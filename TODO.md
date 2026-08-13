# TODO — v2 lane vs. the ONTO Design System

Figma: [ONTO Design System](https://www.figma.com/design/8sDqBWwj4D8sguuOUH1IFE/ONTO-Design-System)
(file key `8sDqBWwj4D8sguuOUH1IFE`)

The token/type pass is **done** — `docs/v2/tokens.css` carries the colour, type,
radius, spacing and elevation system, and all 25 ONTO pages are on it. What is
left is **layout and structure**: the v2 screens don't yet match the Figma frames.

Audited by diffing page markup against the Figma frames, not by eye.

---

## Results / listing — aligned, low priority

`results.html` already carries the anatomy of Figma frame `28:21906` (Hotels / List):
Sort By, Top Pick badge, Popular filters, the Guest rating / Price per night /
Property type accordions, and the "Your stay" rail.

- [ ] Proportional pass only — card image ratio, price-block alignment, chip sizing.
      Nothing architectural.

---

## Home — the entry point is the wrong file

Figma frame `99:15619` is a **two-section scrolling page**. v2 splits its home across
three files and none of them match.

`home.html` is wired as the entry point but says "Travel the world" over a
left-aligned lounge photo. `home2.html` is the closer file — right headline, sky
background — but isn't the one that's linked.

- [ ] Decide which file becomes the real home (`home2.html` is the closer start).
- [ ] Headline → "Find your kind of stay", centred, over the sky photo.
- [ ] Add the destination chip row: Goa · Udaipur · Rishikesh · Coorg · Alibaug.
      Currently missing from **all three** home files.
- [ ] Add the second section: **"Where people are heading"** + "Browse all stays →"
      + 4 destination cards (name, stay count, from-price overlaid on the photo).
      Currently **0 matches** across `home.html`, `home2.html`, `home-loggedout.html`.
- [ ] Blocker: `home.html` is `height:100svh; overflow:hidden`, so it structurally
      cannot hold a second section. That has to come off before anything scrolls.

---

## PDP — the widest gap

Figma frame `29:104254` (`pdp-desktop`) has **9 content sections**.
`hotel-firstfold.html` has **4** — hero, Choose your room, What people are saying,
Amenities.

Missing entirely:

- [ ] **"Why it fits your trip"** — "Strong Match for your family trip" with the
      **83% donut**; fit cards with image carousels + dot pagination; "Close to your
      plans" (12 mins from the beach / 18 mins from restaurants) with a map
      thumbnail; "Easy to change later" (free cancellation, check-in/out times).
- [ ] **"What may not work for you"** — expandable negative-signal rows
      ("Bathroom feedback is inconsistent" with 4 photos, expanded; "Not ideal for
      exploring the city", collapsed). No equivalent exists today.
- [ ] **Instagram section** — `@thefighousegoa` header + follow button, a featured
      Reel (310×416) and 2 rows of 3 posts (202×202).
- [ ] **Gallery lead** — Figma opens with an Instagram Reel at 631×412 beside two
      stacked 310×200 stills. v2 opens with a conventional photo grid.

Present but built differently:

- [ ] Right rail exists ("Your stay", "Booking under the name of", "View all
      photos") but the Figma adds room chips (Junior Suite / Deluxe King) and a
      "Total (incl. taxes)" row with an info icon.
- [ ] v2 has sections the Figma doesn't: "Grounds & beach", "Pools", "Rooms"
      subsections. Decide whether these stay.

Note: the Figma PDP models **The Fig House, Goa** (Assagao boutique villa) while v2
models **Taj Exotica**. That's content, not layout — but a literal port would also
swap the property.

---

## Known substitutions in the token layer

- [ ] **Sharp Sans** is a commercial Sharp Type licence and isn't in this repo.
      Satoshi Black (900) stands in for the Extrabold display role. Swap in the real
      face if the licence is bought — only `--font-display` in `tokens.css` changes.
- [ ] Satoshi ships 400/500/700/900 — there is no 600 or 800 cut. Page CSS asking
      for 600 resolves to 700; the Figma's Extrabold 800 resolves to 900.
- [ ] `--danger` / `--amber` / `--success-soft` are held in `tokens.css` but are
      **not in the Figma** — the design system has no status ramp yet. Get these
      designed so the lane stops inventing them.

## Out of scope, deliberately

`google-login.html`, `google-consent.html` and `razorpay.html` imitate Google and
Razorpay chrome. They are **not** on the ONTO system and should stay that way.
