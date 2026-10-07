"""Extract the public resume; rebuilding does not call an AI service."""
from pathlib import Path
from pypdf import PdfReader
import json, hashlib, re

root = Path(__file__).resolve().parents[1]
pdf = root / 'assets/docs/Rajat_Krishnan_Resume.pdf'
sections = []
headings = {'SUMMARY', 'SKILLS', 'EXPERIENCE', 'PROJECTS', 'EDUCATION', 'ACHIEVEMENTS', 'CERTIFICATIONS'}
for page_number, page in enumerate(PdfReader(pdf).pages, 1):
    title, lines = 'CONTACT', []
    def save():
        if lines:
            sections.append({'section': title, 'page': page_number, 'text': '\n'.join(lines)})
    for raw in page.extract_text().splitlines():
        line = re.sub(r'[\x00-\x1f\x7f]', '', raw).strip()
        if line in headings:
            save()
            title, lines = line, []
        elif line:
            # Keep the user's preference out of generated answers while preserving the PDF source.
            line = line.replace('as Team Minnal, ', '')
            lines.append(line)
    save()
output = {'sha256': hashlib.sha256(pdf.read_bytes()).hexdigest(), 'sections': sections}
(root / 'rag/sources/resume.json').write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Extracted {len(sections)} resume sections.')
