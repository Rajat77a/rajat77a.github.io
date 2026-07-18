# Portfolio Mobile-First Fix Log

**Author:** Rajat Krishnan  
**Date:** July 19, 2026  
**Portfolio URL:** (your deployed URL)

---

## Issues Found and Fixed

### 1. Mobile Navigation Broken
**Before:** Navigation links displayed in a horizontal row with no mobile menu. On phones, links overflowed or were cut off.  
**After:** Added hamburger menu button that toggles navigation on mobile. Navigation stacks vertically on screens < 768px.  
**File:** `style.css` (added `.menu-toggle`, mobile nav styles), all HTML files (added button element)

### 2. No Responsive Layout
**Before:** Fixed padding (32px) on all sections. Content was too wide on mobile, causing horizontal scrolling.  
**After:** Added media queries for tablet (768px) and mobile (480px). Padding reduces to 20px on tablet, 16px on mobile.  
**File:** `style.css` (added `@media` blocks)

### 3. Case Preview Layout Broken on Mobile
**Before:** `.case-preview` used `display: flex` without wrapping. Image and text squeezed together on small screens.  
**After:** On mobile, case preview stacks vertically with centered text. Image takes full width.  
**File:** `style.css` (added responsive styles for `.case-preview`)

### 4. Images Missing Lazy Loading
**Before:** All images loaded immediately, slowing initial page load. No width/height attributes caused layout shift.  
**After:** Added `loading="lazy"` to all images. Added `width` and `height` attributes to prevent CLS.  
**Files:** `index.html`, `preppeer.html`, `about.html`

### 5. No Accessibility Features
**Before:** No skip link for keyboard users. No visible focus states. No aria-labels on interactive elements.  
**After:** Added skip link ("Skip to main content"). Added `:focus-visible` outline styles. Added `aria-label` to menu toggle button. Added `<main>` landmark.  
**Files:** `style.css`, all HTML files

### 6. Hero Text Too Large on Mobile
**Before:** Hero h1 used `clamp(2rem, 5vw, 3rem)` which was still too large on small phones.  
**After:** Added mobile-specific font size (1.5rem) for screens < 480px.  
**File:** `style.css`

### 7. Link Chips Too Large on Mobile
**Before:** Link chips had fixed padding (10px 20px) that looked oversized on phones.  
**After:** Reduced padding to 8px 16px on mobile.  
**File:** `style.css`

---

## Files Modified

| File | Changes |
|------|---------|
| `style.css` | Added skip link, focus states, mobile menu, responsive media queries |
| `index.html` | Added skip link, menu toggle button, `<main>` landmark, lazy loading |
| `preppeer.html` | Added skip link, menu toggle button, `<main>` landmark, lazy loading, image dimensions |
| `about.html` | Added skip link, menu toggle button, `<main>` landmark, lazy loading, image dimensions |

---

## Testing Checklist

- [ ] Open on real phone (iOS Safari / Android Chrome)
- [ ] Tap hamburger menu - navigation opens
- [ ] Tap navigation links - pages load correctly
- [ ] Scroll through all content - no horizontal scroll
- [ ] Check text readability - comfortable size, good contrast
- [ ] Check images - crisp, not blurry, properly sized
- [ ] Tap all links - no broken links
- [ ] Test on tablet width (768px)
- [ ] Test on desktop width (1200px+)
- [ ] Run Lighthouse audit for accessibility

---

## Before/After Notes

### Before (Issues)
- Navigation overflowed on mobile
- Content caused horizontal scrolling
- Images loaded all at once (slow)
- No keyboard navigation support
- Hero text too large on small screens

### After (Fixed)
- Hamburger menu on mobile
- Responsive layout at all breakpoints
- Lazy loading for images
- Skip link and focus states
- Appropriately sized text on all devices
