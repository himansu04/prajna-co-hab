# Prajna Co-hab — free sample deploy + later paid upgrade

## A. Put the site online free (5 min, one time)
Site folder = this folder (index.html + assets/). GitHub Pages hosts it free forever.

    cd ~/Downloads/Prajna-Co-hab/site
    git init
    git add -A
    git commit -m "Prajna Co-hab site"
    gh repo create prajna-co-hab --public --source=. --push
    gh api repos/himansu04/prajna-co-hab/pages -X POST -f "source[branch]=main" -f "source[path]=/"

Live at: https://himansu04.github.io/prajna-co-hab/ (wait ~2 min first time).
If the pages API call errors, open the repo in browser → Settings → Pages → Source: main / root → Save. Same result.

## B. Free data-capture backend (10 min, one time)
1. Make a Google Sheet: sheets.new → name it "Prajna Data".
2. Extensions → Apps Script → delete sample → paste apps-script/Code.gs contents.
3. Deploy → New deployment → type: Web app → Execute as: Me → Access: Anyone → Deploy → approve.
4. Copy the Web app URL (ends in /exec).
5. Open assets/site.js → paste the URL into PRAJNA.endpoint (line ~13).
6. git add -A && git commit -m "wire backend" && git push — live in a minute.
Now: contact form → "Inquiries" tab, feedback → "Feedback" tab, auto board → "Board" tab.
Board moderation: open the Board tab, set Approved = TRUE on good posts. They appear on the site.

## C. Maintaining everything online (your ops layer)
- Daily ops (inquiries/feedback/board) = the "Prajna Data" Sheet — check it like WhatsApp.
- Optional: a Notion "Prajna Ops HQ" database mirroring the same rows for nicer dashboards — say the word and it gets wired (the site never talks to Notion directly; the mirror runs server-side).
- Photos: shoot → resize → drop into assets/photos/ → swap the placeholder blocks in gallery.html.

## D. Domain (the ONLY real cost)
Buy AFTER the free sample works. Options (India, ballpark):
| Option | Cost/yr | Note |
|---|---|---|
| .in domain | ~₹400–800 | local trust, cheapest — recommended |
| .com domain | ~₹800–1,200 | global look |
Buy wherever the RENEWAL price is honest (check year-2 price, not year-1 promo). Hosting stays GitHub Pages (₹0).

Connect it (15 min):
1. Buy prajnacohab.in at the registrar.
2. In the repo: Settings → Pages → Custom domain → prajnacohab.in → save (creates CNAME file).
3. At the registrar's DNS panel add: A records @ → 185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153 ; CNAME www → himansu04.github.io.
4. Wait for DNS (minutes to hours) → tick "Enforce HTTPS" in Pages settings.
5. Update sitemap.xml/robots.txt lines if you pick a different name.

## E. Total running cost
| Item | Cost |
|---|---|
| Hosting (GitHub Pages, SSL, CDN) | ₹0 |
| Forms + inquiries + feedback (Google Sheets/Apps Script) | ₹0 |
| Community board (Sheets, owner-moderated) | ₹0 |
| Gallery (photos live in the repo) | ₹0 |
| Domain | ₹400–1,200 / yr |
Total: domain money only. Everything else is free tier, permanently.

## F. Performance notes
- Static pages, no frameworks: each page ~15–40KB before photos; loads in under a second on 4G.
- Photos are the only real weight — shoot, then export as WebP ~1200px wide (use squoosh.app, free) before adding to the gallery. Target <200KB per image.
- Lighthouse will sit in the 90s once photos are WebP + lazy-loaded (gallery already lazy-loads).

## G. Phase 2 ideas (only if the community proves itself)
- Real forum with accounts (Discourse ₹0 self-host needs a ₹400+/mo server — not worth it early; the moderated board + WhatsApp community covers 95% of need at ₹0).
- Booking calendar + advance-payment link (UPI deep links cost nothing; payment gateway only if demand proves it).
- Notion public status page ("2 beds available now") fed by the same sheet.
