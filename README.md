# Hacker House Goa 2026 — Builder ID site

A single-page site that registers builders, locks one role per team
(Raja / Mantri / Chor / Sipahi), and renders a printable front + back
badge on `<canvas>` using your two template images.

## Files

```
hacker-house-goa/
├─ index.html                 all markup, one page
├─ style.css                  theme tokens + animation + layout
├─ script.js                  role-lock logic + canvas badge renderer
├─ assets/
│  ├─ card-front-template.jpg   your original front artwork (reference)
│  ├─ card-front-hole.png       front artwork with the photo circle
│  │                            cut to transparent — this is what the
│  │                            site actually draws with
│  └─ card-back-template.jpg    your back artwork, used as-is
└─ README.md
```

## Running it

No build step, no npm install. Open `index.html` directly, or serve the
folder with any static server, e.g.:

```
cd hacker-house-goa
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## How the badge render works

- `card-front-hole.png` is your front template with the white photo
  circle punched to real transparency (center ≈ x534,y508, r≈244 on a
  1088×1445 canvas). The script draws the user's photo first, clipped
  to that circle, then draws this template on top — so the gold ring
  and beach scene sit cleanly over the photo edge.
- Name, builder ID, and role are drawn into the empty rounded box
  already printed on the front template.
- The back template is used untouched as a background; builder ID,
  name, title, role, tech-stack pills, and the social/tap link are
  laid out underneath the logo in the empty space you left there.

## Known limitation: role-locking is per-browser

"One role per team" is enforced with `localStorage`, keyed by team
code. That means it stops two teammates *on the same laptop/browser*
from double-booking a role, but it does **not** sync across different
phones/laptops at the actual event — each device has its own storage.

For a real multi-device check-in desk, you'd swap `getTeamRoles` /
`claimRole` in `script.js` for calls to a small shared backend
(Supabase, Firebase, or a two-endpoint REST API: `GET /team/:code` and
`POST /team/:code/claim`). The Antigravity prompt below calls this out
as a stretch goal.

---

