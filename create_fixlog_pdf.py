import markdown
from xhtml2pdf import pisa

md_content = """# Portfolio Mobile-First Fix Log

**Author:** Rajat Krishnan  
**Date:** July 19, 2026  
**Portfolio URL:** https://rajat77a.github.io/

---

## Issues Found and Fixed

### 1. Mobile Navigation Broken
**Before:** Navigation links displayed in a horizontal row with no mobile menu. On phones, links overflowed or were cut off.  
**After:** Added hamburger menu button that toggles navigation on mobile. Navigation stacks vertically on screens < 768px.  
**File:** style.css, all HTML files

### 2. No Responsive Layout
**Before:** Fixed padding (32px) on all sections. Content was too wide on mobile, causing horizontal scrolling.  
**After:** Added media queries for tablet (768px) and mobile (480px). Padding reduces to 20px on tablet, 16px on mobile.  
**File:** style.css

### 3. Case Preview Layout Broken on Mobile
**Before:** .case-preview used display: flex without wrapping. Image and text squeezed together on small screens.  
**After:** On mobile, case preview stacks vertically with centered text. Image takes full width.  
**File:** style.css

### 4. Images Missing Lazy Loading
**Before:** All images loaded immediately, slowing initial page load. No width/height attributes caused layout shift.  
**After:** Added loading="lazy" to all images. Added width and height attributes to prevent CLS.  
**Files:** index.html, preppeer.html, about.html

### 5. No Accessibility Features
**Before:** No skip link for keyboard users. No visible focus states. No aria-labels on interactive elements.  
**After:** Added skip link. Added :focus-visible outline styles. Added aria-label to menu toggle button. Added main landmark.  
**Files:** style.css, all HTML files

### 6. Hero Text Too Large on Mobile
**Before:** Hero h1 used clamp(2rem, 5vw, 3rem) which was still too large on small phones.  
**After:** Added mobile-specific font size (1.5rem) for screens < 480px.  
**File:** style.css

### 7. Menu Background Too Transparent
**Before:** Navigation menu background was semi-transparent, showing hero text through it.  
**After:** Changed to solid background color (#0B0C0E) for full opacity.  
**File:** style.css

---

## Files Modified

| File | Changes |
|------|---------|
| style.css | Added skip link, focus states, mobile menu, responsive media queries |
| index.html | Added skip link, menu toggle button, main landmark, lazy loading |
| preppeer.html | Added skip link, menu toggle button, main landmark, lazy loading |
| about.html | Added skip link, menu toggle button, main landmark, lazy loading |

---

## Phone Screenshots

### Before (Menu Open - Issues)
[Screenshot shows navigation menu with transparent background, hero text visible through menu]

### After (Final Working State)
[Screenshot shows responsive layout with solid menu background, readable text, proper spacing]

---

## Testing Completed

- Opened on real Android phone (Chrome)
- Hamburger menu opens and closes correctly
- No horizontal scrolling on any page
- Text is readable at all sizes
- Images are crisp and properly sized
- All links work correctly
- Menu background is now solid
"""

# Convert markdown to HTML
html_body = markdown.markdown(md_content)

# Wrap in HTML with styling
html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    body {{ font-family: Arial, sans-serif; margin: 30px; line-height: 1.6; font-size: 12px; }}
    h1 {{ color: #333; font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 8px; }}
    h2 {{ color: #444; font-size: 16px; margin-top: 25px; }}
    h3 {{ color: #555; font-size: 13px; }}
    table {{ border-collapse: collapse; width: 100%; margin: 15px 0; font-size: 11px; }}
    th, td {{ border: 1px solid #ddd; padding: 6px; text-align: left; }}
    th {{ background-color: #f2f2f2; }}
    code {{ background-color: #f4f4f4; padding: 2px 5px; border-radius: 2px; font-size: 11px; }}
    pre {{ background-color: #f4f4f4; padding: 12px; border-radius: 4px; font-size: 11px; }}
    ul, ol {{ margin: 8px 0; padding-left: 25px; }}
    li {{ margin: 4px 0; }}
    strong {{ color: #333; }}
    hr {{ border: none; border-top: 1px solid #ddd; margin: 20px 0; }}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

# Create PDF
output_file = 'C:/Users/rajat/Downloads/portfolio-fix-log.pdf'
with open(output_file, 'wb') as f:
    pisa_status = pisa.CreatePDF(html, dest=f)

if pisa_status.err:
    print('Error creating PDF')
else:
    print('PDF created successfully')
