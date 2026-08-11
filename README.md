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

## Prompt for Antigravity (or any coding agent)

Paste this in if you want an AI coding agent to keep building on top of
what's here — it describes the project as it stands so the agent
doesn't have to guess:

```
You're working in an existing project called "Hacker House Goa 2026" —
a single-page hackathon site (plain HTML5/CSS/JS, no framework, no
build step) at index.html / style.css / script.js, with two badge
template images in assets/.

Project facts, don't relitigate these:
- Theme: illustrated Goa beach scene — jungle green (#0b2818), gold
  (#f0b429), cream (#f6f1e2), terracotta (#c1442d). Fonts: Bricolage
  Grotesque (display), Inter (body), JetBrains Mono (data/labels/IDs).
- The badge is a 1088×1445 canvas rendered from assets/card-front-hole.png
  (front, transparent photo circle at cx534 cy508 r244) and
  assets/card-back-template.jpg (back). Rendering logic lives in
  script.js: renderFront() and renderBack().
- Registration form fields: name, builder title, team code, tech
  stack, field (Raja/Mantri/Chor/Sipahi — one per team code, enforced
  client-side via localStorage), social/tap link, photo upload.
- Builder IDs look like HHG26-RAJ-4821 (role prefix + random 4 digits).

Task: [describe what you want changed or added here — e.g. "swap the
localStorage role-lock for a Supabase table so it's shared across
devices" or "add a live leaderboard of registered builders" or "add a
QR code on the back card that encodes the social link"].

Rules to follow while working in this project:
1. Stay vanilla. HTML5 + CSS3 + JavaScript (ES2020+) only — no React,
   no build tooling, no bundler, unless I explicitly ask for one.
2. One page, one job. Keep markup in index.html, styling in style.css,
   behavior in script.js, unless a new feature is genuinely a separate
   concern (e.g. a leaderboard page) — then make a new file, don't
   cram it into the existing ones.
3. Never touch the calibrated badge coordinates (HOLE, PLATE constants
   in script.js) or the assets/ template files without re-verifying
   the photo circle and text still land correctly — render a sample
   PNG and check it before calling the change done.
4. Keep the palette and type scale exactly as defined in style.css's
   :root tokens. New UI should reuse those variables, not introduce
   new colors or fonts.
5. Respect prefers-reduced-motion — every animation you add needs to
   degrade gracefully, matching the existing media query in style.css.
6. Don't hotlink external stock photography or any third-party image
   you don't have rights to. The beach scene is built from CSS/SVG on
   purpose — keep new visuals in that same illustrated style, not
   photographic.
7. No localStorage/sessionStorage assumptions beyond what's already
   there — if a feature needs real persistence across devices, build
   or stub a small backend, don't fake it with browser storage.
8. Keep the whole thing usable with zero installs: it must still open
   directly from index.html or from a plain static file server.
9. Mobile-first responsive. Test the layout down to a 375px-wide
   screen before calling anything done.
10. Don't introduce a photo/document generation library — badge
    rendering stays on the native Canvas 2D API.
```

## General "AI build rules" for this kind of project

If you're briefing any AI tool (Antigravity, Claude Code, Cursor,
whatever) to build something like this from scratch, these are the
constraints worth stating up front — they're the ones that actually
shaped this build:

- **Use HTML5 throughout** — semantic tags, no framework unless asked.
- **No build step.** The deliverable should open by double-clicking
  index.html or from any static host (Netlify, GitHub Pages, S3).
- **Canvas, not an image library**, for compositing the photo into the
  template — it's the only zero-dependency way to do pixel-accurate
  badge generation in the browser.
- **Calibrate template coordinates against the actual asset**, don't
  eyeball them — crop/overlay-test the circle and text-box positions
  against the real PNG/JPG before wiring them into code.
- **Match the source palette**, don't invent a new one — pull real hex
  values from the provided artwork instead of guessing "beach colors."
- **One signature interaction, not five** — this build spends its
  "wow" budget on the shutter-open intro and the flip card; everything
  else stays restrained on purpose.
- **State the persistence limitation out loud** — client-only storage
  (localStorage) is fine for a prototype, but the AI should say so
  explicitly rather than imply it's production-ready for a multi-device
  check-in desk.
- **Respect motion sensitivity** — every animated build needs a
  `prefers-reduced-motion` fallback.
- **No placeholder image services or stock photography** with unclear
  licensing — build visuals from CSS/SVG/canvas so the whole thing is
  yours to ship without attribution headaches.
