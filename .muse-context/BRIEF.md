# PROJECT: Prajna Co-hab — family co-living house website

You are reviewing a LIVE small-business website for a family-run co-living house
in Pune, India. 10 beds: 4 twin-sharing rooms + 2 singles. Ground floor = kitchen,
dining, living, TV, reception. Family-run, not a chain.

## The business goal
Get a first-job young professional (21-28, newly arrived in Pune, works shifts at
Chakan MIDC as a QC trainee) to message on WhatsApp and book a visit. They fear
broker-run hostels and long commutes. They want home food, a family house, and to
save money. Conversion = a WhatsApp click, not a form.

## HARD RULES (breaking any of these is a bug, not a style choice)
1. NEVER use the word "PG" anywhere in copy. Use "co-hab" or "house". This is
   non-negotiable and was a direct client instruction.
2. Branding/location copy says "Moshi". But ANY postal address, Google Maps link,
   or JSON-LD structured data MUST keep "Bhosari Industrial Estate" EXACTLY — the
   listing must resolve to the real building. Local search depends on it.
3. No invented facts or metrics. Ever. Real projects, general descriptions only.
   No fake reviews, no made-up bed counts, no fake awards.
4. Zero emojis in copy.
5. Public-facing content stays overview-level.

## Design system (must not be broken)
- Aesthetic: minimal Indian folk art, modern, calm, flowing. Warm and earthy.
- Colour by ROLE, exactly 11 hexes, 6 core:
  * ink #2b2620 — ALL text and weight and dark bands
  * terracotta #c05621 — ACTION ONLY (buttons, prices, links, call bars)
  * ochre #d9a441 — ORNAMENT ONLY (rules, dots, lotus, trim). NEVER text or buttons.
  * paper #faf5ec — the single background value
  * warm grey #7a6f60 — the single muted
  * ink-deep #3a322a — dark bands at 72% opacity
  Derived: --paper-deep #f2ead9, --ochre-soft #f6ead0, --ochre-ink #7a5a1c, --ink-soft #cdc4b6
  Do NOT introduce new colours. Do not put ochre on buttons.
- Ambient background: a fixed canvas (`.bgfx`, position:fixed, z-index:-3) paints a
  paper ground + drifting colour washes + folk motifs. Content panels are
  TRANSLUCENT glass (44-66% alpha + backdrop-filter blur). Nothing may set an
  opaque background-color on a page band — that kills the ambient layer.
- Photos are real. Room photos carry "doorway arches" (border-radius 150px crown /
  10px base). Buttons are shaped as little doorways (14/14/7 radius + ochre sill).
- Everything decorative must respect prefers-reduced-motion.

## Deploy rules (there are scars here — do not violate)
- The live repo is a GitHub Pages site. Each .html is served directly from root.
- config.js script tags are added ONLY in the repo (the workspace build lacks them);
  there must be exactly 9 pages carrying `<script src="config.js"></script>`.
  Verify the count before committing.
- Cache busting: assets carry ?v=NN. The service worker (sw.js) cache name is
  prajna-vNN. If you change an asset you MUST bump both on all pages.
- Deploy = copy *.html into the repo (never rsync — it silently skips same-size files).

## Your tasks (READ ONLY — do not edit any file)
1. Audit the 9 HTML pages for any violation of the hard rules above (especially the
   word "PG", emoji use, or invented specifics). List file + line.
2. Audit the CSS for: any colour literal that is NOT one of the 11 listed hexes or a
   var() token, and any opaque background-color set on a page-band selector (that
   would break the ambient canvas).
3. Audit accessibility: missing alt text, unlabelled form fields, contrast problems
   between text and its actual background, tap targets under 44px.
4. Report the 5 highest-value improvements ranked by conversion impact (a WhatsApp
   click from a Chakan shift worker), with the file and the concrete change.
5. Flag anything that looks broken, half-shipped, or dead code.

Output: a single markdown report to .muse-context/AUDIT.md. Be specific and terse.
Cite file names and line numbers. Do not be polite, do not pad.
