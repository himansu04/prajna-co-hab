# AUDIT — Prajna Co-hab (read-only, 2026-09-28)

Scope: 9 HTML (`index about contact discover feedback gallery pune autohub 404`) + `assets/style.css` + `assets/site.js` + `assets/fluid.js` + `sw.js` / `assets/sw.js` / `config.js` / `manifest.webmanifest` / `sitemap.xml`. No file modified.

## 1. Hard rules

- "PG": PASS. Zero standalone `PG` / `paying guest` in copy (verified word-boundary grep over `*.html/*.js/*.css/*.webmanifest`; only substrings are `*.jpg` / `og-cover.jpg`).
- Moshi-vs-Bhosari: PASS on the money, 1 metadata bug. Postal/Maps/JSON-LD keep `Bhosari Industrial Estate` exactly — `index.html:25` (streetAddress), `index.html:297-298` (embed + addr block), `contact.html:62-63,108-109` (visit card + embed + addr). Branding says Moshi elsewhere, per rule. BUG: `autohub.html:10` og:title says `Prajna Co-hab, Bhosari` while `autohub.html:6` title says Moshi — brand slot leaks Bhosari; make og:title match title (Moshi).
- Invented facts/metrics (rule 3): HIGHEST RISK, 3 spots. `index.html:249-251` three named "Voices" (Rahul K CNC/MIDC, Sunil T forklift/Chakan, Prashant M QC-trainee/Chakan) with `★★★★★/★★★★☆` read as fake reviews; only cover is the small lede tag at `index.html:246` (`sample — real quotes swap in…`). Same pattern: weekly menu `index.html:233-240` (Mon–Sun dishes, cover tag `index.html:230`) and `index.html:306` `Rooms fill fast in March and June` (urgency claim, no source). `assets/site.js:118-124` board seeds (`Sample post` x5) render as board content, tagged `demo` only. Recommendation: delete names/trades/stars until real feedback lands, or move to first-name-only + `feedback.html` link; drop the March/June line or tie it to `bedsOpen`.
- Emoji: PASS. Zero emoji. `★` (`feedback.html:56-60`, `index.html:249-251`), `→` (`index.html:263,268,273,278,283`), `·`, `‹ ›` (`gallery.html:65-66`) are dingbats/typography, not emoji.
- Overview-level: PASS except the three items above.

## 2. CSS colour + ambient canvas

Allowlist per BRIEF: `#2b2620 #c05621 #d9a441 #faf5ec #7a6f60 #3a322a #f2ead9 #f6ead0 #7a5a1c #cdc4b6` (+1 unlisted, see below).

Off-allowlist literals (all real):
- Favicon, all 9 pages (wrong by design or drift): `fill='%23c05a2e'` should be `%23c05621`; `fill='%23faf6f0'` should be `%23faf5ec` — `index.html:66`, `about.html:25`, `contact.html:25`, `discover.html:25`, `feedback.html:25`, `gallery.html:25`, `pune.html:25`, `autohub.html:25`, `404.html:12`.
- `assets/style.css:10` `--terra-dark:#9a4522` (the 11th hex; not in BRIEF list — either bless it or replace with `terra`).
- `assets/style.css:7` `--card:#ffffff`, `:61,:117,:166,:184,:203,:234,:275` `#fff` (8x: btn text, feature/cta headings, mobilebar WA, skip link, step num).
- `assets/style.css:8` `--line:#e9e0d2` (hairline; bless or map to a derived tone).
- `assets/style.css:287` `#555` (print `a[href^=http]::after`).
- Data-URI strokes: `%23c05a2e` (`style.css:48,76,87`, `fluid.js:21`), `%23a08a68` (`style.css:122` placeholder lotus), `%23f5efe6` (`style.css:165` cta-strip lotus).
- `assets/site.js:250` injects `theme-color #c05a2e` — wrong hex AND wrong value (head uses `#faf5ec`); second tag overrides the first.
- rgba() washes are alpha tints of allowlisted hues throughout, EXCEPT `fluid.js:188,190` ring tone `rgba(90,80,68,…)` and beam tones `255,253,244` / `224,190,120` (`fluid.js:147`).

Ochre-as-text (role violation — ochre is ornament-only):
- `assets/style.css:35,542` `.tag.gold{color:var(--ochre)}` (hits `index.html:157,207`, `autohub.html:43`).
- `assets/style.css:218,546` `.voice .strs{color:var(--ochre)}` (`index.html:249-251`).
- `assets/style.css:215,545` `.voice .q{color:var(--ochre)}`.
- `index.html:212` inline `style="color:var(--ochre);border-color:var(--ochre)"` on a ghost button. Compliant pattern is ochre-ink on ochre-soft (badge/topic/ghost-v18).

Opaque page bands: NONE active. `style.css:457-464` (v12 `background-color:transparent !important` on every band) wins; `.feature`/`.cta-strip`/`.tourbox` are translucent dark veils (`rgba(58,50,42,.55-.74)`, `:557-563`) with blur. Dead-but-harmless opaque declarations remain earlier in cascade (`:113` `.feature .94/.88`, `:162` `.cta-strip .93/.87`, `:219` `.tourbox .9`). `style.css:4-5` `--ink:var(--ink); --ink-deep:var(--ink-deep)` is self-referential (invalid at computed-value time); headings (`:549`) fall back to inherit — fix to `#2b2620` / `#3a322a`.
Doorway shapes: PASS except `about.html:76` inline `border-radius:14px` overrides the 150px arch on the folk illustration.

