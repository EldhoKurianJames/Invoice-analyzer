from app.extraction.entities import InvoiceData

# Comprehensive country-specific rules database
COUNTRY_RULES = {
    "russia": {
        "banned_items": ["polythene", "plastic", "synthetic polymer"],
        "restricted_items": ["steel", "iron"],
        "max_value_usd": 23500000,
        "required_certificates": ["phytosanitary", "quality_certificate"]
    },
    "china": {
        "banned_items": ["cotton", "textile"],
        "restricted_items": ["electronics"],
        "max_value_usd": 10000000,
        "required_certificates": ["origin_certificate"]
    },
    "usa": {
        "banned_items": ["certain_chemicals"],
        "restricted_items": ["food_products"],
        "max_value_usd": 200000,
        "required_certificates": ["fda_approval"]
    },
    "india": {
        "banned_items": ["gold", "silver"],
        "restricted_items": ["pharmaceuticals"],
        "max_value_usd": 7500000,
        "required_certificates": ["import_license"]
    }
}

# Product-specific tax rates by country
# Tax rates are defined by HS Code (primary) or product keywords (secondary)
COUNTRY_TAX_RATES = {
    "russia": {
        "default_tax_rate": 20.0,  # Default VAT for Russia
        "hs_code_rates": {
            "870321": {"rate": 10.0, "description": "Passenger Cars"},
            "870322": {"rate": 10.0, "description": "Passenger Vehicles 1000-1500cc"},
            "870323": {"rate": 10.0, "description": "Passenger Vehicles 1500-3000cc"},
            "260111": {"rate": 5.0, "description": "Iron Ore Fines"},
            "260112": {"rate": 5.0, "description": "Iron Ore Agglomerated"},
            "720851": {"rate": 8.0, "description": "Steel Coils"},
            "720852": {"rate": 15.0, "description": "Steel Hot-Rolled"},
            "300490": {"rate": 50.0, "description": "Medicines/Pharmaceuticals"},
            "300410": {"rate": 50.0, "description": "Antibiotics"},
            "854231": {"rate": 18.0, "description": "Electronic Processors"},
            "847130": {"rate": 18.0, "description": "Laptops/Computers"},
        },
        "category_rates": {
            "automotive": {"rate": 10.0, "keywords": ["car", "vehicle", "automobile", "passenger"]},
            "metals": {"rate": 5.0, "keywords": ["iron ore", "ore fines"]},
            "steel": {"rate": 15.0, "keywords": ["steel", "coil", "hot-rolled"]},
            "medicines": {"rate": 50.0, "keywords": ["medicine", "drug", "pharmaceutical", "antibiotic"]},
            "electronics": {"rate": 18.0, "keywords": ["electronic", "computer", "laptop", "processor"]},
            "food": {"rate": 10.0, "keywords": ["food", "grain", "meat", "vegetable"]},
        }
    },
    "china": {
        "default_tax_rate": 13.0,  # Default VAT for China
        "hs_code_rates": {
            "870321": {"rate": 25.0, "description": "Passenger Cars"},
            "870322": {"rate": 25.0, "description": "Passenger Vehicles"},
            "260111": {"rate": 5.0, "description": "Iron Ore Fines"},
            "720851": {"rate": 13.0, "description": "Steel Coils"},
            "854231": {"rate": 13.0, "description": "Electronic Processors"},
            "520100": {"rate": 16.0, "description": "Cotton"},
        },
        "category_rates": {
            "automotive": {"rate": 25.0, "keywords": ["car", "vehicle", "automobile"]},
            "metals": {"rate": 3.0, "keywords": ["iron ore", "ore"]},
            "steel": {"rate": 13.0, "keywords": ["steel", "coil"]},
            "electronics": {"rate": 13.0, "keywords": ["electronic", "computer"]},
            "textiles": {"rate": 16.0, "keywords": ["cotton", "textile", "fabric"]},
        }
    },
    "usa": {
        "default_tax_rate": 0.0,  # No federal VAT in USA (state taxes vary)
        "hs_code_rates": {
            "870321": {"rate": 2.5, "description": "Passenger Cars"},
            "260111": {"rate": 0.0, "description": "Iron Ore Fines"},
            "720851": {"rate": 0.0, "description": "Steel Coils"},
            "300490": {"rate": 0.0, "description": "Medicines"},
        },
        "category_rates": {
            "automotive": {"rate": 2.5, "keywords": ["car", "vehicle"]},
            "metals": {"rate": 0.0, "keywords": ["iron", "steel", "metal"]},
            "medicines": {"rate": 0.0, "keywords": ["medicine", "drug"]},
        }
    },
    "india": {
        "default_tax_rate": 18.0,  # Default GST for India
        "hs_code_rates": {
            "870321": {"rate": 25.0, "description": "Passenger Cars"},
            "260111": {"rate": 5.0, "description": "Iron Ore Fines"},
            "720851": {"rate": 18.0, "description": "Steel Coils"},
            "300490": {"rate": 10.0, "description": "Medicines"},
            "710812": {"rate": 3.0, "description": "Gold"},
        },
        "category_rates": {
            "automotive": {"rate": 28.0, "keywords": ["car", "vehicle", "automobile"]},
            "metals": {"rate": 5.0, "keywords": ["iron ore", "ore"]},
            "steel": {"rate": 18.0, "keywords": ["steel", "coil"]},
            "medicines": {"rate": 12.0, "keywords": ["medicine", "drug", "pharmaceutical"]},
            "gold": {"rate": 3.0, "keywords": ["gold", "silver", "precious"]},
        }
    }
}


