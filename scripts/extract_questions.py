#!/usr/bin/env python3
import os
import re
import json
import hashlib
from PIL import Image
import pypdf

PDF_PATH = "/private/var/folders/mt/3rgsts3n7_b1sk58ct_4w4rr0000gn/T/Zalo Temp/TempDownloads/AI-103 175.pdf"
OUTPUT_DIR = "/Users/andynguyen/workspace/ai-103-quiz/data"
IMAGES_DIR = os.path.join(OUTPUT_DIR, "images")

os.makedirs(IMAGES_DIR, exist_ok=True)

print("Opening PDF...")
reader = pypdf.PdfReader(PDF_PATH)
num_pages = len(reader.pages)
print(f"Total pages: {num_pages}")

# 1. Identify common logo/watermark hashes (> 5 occurrences)
hash_counts = {}
for page in reader.pages:
    for img in page.images:
        h = hashlib.md5(img.data).hexdigest()
        hash_counts[h] = hash_counts.get(h, 0) + 1

common_hashes = {h for h, count in hash_counts.items() if count > 5}
print(f"Detected {len(common_hashes)} recurring header/logo image hashes.")

# 2. Extract cleaned text and build page to question mapping
page_texts = []
page_q_map = {}

HEADER_1 = "AI-103: Azure AI Apps and Agents Developer Associate - Practice Questions and Answers"
HEADER_2 = "Cloud and AI Hub"

full_doc = ""
for idx, page in enumerate(reader.pages):
    pno = idx + 1
    raw_text = page.extract_text() or ""
    lines = []
    for line in raw_text.split("\n"):
        s = line.strip()
        if s == HEADER_1 or s == HEADER_2:
            continue
        lines.append(line)
    cleaned_page_text = "\n".join(lines)
    page_texts.append(cleaned_page_text)
    
    qs = [int(m.group(1)) for m in re.finditer(r'(?:^|\n)\s*Q(\d+)\.\s*', cleaned_page_text)]
    page_q_map[pno] = qs
    full_doc += f"\n<<<PAGE_{pno}>>>\n" + cleaned_page_text

q_to_pages = {}
current_q = None
for pno in range(1, num_pages + 1):
    qs = page_q_map[pno]
    if qs:
        for q in qs:
            current_q = q
            q_to_pages.setdefault(current_q, []).append(pno)
    elif current_q is not None:
        q_to_pages.setdefault(current_q, []).append(pno)

# 3. Extract custom images per question
q_images_map = {}
for idx, page in enumerate(reader.pages):
    pno = idx + 1
    if pno == 1:
        continue # Cover page
    
    page_qs = page_q_map.get(pno, [])
    target_q = None
    if len(page_qs) == 1:
        target_q = page_qs[0]
    elif len(page_qs) == 0:
        for q in range(175, 0, -1):
            if q in q_to_pages and pno in q_to_pages[q]:
                target_q = q
                break
    else:
        target_q = page_qs[0]

    img_idx = 0
    for img in page.images:
        h = hashlib.md5(img.data).hexdigest()
        if h in common_hashes:
            continue
        
        img_idx += 1
        ext = os.path.splitext(img.name)[1].lower()
        if not ext or ext == ".jp2":
            ext = ".png"
        
        filename = f"q{target_q}_p{pno}_{img_idx}{ext}"
        filepath = os.path.join(IMAGES_DIR, filename)
        
        if not os.path.exists(filepath):
            try:
                img.image.save(filepath)
            except Exception:
                with open(filepath, "wb") as f:
                    f.write(img.data)
        
        rel_path = f"data/images/{filename}"
        if target_q is not None:
            q_images_map.setdefault(target_q, []).append({
                "filename": filename,
                "path": rel_path,
                "page": pno,
                "width": img.image.size[0] if hasattr(img, 'image') else None,
                "height": img.image.size[1] if hasattr(img, 'image') else None
            })

print(f"Extracted images for {len(q_images_map)} questions.")

# 4. Parse question chunks
matches = list(re.finditer(r'(?:^|\n)\s*Q(\d+)\.\s*', full_doc))
questions = []

