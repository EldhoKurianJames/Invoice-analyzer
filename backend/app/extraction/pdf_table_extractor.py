import os
import re
from typing import Any, Dict, List, Optional

try:
    import pdfplumber
except ImportError:
    pdfplumber = None


def _to_float(text: Any) -> Optional[float]:
    if text is None:
        return None
    try:
        return float(str(text).replace(",", "").replace("$", "").replace("€", "").strip())
    except (ValueError, TypeError):
        return None


def _match_header(cell: str, headers_cfg: Dict[str, Any]) -> Optional[str]:
    """Match a raw table header cell to one of the configured header names."""
    if not cell:
        return None

    cell_lower = cell.strip().lower()
    best = None
    best_score = 0

    for header_name in headers_cfg:
        header_lower = header_name.lower()
        if cell_lower == header_lower:
            return header_name

        # Count overlapping words
        cell_words = set(cell_lower.split())
        header_words = set(header_lower.split())
        score = len(cell_words & header_words)
        if header_lower in cell_lower or cell_lower in header_lower:
            score += 1

        if score > best_score:
            best_score = score
            best = header_name

    return best if best_score > 0 else None


def _parse_cell(text: str, cfg: Dict[str, Any]) -> Any:
    """Parse a single table cell using the field configuration."""
    if not text:
        return None

    text = text.strip()
    regex = cfg.get("regex")
    if regex:
        m = re.search(regex, text)
        return m.group(1) if m and m.groups() else (m.group(0) if m else None)

    if cfg.get("type") == "number":
        return _to_float(text)

    return text


def extract_pdf_table(pdf_path: str, table_cfg: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extract a table from a native PDF and map it to the template's line-item schema.
    Falls back to an empty list if pdfplumber is not installed or the PDF has no extractable table.
    """
    if pdfplumber is None:
        print("pdfplumber not installed; skipping native PDF table extraction.")
        return []

    if not pdf_path or not str(pdf_path).lower().endswith(".pdf"):
        return []

    if not os.path.exists(pdf_path):
        return []

    headers_cfg = table_cfg.get("headers", {})
    if not headers_cfg:
        return []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                if not tables:
                    continue

                for raw_table in tables:
                    if not raw_table or len(raw_table) < 2:
                        continue

                    header_row = raw_table[0]
                    col_map = {}
                    for idx, cell in enumerate(header_row):
                        matched = _match_header(cell, headers_cfg)
                        if matched:
                            col_map[idx] = matched

                    if not col_map:
                        continue

                    line_items = []
                    for row in raw_table[1:]:
                        item = {}
                        for idx, cell in enumerate(row):
                            if idx not in col_map:
                                continue

                            header_name = col_map[idx]
                            cfg = headers_cfg[header_name]
                            key = cfg.get("key", header_name)
                            item[key] = _parse_cell(cell or "", cfg)

                        # Always add missing default fields
                        for nf in [
                            "quantity",
                            "unit_price",
                            "total",
                            "subtotal",
                            "tax_percentage",
                            "tax_amount",
                            "hs_code",
                        ]:
                            if nf not in item:
                                item[nf] = None

                        if item.get("description"):
                            line_items.append(item)

                    if line_items:
                        return line_items

    except Exception as e:
        print(f"PDF table extraction failed: {e}")

    return []
