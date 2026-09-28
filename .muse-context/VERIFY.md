# VERIFY — mechanical fixes vs AUDIT.md (read-only verification, 2026-09-28)

Method: `git diff --cached` + `git status` + direct reads of worktree files (`autohub.html`, `index.html`, `gallery.html`, `404.html`, `assets/site.js`, `assets/style.css`, `sw.js`) + `grep`/`node --check`/brace counts. Staged == worktree (no unstaged diff). Backup hits under `.muse-context/backup-pre-fix/` ignored.

## (a) Genuinely fixed (verified in files, not just diff)

1. Favicon hex, all 9 pages — FIXED. `index.html:66`, `about/contact/discover/feedback/gallery/pune/autohub:25`, `404.html:12` now `fill='%23c05621'` + `fill='%23faf5ec'`. Zero `c05a2e`/`faf6f0` remains in live `*.html`.
2. Double `config.js` — FIXED. All 9 pages carry exactly 1× `src="config.js"` (staged and worktree counts = 1 each). Single `site.js` + `fluid.js` + stylesheet + icon tags intact on spot-checked `index/404/gallery`.
3. `site.js` manifest/theme-color injector (AUDIT §5.6) — FIXED. `assets/site.js:245-248` is now a comment only; no `createElement("link"/"meta")` injector remains. `node --check` OK. Static `<link rel="manifest">` + `<meta name="theme-color" content="#faf5ec">` confirmed present (`index.html:58,61`, `gallery.html:17,20`, `404.html:8,10`), so removal is safe; no more wrong-hex override.
4. `style.css:93-94` orphan declarations (AUDIT §5.4) — FIXED. Now a single comment line; `.grid` selector intact below it. Brace balance `496/496`, no stray `}`.
5. Stale `assets/sw.js` twin (AUDIT §5.2) — FIXED. File absent (`ls` confirms); no references remain (only `assets/site.js:251` registers root `sw.js` + `sw.js:30` self-guard).
6. Cache-bust gaps, images + tour (AUDIT §5.5, file part) — FIXED. All 14 `gallery.html` photos now `?v=32`; `index.html:223` now `poster="assets/tour-poster.png?v=32" src="assets/tour.mp4?v=32"`. Filenames unchanged.
7. SW `STATIC` regex gap (AUDIT §5.5, worker part) — FIXED. `sw.js:6` is now `/\/assets\/.*\.(css|js|png|jpg|jpeg|svg|webp|woff2|mp4|webmanifest)$/`. `node --check` OK; covers `.mp4`/`.webmanifest` (pathname match, query-independent) plus `jpeg`.

## (b) NOT fixed or fixed wrong (still present in files)

- Moshi-vs-Bhosari metadata bug — NOT FIXED. `autohub.html:10` `og:title` still ends `Prajna Co-hab, Bhosari` vs `autohub.html:6` title `Moshi`.
- Invented-facts cluster (highest risk) — NOT FIXED. `index.html:249-251` named voices (Rahul K / Sunil T / Prashant M + stars) still present; `index.html:306` `Rooms fill fast in March and June` still present. (Menu/board seeds untouched per mechanical scope.)
- CSS off-allowlist beyond favicon — NOT FIXED. Still live: `style.css:48,76,87` `%23c05a2e` strokes, `:10` `--terra-dark:#9a4522`, `:7` `--card:#ffffff`, `:8` `--line:#e9e0d2`, `:286` `#555`, lotus `%23a08a68`/`%23f5efe6`, `fluid.js` ring/beam tones. Only the HTML favicon instances were corrected.
- Ochre-as-text — NOT FIXED. `style.css:35,214,217,541,544,545` (`.tag.gold`, `.voice .q/.strs`) + `index.html:212` inline ochre ghost button all still present.
- `--ink` self-reference — NOT FIXED. `style.css:4` `--ink:var(--ink)` still present.
- Doorway shape — NOT FIXED. `about.html:76` inline `border-radius:14px` still overrides arch.
- Accessibility items — NOT FIXED. `feedback.html:54` bare label, `style.css:279` stars 32px, `:743` `.ss-dot` 8px, tour `<track>` absence, hover-only captions all unchanged.
- Dead `.gal` stack — NOT FIXED. `site.js:146,301` `.gal` bindings still present; `.gal` CSS untouched.
- Dead assets (`house-card.jpg`, `lotus.svg`, `og-cover.png`) — NOT FIXED (no deletion staged).
- Conversion items §4.1/4.3/4.4/4.5 (real numbers, hero CTA, contact phone, gallery captions) — NOT FIXED (outside mechanical scope; no diff touches them).

## (c) NEW breakage introduced — NONE FOUND

- Selectors: none broken. Orphan-removal site still yields valid `.grid` rule; no selectors removed elsewhere.
- Missing tags: none. Every page retains stylesheet + icon + 1×config + site.js + fluid.js.
- Syntax: none. `node --check` passes for `assets/site.js`, `sw.js`, `assets/fluid.js`; `style.css` braces balanced open/close 496/496.
- Cache-bust mistakes: none. All 14 gallery URLs + both tour URLs correctly suffixed `?v=32` with identical basenames; no double `??`, no typo.
- SW mismatch: none. Registration still `sw.js`, cache version still `prajna-v32`; extended `STATIC` is additive (`jpg` retained). Header comment `(v13)` vs `V="prajna-v32"` mismatch pre-exists in `HEAD` (confirmed via `git show HEAD:sw.js`), not introduced.
- Non-issues noted: `c05a2e` string survives only inside the new `site.js:247` explanatory comment and in pre-existing CSS data-URIs/backups — harmless, not regressions.