# Maps HS code prefixes/exact codes to restricted/banned product categories
# Used to classify products by their internationally standardised HS code
HS_CODE_CATEGORY_MAP = {
    # Pharmaceuticals / Medicines
    "300490": "pharmaceuticals",
    "300410": "pharmaceuticals",
    "300420": "pharmaceuticals",
    "300431": "pharmaceuticals",
    "300432": "pharmaceuticals",
    "300440": "pharmaceuticals",
    "300450": "pharmaceuticals",
    "300460": "pharmaceuticals",
    "300390": "pharmaceuticals",
    "300310": "pharmaceuticals",
    # Food products
    "020": "food_products",   # prefix: meat
    "030": "food_products",   # prefix: fish
    "040": "food_products",   # prefix: dairy
    "070": "food_products",   # prefix: vegetables
    "080": "food_products",   # prefix: fruits
    "100": "food_products",   # prefix: cereals
    "110": "food_products",   # prefix: flour/starch
    "190": "food_products",   # prefix: baked goods
    "200": "food_products",   # prefix: preserved food
    "210": "food_products",   # prefix: misc food prep
    "220": "food_products",   # prefix: beverages
    # Electronics
    "854231": "electronics",
    "847130": "electronics",
    "851712": "electronics",
    "852872": "electronics",
    "854": "electronics",     # prefix: electrical machinery
    # Steel / Iron
    "720851": "steel",
    "720852": "steel",
    "720": "steel",           # prefix: iron/steel
    "260111": "metals",
    "260112": "metals",
    # Automotive
    "870321": "automotive",
    "870322": "automotive",
    "870323": "automotive",
    "870324": "automotive",
    # Chemicals / Certain chemicals
    "280": "certain_chemicals",
    "290": "certain_chemicals",
    # Gold / Precious metals
    "710812": "gold",
    "710813": "gold",
    "710820": "silver",
    # Cotton / Textiles
    "520100": "cotton",
    "520": "textile",
    "540": "textile",
    "550": "textile",
    # Plastics / Polythene
    "390": "plastic",
    "392": "polythene",
}

# Keyword synonyms map: any word/phrase → restricted category name
# Used as fallback when HS code is absent or unrecognised
PRODUCT_KEYWORD_CATEGORY_MAP = {
    # Pharmaceuticals
    "pharmaceuticals": "pharmaceuticals",
    "pharmaceutical": "pharmaceuticals",
    "medicine": "pharmaceuticals",
    "medicines": "pharmaceuticals",
    "drug": "pharmaceuticals",
    "drugs": "pharmaceuticals",
    "tablet": "pharmaceuticals",
    "tablets": "pharmaceuticals",
    "capsule": "pharmaceuticals",
    "capsules": "pharmaceuticals",
    "syrup": "pharmaceuticals",
    "antibiotic": "pharmaceuticals",
    "antibiotics": "pharmaceuticals",
    "vaccine": "pharmaceuticals",
    "injection": "pharmaceuticals",
    "panadol": "pharmaceuticals",
    "paracetamol": "pharmaceuticals",
    "amoxicillin": "pharmaceuticals",
    "ibuprofen": "pharmaceuticals",
    "aspirin": "pharmaceuticals",
    "insulin": "pharmaceuticals",
    "chemotherapy": "pharmaceuticals",
    # Food products
    "food": "food_products",
    "grain": "food_products",
    "rice": "food_products",
    "wheat": "food_products",
    "flour": "food_products",
    "meat": "food_products",
    "fish": "food_products",
    "vegetable": "food_products",
    "fruit": "food_products",
    "dairy": "food_products",
    "milk": "food_products",
    "cheese": "food_products",
    "bread": "food_products",
    "biscuit": "food_products",
    "biscuits": "food_products",
    "chocolate": "food_products",
    "snack": "food_products",
    "snacks": "food_products",
    "packet": "food_products",
    "cereal": "food_products",
    "beverage": "food_products",
    "juice": "food_products",
    "chocos": "food_products",
    # Electronics
    "electronics": "electronics",
    "electronic": "electronics",
    "laptop": "electronics",
    "computer": "electronics",
    "processor": "electronics",
    "smartphone": "electronics",
    "phone": "electronics",
    "mobile": "electronics",
    "television": "electronics",
    "tv": "electronics",
    # Steel / Iron
    "steel": "steel",
    "iron": "steel",
    "coil": "steel",
    # Metals
    "iron ore": "metals",
    "ore": "metals",
    # Automotive
    "car": "automotive",
    "vehicle": "automotive",
    "automobile": "automotive",
    # Chemicals
    "chemical": "certain_chemicals",
    "chemicals": "certain_chemicals",
    "acid": "certain_chemicals",
    # Gold / Silver
    "gold": "gold",
    "silver": "silver",
    # Cotton / Textiles
    "cotton": "cotton",
    "textile": "textile",
    "fabric": "textile",
    # Plastics
    "plastic": "plastic",
    "polythene": "polythene",
    "polymer": "polythene",
}