## 3. Accessibility

- Alt: PASS on images (every `<img>` has a meaningful alt: hero `index.html:95`, folk `about.html:76`, 14/14 gallery `gallery.html:51-64`). Gap: tour video `index.html:223` has no `<track>` captions; slideshow captions (`gallery.html:51-64` figcaptions) are hover-only on desktop (`style.css:738-739`, always-on only ≤640px `:746`).
- Labels: PASS except `feedback.html:54` bare `<label>How was your experience?</label>` (no `for`; group covered by `div[aria-label]` at `:55` but the label is unassociated).
- Contrast FAIL hotspots: ochre `#d9a441` text on glass ≈2.1:1 — `.tag.gold`, `.voice .strs`, `.voice .q`, `index.html:212` ghost. Body `var(--muted) #7a6f60` on 44–66% glass over the animated canvas floats around/below 4.5:1 whenever a wash passes underneath; `.miniopen` (`style.css:699`, `.72rem` ochre-ink) is small + translucent.
- Tap targets FAIL (2): `.stars label` 32px (`style.css:280`, needs 44px); `.ss-dot` 8px (`style.css:744`, needs 44px hit area — keep visual, expand padding). `.ss-btn` 48/40px PASS; nav/footer/btn links PASS via `style.css:278` min-height rule. Lightbox buttons injected at `site.js:151,353` lack `type="button"` (outside any form, harmless, add anyway).
- Reduced motion: PASS. `fluid.js:7-10` exits before canvas/rAF + sets `html.reduce`; CSS `:190-192,:365-369,:644,:653` kills motion. `.bgfx{display:none}` under reduce leaves the flat paper fallback — fine.

## 4. Top 5 conversion fixes (ranked: Chakan shift worker → WhatsApp click)

1. Publish real numbers. `assets/site.js:5-15` ships nulls, so price/cost slots render `Ask today's rate on WhatsApp` (`index.html:114,125,148-149`). A 21–28yo comparing rooms bounces without an anchor. File: repo `config.js` (+ live `PRAJNA` in `assets/site.js`). Change: set real `twinRent/singeRent/deposit/foodIncluded/availability/phone`.
2. De-duplicate `config.js` (all 9 pages carry it TWICE, e.g. `index.html:340`, `about.html:122`, `404.html:38` — 18 tags vs required 9×1). Double execution is benign today but one slow/blocked copy delays every `wa.me` href rewrite (`site.js:54-60`) — the single action that converts. Change: one tag per page; add real `href` fallbacks so `href="#"` never ships.
3. Hero CTA row (`index.html:89-93`): `Send to a friend` sits level with `WhatsApp Us` and `See Rooms` scrolls away from the click. Change: one primary `WhatsApp — Check Availability` (with `data-wamsg`), demote share to footer/contact.
4. Contact page (`contact.html:67-81`): form is demo-mode (`site.js:85-89`) with no visible phone number and free-text move-in (`contact.html:75`). Change: render the real number as tappable text next to the form + month picker + `owner replies within X hours` line.
5. Gallery (`gallery.html:49-68`): auto-3s slideshow with hover-only captions and 8px dots undersells rooms on phones. Change: captions always visible, pause autoplay on first interaction, 44px dots/prev-next.

## 5. Broken / half-shipped / dead

1. Double `config.js` on every page (list in §4.2) — violates the "exactly 9 pages carrying the tag" deploy rule in spirit (9 pages, 18 tags).
2. `assets/sw.js` (`prajna-v11`) vs `sw.js` (`prajna-v32`) — stale twin; registration (`site.js:252-259`) uses root `sw.js`, so `assets/sw.js` is dead. Delete or sync.
3. Dead `.gal` stack: `site.js:146-186` lightbox binds `.gal` (absent from markup since the v32 `#gal-ss` slideshow, `gallery.html:49`); analytics branch `site.js:304` (`.closest('.gal')`) never fires; `.gal` CSS (`style.css:132-136,586,594,616,629,686,704,706,726-727`) is dead. Remove or repoint.
4. `style.css:93-94` stray declarations (`background:var(--paper) url(mandana…);opacity:.55;…}`) outside any selector after `section.flat` — parse error, dropped by browsers. Delete.
5. Cache-bust gaps (deploy-rule scar): `gallery.html:53-64` twelve photos lack `?v=32` (only `:51-52` have it); `index.html:223` `tour.mp4` + poster unversioned. SW `STATIC` regex (`sw.js:6`) also skips `.mp4`/`.webmanifest` — offline tour breaks.
6. `site.js:246-251` injects duplicate `manifest` link + wrong `theme-color #c05a2e`. Remove the injector (static head tags already exist).
7. Dead assets: `assets/house-card.jpg`, `assets/lotus.svg`, `assets/og-cover.png` unreferenced. `og-cover.jpg` is the live one.
8. Workspace `config.js` is MOCKUP-only (`phone 919800000000`, sample rents) with a `MOCKUP ribbon` injector — correctly labelled NEVER-deploy; audit build therefore has dead `wa.me/null` + `tel:+null` links until the repo config lands. Expected, noted.
9. Minor: `contact.html:153` inline `calllink2` script assumes `PRAJNA.phone`; `sitemap.xml` correctly omits `404.html` (8 URLs, fine); `404.html` carries vacancy/mobilebar chrome that can never convert (fine, but its double `config.js` should still be fixed).
