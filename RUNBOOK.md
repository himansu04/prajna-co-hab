# Prajna Co-hab — run book

Everything the owner needs, in the order it's needed. Steps 1–3 are done;
step 4 is the only thing left and it takes about ten minutes.

---

## 1. What is live right now

`https://himansu04.github.io/prajna-co-hab/`

Real data, published: both room types, both meal plans, deposits, terms,
inclusions, and "no beds free right now". The preview banner is gone.

**The contact channel is email.** `srijna2b@gmail.com` is the only address on
the site. There is no phone number anywhere in the HTML, the CSS, the JSON-LD
or the JavaScript — it is handed out in email replies only, which is the point.

---

## 2. The contact model, and why it works this way

The owner's number is never published. Every CTA on all nine pages opens the
visitor's email client with the address, a subject and a pre-written body.

Forms do the same thing if there is no backend: type the inquiry form, press
send, and a properly formatted email opens with everything they typed. Nothing
is lost, and no number is exposed.

If you set `endpoint` in `config.js` (step 4), the same forms silently switch
to posting into a Google Sheet instead, and the visitor never sees an email
client at all. No other code changes.

---

## 3. Changing anything later

Everything factual lives in one file: **`config.js`**. Rents, deposits, meal
plans, availability, terms, the email address. Edit it, commit, push.

```bash
cd ~/Media/prajna/prajna-repo
# edit config.js
git add -A && git commit -m "update rates" && git push
```

**After changing rates, bump the version.** Every page pins its assets with
`?v=53`. If you change `site.js` or `style.css` without bumping, returning
visitors keep the old copy for up to ten minutes. The safest habit:

- change only `config.js` → no bump needed, it is loaded fresh every visit
- change `site.js` or `style.css` → replace `?v=53` with `?v=54` in all nine
  HTML files, and change `prajna-v53` to `prajna-v54` in both `sw.js` and
  `assets/site.js`

---

## 4. The only thing left: enquiries into a spreadsheet

Ten minutes, free, no server. This turns the three forms on the site into rows
in a sheet you check like WhatsApp.

1. Go to **sheets.new** and name it **Prajna Data**.
2. **Extensions → Apps Script**. Delete the sample code.
3. Open `apps-script/Code.gs` in the repo, copy the whole file, paste it.
4. Pick `setup` from the function dropdown, press **Run**. Allow the
   permissions when asked (Google will warn you; it is your own script).
5. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the URL ending in `/exec`.
7. Put it in `config.js`:

```js
endpoint: "https://script.google.com/macros/s/AKfy.../exec",
```

8. Commit and push. The forms now post to the sheet instead of opening an
   email client. That is it.

**What you get:** an `Inquiries` tab (every room enquiry, with their phone number
and message), a `Feedback` tab, a `Board` tab for The Pit (set `Approved` to
TRUE to publish a post), an `Errors` tab, and a `Visits` tab. You get an email
alert the moment an enquiry arrives, because `DIGEST_TO` is already set to
`srijna2b@gmail.com`.

**To change availability later:** edit `bedsOpen` and `availability` in
`config.js`. `bedsOpen: 0` renders "No beds free right now" in the header.
Set it to `2` and it renders "2 beds open · <today's date>".

---

## 5. When you move to your own domain

The site is on `github.io` for testing. When the real domain is ready:

1. Repo → **Settings → Pages → Custom domain** → enter it, save.
2. At the registrar add the four GitHub A records plus a `www` CNAME.
3. Tick **Enforce HTTPS**.
4. Update the hardcoded URLs. Do it as ONE scripted find-and-replace, because
   there are 27 of them across 12 files and missing one silently breaks either
   the social card or the SEO canonical:

```bash
cd ~/Media/prajna/prajna-repo
grep -rlZ 'https://himansu04.github.io/prajna-co-hab/' \
  --include='*.html' --include='*.xml' --include='*.txt' . \
  | xargs -0 sed -i '' 's|https://himansu04\.github\.io/prajna-co-hab/|https://YOURDOMAIN/|g'
```

   That covers every page's `<link rel="canonical">`, `og:url` and `og:image`,
   plus `sitemap.xml` (8 `<loc>` entries) and the `Sitemap:` line in `robots.txt`.

   **`manifest.webmanifest` is the trap.** Its `id` used to be
   `"/prajna-co-hab/index.html"` - root-relative, containing no domain string, so
   the replace above will NOT catch it. It is already fixed to `"./index.html"`,
   so just don't reintroduce an absolute path there.

5. Verify before shipping - this must return nothing:

```bash
grep -rn 'himansu04\|github\.io' --include='*.html' --include='*.xml' \
  --include='*.txt' --include='*.webmanifest' --include='*.js' .
```

**Why this must be done in the files, not in JavaScript:** `og:url` and
`og:image` are read by Facebook, WhatsApp, LinkedIn and X by plain HTTP fetch
with no JavaScript at all. A `site.js` that rewrites the canonical after load is
invisible to exactly the scrapers that matter, and a canonical pointing at the
old domain tells Google the authoritative copy lives on a domain you are
retiring - which gets your new pages dropped from the index.

   A single find-and-replace across the nine HTML files, `sitemap.xml` and
   `robots.txt` covers all of it.

---

## 6. What is deliberately not on the site

- **The phone number.** Never, anywhere, in any layer.
- **Breakfast and lunch.** The "with dinner" rate covers dinner only, and the
  FAQ says so directly. Better to lose a few enquiries than lose a tenant on
  day one.
- **Any number we cannot back up.** There is not one rupee of invented data
  left on the site. Everything is either yours or it isn't there.

## 7. Honest gaps

- **Three room photos for six rooms.** `twin.jpg`, `single.jpg` and
  `room.jpg` cover the room types; the other three rooms have no photo yet.
  The site claims the photos are the real rooms, so shoot the remaining three
  and drop them in `assets/g/`.
- **The tour video** is silent and has no captions. If anyone narrates it,
  it needs a `<track>`.
- **No photos of the caretaker, the kitchen in use, or a meal.** Real life
  shots convert; stock does not.