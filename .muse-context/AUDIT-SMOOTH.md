# AUDIT — Prajna Co-hab smoothness & seamlessness

Read-only audit. No file was edited. No copy, colour, or redesign proposals.

Note on paths: `BRIEF-SMOOTH.md` cites `data/prajna-co-hab/site/`, which does not
exist in this checkout. The site lives at the repo root (`index.html`,
`assets/style.css`, …). All `file:line` refs below are repo-root-relative.

Canvas baseline (assumed, verified in code): `assets/fluid.js:105-204` repaints a
full-viewport canvas every frame with a paper gradient (109-114), two wash
radials (116-124), 3-5 blob radials (126-136), 5-8 beam radials (139-154), a
pointer radial (156-162), 14-26 motif images (165-178), two ripple rings
(184-193), and five arcs (195-202) — each followed by a full-screen `fillRect`,
then `requestAnimationFrame` (203). Everything below is cost on top of that.

---

## 1. Scroll jank — backdrop-filter over a permanently animating canvas

Effective blur rules (later wins; `!important` beats all non-`!important`):

- `assets/style.css:660-666` — `.card, .promises div, .amen div, .post, .voice,
  .statrow>div, .tourbox, .costrows>div, .plaque, .menucard .day, .step, .mapbox,
  .pitstats, .board .post` → `blur(9px) saturate(1.06) !important`; `header` →
  `blur(10px) !important` (667-670).
- `assets/style.css:466-472` — same glass list plus `form.pform, .faq details` →
  `blur(10px) !important`. `pform` and `faq details` are NOT re-listed in the
  v22 block, so they keep 10px — the two strongest blurs on form-heavy pages.
- `assets/style.css:556-561` — `.feature, .cta-strip, .tourbox` → `blur(9px)
  !important` (beats the 8px at 478-492).
- `assets/style.css:504` — `.mobilebar` → `blur(14px) !important`, `position:fixed`,
  always on screen.
- `assets/style.css:424` — `.mapbox .addr` → `blur(4px)` nested INSIDE the
  already-blurred `.mapbox` (double blur region).
- `assets/style.css:608` — `.day` → `blur(4px)` (not covered by the 516-523
  mobile reduction, so it keeps 4px while neighbours drop — inconsistent, not cheap).
- `assets/style.css:312` — `.familyband` → `blur(6px)` (never overridden; every
  page has a `.familyband`).

Findings (`file:line — what's wrong — why it hurts — minimal fix`):

- `assets/style.css:466-472,660-666` — ~15 selector groups carry backdrop blur
  simultaneously over one animating canvas; each forces the browser to re-blur
  its screen region every frame the canvas paints — scrolling becomes a full-page
  blur recompute, not a layer translate — cap blur to header + hero-adjacent
  panels only, or pause canvas on scroll.
- `index.html` (24× `.card`, 12× `.day`, `.promises`, `.menucard`, `.mapbox`,
  `.tourbox`, `.feature`, `.familyband`, 3× `.voice`, `.costrows`) — most glass
  nodes of any page (≈45+ blurred regions incl. header/mobilebar) — this page
  janks first on mid-range phones — remove blur from below-fold cards first.
- `feedback.html` — fewest glass nodes (`form.pform` only + header/mobilebar) —
  use as the smoothness baseline when A/B testing.
- `assets/style.css:317` — `body::before` is a fixed full-viewport weave+grain
  with `mix-blend-mode:multiply` at `opacity:.55`, stacked ABOVE the canvas
  (`z-index:-2` over `-3`, 334/330) — a fullscreen blend recomputed per frame —
  drop `mix-blend-mode` or merge the texture into the canvas wash.
- `assets/style.css:318-319` — `.vignette` fixed full-viewport radial over the
  canvas (`z-index:-1`, 335) — third fullscreen layer in the same stack — fold
  the vignette into the canvas gradient (fluid.js:109-114).
