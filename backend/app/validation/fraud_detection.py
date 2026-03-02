"""
AI-Powered Fraud Detection System

Features:
1. Duplicate Invoice Detection - Flags invoices with same amounts, dates, or vendor patterns
2. Price Anomaly Detection - Alerts when unit prices deviate from historical averages
3. Vendor Risk Scoring - Tracks vendor reliability based on past invoice accuracy
"""

from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import json

from app.database import models
from app.extraction.entities import InvoiceData, LineItem


class FraudDetectionResult:
    def __init__(self):
        self.fraud_score = 0.0  # 0-100, higher = more risky
        self.flags: List[str] = []
        self.warnings: List[str] = []
        self.details: Dict = {}
    
    def add_flag(self, flag: str, score_impact: float):
        """Add a fraud flag and increase the fraud score"""
        self.flags.append(flag)
        self.fraud_score = min(100.0, self.fraud_score + score_impact)
    
    def add_warning(self, warning: str):
        """Add a warning (informational, doesn't affect score)"""
        self.warnings.append(warning)
    
    def is_high_risk(self) -> bool:
        return self.fraud_score >= 70.0
    
    def is_medium_risk(self) -> bool:
        return 40.0 <= self.fraud_score < 70.0
    
    def to_dict(self) -> Dict:
        return {
            "fraud_score": round(self.fraud_score, 2),
            "risk_level": "HIGH" if self.is_high_risk() else "MEDIUM" if self.is_medium_risk() else "LOW",
            "flags": self.flags,
            "warnings": self.warnings,
            "details": self.details
        }


def detect_duplicate_invoice(db: Session, invoice: InvoiceData, vendor_name: str = None) -> Tuple[bool, List[str]]:
    """
    Detect potential duplicate invoices based on:
    - Same invoice ID
    - Same total amount + same date + same vendor
    - Very similar amounts within short time period
    
    Returns: (is_duplicate, list of reasons)
    """
    duplicates = []
    
    # Check 1: Exact invoice ID match
    if invoice.invoice_id:
        existing = db.query(models.Invoice).filter(
            models.Invoice.invoice_id == invoice.invoice_id
        ).first()
        if existing:
            duplicates.append(f"DUPLICATE: Invoice ID '{invoice.invoice_id}' already exists in database")
    
    # Check 2: Same amount + same date + same vendor
    if invoice.total_amount and invoice.invoice_date:
        query = db.query(models.Invoice).filter(
            models.Invoice.total_amount == invoice.total_amount,
            models.Invoice.invoice_date == invoice.invoice_date
        )
        if vendor_name:
            query = query.filter(models.Invoice.vendor_name == vendor_name)
        
        matches = query.all()
        if matches:
            duplicates.append(
                f"POTENTIAL DUPLICATE: Found {len(matches)} invoice(s) with same amount "
                f"(${invoice.total_amount}) and date ({invoice.invoice_date})"
            )
    
    # Check 3: Very similar amount (within 1%) in last 7 days from same vendor
    if invoice.total_amount and vendor_name:
        week_ago = datetime.utcnow() - timedelta(days=7)
        tolerance = invoice.total_amount * 0.01  # 1% tolerance
        
        similar = db.query(models.Invoice).filter(
            models.Invoice.vendor_name == vendor_name,
            models.Invoice.total_amount.between(
                invoice.total_amount - tolerance,
                invoice.total_amount + tolerance
            ),
            models.Invoice.created_at >= week_ago
        ).count()
        
        if similar > 2:
            duplicates.append(
                f"SUSPICIOUS: {similar} similar invoices from '{vendor_name}' in last 7 days"
            )
    
    return len(duplicates) > 0, duplicates


def detect_price_anomaly(db: Session, line_items: List[LineItem], vendor_name: str = None) -> Tuple[List[str], Dict]:
    """
    Detect price anomalies by comparing current prices against historical averages.
    Flags items where price deviates more than 30% from average.
    
    Returns: (list of anomaly warnings, details dict)
    """
    anomalies = []
    details = {}
    
    for item in line_items:
        hs_code = getattr(item, 'hs_code', None)
        unit_price = getattr(item, 'unit_price', None)
        
        if not unit_price or unit_price <= 0:
            continue
        
        # Query historical prices for this product
        query = db.query(
            func.avg(models.PriceHistory.unit_price).label('avg_price'),
            func.min(models.PriceHistory.unit_price).label('min_price'),
            func.max(models.PriceHistory.unit_price).label('max_price'),
            func.count(models.PriceHistory.id).label('count')
        )
        
        if hs_code:
            query = query.filter(models.PriceHistory.hs_code == hs_code)
        else:
            # Match by description keywords
            query = query.filter(
                models.PriceHistory.product_description.ilike(f"%{item.description[:20]}%")
            )
        
        result = query.first()
        
        if result and result.count and result.count >= 3:  # Need at least 3 historical records
            avg_price = result.avg_price
            deviation = abs(unit_price - avg_price) / avg_price * 100
            
            details[item.description] = {
                "current_price": unit_price,
                "historical_avg": round(avg_price, 2),
                "historical_min": round(result.min_price, 2),
                "historical_max": round(result.max_price, 2),
                "deviation_percent": round(deviation, 2),
                "sample_size": result.count
            }
            
            if deviation > 50:
                anomalies.append(
                    f"HIGH PRICE ANOMALY: '{item.description}' price ${unit_price} is {deviation:.1f}% "
                    f"different from average ${avg_price:.2f} (based on {result.count} records)"
                )
            elif deviation > 30:
                anomalies.append(
                    f"PRICE WARNING: '{item.description}' price ${unit_price} deviates {deviation:.1f}% "
                    f"from average ${avg_price:.2f}"
                )
    
    return anomalies, details


