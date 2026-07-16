import os
import re
import sys

# Reconfigure stdout/stderr to UTF-8 to prevent charmap crashes on Windows when printing model download blocks
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
import base64
import json
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize FastAPI Application
app = FastAPI(title="MUET Results OCR Service")

# Allow CORS for easy integration with frontend portals (localhost and live domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize EasyOCR Reader globally
try:
    import easyocr
    print("[OCR] Initializing EasyOCR engine...")
    reader = easyocr.Reader(['en'], gpu=False) # Default to CPU for local open-source setup
    print("[OCR] EasyOCR engine loaded successfully!")
except ImportError:
    print("[ERROR] EasyOCR package is missing. Please run: pip install easyocr")
    sys.exit(1)

class OCRRequest(BaseModel):
    image: str # Base64 data URL

def deskew_image(img):
    """
    Performs minor skew and rotation correction using OpenCV minimum area rect contours.
    """
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Threshold to get dark pixels
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Get coordinates of all text pixels
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) == 0:
            return img
            
        angle = cv2.minAreaRect(coords)[-1]
        
        # cv2.minAreaRect returns angle in range [-90, 0] or similar depending on cv2 version
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
            
        # Only rotate if the skew is minor but noticeable (between 0.5 and 15 degrees)
        if 0.5 < abs(angle) < 15:
            (h, w) = img.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            img = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            print(f"[OCR] Deskewed image by {angle:.2f} degrees")
    except Exception as e:
        print(f"[WARNING] Deskew failed: {e}")
    return img

