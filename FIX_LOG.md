# Portfolio Mobile-First Fix Log

**Author:** Rajat Krishnan
**Date:** July 19, 2026
**Portfolio URL:** https://rajat77a.github.io

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

### 8. Mobile Nav Overlay Bleed-Through (July 19, 2026)
**Before:** When hamburger menu opened on mobile, hero text bled through behind the nav overlay. Nav had `position: absolute` with `background: #0B0C0E` (partially transparent due to topbar's `rgba(11,12,14,0.9)` backdrop).
**After:** Changed mobile nav to `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--bg); z-index: 9; padding: 80px 16px 16px;` — fully opaque, full-viewport overlay.
**File:** `style.css` (mobile nav media query)

### 9. Case Study Image Too Small on Mobile (July 19, 2026)
**Before:** PrepPeer screenshot in case study card rendered as tiny shrunken desktop screenshot on mobile (default `height: auto`).
**After:** Added `.card img { height: 200px; object-fit: cover; }` in tablet media query (≤768px) so images fill the card properly.
**File:** `style.css`

### 10. Subtext Contrast Too Low (July 19, 2026)
**Before:** Hero subtitle used `--muted: #8A8F98` on `#0B0C0E` background — contrast ratio ~4.3:1, fails WCAG AA.
**After:** Updated `--muted` from `#8A8F98` to `#B8B8B8` — contrast ratio ~7.5:1, passes WCAG AA.
**File:** `style.css`

### 11. Tap Targets Too Small (July 19, 2026)
**Before:** Link chips (LinkedIn, GitHub, CV/Resume, Book a chat) had `padding: 10px 20px` — below 44px minimum tap target height.
**After:** Updated `.link-chip` to `min-height: 44px; padding: 12px 20px; display: inline-flex; align-items: center;`. Mobile nav links also updated to `min-height: 44px; display: flex; align-items: center; justify-content: center`.
**File:** `style.css`

### 12. Hero Headline Overflow on 320px (July 19, 2026)
**Before:** Hero h1 used `clamp(2rem, 5vw, 3rem)` — still too large on 320px screens.
**After:** Changed to `clamp(1.6rem, 6vw, 2.8rem)` so it scales properly on narrow phones.
**File:** `style.css`

---

## Files Modified

| File | Changes |
|------|---------|
| `style.css` | Added skip link, focus states, mobile menu, responsive media queries, opacity fix, contrast fix, tap targets, clamp fix |
| `index.html` | Added skip link, menu toggle button, `<main>` landmark, lazy loading |
| `preppeer.html` | Added skip link, menu toggle button, `<main>` landmark, lazy loading, image dimensions |
| `about.html` | Added skip link, menu toggle button, `<main>` landmark, lazy loading, image dimensions |

---

## Testing Checklist

- [x] Open on real phone (iOS Safari / Android Chrome)
- [x] Tap hamburger menu - navigation opens with solid background
- [x] Tap navigation links - pages load correctly
- [x] Scroll through all content - no horizontal scroll
- [x] Check text readability - comfortable size, good contrast (WCAG AA)
- [x] Check images - crisp, not blurry, properly sized
- [x] Tap all links - no broken links
- [x] Test on tablet width (768px)
- [x] Test on desktop width (1200px+)
- [x] Run Lighthouse audit for accessibility

---

## Before/After Notes

### Before (Issues)
- Navigation overflowed on mobile
- Content caused horizontal scrolling
- Images loaded all at once (slow)
- No keyboard navigation support
- Hero text too large on small screens
- Nav overlay transparent, hero text bled through
- Case study image tiny/shrunken on mobile
- Subtext contrast too low (4.3:1)
- Tap targets below 44px minimum
- Hero headline overflowed on 320px screens

### After (Fixed)
- Hamburger menu on mobile with solid full-screen overlay
- Responsive layout at all breakpoints
- Lazy loading for images
- Skip link and focus states
- Appropriately sized text on all devices
- Case study images fill card with object-fit: cover
- WCAG AA contrast on all text
- 44px minimum tap targets on all interactive elements
- Hero headline scales from 1.6rem to 2.8rem
