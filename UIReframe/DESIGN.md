---
name: Academic Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464554'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#904900'
  on-tertiary: '#ffffff'
  tertiary-container: '#b55d00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
  background-main: '#F8FAFC'
  background-card: '#FFFFFF'
  text-primary: '#0F172A'
  text-secondary: '#64748B'
  warning: '#F59E0B'
  danger: '#EF4444'
  border-subtle: '#E2E8F0'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 256px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for high-performance academic research and focused study environments. It targets researchers, students, and academics who require a workspace that minimizes cognitive load while maintaining a professional, authoritative atmosphere. 

The aesthetic is **Corporate / Modern** with a structural emphasis on high-contrast hierarchy. By utilizing a "Dark Navigation, Light Content" architecture, the system creates a clear mental model: the dark periphery represents the "tools and management," while the light central canvas represents "active creation and discovery." The visual tone is scholarly, systematic, and intentional, avoiding unnecessary ornamentation in favor of crisp borders and purposeful whitespace.

## Colors

This design system utilizes a high-contrast layout logic. The primary navigation and sidebar areas use the **Deep Slate (Neutral)** as a solid background to anchor the UI. The main application stage uses a **Light Gray** background to reduce eye strain during long reading sessions.

- **Primary Indigo** is reserved exclusively for primary actions, active navigation states, and focus indicators.
- **Emerald** serves as the success indicator, specifically for completed research milestones or "Won" statuses.
- **Amber and Red** are used sparingly for temporal urgency (deadlines) and system errors, respectively.
- **Text Hierarchy** is strictly enforced: Deep Slate for readability in headers, and Slate 500 for metadata and supporting labels.

## Typography

The typography system relies on **Inter** to provide a neutral, highly legible sans-serif experience across all data-dense views. 

The scale is intentionally compact to facilitate the display of complex information (citations, data tables, and research notes). Headlines use tighter letter spacing and heavier weights to maintain a strong presence against the light background. Labels are slightly tracked out (letter spacing) to ensure legibility at the smallest sizes, particularly when used in the sidebar or within pill-shaped badges.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The sidebar is a fixed 256px column, providing a consistent "command center." The main content area is a fluid grid that expands to a maximum width of 1440px, ensuring that long-form text remains readable without excessive line lengths.

A 24px gutter is used between major layout blocks (e.g., between the sidebar and the content stage). On mobile devices, the sidebar transitions into a hidden drawer, and margins are reduced to 16px. Vertical rhythm is maintained through a base 8px unit, ensuring all components and text blocks align to a predictable grid.

## Elevation & Depth

This design system uses a "Layered Flat" approach. Depth is communicated through color blocking rather than heavy shadows.

- **Level 0 (Floor):** Main Content Background (#F8FAFC).
- **Level 1 (Cards):** Pure White (#FFFFFF) with a subtle 1px border (#E2E8F0). This provides a crisp "sheet" effect for data.
- **Level 2 (Dropdowns/Modals):** These use a soft, ambient shadow (10% opacity Deep Slate) with a 12px blur to separate them from the card layer.
- **Sidebar:** Treated as the deepest layer in the Z-space, utilizing its dark fill to recede while providing high-contrast for navigation items.

## Shapes

The shape language balances approachability with professional rigor. Main content containers (Cards) use a **12px (rounded-lg)** radius to feel modern and distinct. Interactive elements like buttons use an **8px (standard)** radius to appear more precise and functional. Status badges utilize a **Full (Pill)** radius to distinguish them immediately from buttons and input fields.

## Components

### Buttons
Primary buttons use the Indigo background with White text and an 8px radius. Secondary buttons should use a subtle gray border with Indigo text. Hover states for primary buttons should involve a slight darkening of the Indigo.

### Cards
All cards must have a 12px border radius, a 1px border in `#E2E8F0`, and no visible shadow except on hover, where a soft, diffused shadow may be applied to indicate interactivity.

### Badges & Statuses
Badges must be pill-shaped with a "light background, dark text" treatment. For example, a "Success" badge uses a light emerald tint for the background and dark emerald for the text and icon.

### Navigation (Sidebar)
The sidebar items use Indigo for the active state (either a vertical 4px bar on the left edge or a subtle background tint). Icons in the sidebar should be Slate 400 when inactive and White when active.

### Input Fields
Fields should use the Card style (White background, 1px border) but with an 8px radius to match buttons. On focus, the border should transition to 2px Indigo.

### Lists
Research lists and data tables should use "Zebra Striping" or simple 1px dividers in `#E2E8F0` to maintain horizontal flow without adding visual bulk.