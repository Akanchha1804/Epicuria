# Epicuria

**The official website for Epicuria — a modern Indian dining room and world kitchen in Agra.**

[Live site](https://akanchha1804.github.io/Epicuria/) · [Menu](https://akanchha1804.github.io/Epicuria/menu.html) · [Reservations](https://akanchha1804.github.io/Epicuria/reservation.html)

Epicuria is a fully static restaurant website built with plain **HTML, CSS and JavaScript**. It needs no framework, bundler, database or server runtime: every page is a file, every flow runs in the browser, and deployment is a `git push`.

The site covers menu discovery, dietary filtering, per-dish customisation, a persistent cart, pickup and dine-in order requests, table reservations, festive menus and a custom 404 page — with contact details, menus and form destinations configured in one place so most updates do not require touching layout code.

---

## Contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Menu data](#menu-data)
- [Order and reservation flows](#order-and-reservation-flows)
- [Deployment](#deployment)
- [Legacy URLs](#legacy-urls)
- [Accessibility, performance and SEO](#accessibility-performance-and-seo)
- [Browser support](#browser-support)
- [Quality checks](#quality-checks)
- [Known limitations and roadmap](#known-limitations-and-roadmap)
- [Contributing](#contributing)
- [License and credits](#license-and-credits)

---

## Overview

The project started life as a set of standalone HTML pages exported from a design tool. Those pages contained absolute `file:///C:/...` links, duplicated image folders, mismatched `addToCart()` arguments (several dishes added the wrong name and price), and a Taste Board that did not run.

This repository is a ground-up rebuild of that material into one coherent site:

- Every page shares the same header, footer, navigation, design tokens and scripts.
- Contact details, opening hours, currency, form endpoints and featured dishes are configured in `config.js`; the menu lives in a single dataset. Contact values are also mirrored in the HTML as no-JS fallbacks.
- A single menu dataset powers the menu, the Taste Board, the cart, checkout, and the homepage signatures.
- All internal links, image references and legacy URLs were audited; the old addresses still resolve through redirect stubs.
- The cart, checkout and reservation flows work end-to-end with **no backend required**, and can optionally POST to a form service.

The result is a site that behaves like a small web application while remaining deployable to any static host.

## Features

### Menu and discovery

- **97 dishes across 11 cuisines**, with prices in Indian rupees.
- Full-text search across dish names, cuisines and ingredients.
- Cuisine rail and diet filter (Veg, Vegan, Non-Veg), with progressive loading of 24 cards at a time.
- **Taste Board** with six facets generated from the data — cuisine, diet, meal, taste, dish type and dining style — plus live result counts.
- Dish customisation dialog: fixed (mandatory) ingredients are listed, negotiable ingredients can be removed, and a free-text kitchen note can be added.
- No-results state with a one-click filter reset.

### Cart and orders

- Persistent cart in `localStorage`, shared across pages and browser tabs.
- Quantity controls, per-dish exclusions and notes, subtotal calculation, and a confirmation dialog before clearing.
- Empty-cart states that point back to the menu.
- Checkout validates name, phone, email, collection date and time, including kitchen hours and a configurable minimum lead time (30 minutes by default).
- Order review with a reference such as `EP-261020-AB12`, then **Email order**, optional **WhatsApp order**, **Copy details**, **Print** or **Clear cart**.
- When a form endpoint is configured, the order is POSTed as JSON and the cart is cleared automatically on success. If the request fails, the email fallback is offered instead.

### Reservations

- Party size, date, time, seating preference, occasion and notes.
- Validation for opening hours, future date/time and guest limits (1–20 by default).
- The interface is explicit that this is a **request**, confirmed by the restaurant — not a confirmed booking.
- Same delivery options as checkout: JSON endpoint, or email/WhatsApp hand-off. References use the `RS-` prefix.

### Content, structure and discoverability

- Home page with hero slideshow, story, signature dishes, festive teaser and visit information.
- Festive occasions page with seasonal menus (Diwali, Holi, Eid, Navratri, Independence Day) and an enquiry call to action.
- Legacy `takeout.html` alias and redirect stubs for every old URL.
- Custom `404.html` that keeps the site's navigation and styling.
- Per-page titles, descriptions, canonical URLs, Open Graph and Twitter metadata.
- `schema.org/Restaurant` JSON-LD generated from configuration (name, address, phone, hours, menu, reservations).
- `sitemap.xml` and `robots.txt`; cart and checkout are excluded from indexing.
- Print styles for order and reservation confirmations.
- No cookies, analytics or third-party scripts. Only Google Fonts is external, with system-font fallbacks.

## Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Markup | HTML5 | One file per page, semantic landmarks |
| Styling | Hand-written CSS | Custom properties, responsive layout, print and reduced-motion rules |
| Behaviour | Vanilla JavaScript | ES5-compatible IIFE modules, no dependencies |
| Data | JavaScript globals | `window.EPICURIA_CONFIG`, `window.EPICURIA_MENU` |
| Storage | `localStorage` | Cart and last submission, per device |
| Fonts | Google Fonts | Cormorant Garamond + Inter, with fallbacks |
| Hosting | GitHub Pages | Static, `main` branch, repository root |

There is **no build step**: the files in the repository are the files that are served. No `node_modules`, no compilation, no generated output to keep in sync.

## Architecture

```
                     assets/js/config.js
                  (contact, hours, endpoints)
                              │
  assets/js/menu-data.js ─────┼──────────────┐
       (97 dishes)            │              │
                              ▼              ▼
                       site.js          menu-ui.js
              (nav, config fill,     (shared dish card,
               toasts, JSON-LD)       cart buttons)
                              │              │
                              ▼              ▼
                        page scripts: home · menu · food-board
                                      · cart-page · checkout · reservation
                              │
                              ▼
                         cart.js  ──▶  localStorage
                              │
                              ▼
                    checkout.js / reservation.js
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        POST JSON endpoint            mailto: / WhatsApp
        (optional, e.g. Formspree)    (works with no backend)
```

### Shared modules

| File | Responsibility |
| --- | --- |
| `config.js` | Single source of truth for restaurant details, hours, currency, form endpoints, socials and featured dishes |
| `menu-data.js` | The complete menu dataset (`window.EPICURIA_MENU`) |
| `site.js` | Mobile navigation, config injection, cart badge shell, toasts, social links, JSON-LD, footer year |
| `cart.js` | Cart store: read/write/sanitise, quantities, totals, cross-tab sync |
| `menu-ui.js` | Dish card markup, add-to-cart handling, shared empty states |
| `home.js` | Hero slideshow and signature dishes |
| `menu.js` | Search, cuisine rail, diet filter, pagination |
| `food-board.js` | Facet filters, result counts, customisation dialog |
| `cart-page.js` | Cart rendering, quantity changes, clear dialog |
| `form-utils.js` | Date/time helpers, validation, references, mailto/WhatsApp links, clipboard, JSON POST |
| `checkout.js` | Order validation, summary, submission and confirmation |
| `reservation.js` | Reservation validation, summary, submission and confirmation |

All scripts are loaded with `defer` in dependency order: `config` → `site` → `cart` → (`menu-ui`, `menu-data`) → page script.

## Project structure

```
/
├─ index.html                 Home: hero, story, signatures, occasions teaser, visit info
├─ menu.html                  Full menu: search, cuisine rail, diet filter, load more
├─ food-board.html            Taste Board: six facets + dish customisation
├─ cart.html                  Cart, quantities, exclusions, notes, subtotal
├─ checkout.html              Pickup / dine-in pre-order request
├─ reservation.html           Table reservation request
├─ occasions.html             Festive menus and celebration enquiries
├─ takeout.html               Legacy alias → checkout.html
├─ 404.html                   Custom not-found page (absolute /Epicuria/ paths)
├─ .nojekyll                  Disables Jekyll processing on GitHub Pages
├─ robots.txt                 Crawl rules + sitemap reference
├─ sitemap.xml                Indexable pages
├─ assets/
│  ├─ css/
│  │  └─ style.css            Design system, layout, components, print, motion
│  ├─ img/
│  │  ├─ menu/                97 WebP dish images
│  │  ├─ home/                Hero slides
│  │  ├─ occasions/           Festive photography
│  │  └─ brand/               Favicon, touch icon, Open Graph image
│  └─ js/
│     ├─ config.js            Owner-editable configuration
│     ├─ menu-data.js         97-dish dataset
│     ├─ site.js              Global UI and structured data
│     ├─ cart.js              Cart store
│     ├─ menu-ui.js           Dish card component
│     ├─ home.js              Home page behaviour
│     ├─ menu.js              Menu page behaviour
│     ├─ food-board.js        Taste Board behaviour
│     ├─ cart-page.js         Cart page behaviour
│     ├─ form-utils.js        Form helpers
│     ├─ checkout.js          Order flow
│     └─ reservation.js       Reservation flow
├─ Home/                      Redirect stubs for legacy URLs
├─ Menu/
├─ Cart/
├─ Food Board/
├─ Occasions/
├─ Registration/
└─ README.md
```

## Getting started

### Requirements

- A modern browser.
- Any static file server for local development. Python 3 is the simplest option and is already available on most machines.

No installation, package manager or build command is required.

### Run locally

From the repository root:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000/>.

Alternatives:

```bash
npx serve .                 # Node.js
php -S localhost:8000       # PHP
```

Or use the **Live Server** extension in VS Code.

> **Use a local server rather than opening `index.html` with `file://`.**
> Most of the site works from the file system, but a server matches the deployed environment and avoids browser restrictions on storage, clipboard access and relative URLs.

To test the production build exactly, run the server from the repository root — that is what GitHub Pages serves.

## Configuration

All owner-editable values live in **`assets/js/config.js`**. Edit that file, refresh the page, and every occurrence across the site updates at runtime: header, footer, contact blocks, checkout and reservation hints, and structured data.

The same phone number and address are also written into the HTML as fallbacks for visitors without JavaScript. When those details change, update the static text and `tel:`/map links in the HTML files too (a find-and-replace of the phone number and address is enough), or no-JS visitors and some crawlers will see the previous values.

### Restaurant and brand

| Key | Default | Purpose |
| --- | --- | --- |
| `siteUrl` | `https://akanchha1804.github.io/Epicuria/` | Absolute base URL used in JSON-LD and the social preview image |
| `brand.name` | `Epicuria` | Brand name in metadata and structured data |
| `brand.tagline` | `Divine · Luxurious Taste · Cosy Atmosphere` | Brand line |
| `brand.shortDescription` | — | Short description used in JSON-LD |
| `restaurant.phone` | `+91 xxxxxxxxxx` | Displayed phone number; call links dial once it contains 7+ digits |
| `restaurant.email` | `sakanchha47@gmail.com` | Contact email |
| `restaurant.address` | `123 xyz street, Agra` | Displayed address and schema street address |
| `restaurant.mapUrl` | Google Maps search | Target of every "Get directions" link |
| `restaurant.hours` | `12:00 PM – 11:00 PM` | Long-form opening hours |
| `restaurant.hoursShort` | `Open daily · 12–11 PM` | Header strip hours |
| `currency.locale` / `currency.code` | `en-IN` / `INR` | `Intl.NumberFormat` settings for prices |

### Orders and reservations

| Key | Default | Purpose |
| --- | --- | --- |
| `ordering.endpoint` | empty | Optional POST endpoint for order requests; empty enables the email/WhatsApp hand-off |
| `ordering.email` | `sakanchha47@gmail.com` | Recipient for the email fallback |
| `ordering.whatsapp` | empty | Digits-only WhatsApp number; empty hides the WhatsApp button |
| `ordering.earliestPickupMinutes` | `30` | Minimum lead time for pickup validation |
| `ordering.requireEmail` | `true` | Whether an email address is required at checkout |
| `reservation.endpoint` | empty | Optional POST endpoint for reservation requests |
| `reservation.email` | `sakanchha47@gmail.com` | Recipient for the email fallback |
| `reservation.whatsapp` | empty | Digits-only WhatsApp number |
| `reservation.minGuests` / `maxGuests` | `1` / `20` | Party-size bounds |
| `reservation.openTime` / `closeTime` | `12:00` / `22:30` | Kitchen hours in 24-hour `HH:MM`, used by both forms |
| `reservation.seating` | `Indoor`, `Outdoor`, `No preference` | Seating options |

### Other

| Key | Default | Purpose |
| --- | --- | --- |
| `socials.instagram` / `facebook` / `x` | empty | Footer links; empty entries are hidden |
| `featuredDishIds` | `[54, 59, 63, 7]` | Dish IDs shown under "Signatures" on the home page |

### Before launch

1. Replace `restaurant.phone` with the real number and confirm `restaurant.address` and `restaurant.mapUrl`; mirror the same values in the HTML fallbacks.
2. Fill the social links you want to display.
3. Choose how requests reach the restaurant:
   - **No backend:** leave both endpoints empty. Customers send the order or reservation from their own email or WhatsApp app.
   - **Form service:** set `ordering.endpoint` and `reservation.endpoint` to a JSON endpoint (Formspree, Basin, or your own function). Add the site origin to the service's allowed domains.
4. If you move to a custom domain, update `siteUrl`, the canonical and Open Graph tags in each HTML file, `sitemap.xml` and `robots.txt`.
5. Place a real order and a real reservation on a phone: validation, hand-off, quantities, customisations and print layout.

The supplied phone number is currently a placeholder (`+91 xxxxxxxxxx`). Call links stay visible but do not dial until a number with at least seven digits is entered.

## Menu data

`assets/js/menu-data.js` exposes a plain array as `window.EPICURIA_MENU`. Each entry looks like this:

```json
{
  "name": "Butter Chicken",
  "image": "assets/img/menu/54.webp",
  "price": 400,
  "description": "Chicken, tomato, butter, cream, ginger, garlic",
  "cuisine": "North Indian",
  "variety": "Non-Veg",
  "dineTypes": ["Fine Dine", "Street Dine"],
  "tastes": ["Savory", "Spicy"],
  "meals": ["Everyday Meal", "Festive"],
  "types": ["Comfort Food", "Family Meal"],
  "mandatory": ["Chicken", "Tomato", "Butter"],
  "negotiable": ["Coriander", "Green chili", "Kasuri methi"],
  "id": 54,
  "key": "butter-chicken-54"
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | number | Stable identifier; must be unique. Used by `featuredDishIds` and conventionally matches the image filename |
| `key` | string | Unique line signature used by the cart; `slug-id` by convention |
| `name` | string | Dish name shown on cards and in orders |
| `price` | number | Whole rupees; formatted with `Intl.NumberFormat` |
| `image` | string | Path relative to the site root (most follow `assets/img/menu/<id>.webp`) |
| `description` | string | Ingredient/description line on the card |
| `cuisine` | string | Cuisine filter value |
| `variety` | string | `Veg`, `Vegan` or `Non-Veg` — drives the diet filter |
| `dineTypes`, `tastes`, `meals`, `types` | string[] | Multi-value facets; new values automatically create new filter chips |
| `mandatory` | string[] | Ingredients always included; listed but not removable |
| `negotiable` | string[] | Ingredients a guest may remove in the Taste Board dialog |

### Editing the menu

- **Prices** are integers in rupees. Do not add decimals or a currency symbol.
- **Images** are WebP, displayed with `object-fit: cover`; keep the same aspect ratio as the existing set.
- **Adding a dish:** copy an existing entry, give it a new unique `id` and `key`, add the image (most dishes use `assets/img/menu/<id>.webp`), and reload. No other file needs to change.
- **Removing a dish:** remove its entry and image. Carts that already contain the dish keep their own stored copy until the customer clears them.
- Facet values are case-sensitive. Match the existing spelling (`North Indian`, `Non-Veg`, `Street Dine`) so filters stay coherent.

The dataset was rebuilt from the original menu and Taste Board sources. Duplicate dishes were merged and the original mismatched cart arguments — where several dishes added "Kung Pao Chicken" or the wrong price — were corrected.

## Order and reservation flows

### Cart

- Stored under `epicuria.cart.v1` in `localStorage`.
- Items are sanitised on read: unknown fields are dropped, quantities are clamped, and duplicate line signatures are merged.
- The header badge updates in every open tab through the `storage` event.
- The cart is per device. There are no accounts and no server-side storage.

### Checkout

1. The customer reviews the order summary and chooses **Pickup** or **Dine-in pre-order**.
2. Validation checks name, phone (7–15 digits), email (if required), date, time, kitchen hours and the minimum lead time.
3. A reference is generated, for example `EP-261020-AB12`.
4. If `ordering.endpoint` is set, the order is POSTed as JSON:

   ```json
   {
     "_subject": "Epicuria order EP-261020-AB12",
     "type": "order",
     "order": {
       "reference": "EP-261020-AB12",
       "createdAt": "2026-10-20T10:36:38.111Z",
       "fulfilment": "Pickup",
       "customer": { "name": "…", "phone": "…", "email": "…" },
       "date": "2026-10-20",
       "time": "16:50",
       "notes": "…",
       "items": [
         { "name": "Butter Chicken", "qty": 2, "price": 400, "customizations": null }
       ],
       "subtotal": 800
     }
   }
   ```

   The request uses `Content-Type: application/json`, `Accept: application/json` and a 15-second timeout. On success the cart is cleared and the confirmation is shown. On failure the email fallback appears with an explanatory message.

5. Without an endpoint, the confirmation screen offers **Email order**, **WhatsApp** (if configured), **Copy details**, **Print** and **Clear cart**. Nothing is charged; the cart remains until cleared.

The last submission is also cached in `localStorage` under `epicuria.last-order`.

### Reservations

The reservation form follows the same pattern. The payload uses `type: "reservation"` and a `reservation` object containing the customer, date, time, guest count, seating, occasion and notes. References use the `RS-` prefix and the last submission is stored under `epicuria.last-reservation`.

A reservation is always presented as a **request**: the site does not hold tables or confirm availability.

## Deployment

### GitHub Pages (current setup)

The repository is configured to deploy from the `main` branch at the repository root.

1. Commit and push to `main`:

   ```bash
   git add .
   git commit -m "Update site"
   git push origin main
   ```

2. On GitHub, open **Settings → Pages** and confirm:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / `/ (root)`

3. GitHub rebuilds automatically. The site is published at <https://akanchha1804.github.io/Epicuria/>.

The build usually completes within a minute. The `.nojekyll` file prevents GitHub from running Jekyll over the project.

### Other static hosts

Because the site has no server-side code, it deploys unchanged to Netlify, Cloudflare Pages, Vercel, S3 + CloudFront, Firebase Hosting or any Apache/Nginx document root. Upload the repository root as-is.

### Custom domain

1. Add a `CNAME` file at the repository root containing the domain, and point DNS at GitHub Pages.
2. Update `siteUrl` in `config.js`.
3. Update the canonical, Open Graph and Twitter URLs in each HTML file.
4. Update `sitemap.xml` and the sitemap line in `robots.txt`.
5. Recheck the absolute paths in `404.html`.

## Legacy URLs

The old site used folder-based URLs. Every one of them is preserved as a small redirect stub so external links and search results keep working:

| Legacy URL | Redirects to |
| --- | --- |
| `/Home/4.html` | `/index.html` |
| `/Menu/Menu_Page.html` | `/menu.html` |
| `/Menu/cart.html` | `/cart.html` |
| `/Cart/cart.html` | `/cart.html` |
| `/Food Board/Food_Board.html` | `/food-board.html` |
| `/Occasions/Occasions.html` | `/occasions.html` |
| `/Registration/Registration.html` | `/reservation.html` |
| `/Registration/takeout.html` | `/takeout.html` |
| `/takeout.html` | `/checkout.html` |

Each stub uses a meta refresh, a `location.replace()` fallback and a visible link, and is marked `noindex,follow`.

## Accessibility, performance and SEO

### Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `footer`), a skip link, and a logical heading order.
- Labelled form controls, inline error messages tied to their fields, `aria-invalid`, and focus moved to the first invalid field.
- `aria-live` regions for result counts, cart updates and form status.
- Native `<dialog>` elements for the cart-clear and customisation modals, with built-in focus handling and Escape support.
- Mobile navigation is a real `<button>` with `aria-expanded`, closes on Escape, link activation or backdrop click, and applies `inert` to the off-screen panel.
- Visible focus styles and high-contrast text on dark surfaces.
- The hero slideshow pauses on hover and focus, pauses when the tab is hidden, and does not autoplay when `prefers-reduced-motion` is set.
- Print styles remove navigation, controls and decorative layers, leaving readable order and reservation details.

### Performance

- No frameworks, no runtime dependencies, no third-party JavaScript.
- Images are WebP with explicit `width`/`height`; below-the-fold images use `loading="lazy"`.
- The menu renders 24 cards at a time and adds more on demand.
- Total asset payload is approximately 7.3 MB, dominated by dish photography; pages themselves are small.
- Fonts are loaded from Google Fonts with `display=swap` and system-font fallbacks.

### SEO

- Unique `<title>` and meta description on every page, plus canonical URLs.
- Open Graph and Twitter card metadata on the public pages (home, menu, Taste Board, occasions, reservations), with a shared preview image.
- `Restaurant` JSON-LD generated at runtime from `config.js` (name, address, phone, email, cuisine, hours, menu, reservations, social profiles).
- `sitemap.xml` lists the public pages; `robots.txt` disallows `cart.html` and `checkout.html`.
- Legacy stubs are `noindex,follow` and point to the current canonical URL, so search results consolidate on the new pages.

## Browser support

The site targets current evergreen browsers: Chrome, Edge, Firefox and Safari on desktop, and Chrome/Safari on iOS and Android.

It uses `<dialog>`, `inert`, `Intl`, `AbortController` and modern CSS (`:has()`, custom properties, grid). Browsers without `:has()` lose only the enhanced selected-state styling; the underlying controls still work. JavaScript is required for the menu, cart, checkout and reservation flows — without it the page shell and static copy still render.

## Quality checks

There is no automated test suite; this is a static site with browser-driven flows. Before each release:

- [ ] Run the site from a local server and click every navigation, footer and legacy link.
- [ ] Check the browser console for errors on each page.
- [ ] Add a dish, change quantities, add exclusions and a note, reload, and confirm the cart survives.
- [ ] Complete checkout with the default suggested pickup time (should pass) and a time under 30 minutes (should fail with a clear message).
- [ ] Submit a reservation at opening time, closing time and with an invalid party size.
- [ ] Test the email and WhatsApp hand-off on a phone, including copy and print.
- [ ] Check keyboard-only navigation, focus visibility and the mobile drawer.
- [ ] Confirm images load at mobile and desktop widths.
- [ ] Validate `sitemap.xml`, `robots.txt` and the JSON-LD block.
- [ ] Recheck that no placeholder contact details remain.

## Known limitations and roadmap

**Limitations of a static site**

- No payment processing, order confirmation, inventory or staff dashboard.
- Orders and reservations are requests delivered by a form endpoint or the customer's email/WhatsApp app; the site cannot confirm or store them itself.
- The cart is per device and per browser; there are no customer accounts.
- Form endpoints must allow the site origin via CORS.
- Contact details are placeholders until the real phone number is supplied.

**Possible next steps**

- Connect the forms to a small serverless function with email delivery and spam protection.
- Add online payment for pickup orders.
- Move menu content into a headless CMS so staff can edit it without a deploy.
- Add analytics with consent, and richer structured data (reviews, price range).
- Add an image pipeline to generate responsive `srcset` variants.
- Add multi-language support.

## Contributing

Small, focused changes are easiest to review.

1. Create a branch.
2. Keep owner-editable content in `config.js` and `menu-data.js`; when contact details change, update the matching no-JS fallbacks in the HTML as well.
3. Match the existing style: two-space indentation, IIFE modules, `var` in browser scripts, no new dependencies.
4. Test the affected pages locally at mobile and desktop widths, and check the console.
5. Open a pull request describing the change and the pages affected.

For content changes, include the exact copy and confirm prices, dietary labels and ingredient lists with the restaurant.

## License and credits

Menu copy, photography and brand assets originate from the Epicuria project and remain the property of their respective owners. No open-source license is included in this repository; add a `LICENSE` file before redistributing the code.

Built and maintained for Epicuria. For questions about the site, open an issue in this repository.