def get_vendor_risk_score(db: Session, vendor_name: str) -> Tuple[float, Dict]:
    """
    Get or calculate vendor risk score based on historical performance.
    
    Risk Score Factors:
    - Failed invoice ratio (higher = more risky)
    - Total invoices processed (more history = more reliable score)
    - Recent activity (inactive vendors are slightly riskier)
    
    Returns: (risk_score 0-100, details dict)
    """
    if not vendor_name:
        return 50.0, {"reason": "No vendor name provided"}
    
    vendor = db.query(models.VendorScore).filter(
        models.VendorScore.vendor_name == vendor_name
    ).first()
    
    if not vendor:
        # New vendor - moderate risk
        return 50.0, {
            "reason": "New vendor - no history",
            "recommendation": "First invoice from this vendor, apply standard scrutiny"
        }
    
    # Use the stored score (computed by update_vendor_score with weighted errors)
    risk_score = vendor.risk_score

    # Build details
    if vendor.total_invoices > 0:
        success_rate = vendor.successful_invoices / vendor.total_invoices
        success_rate_str = f"{success_rate * 100:.1f}%"
    else:
        success_rate_str = "N/A"

    try:
        stored = json.loads(vendor.notes) if vendor.notes else {}
    except Exception:
        stored = {}

    cumulative_penalty = stored.get("cumulative_penalty", 0.0)

    details = {
        "total_invoices": vendor.total_invoices,
        "successful_invoices": vendor.successful_invoices,
        "failed_invoices": vendor.failed_invoices,
        "success_rate": success_rate_str,
        "total_amount_processed": vendor.total_amount_processed,
        "last_invoice_date": vendor.last_invoice_date.isoformat() if vendor.last_invoice_date else None,
        "cumulative_error_penalty": round(cumulative_penalty, 2),
        "avg_error_penalty_per_failure": round(cumulative_penalty / vendor.failed_invoices, 2) if vendor.failed_invoices > 0 else 0.0,
        "calculated_risk_score": round(risk_score, 2),
        "scoring_notes": (
            "Low history — score less reliable" if vendor.total_invoices < 5
            else "Established vendor" if vendor.total_invoices >= 20
            else "Normal history"
        )
    }

    return risk_score, details


# Error severity weights — higher = more serious infraction
_ERROR_WEIGHTS = [
    # (substring to match in error message, penalty points)
    ("TAX RATE ERROR",        10.0),  # Wrong tax % — high severity
    ("TAX CALCULATION",       8.0),   # Tax amount doesn't match %
    ("TAX ERROR",             7.0),   # General tax error
    ("TAX INFO MISSING",      5.0),   # Tax info not found for product
    ("GRAND TOTAL",           6.0),   # Grand total mismatch
    ("SUBTOTAL ERROR",        4.0),   # Subtotal mismatch
    ("FRAUD ALERT",          12.0),   # Fraud flag raised
    ("MISSING FIELDS",        5.0),   # Required fields absent
    ("DUPLICATE",            10.0),   # Duplicate invoice
]
_DEFAULT_ERROR_PENALTY = 3.0  # Generic/unknown error


def _calculate_error_penalty(errors: List[str]) -> float:
    """Sum weighted penalties for a list of validation error strings."""
    total = 0.0
    for err in errors:
        err_upper = err.upper()
        matched = False
        for keyword, weight in _ERROR_WEIGHTS:
            if keyword in err_upper:
                total += weight
                matched = True
                break
        if not matched:
            total += _DEFAULT_ERROR_PENALTY
    return total