def classify_product_category(hs_code: str = None, description: str = None) -> str:
    """
    Classify a product into a category using HS code first, then keyword synonyms.
    Returns the category string or None if unclassified.
    """
    # Priority 1: exact HS code match
    if hs_code:
        hs_clean = str(hs_code).strip()
        if hs_clean in HS_CODE_CATEGORY_MAP:
            return HS_CODE_CATEGORY_MAP[hs_clean]
        # Priority 2: HS code prefix match (first 3 digits)
        for prefix_len in (3, 4):
            prefix = hs_clean[:prefix_len]
            if prefix in HS_CODE_CATEGORY_MAP:
                return HS_CODE_CATEGORY_MAP[prefix]

    # Priority 3: keyword synonym match on description
    if description:
        desc_lower = description.lower()
        # Check multi-word keywords first (longer matches win)
        for keyword in sorted(PRODUCT_KEYWORD_CATEGORY_MAP.keys(), key=len, reverse=True):
            if keyword in desc_lower:
                return PRODUCT_KEYWORD_CATEGORY_MAP[keyword]
    return None


def get_product_tax_rate(country: str, hs_code: str = None, description: str = None) -> dict:
    """
    Get the tax rate for a product based on country, HS code, or description.
    
    Args:
        country: Destination country
        hs_code: HS Code of the product (optional)
        description: Product description (optional)
    
    Returns:
        dict with 'rate', 'source', and 'found' keys
        If tax info not found, returns {'found': False}
    """
    country_lower = country.lower()
    
    if country_lower not in COUNTRY_TAX_RATES:
        return {"found": False, "error": f"No tax rules defined for country: {country}"}
    
    tax_rules = COUNTRY_TAX_RATES[country_lower]
    
    # Priority 1: Match by HS Code (most precise)
    if hs_code:
        hs_code_clean = str(hs_code).strip()
        if hs_code_clean in tax_rules["hs_code_rates"]:
            rate_info = tax_rules["hs_code_rates"][hs_code_clean]
            return {
                "found": True,
                "rate": rate_info["rate"],
                "source": f"HS Code {hs_code_clean}",
                "description": rate_info["description"]
            }
    
    # Priority 2: Match by product category keywords
    if description:
        desc_lower = description.lower()
        for category, cat_info in tax_rules["category_rates"].items():
            for keyword in cat_info["keywords"]:
                if keyword in desc_lower:
                    return {
                        "found": True,
                        "rate": cat_info["rate"],
                        "source": f"Category: {category}",
                        "matched_keyword": keyword
                    }
    
    # No match found - return not found (will raise error)
    return {
        "found": False, 
        "error": f"No tax rate defined for product '{description}' (HS: {hs_code}) in {country}"
    }

def validate_country_rules(invoice_data: InvoiceData, country: str) -> list[str]:
    """
    Validates invoice items against comprehensive country-specific rules.

    Args:
        invoice_data: The extracted invoice data.
        country: The destination country.

    Returns:
        A list of error messages, or an empty list if validation passes.
    """
    errors = []
    country_lower = country.lower()
    
    if country_lower not in COUNTRY_RULES:
        return errors  # No rules defined for this country
    
    rules = COUNTRY_RULES[country_lower]
    
    # Check banned and restricted items using smart category classification
    for item in invoice_data.line_items:
        item_desc = item.description
        item_desc_lower = item_desc.lower()
        hs_code = getattr(item, 'hs_code', None)

        # Determine product category via HS code + keyword synonyms
        detected_category = classify_product_category(hs_code=hs_code, description=item_desc)

        # Check banned items
        for banned_item in rules["banned_items"]:
            banned_lower = banned_item.lower()
            if (
                banned_lower in item_desc_lower
                or (detected_category and banned_lower in detected_category)
            ):
                errors.append(
                    f"BANNED: '{item_desc}' is prohibited for export to {country.title()}"
                )
                break

        # Check restricted items (require certificate)
        for restricted_item in rules["restricted_items"]:
            restricted_lower = restricted_item.lower()
            if (
                restricted_lower in item_desc_lower
                or (detected_category and restricted_lower in detected_category)
            ):
                certs = ", ".join(rules.get("required_certificates", []))
                errors.append(
                    f"RESTRICTED ITEM: '{item_desc}' falls under '{restricted_item}' category "
                    f"for {country.title()} — requires certificate(s): {certs}"
                )
                break

    # Check total value limits
    if invoice_data.total_amount and invoice_data.total_amount > rules["max_value_usd"]:
        errors.append(f"VALUE LIMIT EXCEEDED: Invoice total ${invoice_data.total_amount:.2f} exceeds maximum allowed ${rules['max_value_usd']:,} for {country.title()}")

    return errors