for i in range(len(matches)):
    qnum = int(matches[i].group(1))
    start_pos = matches[i].start()
    end_pos = matches[i+1].start() if i + 1 < len(matches) else len(full_doc)
    chunk = full_doc[start_pos:end_pos].strip()
    
    clean_chunk = re.sub(r'<<<PAGE_\d+>>>\n?', '', chunk)
    clean_chunk = re.sub(rf'^Q{qnum}\.\s*', '', clean_chunk).strip()
    
    m_ans = re.search(r'\n\s*(Answers?|Correct\s+Answers?)(?:\s*:|\s*\n)', clean_chunk, re.IGNORECASE)
    if not m_ans:
        print(f"Error: Question {qnum} has no Answer marker!")
        continue
    
    ans_start = m_ans.start()
    prompt_and_options = clean_chunk[:ans_start].strip()
    ans_and_expl = clean_chunk[ans_start:].strip()
    
    # Parse options
    opt_matches = list(re.finditer(r'(?:^|\n)\s*([A-H])\s*\.\s+', prompt_and_options))
    options = []
    question_text = prompt_and_options
    
    if opt_matches:
        first_opt_start = opt_matches[0].start()
        question_text = prompt_and_options[:first_opt_start].strip()
        
        for idx_opt, m_opt in enumerate(opt_matches):
            key = m_opt.group(1)
            start_idx = m_opt.end()
            end_idx = opt_matches[idx_opt + 1].start() if idx_opt + 1 < len(opt_matches) else len(prompt_and_options)
            opt_body = prompt_and_options[start_idx:end_idx].strip()
            opt_body = re.sub(r'\s+', ' ', opt_body)
            options.append({
                "key": key,
                "text": opt_body
            })
    
    # Parse Answer & Explanation
    m_expl = re.search(r'\n\s*(Explanation)(?:\s*:|\s*\n)', ans_and_expl, re.IGNORECASE)
    
    answer_raw = ""
    explanation_raw = ""
    
    if m_expl:
        answer_raw = ans_and_expl[:m_expl.start()].strip()
        explanation_raw = ans_and_expl[m_expl.end():].strip()
    else:
        # Check if it starts with 'Correct Answer:' or 'Statement 1 -->'
        m_stmt = re.search(r'\n\s*(Statement\s+1\s*-->)', ans_and_expl, re.IGNORECASE)
        if m_stmt:
            answer_raw = ans_and_expl[:m_stmt.start()].strip()
            explanation_raw = ans_and_expl[m_stmt.start():].strip()
        else:
            # Check for Correct Answer:
            lines = [l.strip() for l in ans_and_expl.split('\n') if l.strip()]
            # Usually line 0: 'Correct Answer:' or 'Answer:'
            # line 1: e.g. 'A. Yes'
            # line 2+: Explanation
            if len(lines) >= 2 and re.match(r'^(?:Correct\s+Answers?|Answers?):?$', lines[0], re.IGNORECASE):
                answer_raw = lines[1]
                explanation_raw = '\n\n'.join(lines[2:])
            else:
                answer_raw = ans_and_expl.strip()
                explanation_raw = ""
    
    clean_ans_text = re.sub(r'^(Answers?|Correct\s+Answers?)(?:\s*:|\s*\n)?', '', answer_raw, flags=re.IGNORECASE).strip()
    
    # If clean_ans_text is empty or just whitespace, look into explanation_raw
    if not clean_ans_text and explanation_raw:
        # Check Statement 1 --> ...
        stmts = re.findall(r'Statement\s+(\d+)\s*-->\s*(Yes|No)', explanation_raw, re.IGNORECASE)
        if stmts:
            clean_ans_text = " | ".join([f"Statement {s[0]}: {s[1]}" for s in stmts])
        else:
            m_corr = re.search(r'Correct\s+Answers?:?\s*\n(.*?)(?=\n\s*Incorrect\s+Answers?:|\n\n\n|\Z)', explanation_raw, re.DOTALL | re.IGNORECASE)
            if m_corr:
                corr_block = m_corr.group(1).strip()
                # Take lines up to the first detailed narrative
                corr_lines = [l.strip() for l in corr_block.split('\n') if l.strip()]
                # Take up to 3 lines or lines with ':' / '→'
                selected_lines = []
                for cl in corr_lines:
                    if any(sym in cl for sym in [':', '→', '=']) or len(selected_lines) == 0:
                        selected_lines.append(cl)
                    else:
                        break
                clean_ans_text = "\n".join(selected_lines) if selected_lines else corr_lines[0]

    # Special fix for Q155: remove duplicated lines if any
    if qnum == 155:
        clean_ans_text = "C. the deployment name, endpoint, and key"
        if not explanation_raw or "Incorrect Answers:" not in explanation_raw:
            explanation_raw = """To connect an application to an Azure OpenAI model, the SDK needs three key pieces of information. The endpoint identifies the Azure OpenAI resource that the application should connect to, the key authenticates the application to that resource, and the deployment name identifies the specific model deployment that the application wants to use. In Azure OpenAI, applications generally call a deployment, rather than directly specifying the underlying model name in the API request.

Incorrect Answers:
A. the deployment name, key, and model name: This is missing the endpoint, which tells the SDK where the Azure OpenAI resource is located.
B. the endpoint, key, and model type: The SDK needs the deployment name to identify which deployed model should process the request.
D. the endpoint, key, and model name: The model name describes the underlying model, but Azure OpenAI applications target the deployment name."""

    # Parse answer_keys for MC questions
    answer_keys = []
    if options:
        # Match lines starting with key e.g. 'A.' or 'F .'
        matched_keys = re.findall(r'(?:^|\n)\s*([A-H])\s*\.', clean_ans_text)
        if not matched_keys:
            # check comma or 'and' separated
            if re.match(r'^[A-H](?:\s*,\s*[A-H]|\s+and\s+[A-H])+$', clean_ans_text.strip()):
                matched_keys = re.findall(r'[A-H]', clean_ans_text)
            else:
                # check single letter
                m_single = re.match(r'^([A-H])\b', clean_ans_text.strip())
                if m_single:
                    matched_keys = [m_single.group(1)]
        
        valid_keys = [opt['key'] for opt in options]
        seen = set()
        for k in matched_keys:
            if k in valid_keys and k not in seen:
                seen.add(k)
                answer_keys.append(k)
        
        # Fallback to explanation
        if not answer_keys and explanation_raw:
            m_exp_corr = re.findall(r'(?:Correct\s+Answers?|Answer):\s*\n?\s*([A-H])\s*\.', explanation_raw)
            for k in m_exp_corr:
                if k in valid_keys and k not in seen:
                    seen.add(k)
                    answer_keys.append(k)

    # Determine question type
    q_type = "multiple_choice"
    lower_prompt = question_text.lower()
    if not options:
        if "select yes if the statement is true" in lower_prompt or "select yes" in lower_prompt:
            q_type = "yes_no"
        elif "drag" in lower_prompt:
            q_type = "drag_drop"
        else:
            q_type = "matching_hot_area"
    else:
        if len(answer_keys) > 1 or "which two" in lower_prompt or "which three" in lower_prompt or "select two" in lower_prompt or "select three" in lower_prompt:
            q_type = "multiple_choice_multi"
        else:
            q_type = "multiple_choice_single"

    cleaned_expl = re.sub(r'\n{3,}', '\n\n', explanation_raw).strip()
    q_imgs = q_images_map.get(qnum, [])
    
    q_obj = {
        "id": qnum,
        "title": f"Q{qnum}",
        "type": q_type,
        "question": question_text,
        "options": options,
        "answer": clean_ans_text,
        "answer_keys": answer_keys,
        "explanation": cleaned_expl,
        "images": q_imgs,
        "pages": q_to_pages.get(qnum, [])
    }
    questions.append(q_obj)

print(f"Total processed questions: {len(questions)}")

out_json_path = os.path.join(OUTPUT_DIR, "ai-103-questions.json")
with open(out_json_path, "w", encoding="utf-8") as f:
    json.dump({
        "exam": "AI-103",
        "title": "Azure AI Apps and Agents Developer Associate",
        "total_questions": len(questions),
        "source": "AI-103 175.pdf",
        "questions": questions
    }, f, ensure_ascii=False, indent=2)

print(f"Successfully wrote JSON to {out_json_path}")