def update_vendor_score(db: Session, vendor_name: str, invoice_passed: bool, amount: float, errors: List[str] = None):
    """
    Update vendor score after processing an invoice.
    Errors list is used to weight the penalty by error severity.
    """
    if not vendor_name:
        return

    vendor = db.query(models.VendorScore).filter(
        models.VendorScore.vendor_name == vendor_name
    ).first()

    if not vendor:
        vendor = models.VendorScore(
            vendor_name=vendor_name,
            total_invoices=0,
            successful_invoices=0,
            failed_invoices=0,
            total_amount_processed=0.0,
            risk_score=50.0
        )
        db.add(vendor)

    vendor.total_invoices += 1
    if invoice_passed:
        vendor.successful_invoices += 1
    else:
        vendor.failed_invoices += 1
    vendor.total_amount_processed += amount or 0
    vendor.last_invoice_date = datetime.utcnow()

    # --- Weighted risk score recalculation ---
    # Base: failure rate contributes up to 50 points
    if vendor.total_invoices > 0:
        failure_rate = vendor.failed_invoices / vendor.total_invoices
        base_score = failure_rate * 50.0
    else:
        base_score = 25.0

    # Error penalty: weighted by error type, averaged across failed invoices
    # We store cumulative penalty in notes field as JSON
    try:
        stored = json.loads(vendor.notes) if vendor.notes else {}
    except Exception:
        stored = {}

    cumulative_penalty = stored.get("cumulative_penalty", 0.0)
    if not invoice_passed and errors:
        cumulative_penalty += _calculate_error_penalty(errors)
    stored["cumulative_penalty"] = cumulative_penalty
    vendor.notes = json.dumps(stored)

    # Average penalty per failed invoice (max 40 points contribution)
    if vendor.failed_invoices > 0:
        avg_penalty = cumulative_penalty / vendor.failed_invoices
        # Normalise: 30 penalty points = full 40-point contribution
        penalty_score = min(40.0, (avg_penalty / 30.0) * 40.0)
    else:
        penalty_score = 0.0

    # Volume bonus: established vendors with many invoices get slight relief
    if vendor.total_invoices >= 20:
        volume_adj = -5.0
    elif vendor.total_invoices < 5:
        volume_adj = 10.0  # Low history — less certainty
    else:
        volume_adj = 0.0

    vendor.risk_score = max(0.0, min(100.0, base_score + penalty_score + volume_adj))

    db.commit()


def record_price_history(db: Session, line_items: List[LineItem], vendor_name: str = None, country: str = None):
    """
    Record prices from invoice items for future anomaly detection.
    """
    for item in line_items:
        unit_price = getattr(item, 'unit_price', None)
        if not unit_price or unit_price <= 0:
            continue
        
        price_record = models.PriceHistory(
            hs_code=getattr(item, 'hs_code', None),
            product_description=item.description,
            unit_price=unit_price,
            vendor_name=vendor_name,
            country=country
        )
        db.add(price_record)
    
    db.commit()


def run_fraud_detection(db: Session, invoice: InvoiceData, vendor_name: str = None, country: str = None) -> FraudDetectionResult:
    """
    Run all fraud detection checks on an invoice.
    
    Returns: FraudDetectionResult with score, flags, and details
    """
    result = FraudDetectionResult()
    
    print(f"DEBUG FRAUD: Running fraud detection for invoice {invoice.invoice_id}")
    
    # 1. Duplicate Detection
    is_duplicate, duplicate_reasons = detect_duplicate_invoice(db, invoice, vendor_name)
    if is_duplicate:
        for reason in duplicate_reasons:
            if "DUPLICATE:" in reason:
                result.add_flag(reason, 40)  # High impact for exact duplicates
            elif "POTENTIAL DUPLICATE:" in reason:
                result.add_flag(reason, 25)
            else:
                result.add_flag(reason, 15)
    
    # 2. Price Anomaly Detection
    if invoice.line_items:
        anomalies, price_details = detect_price_anomaly(db, invoice.line_items, vendor_name)
        result.details["price_analysis"] = price_details
        
        for anomaly in anomalies:
            if "HIGH PRICE ANOMALY" in anomaly:
                result.add_flag(anomaly, 20)
            else:
                result.add_warning(anomaly)
    
    # 3. Vendor Risk Score
    vendor_risk, vendor_details = get_vendor_risk_score(db, vendor_name)
    result.details["vendor_analysis"] = vendor_details
    
    if vendor_risk >= 70:
        result.add_flag(f"HIGH RISK VENDOR: '{vendor_name}' has risk score {vendor_risk:.1f}", 25)
    elif vendor_risk >= 50:
        result.add_warning(f"Vendor '{vendor_name}' has moderate risk score: {vendor_risk:.1f}")
    
    # 4. Additional checks
    # Check for round number amounts (potential fabrication)
    if invoice.total_amount and invoice.total_amount == int(invoice.total_amount):
        if invoice.total_amount >= 10000:
            result.add_warning(f"Round number amount: ${invoice.total_amount:,.0f} - verify authenticity")
    
    # Check for missing critical fields
    missing_fields = []
    if not invoice.invoice_id:
        missing_fields.append("invoice_id")
    if not invoice.invoice_date:
        missing_fields.append("invoice_date")
    if not vendor_name:
        missing_fields.append("vendor/exporter")
    
    if missing_fields:
        result.add_flag(f"MISSING FIELDS: {', '.join(missing_fields)}", 10 * len(missing_fields))
    
    print(f"DEBUG FRAUD: Fraud score = {result.fraud_score}, Flags = {len(result.flags)}")
    
    return result
