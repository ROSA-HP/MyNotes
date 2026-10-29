---
name: Cosmic Luminary
colors:
  surface: '#0f1322'
  surface-dim: '#0f1322'
  surface-bright: '#353849'
  surface-container-lowest: '#090d1c'
  surface-container-low: '#171b2a'
  surface-container: '#1b1f2f'
  surface-container-high: '#252939'
  surface-container-highest: '#303445'
  on-surface: '#dfe1f7'
  on-surface-variant: '#c9c4d8'
  inverse-surface: '#dfe1f7'
  inverse-on-surface: '#2c3040'
  outline: '#938ea1'
  outline-variant: '#484555'
  surface-tint: '#cabeff'
  primary: '#cabeff'
  on-primary: '#31009a'
  primary-container: '#947dff'
  on-primary-container: '#2a0088'
  inverse-primary: '#603ce2'
  secondary: '#ffb1c5'
  on-secondary: '#650030'
  secondary-container: '#8c0a46'
  on-secondary-container: '#ff95b4'
  tertiary: '#a2c9ff'
  on-tertiary: '#00315b'
  tertiary-container: '#3994ef'
  on-tertiary-container: '#002b50'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e6deff'
  primary-fixed-dim: '#cabeff'
  on-primary-fixed: '#1c0062'
  on-primary-fixed-variant: '#4816cb'
  secondary-fixed: '#ffd9e1'
  secondary-fixed-dim: '#ffb1c5'
  on-secondary-fixed: '#3f001b'
  on-secondary-fixed-variant: '#8c0a46'
  tertiary-fixed: '#d3e4ff'
  tertiary-fixed-dim: '#a2c9ff'
  on-tertiary-fixed: '#001c38'
  on-tertiary-fixed-variant: '#004881'
  background: '#0f1322'
  on-background: '#dfe1f7'
  surface-variant: '#303445'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  metric-xl:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  metric-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.02em
  metric-sm:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 0.75rem
  gutter-lg: 2rem
  margin: 2rem
  margin-sm: 1rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a balance between gamified study tools and focused cognitive workspaces. Aimed at high school, undergraduate, and language-learning students aged 16–25, the visual identity re-imagines rote memorization as cosmic cartography: every concept is an illuminated star, and every cross-reference builds an interconnected constellation.

### Aesthetic Foundation
- **Celestial Glassmorphism:** Deep space canvases overlaid with translucent panels, optical refraction, and subtle boundary borders that capture ambient light without visual noise.
- **Luminescent Visual Hierarchy:** Information hierarchy is driven by varying intensities of luminosity and color temperature rather than heavy opaque backgrounds or harsh drop shadows.
- **Focused Playfulness:** Micro-rewards, soft tactile pill buttons, energetic typography for numbers, and fluid physics imbue joy without tipping into distracting juvenile gamification.

## Colors

The color system operates on an emissive light model. In dark mode, elements radiate light from the deep void. In light mode, the system transitions to a clean editorial paper aesthetic with lavender undertones and soft ambient shading.

### Dark Mode (Default)
- **Canvas Base (`#0B0F1E`):** Deep Midnight. Absorbs peripheral distraction and provides the dark backdrop for radiant nodes.
- **Surface Elevation 1 (`rgba(20, 26, 51, 0.60)`):** Frosted nebula glass with `backdrop-filter: blur(16px)` and a crisp rim highlight `rgba(255, 255, 255, 0.10)`.
- **Surface Elevation 2 (`rgba(30, 39, 73, 0.75)`):** Raised modals, floating control islands, and hover states with `rgba(255, 255, 255, 0.16)` borders.

### Light Mode
- **Canvas Base (`#F6F5FF`):** Pale cosmic mist with slight lilac saturation.
- **Surface Elevation 1 (`#FFFFFF`):** Crisp pure white card with subtle lavender border `rgba(124, 92, 255, 0.12)` and diffused ambient shadow.
- **Surface Elevation 2 (`#FFFFFF`):** High-level overlays with elevated lilac rim `rgba(124, 92, 255, 0.20)`.