- `assets/style.css:43,180` + `667-670,504` — sticky `header` + fixed
  `.mobilebar` both blur over the canvas permanently; fixed/sticky blurred bars
  are re-composited on every scroll offset change — give them an opaque-ish
  background and no blur on small screens.
- `assets/style.css:377` — `.bgfx,.lotusdraw,.ripplelotus{will-change:transform,
  opacity}` pins three permanent compositor layers for decorative motion —
  remove `will-change` from `.bgfx` (a fixed canvas already composites).
- Verdict: yes, paint storm. Canvas (~15 fullscreen gradient fills/frame) ×
  backdrop-blur over most of the viewport × two fixed blurred chrome bars.

---

## 2. Layer promotion — transparent over canvas with no own layer

These paint the animating region every frame without a compositing hint (no
`will-change`, no `translate3d`, no `backdrop-filter` of their own):

- `assets/style.css:399` — `p,li{text-shadow:0 1px 0 rgba(255,255,255,.35)}` —
  text-shadow over a moving background forces per-frame text repaint while
  scrolling — remove the shadow (flat paper text needs none).
- `assets/style.css:51` — `.navlinks a::after` scaleX underline transition —
  animates inside the sticky blurred header with no layer — add
  `will-change:transform` or accept the header repaint.
- `assets/style.css:38-40,435-436` — `.folkline` animated `scaleX(.9s)` sits at
  the top of every page with no layer hint — harmless after arrival; leave, or
  add `transform:translateZ(0)`.
- `assets/style.css:64,110,146,175` — `.btn:hover`, `.teasercard .go`,
  `.stars label`, `.fcols a:hover` translate on hover with no layer — each hover
  repaints under-canvas region until promoted — add `will-change:transform` to
  `.btn` and `.fcols a` only.
- `assets/style.css:737-738` — `.ss figcaption` opacity fade over the
  slideshow image — repaints the photo each frame of the fade — add
  `will-change:opacity` to `.ss figcaption`.
- `assets/style.css:640-642` — `.vacancy` badge + `.vdot` pulse in the header —
  animates opacity forever inside the blurred header — pause when
  `hidden` (it starts `hidden` in every page head, e.g. `index.html:79`).
- NOT problems (already layered, do not "fix"): `.ss-track` has
  `will-change:transform` (734); `.flow` has `will-change:opacity,transform`
  (672); `.card` has `will-change:transform` (96) — though that one is wasted,
  see §3.

---

## 3. Transform conflicts — hover/JS rules vs arrival-system `!important`

Core defect: `assets/fluid.js:262-282` `flow()` adds `.flow` to `section, .card,
.promises div, .menucard .day, .post, …` (263-265) at runtime, while every page
marks the same nodes `.reveal` for the older `site.js` system (e.g.
`index.html:111-133`, 35 `reveal` hits). Both systems run on the same elements.

- `assets/style.css:672-674` — `.flow{…translateY(26px) scale(.988)!important}`
  and `.flow.flow-in{transform:none!important}` — the `!important` on the
  arrived state permanently beats every non-`!important` hover transform below —
  remove `!important` from 673 (keep it on 672 only).
- `assets/style.css:200` — `.promises div:hover{transform:translateY(-2px)}` —
  dead: flow-processed divs keep `transform:none!important` after arrival —
  hover lift never renders — same fix as above.
- `assets/style.css:211` — `.menucard .day:hover{transform:translateY(-2px)}` —
  dead for the same reason — same fix.
- `assets/style.css:152` — `.post:hover{transform:translateX(4px)}` — dead for
  the same reason (`.post` is in the flow selector, fluid.js:263) — same fix.
- `assets/site.js:225-227` — tilt writes `el.style.transform="perspective(900px)
  rotateX…"` on mousemove and clears it on mouseleave — on any `.tilt` card that
  `flow()` processed, the inline transform loses to `.flow`/`.flow-in
  !important`, so the tilt visibly does nothing while `getBoundingClientRect`
  (222) still runs per mousemove — after fixing 672-674, ALSO scope tilt to
  non-`.flow` nodes or remove `.flow` from `.card.tilt`.
