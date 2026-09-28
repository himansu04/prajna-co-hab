# AUDIT — Prajna Co-hab DEEP pass (second pass)

Read-only audit. Only `.muse-context/AUDIT-DEEP.md` was written.
Read `.muse-context/AUDIT-SMOOTH.md` first — nothing in it is repeated here.
Where a line was already covered there for a different reason, it is cited, not re-argued.

Method: full read of `assets/style.css` (745 lines), `assets/site.js`,
`assets/fluid.js`, `config.js`, `sw.js`, all 9 pages. `!important` count
re-verified by grep: **85**. Contrast ratios computed from the hex values in
the file (nominal, on `#faf5ec` unless noted). Cyclic-`var()` consequences are
per CSS spec (custom property whose value references itself is
guaranteed-invalid; a declaration left with the guaranteed-invalid value is
invalid at computed-value time → inherited value if the property inherits,
else initial) — worth one real-browser spot-check, the predictions are in §3.

Sections 1, 3, 5, 6 are the full treatment. Sections 2, 4, 7, 8 are condensed.

---

## 1. THE CASCADE ITSELF — order of battle

Single file, appended version blocks (v5→v32). Rule: later wins on ties;
`!important` beats everything earlier without it. Winner shown last in each row.

### 1a. `background` — the most rewritten property in the file

