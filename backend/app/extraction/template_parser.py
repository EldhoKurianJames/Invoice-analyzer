import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from PIL import Image
import pytesseract

from app.extraction.invoice_parser import parse_invoice
from app.extraction.pdf_table_extractor import extract_pdf_table


def _get_words(image: Image.Image) -> List[Dict[str, Any]]:
    """Run OCR and return a list of word boxes with positions."""
    data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    words = []
    for i in range(len(data["text"])):
        text = data["text"][i].strip()
        if text:
            left = data["left"][i]
            top = data["top"][i]
            width = data["width"][i]
            height = data["height"][i]
            words.append(
                {
                    "text": text,
                    "left": left,
                    "top": top,
                    "width": width,
                    "height": height,
                    "right": left + width,
                    "bottom": top + height,
                    "conf": int(data["conf"][i]),
                }
            )
    return words


def _find_label(words: List[Dict[str, Any]], label: str) -> Optional[Dict[str, Any]]:
    """Find the bounding box of a label phrase in the OCR word list."""
    label_lower = label.lower().strip()
    label_tokens = label_lower.split()
    n = len(label_tokens)

    for i in range(len(words)):
        if i + n > len(words):
            continue

        candidate_tokens = []
        left = float("inf")
        top = float("inf")
        right = 0
        bottom = 0

        for j in range(i, i + n):
            candidate_tokens.append(words[j]["text"].lower().strip(",:.;-"))
            left = min(left, words[j]["left"])
            top = min(top, words[j]["top"])
            right = max(right, words[j]["right"])
            bottom = max(bottom, words[j]["bottom"])

        candidate = " ".join(candidate_tokens)
        if candidate == label_lower or label_lower in candidate:
            return {
                "left": left,
                "top": top,
                "right": right,
                "bottom": bottom,
                "height": bottom - top,
                "width": right - left,
            }

    # Fallback: single-word or partial label match
    for w in words:
        if label_lower in w["text"].lower():
            return {
                "left": w["left"],
                "top": w["top"],
                "right": w["right"],
                "bottom": w["bottom"],
                "height": w["height"],
                "width": w["width"],
            }

    return None


def _find_value(
    words: List[Dict[str, Any]],
    label_box: Dict[str, int],
    direction: str = "right",
    regex: Optional[str] = None,
    max_words: int = 8,
) -> Optional[str]:
    """Find the value near a label box."""
    h_tol = max(label_box["height"] * 1.2, 10)
    candidates = []

    for w in words:
        # Skip words inside the label itself
        if (
            w["left"] >= label_box["left"]
            and w["right"] <= label_box["right"]
            and w["top"] >= label_box["top"]
            and w["bottom"] <= label_box["bottom"]
        ):
            continue

        if direction == "right":
            if (
                w["top"] >= label_box["top"] - h_tol
                and w["bottom"] <= label_box["bottom"] + h_tol
                and w["left"] >= label_box["right"]
            ):
                candidates.append(w)
        elif direction == "below":
            if (
                w["left"] >= label_box["left"] - h_tol
                and w["right"] <= label_box["right"] + h_tol * 4
                and w["top"] >= label_box["bottom"]
            ):
                candidates.append(w)

    if not candidates:
        return None

    key = lambda w: w["left"] if direction == "right" else w["top"]
    candidates.sort(key=key)

    parts = []
    for w in candidates:
        if not parts:
            parts.append(w)
        else:
            last = parts[-1]
            gap = key(w) - (last["right"] if direction == "right" else last["bottom"])
            if gap <= label_box["height"] * 2:
                parts.append(w)
            else:
                break

    text = " ".join(p["text"] for p in parts[:max_words])

    if regex:
        m = re.search(regex, text)
        if m:
            return m.group(1).strip() if m.groups() else m.group(0).strip()
        return None

    return text.strip()


def _extract_field(
    words: List[Dict[str, Any]], field_cfg: Dict[str, Any]
) -> Optional[str]:
    """Extract a single field using its label and direction."""
    label = field_cfg.get("label", "")
    box = _find_label(words, label)
    if not box:
        return None

    value = _find_value(
        words,
        box,
        direction=field_cfg.get("direction", "right"),
        regex=field_cfg.get("regex"),
    )
    return value


def _parse_number(text: Optional[str]) -> Optional[float]:
    if text is None:
        return None
    text = str(text).replace(",", "").replace("$", "").replace("€", "").strip()
    m = re.search(r"(\d+(?:\.\d+)?)", text)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            return None
    return None


def _to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).replace(",", "").replace("$", "").replace("€", "").strip())
    except (ValueError, TypeError):
        return None