- `assets/style.css:98,262,629` — `.card.tilt:hover` sets only shadow/border,
  never `transform` — no conflict; correct as-is, do not touch.
- `assets/style.css:134` vs `:726` — `.gal figure:hover img{scale(1.045)}` and
  `.gal figure:hover{translateY(-4px)}` target different elements (img vs
  figure) so they compose — but the whole `.gal` block (131-135, 725-726) is
  dead code: no page contains `class="gal"` (gallery uses `.ss`,
  `gallery.html:49`) — delete 131-135, 725-726.
- `assets/site.js:332-339` — slideshow `go()` restarts the `.65s` track
  transition (739, 734) on every 3s tick even mid-gesture; a swipe during
  auto-advance snaps direction — pause the timer on `touchstart` until
  `transitionend` instead of re-arming immediately (347).

---

## 4. Mobile cost — what still runs on phones, reduced-motion gaps

- `assets/fluid.js:42` — `dpr = Math.min(devicePixelRatio||1, 2)` — a 3x phone
  still renders a 2x backing store (≈1.3M px at 390×844) × ~15 fullscreen
  gradient fills per frame — cap to `1.5` (or `1` when `w<700`).
- `assets/fluid.js:60` — `n = max(14, min(26, …))` — the 14-motif FLOOR means a
  small phone draws as many sprites as a small laptop despite the "keep it
  cheap" comment (403-405, which only lowers blur) — lower the floor to ~8 when
  `w<700`.
- `assets/fluid.js:75,84` — phones still get 5 beams + 3 blobs, each a
  fullscreen `fillRect` (135, 152-153) — cut to 3 beams / 2 blobs when `w<700`.
- `assets/style.css:504` vs `:516-523` — the ≤640px rule lowers glass to 6px
  and header/feature to 5px but OMITS `.mobilebar`, which keeps `blur(14px)`
  fixed at the bottom of every phone screen — add `.mobilebar` to the 522 list
  at 5px.
- `assets/style.css:608,424` — `.day` (4px) and `.mapbox .addr` (4px) blur on
  phones with no reduction path — include them in the 516-523 block.
- `assets/fluid.js:208-211` — `pointermove` listener + pointer-light radial
  (156-162) run on touch devices where they never fire meaningfully — guard
  with `matchMedia("(pointer:fine)")` like site.js:217 does.
- Reduced motion, complete: `fluid.js:7-10` early-return (no canvas, no
  injected SVG, no observers); `style.css:189-191` kills all
  animations/transitions; `643,652` kill `.vdot`/lotus loops.
- Reduced motion, INCOMPLETE:
  - `assets/site.js:339,348` — slideshow auto-advances every 3s regardless of
    `prefers-reduced-motion` — gate `arm()` on `!reduced` (the `reduced` flag
    already exists at 192).
  - `assets/style.css:22` — `html{scroll-behavior:smooth}` is not disabled
    under `prefers-reduced-motion` — anchor/skip-link jumps animate for users
    who asked for none — add `scroll-behavior:auto` inside the 189-191 block.
  - `assets/style.css:362` — `html.reduce .bgfx{…}` is dead (under reduce no
    canvas exists, fluid.js:7-10) — harmless; delete.
  - `assets/site.js:204-214` — `.reveal` observer still runs under reduce but
    only adds `.in`, and CSS 360 keeps `.reveal` visible — no motion, no fix
    needed.

---

## 5. Dead / duplicated code

Overridden rules (earlier line loses; delete the loser):

- `assets/style.css:99-101 → 260` — `.card:before` folk trim, then
  `.card:before{display:none}` — delete 99-101 + 101.
- `assets/style.css:259 → 374` — `section:not(.flat)::before{display:none}`,
  then `content:none` — delete one.
- `assets/style.css:86-88 → 371` — `.pagehead::after` lotus (with its own
  `float` animation, 86), then `.pagehead::after{content:none}` — yet 88 still
  re-sizes the dead pseudo-element — delete 86-88.
