# BRIEF — Prajna Co-hab website: smoothness & seamlessness audit

You are auditing a STATIC HTML/CSS/JS site (no build step, no framework, no dependencies).

## Location
- Workspace source of truth: data/prajna-co-hab/site/  (also accessible on the Mac at
  ~/Downloads/prajna-repo/ which is the deployed git clone)
- 9 pages: index.html, autohub.html, gallery.html, pune.html, discover.html,
  about.html, contact.html, feedback.html, 404.html
- assets/style.css, assets/site.js, assets/fluid.js, assets/sw.js, sw.js, config.js

## The goal (user's words)
"Make the website more smooth and seamless. See each element, factor, aspect and things."

## Architecture you must understand BEFORE judging anything
- `assets/fluid.js` paints a FULL-VIEWPORT `requestAnimationFrame` canvas (`.bgfx`, position:fixed,
  z-index:-3) on EVERY page, forever, with: gradient wash, 5 radial colour blobs, 8 caustic light
  beams, 14-26 drifting SVG motif sprites, expanding ripple rings, a pointer-following radial light,
  and hairline arcs. ~15+ full-screen composited gradients PER FRAME.
- Above it sit translucent "glass" panels with `backdrop-filter: blur()` — a huge list of selectors
  (.card, .post, .mapbox, form.pform, .plaque, .statrow>div, .faq details, .amen div, .menucard .day,
  .promises div, .costrows>div, .voice ...) each with blur(6-10px).
- On top: a sticky `header` with blur(14px) + a `position:fixed` bottom `.mobilebar` with blur.
- There is a `sw.js` service worker.

## What I want from you (READ-ONLY, do not edit any file)
Produce `~/Downloads/prajna-repo/.muse-context/AUDIT-SMOOTH.md` with concrete, file:line-referenced
findings. Focus ONLY on things that make the page feel less smooth/seamless:

1. **Scroll jank**: list every element that gets a `backdrop-filter` while a full-screen canvas
   animates behind it. Count them. Which page has the most? Is there a paint storm?
2. **Layer promotion**: identify elements that are transparent-over-animating-background but do NOT
   have their own compositing layer (no translate3d/will-change/backdrop-filter). These repaint the
   canvas region every frame. Name them.
3. **Transform conflicts**: find any element where a hover/JS rule REPLACES a base transform (which
   would drop GPU layer promotion mid-interaction). Check `.card.tilt:hover`, `.gal figure:hover`,
   `.promises div:hover`, `.menucard .day:hover`, `.post:hover` and the JS tilt code in site.js.
4. **Mobile cost**: which visuals run on phones that shouldn't (blur radius, dpr, motif count)?
   `prefers-reduced-motion` handling — is it complete?
5. **Dead / duplicated code**: list CSS rules that are overridden by later rules, dead classes
   (e.g. `.gal` grid vs the new `.ss` slideshow, `.reveal` vs `.flow`), missing keyframes
   referenced by `animation:` shorthand, duplicate `@media` blocks, `!important` count and where.
6. **Layout shift (CLS)**: images iframes and the map without width/height, fonts, anything that
   moves after load.
7. **Seams**: places where one band visually stops and another begins (borders, gradient stops,
   mismatched backgrounds, the header/footer/mobilebar edges).
8. **Navigation flow**: anything that breaks continuity between pages (page transition, scroll
   restoration, focus, the service worker's document caching).

Write findings as: `file:line — what's wrong — why it hurts smoothness — the minimal fix`.
Be specific and mechanical. Do not propose redesigns, do not change copy, do not change brand
colours. Do not edit files. Just the audit.