### Semantic & Domain Accents
- **Primary Core (`#7C5CFF`):** Soft Violet Glow. Used for focal actions, active constellation anchors, progress paths, and primary interactive nodes.
- **Reward / Gamification (`#FF6B9D`):** Supernova Coral. Reserved for streak milestones, XP counters, critical memory flags, and achievement badges.
- **Language / Domain Taxonomy (Glow Badges & Node Edges):**
  - **English Nodes (`#4DA3FF`):** Atmospheric Sky Blue.
  - **Arabic Nodes (`#2DD4A0`):** Emerald Aurora. Paired with intrinsic RTL alignment and font overrides.
  - **German Nodes (`#FFB04D`):** Solar Amber. High legibility for compound noun chains.

## Typography

The typographic hierarchy distinguishes narrative human thought from quantifiable metric progression.

- **Primary UI & Prose (`Plus Jakarta Sans`):** Selected for its geometric structure, open counters, and high legibility across interactive states. Renders markdown study notes, summaries, navigation controls, and contextual menus cleanly.
- **Metrics, Counters & Data Display (`Space Grotesk`):** Injects a technical, space-age tone into gamified elements: XP gain counters, memory decay half-lives, streak trackers, and micro-analytics.
- **Multilingual Script Support (`IBM Plex Sans Arabic`):** Applied across all nodes and badges tagged with Arabic context. When rendering Arabic, letter spacing is set to `0` (avoiding character disconnection), line height is expanded by 20% to account for high and low ascenders/descenders, and layout flows seamlessly into CSS `dir="rtl"`.

## Layout & Spacing

This design system uses an **ambient canvas model** that transitions between a structured 12-column responsive grid (for dashboards, settings, flashcards, and metrics) and an infinite, pannable node canvas (for the constellation mind map).

### Responsive Breakpoints
- **Mobile (`< 768px`):** 4-column layout, `margin-sm` (1rem / 16px), `gutter-sm` (0.75rem / 12px). Constellation maps enter focused "orbit view" with single-node centering and bottom sheet inspections.
- **Tablet (`768px – 1024px`):** 8-column layout, `margin` (2rem / 32px), `gutter` (1.5rem / 24px). Split drawer view for note drafting while previewing star linkages.
- **Desktop (`> 1024px`):** 12-column system, max-width 1440px for structured views, fluid viewport width for constellation maps. Side docks float over the canvas with frosted backdrop filters.

### Component Spacing Rationale
Paddings within card nodes follow strict 8pt base units: tight badges utilize `space-xs` (4px) and `space-sm` (8px), operational tools scale between `space-md` (16px) and `space-lg` (24px), and expansive canvas HUD boundaries use `space-xl` (40px).

## Elevation & Depth

Visual hierarchy uses luminous optical depth rather than opaque stacking. Deep surfaces absorb focus, while interactive layers diffuse light back to the viewer.

### Tiers of Elevation

1. **Space Void (Base 0):** Hex `#0B0F1E` punctuated with procedural SVG star particles with randomized opacities (15% to 40%). Static canvas layer.
2. **Nebula Panel (Elevation 1):** Solid `#141A33` blended at 60% opacity with `backdrop-filter: blur(16px)` and an inner highlight rim of `inset 0 1px 0 0 rgba(255, 255, 255, 0.08)`. Border is `1px solid rgba(255, 255, 255, 0.08)`. Used for cards, note sidebars, and control panels.
3. **Floating Satellite (Elevation 2):** Solid `#1E2749` at 80% opacity with `backdrop-filter: blur(24px)`. Drops an ambient celestial glow: `0 12px 32px -4px rgba(11, 15, 30, 0.8), 0 0 24px 0 rgba(124, 92, 255, 0.15)`. Used for hovering node previews, modals, and quick search.
4. **Active Star / Node Glow (Peak Focus):** Nodes and active elements produce an outward radiating aura:
   - **Violet Core:** `box-shadow: 0 0 20px 2px rgba(124, 92, 255, 0.45)`.
   - **Coral Streak:** `box-shadow: 0 0 20px 2px rgba(255, 107, 157, 0.5)`.
   - **Language Nodes:** Box-shadow utilizes corresponding semantic hex at 35% opacity with an 18px blur radius.