- `assets/style.css:308 → 338 → 387 → 470 → 663` — `.card` blur walks
  9px → 2px → 6px → 10px! → 9px! — four dead declarations — keep only 660-666.
- `assets/style.css:43 → 316 → 497-500 → 568` — `header` background rewritten
  four times — keep only 568 + 667-670.
- `assets/style.css:112-113 → 340-342 → 476-477 → 556-558` — `.feature`
  background rewritten four times (plus `overflow:hidden` at 112 vs 413) —
  keep only 556-561 + 413.
- `assets/style.css:435-436` overrides the `.folkline` background of 38-40
  (dash pitch changes 12/20/30 → 14/24/36) — keep one.
- `assets/style.css:629` — `.card.tilt:hover,.card.tilt:hover` duplicated
  selector in one rule — collapse.
- `assets/style.css:4-5,292` — `--ink:var(--ink)`, `--ink-deep:var(--ink-deep)`,
  `--paper-deep:var(--paper-deep)` are self-references (cyclic → guaranteed-
  invalid), and 292 poisons the valid `--paper-deep` from line 16 — every
  `var(--paper-deep)` use (567, 585, 733, 715) resolves to invalid — define real
  values once at the top and delete 292.

Dead classes / selectors with no matching elements:

- `.gal` grid + hover system (`131-135, 725-726`) — zero matches in any HTML.
- `.reveal` (`360: opacity:1; no transition`) — neutered, yet 100+ usages
  (`index.html` 35, `contact.html` 13, …) and `site.js:204-214` still observes
  every one to add `.in`, which only matters for the 428-433 list — pick ONE
  arrival system (`.flow` OR `.reveal`) and delete the other.
- `assets/style.css:428-433` — `.in` rules for `.picker, .pitstats, .board
  .post, .onepager, .sheet` — none exist in any HTML (only runtime `.board
  .post` on autohub) — delete dead selectors from 428 and 263-265.
- v12 transparent list (`456-463`) names `.band, .strip, .tile` — never used —
  delete from the selector.
- `.hero-lotus` (75-76) used only at `index.html:96`; `.teasercard` (108-110)
  index-only; `.fadeup` (80) used once (`index.html:95`) — fine, but they ship
  on all 9 pages; no action unless splitting CSS.
- `vacancy-mini` (`index.html:338` et al., styled at 698) is never written by
  any JS (only `vacancy-badge` is, site.js:270-278) — permanently `hidden` dead
  node in the mobile bar on 8 pages — wire it or remove it.
- `404.html` has zero `reveal` classes, no skip link, no mobilebar — the
  lightest page; keep it that way.

Missing keyframes: none. Every `animation:` name resolves —
`bodyin` (24), `folkopen` (41), `float` (77), `fadeUp` (81), `drawlotus` (355),
`vpulse` (642), `lbloom` (649), `lrip` (651).

Duplicate `@media` blocks (same condition, merge candidates):

- `max-width:820px` ×2 (55, 177); `max-width:720px` ×3 (78, 88, 188);
- `max-width:640px` ×4 (208, 403, 516, 702+745); `max-width:520px` ×4
  (178, 613, 615, 657); `max-width:760px` ×2 (351, 401);
  `max-width:860px` ×2 (612, 711); `prefers-reduced-motion` ×4
  (189, 364, 643, 652); `pointer:coarse` ×2 (280, 730).

`!important` count: 85. Heaviest clusters — v12 one-surface block (462-507,
~30), v22 glass slab (660-670), v18 borderless (625-635), v27 fluid-type
(684-709, layout `!important`s that block per-page tuning). Minimal fix:
resolve the cascade so v22/v18 win without `!important` (they are already last;
specificity ties can be broken by ordering, not flags), then delete the flags
in 625-635 and 684-709.

---

## 6. Layout shift (CLS)

