from sqlalchemy.orm import Session
from . import models
from app.extraction.entities import InvoiceData
from typing import List
import json

def create_invoice(db: Session, invoice: InvoiceData, vendor_name: str = None, country: str = None, fraud_score: float = 0.0, fraud_flags: list = None):
    # Calculate total tax amount from line items if not provided
    if invoice.tax_amount is None or invoice.tax_amount == 0:
        total_tax = sum(getattr(item, "tax_amount", None) or 0 for item in invoice.line_items)
        invoice.tax_amount = total_tax
    
    db_invoice = models.Invoice(
        invoice_id=invoice.invoice_id,
        invoice_date=invoice.invoice_date,
        due_date=invoice.due_date,
        customer_name=invoice.customer_name,
        total_amount=invoice.total_amount,
        subtotal=invoice.subtotal,
        tax_amount=invoice.tax_amount,
        tax_percentage=invoice.tax_percentage,
        vendor_name=vendor_name,
        country=country,
        fraud_score=fraud_score,
        fraud_flags=json.dumps(fraud_flags) if fraud_flags else None
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    
    # Save line items
    for item in invoice.line_items:
        db_line_item = models.InvoiceLineItem(
            invoice_id=invoice.invoice_id,
            description=item.description,
            hs_code=item.hs_code,
            category=getattr(item, "category", None),
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
            tax_percentage=item.tax_percentage,
            tax_amount=getattr(item, "tax_amount", None),
            total=item.total,
            country=country
        )
        db.add(db_line_item)
    
    db.commit()
    return db_invoice

def get_all_invoices(db: Session) -> List[models.Invoice]:
    """Get all invoices from the database."""
    return db.query(models.Invoice).all()

def get_invoice_by_id(db: Session, invoice_id: str) -> models.Invoice:
    """Get a specific invoice by its invoice_id."""
    return db.query(models.Invoice).filter(models.Invoice.invoice_id == invoice_id).first()

def delete_all_invoices(db: Session) -> int:
    """Delete all invoices from the database."""
    count = db.query(models.Invoice).count()
    db.query(models.Invoice).delete()
    db.query(models.InvoiceLineItem).delete()
    db.commit()
    return count

def get_invoice_line_items(db: Session, invoice_id: str) -> List[models.InvoiceLineItem]:
    """Get all line items for a specific invoice."""
    return db.query(models.InvoiceLineItem).filter(models.InvoiceLineItem.invoice_id == invoice_id).all()