def _extract_line_items_zonal(
    words: List[Dict[str, Any]], table_cfg: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Extract table rows from an image using header positions."""
    headers_cfg = table_cfg.get("headers", {})
    header_boxes = {}

    for header, cfg in headers_cfg.items():
        box = _find_label(words, header)
        if box:
            header_boxes[header] = box

    if not header_boxes:
        return []

    header_bottom = max(b["bottom"] for b in header_boxes.values())
    avg_height = max(b["height"] for b in header_boxes.values())
    row_gap = avg_height * 1.5

    col_centers = {
        h: (b["left"] + b["right"]) / 2 for h, b in header_boxes.items()
    }
    col_half_widths = {}
    centers = sorted(col_centers.values())
    if len(centers) > 1:
        for h, c in col_centers.items():
            # half the smaller distance to neighbors
            idx = centers.index(c)
            left = centers[idx - 1] if idx > 0 else c - (centers[idx + 1] - c) / 2
            right = centers[idx + 1] if idx < len(centers) - 1 else c + (c - centers[idx - 1]) / 2
            col_half_widths[h] = (right - left) / 2
    else:
        for h in col_centers:
            col_half_widths[h] = header_boxes[h]["width"] * 1.5

    row_words = [w for w in words if w["top"] > header_bottom + avg_height * 0.3]
    row_words.sort(key=lambda w: w["top"])

    rows = []
    current = []
    last_top = None
    for w in row_words:
        if last_top is None or abs(w["top"] - last_top) <= avg_height:
            current.append(w)
            last_top = w["top"]
        else:
            rows.append(current)
            current = [w]
            last_top = w["top"]
    if current:
        rows.append(current)

    line_items = []
    for row in rows:
        cells = {h: [] for h in header_boxes}
        for w in row:
            x = w["left"] + w["width"] / 2
            best_header = None
            best_dist = float("inf")
            for h, center in col_centers.items():
                dist = abs(x - center)
                if dist <= col_half_widths[h] and dist < best_dist:
                    best_dist = dist
                    best_header = h

            if best_header:
                cells[best_header].append(w)

        item = {}
        row_text = " ".join([w["text"] for w in row])

        for header in header_boxes:
            cfg = headers_cfg[header]
            key = cfg.get("key", header)
            cell_texts = sorted(cells[header], key=lambda w: w["left"])
            text = " ".join([w["text"] for w in cell_texts]).strip()

            regex = cfg.get("regex")
            if regex:
                m = re.search(regex, text)
                value = m.group(1) if m and m.groups() else (m.group(0) if m else None)
            elif cfg.get("type") == "number":
                value = _parse_number(text)
            else:
                value = text or None

            item[key] = value

        # Fallback HS code search if not assigned to the right column
        if not item.get("hs_code"):
            m = re.search(r"\b(\d{6})\b", row_text)
            if m:
                item["hs_code"] = m.group(1)

        if item.get("description"):
            # Fill missing numeric defaults
            for nf in [
                "quantity",
                "unit_price",
                "total",
                "subtotal",
                "tax_percentage",
                "tax_amount",
            ]:
                if nf not in item:
                    item[nf] = None
            if "hs_code" not in item:
                item["hs_code"] = None
            line_items.append(item)

    return line_items


def load_templates(template_dir: Optional[str] = None) -> List[Dict[str, Any]]:
    if template_dir is None:
        template_dir = os.path.join(os.path.dirname(__file__), "templates")

    templates = []
    if not os.path.isdir(template_dir):
        return templates

    for f in sorted(os.listdir(template_dir)):
        if f.endswith(".json"):
            try:
                with open(os.path.join(template_dir, f), "r", encoding="utf-8") as fp:
                    templates.append(json.load(fp))
            except Exception as e:
                print(f"Warning: could not load template {f}: {e}")

    return templates


def detect_template(text: str, templates: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    text_lower = text.lower()
    best = None
    best_score = 0

    for t in templates:
        detection = t.get("detection", {})
        keywords = detection.get("keywords", [])
        min_score = detection.get("min_score", 1)

        score = sum(1 for kw in keywords if kw.lower() in text_lower)
        if score >= min_score and score > best_score:
            best = t
            best_score = score

    return best


def extract_invoice_data(
    text: str,
    image: Optional[Image.Image] = None,
    pdf_path: Optional[str] = None,
    template_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Extract invoice data using a template. Falls back to the legacy regex parser.
    """
    templates = load_templates(template_dir)
    template = detect_template(text, templates)

    if not template or (not image and not pdf_path):
        return parse_invoice(text)

    words = _get_words(image) if image else []
    result = {"line_items": []}

    # Extract header fields
    for field, cfg in template.get("fields", {}).items():
        result[field] = _extract_field(words, cfg)

    # Extract line items
    table_cfg = template.get("line_items")
    if table_cfg:
        line_items = []

        if pdf_path and str(pdf_path).lower().endswith(".pdf"):
            line_items = extract_pdf_table(pdf_path, table_cfg)

        if not line_items:
            line_items = _extract_line_items_zonal(words, table_cfg)

        result["line_items"] = line_items

    # Convert numeric fields
    for key in [
        "total_amount",
        "subtotal",
        "tax_amount",
        "tax_percentage",
    ]:
        if result.get(key) is not None:
            result[key] = _to_float(result[key])

    # Convert line item numbers
    for item in result.get("line_items", []):
        for nf in [
            "quantity",
            "unit_price",
            "total",
            "subtotal",
            "tax_percentage",
            "tax_amount",
        ]:
            if item.get(nf) is not None:
                item[nf] = _to_float(item[nf])

    fallback = parse_invoice(text)
    if not result.get("line_items") and not result.get("invoice_id"):
        return fallback

    for key, value in fallback.items():
        if key != "line_items" and result.get(key) in (None, ""):
            result[key] = value

    fallback_items = {
        item.get("hs_code"): item
        for item in fallback.get("line_items", [])
        if item.get("hs_code")
    }
    for item in result.get("line_items", []):
        fallback_item = fallback_items.get(item.get("hs_code"))
        if not fallback_item:
            continue
        for key, value in fallback_item.items():
            if item.get(key) in (None, ""):
                item[key] = value

    return result