- `index.html:297`, `contact.html:108` — map `<iframe>`s have NO
  `width`/`height` attrs; CSS (`style.css:126`) gives `height:260px` only after
  CSS loads, and `loading="lazy"` delays the frame — the `.mapbox` block grows
  0→260px+addr late — add `width="600" height="260"` attrs (CSS `width:100%`
  preserves the ratio box).
- Good, do not touch: hero/gallery/folk `<img>`s all carry `width`+`height`
  (`index.html:95`, `gallery.html:51-64`, `about.html:76`) and CSS keeps ratio
  (`style.css:690`, `736`); tour `<video>` reserves `aspect-ratio:16/9` (219)
  with `preload="none"` + poster (`index.html:223`).
- `assets/site.js:126-136` — autohub board renders 6 seed posts via
  `innerHTML` after parse — the board region jumps from empty to full height —
  reserve with `min-height` on `#board` or server-render the seed markup.
- `assets/site.js:270-278` + `32-35` — `vacancy-badge` (`hidden` → shown) and
  `availbadge` (`display:none` → `inline-block`) pop into the nav/header after
  JS runs, reflowing wrapped nav links — reserve the slot (fixed-size
  placeholder) or set text in HTML.
- `config.js:18-28` — `mockupRibbon` injects a `position:fixed;top:0` bar
  AFTER load over the sticky header (`top:0`, style.css:43) — covers the nav
  until noticed, and shifts nothing but hides the header's first ~25px —
  offset `header{top:<ribbon-height>}` while the ribbon exists, or render the
  ribbon in HTML.
- `assets/fluid.js:222-245` — `lotuses()` inserts `.lotusdraw` SVG as
  `firstChild` of `.familyband/.plaque/.cta-strip` — pushes copy down on
  arrival (only `.plaque` pre-reserves space, 353) — reserve height for
  `.familyband .lotusdraw` / `.cta-strip .lotusdraw` or use absolute
  positioning.
- `assets/style.css:672` — `.flow{opacity:0}` hides below-fold sections until
  the observer fires; on slow JS this reads as content popping in per section —
  scope `.flow` to above-the-fold elements or default to visible with
  `no-js`/noscript cover already present in each `<head>`.
- Fonts: system stacks only (`style.css:239-244`) — no webfont CLS. No fix.

---

## 7. Seams — visible bands/edges breaking one continuous surface

- `assets/style.css:44` vs `:625` — `header.scrolled` shadow + `border-bottom`
  vs later `border:none!important` — the shadow alone still draws a hard edge
  over the wash on scroll — soften to a transparent-gradient fade or remove.
- `assets/style.css:180,441` — `.mobilebar` top hairline + `-8px` shadow over
  content, and per §5 the two buttons lost their two-tone split: `531-533`
  forces BOTH `.call` and `.wa` to terracotta `!important`, overriding the
  light `.call` at 182 — the bar reads as one slab — restore `.call` to the
  paper tone (delete `.mobilebar .call` from the 531 list).
- `assets/style.css:426,507,570` — `footer` fade rewritten three times (570
  wins) — plus `.fbottom` inner top border (440, kept since 627 only strips
  outer borders) — a faint line remains across the fade — remove `.fbottom`'s
  border too.
- `assets/style.css:414-418` on top of `556-561` — `.feature`/`.cta-strip`
  get BOTH a dark veil gradient AND an `::after` radial overlay at `.5`
  opacity — the overlay edge (55-60% stops) bands against the veil — drop the
  `::after` overlay.
- `assets/style.css:562` + `218` — `.tourbox` dark frame with a video gradient
  that never matches the poster image (`tour-poster.png`) — poster → first
  frame is a visible pop — sample the poster's dominant tone for the 562
  gradient.
- `assets/style.css:126,424` — `.mapbox iframe` (`saturate(.92)`, `opacity:.94`)
  under `.mapbox .addr` (paper `.35` + `blur(4px)`) — the addr strip cuts the
  map with a frosted edge — extend the addr background to full opacity or drop
  its blur.