| Target | Declarations in cascade order | Winner |
|---|---|---|
| `body` | `style.css:23` transparent → `:299` transparent → `:384` transparent | transparent (unanimous; the paper comes from canvas, see §3 html row) |
| `html` | `:324` `var(--paper-deep)` → `:383` `var(--paper)` → `:567` `var(--paper-deep)` | **`:567`, but the value is guaranteed-invalid → falls back to transparent** (§3). The v8 safety net (`:383`) is dead. No-JS / reduced-motion pages sit on white viewport, not paper |
| `header` | `:43` `rgba(250,246,240,.78)` → `:316 !important` .66 → `:498 !important` .55 → `:568 !important` .58 | `:568` |
| `.feature` image | `:112` dark gradient + dot tile → `:340` weave + 2 gold radials → `:476 !important` dark veil → `:556 !important` warm veil `(58,50,42)` | `:556-561` (with it, the `background-size:auto,auto,8px` at `:341` dies too) |
| `.cta-strip` image | `:161-162` dark + dot tile → `:343-345` weave + gold radial → `:481-487 !important` → `:556-561 !important` | `:556-561`. Note the `::after` overlay at `:414-418` is a *pseudo-element* — untouched by all of this, still paints on top |
| `.tourbox` | `:218` `rgba(43,38,32,.9)` → `:488-493 !important` veil → `:556-561 !important` warm veil | `:556-561` |
| `.tourbox video` | `:219` `var(--ink)` → `:421` `var(--ink),var(--ink-deep)` → `:494 !important` rgba → `:562 !important` rgba | `:562` (valid). `:219` and `:421` are doubly dead: earlier AND invalid vars |
| `.card` + glass group image | `:303-306` white gradient + weave → `:468 !important` white gradient (weave dropped) → `:662 !important` flat `rgba(250,246,240,.52)` shorthand (resets image to none) | `:662`: **flat tint, no weave, no gradient**. The v10.1 "woven cards" intent is fully dead at cascade level |
| `footer` image | `:426` fade + weave → `:507 !important` lighter fade → `:570 !important` warm fade | `:570` |
| `.btn` base | `:61-63` terra + stitch tile + inset rings → `:531-533 !important` terra (same value) | same colour; tile/rings from `:61-63` survive (nothing resets them) |
| `.mobilebar .call` | `:182` light paper tone → `:531-533 !important` forces `.call` AND `.wa` to terra | `:531-533`. The two-tone split is gone at cascade level, not just visually |
| `.ph` | `:120-121` paper-deep gradient + lotus motif → `:268` radial shorthand (resets motif) → `:513 !important` `background-color` wash | split verdict: image = `:268`, but both its stops are `var(--paper-deep)` → invalid → **no image at all**; colour = `:513`. Net: flat wash (§3) |
| `.ss` | `:733` `var(--paper-deep)` — single declaration, but invalid var | transparent (§3). Slideshow region shows raw canvas |
| `.demo-tag` | `:156` `var(--paper-deep)` — single declaration, invalid | `background: transparent` initial (colour doesn't inherit). Tag chips are text with no pill behind them |
| `.gal figure img` | `:585` `var(--paper-deep)` — invalid | transparent (moot: no `.gal` in any HTML) |
| `.day` | `:608` `rgba(255,255,255,.44)` shorthand vs `:462 !important` `background-color:transparent` | **`:462` wins for colour** (flag beats later shorthand's colour layer); no image anywhere. `.day` is fully transparent + `blur(4px)` — the v12 block is load-bearing here, and only here (§2) |

### 1b. `backdrop-filter` — winners only (perf cost is SMOOTH §1, not repeated)

| Target | Chain | Winner |
|---|---|---|
| `.card` glass group | `:308` 9px → `:338` 2px → `:386-389` 6px → `:466-472 !important` 10px → `:660-666 !important` v22 9px | `:660-666` 9px |
| `header` | `:43` 10px → `:497-500 !important` 14px → `:522` 5px (@640) → `:668 !important` v22 10px | `:668` 10px **at all widths** |
| `.feature/.cta-strip/.tourbox` | `:312` 6px → `:395` 5px → `:478-492 !important` 8px → `:522` 5px (@640) → `:556-561 !important` 9px | `:556-561` 9px at all widths |
| `.faq details` | `:311` 8px → `:467 !important` 10px → `:386` 6px (later, no flag — loses) | `:467` 10px. v22 (`:660-661`) does **not** list `faq details`, so FAQ keeps the strongest desktop blur in the file |
| `.voice` | `:311` 8px → `:467 !important` 10px → `:660-666 !important` 9px | `:660-666` 9px |
| `.day` (rhythm strip, NOT `.menucard .day`) | `:608` 4px, no flag, never re-declared (v22 lists only `.menucard .day`) | `:608`. Two components share the `day` stem with different blur fates — confusion risk, no visual bug |
| `.mapbox .addr` | `:424` 4px, never overridden | `:424` |
| `.familyband` | `:312` 6px, never overridden | `:312` |
| **The ≤640px reduction block (`:516-523`)** | 6px glass / 5px bands+header — all `!important`, but all EARLIER than v12/v13/v22 `!important`s | **Dead on arrival. Phones render desktop blur (9–10px), not the 5–6px the comment promises.** SMOOTH §4 asked to add `.mobilebar` to this list; the deeper finding is the whole list is a no-op for blur. (The *padding* reductions at `:704-705` survive — they sit after v22.) |

### 1c. `border` — the borderless pass left three survivors

| Target | Chain | Winner |
|---|---|---|
| `section` top | `:91` hairline → `:626 !important` none | none |
| `header.scrolled` bottom | `:44` → `:625 !important` none | none |
| `.card` | `:96` 1px → `:628 !important` none | none — which kills the `:573-576 !important border-color:var(--line)` restyle for cards (border-colour with no border renders nothing). That rule is dead for every selector it names that is also in `:628` |
| `.btn.ghost` | `:66` dashed ochre → `:270` solid ochre → `:630 !important` none (+ ochre-soft fill) | `:630`: ghost buttons are borderless pills, not outlined buttons |
| inputs | `:140` 1px → `:632 !important` none; focus `:141` ring → `:633 !important` 2.5px ochre ring | borderless + shadow ring |
| `footer/.fbottom/.mobilebar/.familyband` | `:168/:176/:180/:193` → `:627 !important` none (`:440-441` re-declarations sit before `:627`, dead) | none |
| `.day`, `.mapbox`, `.gal img`, `.ph`, `a.ph.heroshot`, `.badge`, `.post .topic` | various → `:628 !important` none | none |
| `.tourbox` | `:218` 1px line — **not named in `:628`** | **keeps its 1px border. The only framed panel left** |
| `.post` (incl. 4px ochre left accent) | `:151` — **not named in `:628`** (only `.post .topic` is) | **keeps full border + accent** |
| `.plaque` | `:225` 2px terra — not named in `:628`; `:266` restyles inner shadows | keeps 2px terra border |

### 1d. `border-radius`

| Target | Chain | Winner |
|---|---|---|
| `.btn` | `:61` 6px → `:269` `var(--r-sm)` 8px → `:601` `14px 14px 7px 7px` | `:601` doorway |
| `.card` | `:96` 12px → `:261` `var(--r-md)` 12px | 12px (agree) |
| `.gal img/.ph/heroshot` | `:133/:120/:582` → `:593/:595/:594` arches → `:615` 80px @520 | arch / 80px small screens — but no `.gal` exists in HTML, so this chain only bites `a.ph.heroshot` (`index.html:95`) and the about folk image |
| about folk image | `:596` arch (`section.flat figure.reveal img`) vs inline `style="…border-radius:14px"` (`about.html:76`) | **inline style wins — 14px, not the arch.** The one illustration the arch system was written for opts out by inline style |
| heroshot `img` | `:583` 11px inside `:594` 190px-arch anchor with `overflow:hidden` (`:582`) | container clips; coherent by accident |

### 1e. `font-size` / `padding` / `margin`

- `body` size: `:23` 1.02rem → `:245` 1rem → `:682` `clamp(.95rem,1.7vw,1.02rem)`. Winner `:682`.
- `h1`: `:27` clamp(1.95–2.75) → `:247` clamp(2.35–3.3); `:706` `.hero h1` @640; `:281` @380px 2.05rem. Winners: `:247` base, `:706` hero-on-phone, `:281` tiny screens.
- `h2`: `:28` → `:248`. Winner `:248`. `h3`: `:29` 1.08 → `:249` 1.2. Winner `:249`.
- `.lede`: `:32` 1.05 → `:255` 1.06 → `:683` clamp. Winner `:683`. `.fblarge`: `:195` → `:695` @480. `.brand`: `:46` 1.28 → `:693` clamp. `.tag`: `:34` .68rem → `:253` .7rem. Inputs: `:140` .85rem → `:692` `max(16px,.95rem)` — the 16px floor (iOS zoom fix) survives; keep.
- `.wrap` padding: `:25` 0 22px → `:635 !important` fluid clamp. Winner `:635`.
- `section` padding: `:91` 3rem → `:626` 3.2rem (shorthand WITHOUT flag) → `:709 !important` clamp @640. Winners: `:709` phones, `:626` desktop. **`section.flat` keeps `padding-top:1.6rem` (`:92`)** — higher specificity than `:626`, no flag conflict — so flat vs normal still differs in rhythm, only in top padding.
- `.card` padding: `:96` → `:704 !important` @640. `.mobilebar a`: `:181` → `:700`. `.hero`: `:71` → `:684 !important`.
- `margin` is barely contested — only `.grid` top (`:94` → `:705 !important` @640) has two declarations. Everything else single-source.

### 1f. `transform` / `opacity` / `position` / `z-index`

- Winners are the v22 pair `:672-675 !important` (base + `.flow-in` + `.card.flow` variants). Flow mechanics and the hover-kill are SMOOTH §3 — not repeated. New cascade note: `.shead h2::after` (`:721-722`) animates `scaleX` on the *child* pseudo-element gated by parent `.flow-in` — independent of the parent's `transform:none!important`, so the underline reveal is one of the few arrival-coupled animations that actually works. Pass.
- Dead-on-arrival: `:719` `.btn:hover::after{opacity:1}` — the `::after` sill (`:602-604`) never sets `opacity<1`, so this rule changes nothing. Not in SMOOTH's dead list; adding here.
- `position`: header sticky (`:43`), mobilebar/wa-float/lb fixed (`:180/:231/:184`), bgfx/vignette/before fixed (`:326/:317/:318`) — all single-source, stable.
- `z-index` stack: bgfx −3! → before −2! → vignette −1! → header 40 → mobilebar 50 → wa-float 60 → lightbox 100 → skip 200 → mockup ribbon 9999 (inline, `config.js:24`). Sane order, no conflict. `:322` (`body>*:not(.bgfx)…z-index:auto`) is harmless.

### 1g. `color` — winners (resolution in §3)

`body` `:23`→`:551`; `p` `:30`→`:551`→`:552` **muted (valid, `:552` wins the tie by order)**; headings →`:548`; `.brand` `:46`; `.faq summary` `:158`; `.fcols a` `:174`; `.mapbox .addr` `:127`; `.day p` `:611`; `.pform label`/inputs `:138/:140`; `.vacancy` `:640`; `.mobilebar .call` `:182`; `.voice p` `:215`→`:551`; `.teasercard` `:108`; `.promises div` `:199` — all resolve to `var(--ink)` = guaranteed-invalid (§3). Valid survivors: `.tag`/links/prices/statrow (`:34/:31/:103/:222` → `:536-538` terra), `.persona` (`:197` terra-dark), `.meta`/notes (`:153` etc. muted), `.tag.gold`/stars/quote (`:35/:214/:217` → `:541/:544-545` ochre, valid but 2:1 contrast — §5), dark-band text (`:117/:166` → `:553` ink-soft), `::selection` (`:619` ochre-soft bg, ink text — text half invalid → inherits, minor).

---

## 2. THE `!important` WAR (condensed)

85 flags, verified by grep. Grouped by intent; "band-aid" = removable once values are absorbed into normal order (these blocks are already last, so ties break their way without flags).

- **One-surface transparency, v12 (`:456-463`, ~30 flags): band-aid, ~all droppable.** `:462`'s `background-color:transparent` is dead everywhere v22 `:662` re-covers the same elements (later shorthand wins). Sole exception: `.day` (§1a) — `:462` is load-bearing there and would need a normal replacement.
- **Glass blur ladder (`:466-512`, `:556-561`, `:660-670`): band-aid.** Order already decides; flags only armour against the dead `:516-523` block (§1b). Droppable as a set, kept as values.
- **Role discipline, v13 (`:531-564`): LOAD-BEARING as values, flags mostly band-aid** — except `:531-535` (terra action) must keep beating `:182`'s light `.call`, and `:541/:544-545` ochre text must keep beating base colours. Keep the declarations; flags needed only where an earlier higher-specificity rule steals (i.e. `:531-535`).
- **Borderless v18 (`:625-635`): band-aid.** Last-writer already; absorb and drop flags. Values `:628`'s omissions (tourbox/post/plaque keep borders, §1c) must be a conscious choice, not an accident.
- **Motion pair (`:672-675`): load-bearing**, minus SMOOTH §3's fix (drop the flag on `.flow-in`, keep on base).
- **Fluid/mobile layout v27/v29 (`:684-711`): load-bearing** — these must beat base layout at width, and `:703-705`/`:709` do real work. Keep.
- **Print (`:283`): load-bearing.** Must beat even the glass `!important`s. Keep — but it needs one more line (§8.10).
- **A11y taps (`:273-279`): load-bearing.** Keep.

Minimal surviving set: print `:283`, terra action `:531-535`, dark bands + role text `:556-564`, glass slab `:660-671`, flow `:672-675` (flagless arrived state), wrap rhythm `:635`, fluid/mobile `:684-711`, taps `:273-279`, form fields `:510/:632-633`. Everything else can go once the values sit in normal cascade order.

---

## 3. COLOR RESOLUTION — the three cyclic variables

### 3a. What actually resolves

- `--ink:var(--ink)` (`style.css:4`) — self-reference → **guaranteed-invalid, everywhere, permanently.** Every `color:var(--ink)` declaration is invalid at computed-value time → `color` inherits → walks up to `html`, which sets no colour → **CanvasText (≈ black), not a warm ink.**
- `--ink-deep:var(--ink-deep)` (`style.css:5`) — same fate, but nothing live uses it directly: `:421` pairs it with `var(--ink)` and both `:219`/`:421` lose to `:494`/`:562` anyway. Harmless, delete.
- `--paper-deep` — valid `#f2ead9` at `:16`, then **poisoned by `:292` `--paper-deep:var(--paper-deep)`** (later `:root`, same specificity → wins → self-reference → invalid for the whole tree). `--paper-warm:var(--paper)` (`:293`) is valid but **never used anywhere** (grep: zero hits).
- `--paper` `#faf5ec`, `--terra`, `--ochre`, `--muted`, `--ochre-soft/ink`, `--ink-soft`, `--line` — all literal, all fine.

### 3b. Every place the user SEES the wrong value

The intended ink is unrecoverable — no hex was ever assigned (nearest in-file candidates: `#3a322a` lotus strokes, `43,38,32`/`58,50,42` veil tones). Any fix must pick one; until then:

- **All headings, every page** (`style.css:548` + `:26/:246` inheritance): render CanvasText black instead of the designed warm dark. Most visible on `.pagehead h1` / hero `h1`.
- **Body-level text wherever `:551-552` doesn't rescue it**: plain `li` (outside `.card ul`), `.voice p` (`:215`→`:551`), `.faq summary` (`contact.html:91-98`), `.fcols a` footer links, `.mapbox .addr` (`index.html:298`, `contact.html:109`), `.day p` (`index.html:162-165`), `.pform label` + input text (`contact.html:67-81`, `feedback.html:49-66`, `autohub.html:77-87`), `.vacancy` badge text, `.mobilebar .call` ("Call" renders black on the light bar — passes contrast by accident), `.brand` wordmark, `.teasercard` headings.
- **What still renders correctly**: all `p`/`.lede` (rescued by `:552` muted), prices/links/tags (terra), badges/topics/results (ochre-soft/ink), dark-band copy (ink-soft), persona (terra-dark).
- **`html` background (`:567`) invalid → transparent.** With the canvas running, invisible (canvas paints `#faf5ec→#f2ead9`, `fluid.js:109-112`). With reduced-motion or no JS (no canvas, `fluid.js:7-10`), **every page sits on white viewport**, not paper — the v8 fallback (`:383`) can't save it because invalid-at-computed-value-time doesn't roll back to earlier declarations.
- **`.ss` slideshow bed (`:733`) invalid → transparent** (`gallery.html:49`): the photo stack floats over raw canvas instead of the designed `#f2ead9` card. Benign but not as drawn.
- **`.ph` washes (`:120-121`, `:268`) invalid → flat** `rgba(239,231,218,.62)` (`:513`): placeholder blocks lose both gradient and motif.
- **`.demo-tag` pills (`:156`) invalid → transparent**: "demo / sample" chips (`index.html:151,230,246`, `contact.html:88`, board seeds) render as bare muted text with no pill.
- **`.tourbox video` `:219`/`:421` invalid** — moot, `:562` wins regardless.
- **`::selection` text half (`:619`)** inherits instead of ink — invisible difference in practice.

---

## 4. THE 9 PAGES AS ONE SYSTEM (condensed matrix)

Rows = components, ✓ = present. (Chrome: header/nav + footer + mobilebar identical on all 8 content pages; `404.html` has header only — no footer, no mobilebar, no skip link, no scripts' targets; that asymmetry is SMOOTH §5/§8, not repeated.)

| Component | index | about | autohub | contact | discover | feedback | gallery | pune |
|---|---|---|---|---|---|---|---|---|
| `.hero` / `.pagehead` | hero | head | head | head | head | head | head | head |
| `.familyband` | ✓ | — | — | — | — | — | — | — |
| prices (`data-cfg`) / costcard | ✓ | — | — | — | — | — | — | — |
| `.daystrip` / `.menucard` / voices | ✓ | — | — | — | — | — | — | — |
| `.tourbox` video | ✓ | — | — | — | — | — | — | — |
| promises / steps / teasers | ✓ | — | — | — | — | — | — | — |
| `.loc` + `.mapbox` | ✓ | — | — | ✓ map | — | — | — | — |
| `.cta-strip` closer | ✓ | — | — | ✓ | ✓ | — | ✓ | — |
| `.faq` | — | — | — | ✓ | — | — | — | — |
| forms | — | — | board | inquiry | — | feedback | — | — |
| board + `.statrow` + `.plaque` | — | — | ✓ | — | — | — | — | — |
| `.ss` slideshow | — | — | — | — | — | — | ✓ | — |
| folk-illustration figure | — | ✓ | — | — | — | — | — | — |
| `availbadge` (config string) | ✓ | — | — | — | — | — | — | — |
| `vacancy-badge` (bedsOpen count) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| share-btn | ✓ | — | — | ✓ | — | — | — | — |

Asymmetries (new only):

- **Two vacancy signals, different sources, different coverage.** `availbadge` (`index.html:84`, from `availability` string, `site.js:32-35`) exists only on index; `vacancy-badge` (from numeric `bedsOpen`, `site.js:270-278`) exists everywhere. They can disagree with each other (string vs count) and the badge pair is hidden ≤900px (`style.css:644`) while `vacancy-mini` is never populated by any JS — so **phones show zero vacancy signal under any config** (feeds §6).
- **`.cta-strip` closers on index/contact/discover/gallery only.** About/autohub/feedback/pune end cold at the footer — the journeys that most need a next step (about → visit, autohub → join) don't have one.
- **`feedback.html` and `pune.html` are absent from the primary nav** (7 links, all pages) despite footer/teaser links in — feedback is the only input channel for real quotes the homepage begs for (`index.html:246`).
- **Contact carries two call targets** (`#calllink` mobilebar + `#calllink2` card, `contact.html:58,153`) — the only page with a duplicated action; both die identically with null phone (§6).
- **Section rhythm**: `.flat` vs normal still differs (`padding-top:1.6rem` survives, §1e) — about/gallery/pune/discover open denser than index/contact. Consistent, just undocumented.
- Heading scale is coherent (one clamp system, §1e). No drift found.

---

## 5. ACCESSIBILITY + INPUT

### 5a. Keyboard / roles / labels — element by element

- **Slideshow (`gallery.html:49-68`, `site.js:326-348`).** Prev/next are real `<button type="button">` with `aria-label`s — reachable, named, working (mouse, touch, and click). Dots are real buttons with `aria-label="Photo N"` — reachable — but carry **no selected state** (`aria-current` never set in `paint()`, `site.js:332-336`): a screen-reader user tabs through 14 identical-sounding buttons with no idea which is active. The widget has **no region role/label** (`role="region" aria-roledescription="carousel" aria-label`) and no instructions, so SR users meet "button, Previous photo" with no context. Slides themselves are correctly out of the tab order. Contrast with SMOOTH's motion findings: this is all state/semantics, not motion.
- **Star rating (`feedback.html:54-61`).** Critical: `.stars input{display:none}` (`style.css:144`) removes all five radios from the tab order *and* the accessibility tree — **keyboard users and most SR users cannot rate at all**; only pointer users clicking `<label>`s can. (Labels carry `title="5"…"1"` but no accessible-name computation via label-for on a display:none control.) Also: the bare `<label>How was your experience?</label>` (`feedback.html:54`) has no `for`, and the group has no `fieldset/legend` — only `aria-label="Rating out of 5"` on a div. Fix is one pattern: visually-hidden (not `display:none`) radios + `role="radiogroup"` or native fieldset.
- **Board (`autohub.html:76`, `site.js:126-143`).** Seed and fetched posts render as bare `<div class="post">`s — no list, no headings, no `aria-live`. When the endpoint replaces 6 seed posts with live ones, SR users get no announcement. Posts' author names are injected via `meta.innerHTML = list[n].name + …` (`site.js:131`) — owner-moderated today, but a hostile endpoint value executes markup; `textContent` + explicit spans costs nothing. The board form itself is the best-labelled on the site (all three fields labelled, `required` + `maxlength` where it matters).
- **Forms generally.** Labels + `for/id` correct on all three forms; `required` present on the fields that need it (`autohub.html:80,84`, `contact.html:70-71`, `feedback.html:63`); optional name honestly marked (`feedback.html:51`). Gaps, all three forms: **`.fresult` has no `role="status"`** — success/demo/error confirmations (`site.js:71-74,101-108`) are never announced. No `autocomplete` on name/phone (`contact.html:70-71` — WCAG 1.3.5), no per-field error association (only the generic retry string). Phone field is `inputmode="tel"` with no `type="tel"`/pattern — mild.
- **Lightboxes (two implementations).** Both support Escape + arrows + swipe (gal: `site.js:172-185`; ss: `site.js:364-370`). Neither has `role="dialog"`/`aria-modal`, neither moves focus in, neither traps, neither marks the background inert. Additionally the legacy `.gal` lightbox bakes `<img alt="">` (`site.js:151`) and never updates it — dead path today (no `.gal` in HTML) but an SR hole if revived; the ss lightbox copies `alt` correctly (`site.js:354`).
- **Dead links.** Every `.wa-link` ships as `href="#"` until `site.js:54-60` rewrites it — no-JS keyboard/SR users get dozens of "link" stops that jump to top. `#calllink`/`#calllink2` stay `"#"` with null phone (dead even *with* JS). `#communitylink` with empty community gets its `href` *removed* (`site.js:68`) — the control vanishes from tab order with no explanation; keep the link focusable and announce state instead. `.share-btn href="#"` is `preventDefault`ed with JS, a top-jump without it. Skip-link/focus-move mechanics are SMOOTH §8 — not repeated — except: `404.html` still has no skip link at all.
- **Passes:** native `details/summary` FAQ (keyboard free), native video controls, whole-card teaser links with real `href`s, `lang="en"`, viewport-fit, decorative SVGs `aria-hidden`, all content images carry meaningful `alt`, `min-height:44px` on nav/footer/button links (`style.css:277`), inputs ≥16px (`:692`, no iOS zoom), visible `:focus-visible` ring (`:276`→`:620` ochre wins).

### 5b. Tap targets that miss 44px (WCAG 2.5.5/2.5.8)

- `.ss-dot` — **8×8px** (`style.css:743`), 14 in a row. Smallest target on the site; fails even the 24px minimum. Enlarge hit area (padding) while keeping the visual dot.
- `.stars label` — `min-height:32px` (`style.css:279`) undercuts the site's own 44px rule (`:277`). Five adjacent 32px targets.
- `.ss-btn` — 48px desktop, **40px ≤640px** (`style.css:745`): just under 44 on the phones that need it most.
- `.mobilebar a` — `.7rem` padding (`:700`) ≈ 40–42px tall pre-safe-area: borderline; verify on device.
- Dots + stars are also the two controls with STATE (selected rating / active slide) — the hardest to hit are the ones where mis-taps corrupt input.

### 5c. Colour contrast (computed nominals; canvas-backed panels vary ± against motion)

| Pair | Ratio | Verdict |
|---|---|---|
| Terra `#c05621` on paper (body links `:31`, `.tag` `:538`, `.price` `:537`, `.menucard .day b`, `.persona` is darker terra-dark — passes) | **≈4.2:1** | **Fails AA normal text.** Passes only where large/bold (`.statrow b` 1.9rem). Small terra copy is the site's most-used action colour and it under-passes |
| Muted `#7a6f60` on paper (all body copy) | ≈4.5:1 | Borderline pass nominally; over the moving canvas behind glass the effective bg darkens/lightens per frame — treat as at-risk, never lighten |
| Ochre `#d9a441` as text on light (`.tag.gold` `:541`, `.voice .strs` `:545`, `.voice .q` `:544`) | **≈2.1:1** | **Fails.** `.tag.gold` kicker lines ("The feeling", "The community pit") are real text at less than half the required contrast |
| Ochre-ink on ochre-soft (badge, `.topic`, `.fresult`) | ≈5.3:1 | Pass |
| White on terra (buttons) | ≈4.6:1 | Pass (thin margin — never darken the button or lighten the text) |
| Ink-soft `#cdc4b6` on dark veil (`.feature p`, `.cta-strip p` over `rgba(58,50,42,.74)` + canvas) | **≈3.3:1 effective** | **Fails AA normal text.** The veil is translucent over a bright animated wash, so the real background is lighter than the flat-composite estimate — body copy on the two darkest bands is the site's worst readable-text pair |
| White headings on veil | ≈5.7:1 effective | Pass, but photo/canvas-dependent; never reduce veil opacity without re-checking |
| `.ss figcaption` paper on photo + `.55` scrim (`:737`) | photo-dependent | Unverifiable statically; bottom-anchored text over bright photos will fail — deepen scrim (§8.3) |
| `.mobilebar .call`, `.vacancy` (invalid ink → black) | high | Pass by accident of the §3 bug, wrong hue by design |

---

## 6. FAILURE MODES — `config.js` all nulls (the documented shipped state)

> Note: the checkout's `config.js` is a MOCKUP build (sample phone `919800000000`, sample rents, olive ribbon, "NEVER deploy" header). This section analyses the documented production state — all nulls / empty strings, no ribbon — which is what `site.js:5-15` defaults describe.

### 6a. What each page looks like with nulls

- **index:** prices read "Ask today's rate on WhatsApp" (twin + single, `site.js:38-39`); costcard reads "Ask on WhatsApp" ×2 (`site.js:50-51`) — **two different fallback wordings for the same missing data**, one line apart (`index.html:148-149`). Food lines read "Food not provided; kitchen access available" (`site.js:40-43`) — the null fallback is the *most negative* of the three food modes. Deposit line stays hidden. `availbadge` stays hidden (`site.js:32-35`). Page is coherent, just priceless.
- **autohub:** board renders 6 seed posts (`site.js:118-125`) — five authored "Sample post" with `demo` tags. The page looks *alive but fake*: specific invented transactions (clutch-plate job, ₹2,200 headlamp quote, 2019 Splendor sale, Gate-4 carpool) presented as community history, next to the claim "Every post is checked by the owner before it appears" (`autohub.html:74`). Most misleading page under nulls.
- **contact / feedback / gallery / pune / discover / about:** structurally complete. Map, video, photos, copy all render; only actions die (below).
- **No page is structurally empty.** Nothing 500s, nothing blank-screens.

### 6b. Every dead or placeholder control with nulls

- **All `.wa-link`s → `https://wa.me/null?text=…`** (`site.js:19`): hero WhatsApp, "Get the Location Pin" (`index.html:294` — a location action that opens a chat with nobody), feature "Ask a Question", all cta-strip CTAs, contact "Open WhatsApp", footer links, mobilebar WhatsApp on all 8 pages, the desktop `wa-float` (`site.js:259-268`), and `vacancy-badge` itself.
- **Call actions dead:** `#calllink` (mobilebar, all pages) and `#calllink2` (`contact.html:58`) keep `href="#"` — `site.js:62` only writes `tel:` when a phone exists.
- **Community join neutered:** `#communitylink` (`autohub.html:97`) loses `href`, drops to 50% opacity (`site.js:68`) — visible, unfocusable (§5a), unexplained.
- **Badges hidden:** `vacancy-badge` forced `hidden` (non-numeric `bedsOpen`, `site.js:274`); `availbadge` never shown; `vacancy-mini` never populated on any page. Combined with the ≤900px badge hide (`style.css:644`): **no visitor on a phone can see any availability signal under any config.**
- **Forms still "work":** every submit resolves to the demo-mode string (`site.js:86`) — honest, but it cites `DEPLOY.md`, an internal file, to end users.

### 6c. Complete user-visible placeholder inventory (exact strings)

"Ask today's rate on WhatsApp" · "Ask on WhatsApp" (also hardcoded in `index.html:148-149`) · "Food not provided; kitchen access available" · "Saved in demo mode. Connect the free Google Sheets backend (5-minute setup in DEPLOY.md) and this lands in your sheet for real." · "Posted. It appears on the board once the owner clears it." · "Got it. The owner will get back to you on WhatsApp or by call." · "Network hiccup — please try once more, or just WhatsApp us." · "updates from the owner.s numbers" (`index.html:151` — sic, typo) · "sample — real menu from the family kitchen" (`index.html:230`) · "sample — real quotes swap in as feedback lands" (`index.html:246`) · "sample — owner confirms final wording" (`contact.html:88`) · "demo" ×6 (board seeds) · "Sample post" ×5 + all six seed bodies (`site.js:118-125`) · "Need help? WhatsApp us" (wa-float tooltip, `style.css:234`) · share text hardcodes "…2 beds open" (`site.js:311` — wrong under nulls; coincidentally right under the mockup) · static `"+91-0000000000"` in JSON-LD (`index.html:31`, never rewritten when phoneless) · no-JS only: twin/single `.price` divs render **entirely blank** (`index.html:114,125` have no initial content, unlike the costcard).

### 6d. Two non-config failure modes found while here

- **Print:** the print block (`style.css:282-288`) hides chrome but never overrides `.flow{opacity:0}` — **printing (or print-previewing) with JS on renders only already-arrived sections; everything below the fold prints blank.** The `noscript` cover in each `<head>` saves no-JS print only. One-line fix (§8.10).
- **Offline-first visit:** first load offline serves `index.html` for any page (`sw.js:42`, SMOOTH §8) — combined with nulls, a saved "contact.html" shows the homepage with dead `wa.me/null` actions and no indication. Not re-argued; noting the compound.

---

## 7. CONTENT INTEGRITY (condensed — overview-only standing rule)

Flagged as unverified specifics; several are already labelled sample by the pages themselves (labels noted — the label mitigates, the numbers are still invented until replaced):

- **Inventory counts:** "Ten beds. Four twin-sharing rooms, two singles" (`index.html:88,101`, `about.html:52`). Specific stock claims — must match the real house.
- **Urgency/seasonality:** "Rooms fill fast in March and June." (`index.html:306`). A demand claim with named months; unverifiable as written.
- **Voices:** three named persons + trades + star ratings (`index.html:249-251` — Rahul K./CNC, Sunil T./forklift, Prashant M./QC; ★★★★★ ×2, ★★★★☆ ×1). Page labels them "sample — real quotes swap in" (`index.html:246`) — good hygiene, but names, trades, and ratings are invented until swapped.
- **Menu card:** 7 days of dishes (`index.html:233-239`), labelled "sample — real menu from the family kitchen" (`index.html:230`). Same status as voices.
- **Board seeds:** "Pulsar 150 clutch-plate change", "Activa 6G … ₹2,200", "2019 Splendor — 28,000 km", "Gate 4, MIDC Moshi … 7:30 shift" (`site.js:118-125`) — the most specific invented facts on the site, rendered as community history with no sample labelling on the board itself (only `demo` tags, themselves explained nowhere).
- **Absolutes:** "₹0 fees, forever" (`autohub.html:50`) — "forever" is unclaimable; "Same-day visits, most days" (`contact.html:116`), "Visit the same day" (`index.html:200`) — service promises, keep only if operationally true.
- **Hardcoded metric in code:** share text "…2 beds open" (`site.js:311`) — a live count baked into a string, wrong under nulls (§6) and stale under any future count.
- **Typo with integrity flavour:** "updates from the owner.s numbers" (`index.html:151`).
- **Passes (overview-level, no action):** all of `pune.html`/`discover.html` (no prices, no ratings, no counts — "an hour-plus" is honestly vague); amenity claims (WiFi/CCTV/parking/cleaning) are category-level, though still owner-to-verify; static `"+91-0000000000"` in JSON-LD (`index.html:31`) is a placeholder, flagged in §6.

---

## 8. WHAT WOULD MAKE IT FEEL EXPENSIVE (designer pass — 10 items, no redesigns, no new colours)

1. **One easing everywhere.** `--ease` (`style.css:14`) drives most motion, but `.lb img` (`.3s ease`, `:186`), `.vdot` pulse (`:641`), lotus bloom/ripple (`:648/:650`), and `float` usages still use bare `ease`/`ease-in-out`. Swap them to `var(--ease)` — a single motion voice reads as quiet luxury; mixed easings read as template.
2. **Lock the slideshow track.** `.ss img` (`:736`) is `width:100%;height:auto` — all 14 photos are 1200×800 today so heights match, but the first photo with a different ratio bounces the whole track, dots, and caption. `aspect-ratio:3/2;object-fit:cover` on `.ss img` makes future photos free.
3. **Caption legibility + dot overlap.** `.ss figcaption` (`:737`) sits under `.ss-dots` (`bottom:.9rem`, `:742`) — dots print over caption text. Deepen the scrim toward `.72`, add `padding-bottom:2.6rem` to the caption, and the overlay becomes a composed lower-third instead of a collision.
4. **FAQ markers in the house language.** `contact.html:91-98` `details/summary` use the UA default triangle — the only default-browser chrome visible on the site. A custom ochre-diamond `::marker` (same diamond as `.ddia`, `style.css:610`) rotating 45° on `[open]` ties the answers to the doorway motif for ~6 lines.
5. **Scale the section rule.** `.shead h2::after` (`:720-722`) is a fixed 52px bar under fluid `clamp()` headings — chunky on phones, timid on desktop. `width:2.4em` makes it proportional at every size.
6. **Fit the folkline tile.** `.folkline` is 6px tall over a 7px dot tile (`:38-40`) — the paper dots are cropped a pixel short everywhere. A 6px tile (or 8px bar) renders whole dots; the top edge of every page gets crisper.
7. **Stop shattering words.** `overflow-wrap:anywhere` (`:691`) on `.card p`/`.post p` breaks mid-word under narrow cards; `break-word` + `hyphens:auto` on prose, plus `text-wrap:balance` on `h1/h2/.btn`, keeps narrow-screen text even without touching a single size.
8. **One quotation mark, not two.** Voice cards render `.q` " (glyph in HTML, `index.html:249-251`) *and* `.voice::before` " (`style.css:723-724`) — two giant ochre quotes stacked. Delete one; the survivor finally looks intentional.
9. **Async-decode the gallery.** `fluid.js` images already use `decoding="async"` (`fluid.js:100`); the 14 gallery `<img>`s (`gallery.html:51-64`) and the hero shot don't — one attribute each,主-thread stays out of image decode on the site's heaviest page.
10. **Print the whole page.** Add `.flow,.reveal{opacity:1!important;transform:none!important}` to the print block (`style.css:282-288`, which already hides `.bgfx`) — today JS-on printing emits only arrived sections and blank space below the fold (§6d). The `noscript` covers in each `<head>` already prove the pattern; print just needs the same line.

---

*End of deep pass. Highest-value order: §3 (one real ink hex + un-poison `--paper-deep`), §5a stars fix, §1b dead mobile-blur block, §5c terra/ochre/veil contrast, §6c fallback strings + `wa.me/null` guards.*

