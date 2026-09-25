# Prajna Co-hab — deploy & run book

## 1. Pull a change live (current URL)
The repo checkout on this Mac is `~/Downloads/Prajna-Co-hab/site-mockup`.

```
cd ~/Downloads/Prajna-Co-hab/site-mockup
git add -A && git commit -m "update" && git push
```
GitHub Pages serves it ~60-90s later: https://himansu04.github.io/prajna-co-hab/

**Rule:** `config.js` lives ONLY in this repo (never in the workspace source), so a sync must keep
it. Always sync with `--exclude '.git' --exclude 'config.js'`, or re-add the tag after.

## 2. Turn on real data capture (10 min, ₹0)
1. `sheets.new` → name the file **Prajna Data**
2. Extensions → Apps Script → paste `apps-script/Code.gs`
3. Run `setup()` once → allow the permissions
4. Optional: put your email in `DIGEST_TO` at the top, then add a daily trigger on `digest()`
5. Deploy → New deployment → Web app → Execute as **Me**, access **Anyone** → copy the `/exec` URL
6. Paste that URL into `config.js` as `endpoint: "..."` and into `assets/site.js` → `PRAJNA.endpoint`

Tabs it creates and what they are for:

| Tab | Rows land here | You do |
|---|---|---|
| Inquiries | contact form | call/WhatsApp back, set `Status` |
| Feedback | feedback form | read, then set `Published` if you want it public |
| Board | The Pit posts | set `Approved` = TRUE to show it on the site |
| Digest | daily roll-up | nothing |
| Errors | anything that failed | nothing unless it grows |

Nothing on the website can read your sheet except the board feed, and that only returns rows
you approved.

## 3. If you want Notion instead of / alongside the sheet
The site never talks to Notion directly (that would expose a key). Mirror it server-side:
sheet → Apps Script → Notion API with your integration token stored in Script Properties.
Ask and I'll write the mirror.

## 4. Domain (optional, later)
Buy a `.in` domain, then in the repo: Settings → Pages → Custom domain, and add the four GitHub
A records plus a `www` CNAME at your registrar. HTTPS turns on by itself. Update `sitemap.xml`
and the canonicals in each page to the new domain when you do.

## 5. What the site now ships with
- Installable app (manifest + service worker): loads instantly on repeat visits, works offline
- 404 page, skip link, focus rings, print stylesheet, reduced-motion support
- Auto-generated icons, OG/Twitter cards, schema.org data, sitemap, robots
- One config block drives prices, phone, WhatsApp links, availability and food wording
- Retry-on-failure forms, duplicate-submit lock, IST timestamps everywhere
