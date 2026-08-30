# Tesseract OCR implementation

import os
import shutil
from typing import Union

import pdfplumber
import pytesseract
from PIL import Image

if not shutil.which("tesseract"):
    windows_tesseract = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.isfile(windows_tesseract):
        pytesseract.pytesseract.tesseract_cmd = windows_tesseract

def extract_text_from_image(image: Union[str, Image.Image]) -> str:
    """
    Extracts text from an image file or PIL Image object using Tesseract OCR.

    Args:
        image: The path to the image file or a PIL Image object.

    Returns:
        The extracted text as a string.
    """
    try:
        if isinstance(image, str):
            image = Image.open(image)
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        print(f"Error during OCR: {e}")
        return ""


def extract_text_from_pdf(pdf_path: str) -> str:
    try:
        with pdfplumber.open(pdf_path) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages).strip()
    except Exception as e:
        print(f"Error extracting native PDF text: {e}")
        return ""
