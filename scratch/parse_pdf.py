import os
import sys

pdf_path = r"c:\Users\WIN11\Downloads\terasmartecom-backend\public\company profile PDF (Ref.) - 2026Rev.01.pdf"

try:
    import pypdf
    reader = pypdf.PdfReader(pdf_path)
    print(f"Total pages: {len(reader.pages)}")
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        print(f"--- PAGE {i+1} ---")
        print(text[:500] if text else "[No text / Image page]")
except Exception as e:
    print(f"pypdf error: {e}")
    try:
        import fitz # PyMuPDF
        doc = fitz.open(pdf_path)
        print(f"Total pages (fitz): {len(doc)}")
        for i in range(len(doc)):
            page = doc[i]
            text = page.get_text()
            print(f"--- PAGE {i+1} ---")
            print(text[:500] if text else "[No text / Image page]")
    except Exception as e2:
        print(f"fitz error: {e2}")