## Shapes

The geometric personality balances organic celestial curvature with clean, modern digital surfaces. 

- **Containers & Surfaces:** Panels, modals, and preview overlays use `rounded-2xl` (1rem / 16px) to `rounded-3xl` (1.5rem / 24px). Sharp 90-degree corners are eliminated to evoke an organic, floating aesthetic.
- **Pills & Badges:** Tags, language markers, filters, and status chips use full pill shapes (`rounded-full` / 9999px) to contrast against squared text blocks and mimic astronomical capsules.
- **Constellation Nodes:** Circular geometric anchors ranging from 12px (sub-concept star) to 48px (core anchor topic), encased in concentric translucent rings.

## Components

### Buttons
- **Primary Celestial Button:** Pill or `rounded-2xl` shape with background `#7C5CFF`. Text is white, bold `Plus Jakarta Sans`. Rest state features an outer glow of `0 0 16px rgba(124, 92, 255, 0.3)`. Hover triggers a scale micro-interaction (`scale-105`) and increases aura blur to `24px` with `0.5` opacity. Active state compresses slightly (`scale-95`).
- **Ghost Cosmic Button:** Frosted background `rgba(255, 255, 255, 0.05)`, border `1px solid rgba(255, 255, 255, 0.12)`, text `#F6F5FF`. Hover transitions background to `rgba(124, 92, 255, 0.15)` and border to `rgba(124, 92, 255, 0.4)`.

### Chips & Cosmic Pill Tags
- Fully rounded pills (`padding: 4px 12px`) displaying multilingual codes or concept categories.
- **Language Chips:** Feature a leading 6px glowing dot.
  - *English:* Border `rgba(77, 163, 255, 0.3)`, text `#4DA3FF`, dot glow `#4DA3FF`.
  - *Arabic:* Border `rgba(45, 212, 160, 0.3)`, text `#2DD4A0`, dot glow `#2DD4A0`. Font override applies `IBM Plex Sans Arabic`.
  - *German:* Border `rgba(255, 176, 77, 0.3)`, text `#FFB04D`, dot glow `#FFB04D`.

### Constellation Mind Map Nodes
- Central node rendering with an SVG connector canvas.
- Unvisited / Low-strength nodes appear as faint stars (30% opacity, 1px subtle ring).
- Mastered nodes pulse slowly using CSS keyframes, casting their domain color aura.
- Hovering a node highlights all connected vector filaments with an illuminated gradient line connecting child concepts.

### Input Fields
- Background `rgba(20, 26, 51, 0.45)`, frosted blur `12px`, border `1px solid rgba(255, 255, 255, 0.12)`, border-radius `16px`.
- Text is crisp `#F6F5FF` with placeholder rendered in muted lavender `#7D84A6`.
- Focus state eliminates standard browser outlines, transitioning border to `#7C5CFF` and casting an inner and outer glow: `box-shadow: 0 0 0 3px rgba(124, 92, 255, 0.25)`.

### Cards & Study Panels
- Built with `rounded-3xl` glass panels. Header areas house node titles alongside `Space Grotesk` metrics (e.g., `+50 XP`, `4d Interval`).
- Dividers between content use non-solid gradients (`linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`).

### Gamification & Streak Badges
- XP meters and streak counters are encased in frosted capsules highlighted with Supernova Coral (`#FF6B9D`).
- Number counters render exclusively in `Space Grotesk` with tabular figures (`font-variant-numeric: tabular-nums`) to ensure fluid layout during animated counting sequences.