# Changelog

All notable changes to this portfolio will be documented in this file.

## [1.2.0] - 2026-07-19

### Fixed
- Mobile nav overlay bleed-through (hero text visible behind menu)
- Case study image too small on mobile (now fills card with object-fit: cover)
- Subtext contrast too low (updated to #B8B8B8 for WCAG AA)
- Tap targets below 44px minimum on link chips and nav links
- Hero headline overflow on 320px screens (changed to clamp(1.6rem, 6vw, 2.8rem))

### Changed
- Mobile nav from position: absolute to position: fixed (full-viewport overlay)
- Updated --muted color from #8A8F98 to #B8B8B8 for better contrast
- Link chips now use min-height: 44px with inline-flex layout
- Mobile nav links now flex-centered with min-height: 44px

## [1.1.0] - 2026-07-16

### Added
- Hamburger menu for mobile navigation
- Responsive media queries for tablet and mobile
- Skip link for keyboard accessibility
- :focus-visible outline styles
- aria-label on menu toggle button
- Lazy loading on all images
- Width/height attributes to prevent CLS

### Fixed
- Navigation overflow on mobile
- Horizontal scrolling on small screens
- Hero text too large on mobile
- Link chips oversized on mobile

## [1.0.0] - 2026-07-15

### Added
- Initial portfolio with Home, PrepPeer, and About pages
- Dark theme with teal accent color
- Google Fonts (Inter, Space Grotesk)
- GitHub Pages deployment