def preprocess_image(image_bytes):
    """
    Converts image bytes to open-cv format and deskews.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return None
    return deskew_image(img)

def clean_roll_number(text):
    # Map common multi-char confusions before stripping
    text = text.replace('()', '00').replace('[]', '00').replace('{}', '00')
    # Strip spaces and noise
    text = re.sub(r'[\s|()\[\]{}?_#\-]', '', text).upper()
    
    if len(text) < 5 or len(text) > 10:
        return None
        
    # Pattern: Year (2 chars) + Dept (2-5 chars) + Num (1-4 chars)
    # Allows digits/letters/digits class
    pattern = re.compile(r'^([2Z0-9]{2})([A-Z8]{2,5})([0-9OQUIlS]{1,4})$', re.IGNORECASE)
    match = pattern.match(text)
    if not match:
        return None
        
    y_raw, dept_raw, num_raw = match.groups()
    
    # 1. Clean Year
    y_clean = y_raw.replace('Z', '2').replace('O', '0')
    if not y_clean.isdigit():
        return None
        
    # 2. Clean Dept
    dept_clean = dept_raw.upper().replace('8', 'B').replace('RBA', 'BBA').replace('BRA', 'BBA').replace('EDAO', 'BBA')
    
    # 3. Clean Number
    num_clean = ""
    for char in num_raw:
        if char in ('O', 'Q', 'U'):
            num_clean += '0'
        elif char in ('I', 'L', 'l'):
            num_clean += '1'
        elif char == 'S':
            num_clean += '5'
        elif char == 'Z':
            num_clean += '2'
        elif char.isdigit():
            num_clean += char
            
    if not num_clean:
        num_clean = "000"
    elif len(num_clean) < 3:
        num_clean = num_clean.zfill(3)
        
    return f"{y_clean}{dept_clean}{num_clean}"

def clean_gpa(text):
    # Remove spaces and noise
    text = re.sub(r'[\s|()\[\]{}?_#]', '', text)
    # Commas to dots
    text = text.replace(',', '.')
    # Double dots to single
    text = re.sub(r'\.+', '.', text)
    
    # Map common char confusions
    text_clean = ""
    for char in text:
        if char in ('O', 'Q', 'U'):
            text_clean += '0'
        elif char in ('I', 'l'):
            text_clean += '1'
        elif char == 'S':
            text_clean += '5'
        elif char == 'Z':
            text_clean += '2'
        else:
            text_clean += char
            
    # Case 1: Standard decimal float (e.g. 3.85, 2.50)
    match = re.search(r'\b([0-4])\.(\d{1,2})\b', text_clean)
    if match:
        try:
            return float(f"{match.group(1)}.{match.group(2)}")
        except ValueError:
            pass
            
    # Case 2: 3 consecutive digits without dot (e.g. 155, 342)
    match_nodot = re.search(r'\b([0-4])(\d{2})\b', text_clean)
    if match_nodot:
        try:
            return float(f"{match_nodot.group(1)}.{match_nodot.group(2)}")
        except ValueError:
            pass
            
    return None

def parse_results(results):
    # Process text blocks and extract bounding box centers
    items = []
    for bbox, text, conf in results:
        text = text.strip()
        if not text:
            continue
            
        xs = [pt[0] for pt in bbox]
        ys = [pt[1] for pt in bbox]
        cx = sum(xs) / 4.0
        cy = sum(ys) / 4.0
        h = max(ys) - min(ys)
        w = max(xs) - min(xs)
        
        items.append({
            "text": text,
            "cx": cx,
            "cy": cy,
            "h": h,
            "w": w,
            "bbox": bbox
        })
        
    # Sort elements vertically
    items.sort(key=lambda x: x["cy"])
    
    # Determine Section Boundaries
    start_y = 0
    end_y = 9999999
    
    for item in items:
        txt_lower = item["text"].lower()
        if "successful student" in txt_lower or "list of successful" in txt_lower:
            start_y = item["cy"]
            print(f"[OCR] Found start boundary 'Successful' at Y={start_y}: '{item['text']}'")
            break
            
    for item in items:
        if item["cy"] > start_y:
            txt_lower = item["text"].lower()
            if ("probationary" in txt_lower or 
                "failed student" in txt_lower or 
                "failed list" in txt_lower or 
                "controller of" in txt_lower or 
                "signature" in txt_lower or
                "page " in txt_lower):
                end_y = item["cy"]
                print(f"[OCR] Found end boundary at Y={end_y}: '{item['text']}'")
                break
                
    valid_items = [item for item in items if start_y < item["cy"] < end_y]
    
    print("[OCR] --- Valid Items in Y Boundary ---")
    for item in valid_items:
        print(f"  Y={item['cy']:.1f}, X={item['cx']:.1f}: '{item['text']}'")
    print("[OCR] ---------------------------------")
    
    rolls = []
    gpas = []
    direct_pairs = []
    
    for item in valid_items:
        txt = item["text"]
        
        # Check combined format in a single block
        combined_match = re.search(r'(\b\d{2}(?:-\d{2})?[A-Z0-9]{2,5}\b)[^\d\n]*?([0-4]\.?\d{2})\b', txt, re.IGNORECASE)
        if combined_match:
            roll_candidate = combined_match.group(1)
            gpa_candidate = combined_match.group(2)
            
            cleaned_roll = clean_roll_number(roll_candidate)
            cleaned_gpa = clean_gpa(gpa_candidate)
            if cleaned_roll and cleaned_gpa is not None:
                direct_pairs.append({
                    "id": cleaned_roll,
                    "gpa": cleaned_gpa
                })
                continue
                
        # Match separate candidate roll
        cleaned_roll = clean_roll_number(txt)
        if cleaned_roll:
            rolls.append({
                "id": cleaned_roll,
                "cx": item["cx"],
                "cy": item["cy"],
                "h": item["h"]
            })
            continue
            
        # Match separate candidate GPA
        cleaned_gpa_val = clean_gpa(txt)
        if cleaned_gpa_val is not None:
            gpas.append({
                "val": cleaned_gpa_val,
                "cx": item["cx"],
                "cy": item["cy"]
            })
            
    # Pair separated items
    paired = []
    used_gpas = set()
    
    for r in rolls:
        row_height = r["h"]
        y_threshold = max(row_height * 1.8, 25.0)
        
        candidates = []
        for i, g in enumerate(gpas):
            if i in used_gpas:
                continue
            cy_diff = abs(g["cy"] - r["cy"])
            cx_diff = g["cx"] - r["cx"]
            # GPA must be close in Y and to the right of the roll number
            if cy_diff < y_threshold and cx_diff > 0:
                candidates.append((cx_diff, i, g["val"]))
                
        if candidates:
            candidates.sort(key=lambda x: x[0])
            best_gpa_val = candidates[0][2]
            best_gpa_idx = candidates[0][1]
            used_gpas.add(best_gpa_idx)
            paired.append({
                "id": r["id"],
                "gpa": best_gpa_val
            })
        else:
            paired.append({
                "id": r["id"],
                "gpa": None
            })
            
    # Combine lists
    all_pairs = direct_pairs + paired
    
    # Deduplicate and sort
    seen_ids = set()
    final_results = []
    for pair in all_pairs:
        clean_id = pair["id"]
        if clean_id not in seen_ids:
            seen_ids.add(clean_id)
            final_results.append({
                "id": clean_id,
                "gpa": pair["gpa"]
            })
            
    return { "results": final_results }

@app.post("/ocr")
async def process_ocr(payload: OCRRequest):
    try:
        # Extract base64 payload
        data_str = payload.image
        if "," in data_str:
            header, encoded = data_str.split(",", 1)
        else:
            encoded = data_str
            
        print(f"[OCR] Received image payload of length: {len(data_str)}")
        print(f"[OCR] Base64 prefix: {encoded[:100]}")
        img_bytes = base64.b64decode(encoded)
        print(f"[OCR] Decoded bytes length: {len(img_bytes)}")
        img = preprocess_image(img_bytes)
        if img is None:
            print("[OCR] OpenCV imdecode returned None! Checking image bytes...")
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
            
        # Perform extraction
        ocr_results = reader.readtext(img)
        parsed = parse_results(ocr_results)
        
        print(f"[OCR] Processed result sheet. Extracted {len(parsed['results'])} record(s).")
        return parsed
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Start server locally on port 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)