- `assets/style.css:593-595,615` — doorway arch radii (150-190px) snap to 80px
  at ≤520px — rotating a phone across 520px visibly re-crops every photo —
  use a proportional radius (`40% 40% 8px 8px` or `clamp()`) so shape is
  continuous.
- `assets/style.css:399` — `p,li` text-shadow over the moving canvas fringes
  text edges while scrolling (also §2) — remove.
- `assets/style.css:714-717` — styled `::-webkit-scrollbar` only; Firefox gets
  default scrollbars — add `scrollbar-color`/`scrollbar-width` for parity.

---

## 8. Navigation flow — continuity breaks between pages

- Full reload + replayed entrances: `body{animation:bodyin .5s}` (23),
  `.folkline` `.9s` (40), hero `.fadeup` (80) re-run on EVERY page — moving
  between pages flashes and re-draws rather than gliding — shorten to
  `.25s`/none for subsequent navigations (e.g. via `sessionStorage`) or keep
  only on first visit.
- `assets/style.css:22` — `html{scroll-behavior:smooth}` with NO
  `scrollRestoration` handling anywhere — back/forward navigation smooth-scrolls
  from top instead of restoring position — set
  default UA restoration — `scroll-behavior:smooth` on the whole document
  (`style.css:22`) makes back/forward restoration animate from the wrong start;
  no JS touches `scrollRestoration` anywhere. Minimal fix: scope
  `scroll-behavior:smooth` to in-page anchor activation (e.g. a class toggled
  on click), leaving the document default `auto` so the browser restores
  scroll position instantly.
- Focus: skip links (`about.html:29` et al.) jump to `<div id="main">`, which
  is a `div`, not `<main>`, with no `tabindex="-1"` — keyboard focus does not
  move, only the viewport scrolls — add `tabindex="-1"` to each `#main` div;
  `404.html` has NO skip link at all (16) — add one.
- Service worker documents (`sw.js:33-44`): network-first, cache fallback to
  `./index.html` (42) — offline, a missing page (or 404) renders INDEX content
  under the wrong URL with no indication — fall back to a dedicated offline
  page or the cached 404 instead of index.
- `sw.js:6` — `STATIC` regex covers `/assets/…` only; page navigations always
  go network-first — correct for freshness, but every same-site navigation
  re-downloads HTML even when offline-capable — acceptable; do not "fix" by
  caching documents cache-first (would reintroduce stale deploys).
- `config.js:29` excluded from SW caching (`sw.js:29`) — correct (live facts),
  but offline pages then run with `window.PRAJNA` from the silicon defaults in
  `site.js:5-15` (`phone:null`), so `wa()` (19) builds `https://wa.me/null…`
  links — guard `wa()` to hide `.wa-link` buttons when `!C.phone`.
- `assets/site.js:234-243` — stale-cache heal calls `location.reload()` once
  per session mid-visit, discarding scroll position, focus, and form input with
  no warning — defer the reload until `pagehide`/idle or show a one-line
  "updated — tap to refresh" affordance.
- `assets/site.js:249-256` — SW registers on `https:` only; `http`/file
  previews silently get no offline shell while the heal block still probes
  `caches` — consistent, but the two gates disagree — document that offline
  only applies to the `https:` deploy.
- Version skew: SW `prajna-v32` (sw.js:5) vs `?v=32` asset pins — bumping one
  without the other strands clients between cached CSS and fresh HTML — bump
  both from a single constant and note it in `DEPLOY.md`.

---

## Highest-value minimal fixes, in order

1. Delete the `!important` on `.flow.flow-in` (673) — restores ALL hover lifts
   and the JS tilt in one line (§3).
2. Pick one arrival system (`.flow` xor `.reveal`) — halves scroll observers
   and kills the dual-class FOUC risk (§5).
3. Cap canvas backing store + motif/beam counts on small screens, add
   `.mobilebar` to the mobile blur reduction (§4).
4. Reserve space for board posts, badges, and lotus SVGs; size map iframes
   (§6) — removes nearly all CLS.
5. Remove `mix-blend-mode` texture layer or fold vignette into canvas (§1).
