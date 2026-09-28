# BRIEF 2 — Prajna Co-hab: DEEP audit, second pass

Static site at repo root. 9 pages, assets/style.css, assets/{site,fluid}.js, sw.js, config.js.
A previous pass produced `.muse-context/AUDIT-SMOOTH.md` — READ IT FIRST, then go DEEPER.
Do not repeat its findings. Only NEW, non-overlapping findings.

Read-only. Do NOT edit any file except your report.

## Focus areas for THIS pass

1. **THE CASCADE ITSELF.** style.css is a single file built by appending version blocks
   (v4, v5, v6, v7, v10, v12, v13, ... v32). Map the file into its version sections and report
   the ORDER-OF-BATTLE: for every property that is declared more than twice, list every line
   that sets it, in cascade order, and say which one actually wins. I want a table.
   Pay special attention to: `background`, `transform`, `opacity`, `border`, `border-radius`,
   `font-size`, `padding`, `margin`, `backdrop-filter`, `z-index`, `position`, `color`.

2. **THE `!important` WAR.** There are ~85. Group them by intent. For each group say whether
   the flag is load-bearing (removing it changes rendering) or a band-aid covering a
   specificity problem. Propose the minimal set that must survive.

3. **COLOR RESOLUTION.** `--ink:var(--ink)`, `--ink-deep:var(--ink-deep)`,
   `--paper-deep:var(--paper-deep)` (line ~293) are cyclic self-references. Verify which of
   these actually resolve and which fall back to the CSS-wide initial value. Then find EVERY
   place the resolved-to-wrong value changes what the user SEES. Be precise: which element,
   which page, what colour does it render as, what should it be.

4. **THE 9 PAGES AS ONE SYSTEM.** For each page, list which visual components it uses versus
   which it doesn't. Then find ASYMMETRY: a component styled 4 different ways across pages,
   a page missing a pattern the others have, spacing that drifts page to page, heading
   scales that differ, section rhythm that differs. I want a page-by-page consistency matrix.

5. **ACCESSIBILITY + INPUT.** Every interactive element: keyboard reachable? focus visible?
   correct role? Correct label? Tap target >= 44px? Look for:
   - the slideshow (gallery.html) keyboard + ARIA state
   - the board on autohub (runtime-injected posts)
   - forms on contact/feedback (labels, required, error announcement)
   - the lightbox (focus trap? escape? aria-modal?)
   - `href="#"` dead links and what they do for keyboard/screen-reader users
   - colour contrast of every text-on-background pair actually used

6. **FAILURE MODES.** With `config.js` empty (all nulls — the current shipped state):
   what does each page look like? Which buttons go nowhere? Which numbers read "Ask today's
   rate"? Is there any page that looks broken/empty? List every placeholder user-visible string.

7. **CONTENT INTEGRITY.** Flag anything that reads as an unverified or invented specific
   (a number, a rating, a date, an urgency claim, a named person) — this site has a hard
   standing rule: overview-level only, zero invented metrics.

8. **WHAT WOULD MAKE IT FEEL EXPENSIVE.** You are a designer now, not an auditor. List 10
   concrete, specific, low-risk changes that would make this static site feel markedly more
   polished and seamless — things like optical alignment, easing curves, spacing rhythm,
   typographic detail, transition continuity. No redesigns, no new sections, no new colours.

Report to `.muse-context/AUDIT-DEEP.md`. Use file:line everywhere. Be specific and mechanical.
