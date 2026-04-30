## Quiet Luxury UI Refinements — Page 1 & Page 2

Pure CSS/className changes only. No structural, routing, or functional changes. Existing copy preserved verbatim.

### 1. Page 1 — Room Cards: strict horizontal scroll-snapping

**File:** `src/pages/Index.tsx` (room scroll container) and `src/components/RoomCard.tsx` (snap children)

The container already has `snap-x snap-mandatory`, but cards use `snap-start` which snaps to the left edge, not center. Refine to snap-to-center for a premium swipe feel:

- Container: keep `flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory`, add `scroll-px-6` so the snap padding matches the visual padding, and add `overscroll-x-contain` to prevent page bounce.
- Card: change `snap-start` → `snap-center` on the `motion.button` in `RoomCard.tsx`. Also add `scroll-ml-6` is unnecessary with `snap-center`.

This gives perfect, deterministic snapping as the user swipes through rooms.

### 2. Page 2 — Venue thumbnail legibility

**File:** `src/components/VenueCard.tsx`

Currently the thumbnail uses `bg-gradient-to-t from-card via-card/30 to-transparent`, which is tied to the espresso card color and fades unevenly. Replace with a stronger, neutral dark gradient and ensure text overlay contrast:

- Replace the overlay `<div>` gradient classes with: `absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent` (matches the spec: rgba(0,0,0,0.8) at bottom → transparent at top).
- The venue identity marker (top-left chip with first letter) sits inside the image area; it already uses `bg-background/60 backdrop-blur-sm` so it remains legible against the lighter top of the gradient.
- Body content (`venue.name`, address, snapshot) lives below the image in the card body — its readability is unchanged. The gradient ensures any text or chips placed *over* the image stay readable on light or busy thumbnails (e.g. Coofie Cafe).
- Promote the chip text (`text-foreground/80`) to `text-white` and the inner avatar letter to `text-white` to guarantee crisp legibility against the dark gradient regardless of image content. Keep Inter font (already inherited via body class).

### 3. Page 1 — Trust section breathing room

**File:** `src/pages/Index.tsx`

Increase whitespace around the "Connect when it feels right." section without altering text:

- The Trust `<motion.section>` currently uses `mb-20`. Add generous top padding and increase internal vertical rhythm:
  - Section: `mb-20` → `mt-8 mb-28 py-6`
  - Heading: `mb-6` → `mb-8`
  - List spacing: `space-y-5` → `space-y-7`

This adds quiet, premium air around the trust pillars while keeping all copy and icons exactly as they are.

### Technical summary

| Change | File | Lines touched |
|---|---|---|
| `snap-start` → `snap-center` on room card | `src/components/RoomCard.tsx` | 1 className |
| Add `scroll-px-6 overscroll-x-contain` to scroller | `src/pages/Index.tsx` | 1 className |
| Stronger neutral-black gradient + white chip text | `src/components/VenueCard.tsx` | 2 classNames |
| Trust section padding + internal spacing | `src/pages/Index.tsx` | 3 classNames |

No routes, components, props, store, or copy are modified. All changes are additive Tailwind utility tweaks that preserve the existing Quiet Luxury palette (espresso bg, bronze accents, Playfair + Inter).