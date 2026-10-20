# Epicuria

A production-leaning static restaurant site for **Epicuria** — menu, dietary "Taste Board", cart, pickup checkout, reservations, and festive menus. No build step, no framework, no server required.

The original project was a set of standalone HTML pages with broken `file:///C:/...` links, mismatched cart data, and a non-functional Taste Board script. It has been rebuilt as one consistent site with shared styles, shared data, and working order/reservation flows.

---

## Quick start

From the project folder:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000/>.

> Opening `index.html` directly with `file://` mostly works too, but a local server is closer to the deployed environment and avoids browser restrictions on storage/clipboard.

## Deploy (GitHub Pages)

The repository is already configured for **GitHub Pages from the `main` branch / root**.

1. Commit and push the changes to `main`.
2. In GitHub: **Settings → Pages → Build and deployment** → Source: *Deploy from a branch* → Branch: `main` / `/ (root)`.
3. The site will be published at <https://akanchha1804.github.io/Epicuria/>.

The root `index.html`, `.nojekyll`, `404.html`, `robots.txt` and `sitemap.xml` are included. Old URLs such as `/Home/4.html` and `/Menu/Menu_Page.html` are kept as redirect stubs, so existing links do not 404.

## Project structure

```
/
├─ index.html               Home
├─ menu.html                Full menu with search, cuisine + diet filters
├─ food-board.html          Dietary filters + ingredient customisation modal
├─ cart.html                Cart with quantities
├─ checkout.html            Pickup / dine-in pre-order request
├─ reservation.html         Table reservation request
├─ occasions.html           Festive menus
├─ takeout.html             Legacy alias → checkout
├─ 404.html
├─ assets/
│  ├─ css/style.css         Shared design system (responsive, print, reduced motion)
│  ├─ img/menu/             97 optimised WebP dish images
│  ├─ img/home/             Hero slides
│  ├─ img/occasions/        Festive photography
│  ├─ img/brand/            Favicon + Open Graph image
│  └─ js/
│     ├─ config.js          ← edit this first
│     ├─ menu-data.js       Generated menu data (97 dishes)
│     ├─ site.js            Nav, contact details, toasts, schema.org
│     ├─ cart.js            localStorage cart store
│     ├─ menu-ui.js         Shared dish card component
│     ├─ menu.js            Menu page
│     ├─ food-board.js      Taste Board filters + customisation
│     ├─ cart-page.js       Cart rendering
│     ├─ checkout.js        Order flow
│     ├─ reservation.js     Reservation flow
│     └─ form-utils.js      Validation, mailto, WhatsApp, POST helpers
├─ Home/ Menu/ Cart/ …      Redirect stubs only (legacy URLs)
└─ README.md
```

## Before you go live — 5-minute checklist

All owner-editable values live in **`assets/js/config.js`**.

1. **Restaurant details** - replace the placeholder phone number and address (`restaurant.phone`, `restaurant.address`, `restaurant.mapUrl`). The current phone (`+91 xxxxxxxxxx`) has no digits, so call buttons stay visible but do not dial; entering a real number with 7+ digits turns them into working `tel:` links.
2. **Social links** — fill `socials.instagram` / `facebook` / `x`. Empty entries are hidden automatically.
3. **Order + reservation destination**
   - Set `ordering.endpoint` and `reservation.endpoint` to a form endpoint (e.g. a Formspree form URL) to receive submissions in an inbox/dashboard.
   - Leave them empty to use the built-in **email fallback**: the customer reviews the order and clicks *Email order* / *Email request*. This requires no backend.
   - Optionally set `ordering.whatsapp` / `reservation.whatsapp` to a digits-only number (`919876543210`) to enable WhatsApp ordering.
4. **Domain** — if you move to a custom domain, update `siteUrl`, the canonical/OG tags in each HTML file, `sitemap.xml` and `robots.txt`.
5. **Test a real order + reservation on a phone** (validation, email/WhatsApp hand-off, quantities, customisations).

> `assets/js/config.js` and the meta tags currently point at `https://akanchha1804.github.io/Epicuria/`.

## How the flows work

### Cart
- Stored in `localStorage` under `epicuria.cart.v1` — per device/browser.
- Quantities, per-dish ingredient exclusions and kitchen notes are preserved.
- Header badge updates across tabs.
- No payment is collected. Checkout creates an **order request**.

### Checkout
- Validates contact details, date/time (kitchen hours, minimum 30-minute lead, future date).
- With an endpoint configured: POSTs JSON and shows a confirmation reference.
- Without an endpoint: shows the order review with *Email order*, optional *WhatsApp order*, *Copy details* and *Print*. The customer sends it; the cart stays until they clear it.
- References look like `EP-261020-AB12` and are also saved in `localStorage` (`epicuria.last-order`).

### Reservations
- Validates party size (1–20), opening hours and future date/time.
- Same endpoint-or-email/WhatsApp hand-off. The UI explicitly says this is a **request**, confirmed by the restaurant.
- Reference prefix: `RS-`.

### Taste Board
The filters are generated from the menu data (cuisine, diet, meal, taste, dish type, dining style). Opening a dish lets the customer uncheck negotiable ingredients and add a note. The cart stores the exclusions and notes, and they appear on the cart/checkout summary.

## Editing menu data

`assets/js/menu-data.js` is a plain array exposed as `window.EPICURIA_MENU`. Each item:

```js
{
  id: 54,
  key: "butter-chicken-54",
  name: "Butter Chicken",
  price: 400,
  image: "assets/img/menu/54.webp",
  description: "Chicken, Tomato, Butter, Cream, Ginger, Garlic",
  cuisine: "North Indian",
  variety: "Non-Veg",
  dineTypes: ["Fine Dine", "Street Dine"],
  tastes: ["Savory", "Spicy"],
  meals: ["Everyday Meal", "Festive"],
  types: ["Comfort Food", "Family Meal"],
  mandatory: ["Chicken", "Tomato", "Butter"],
  negotiable: ["Coriander", "Green chili", "Kasuri methi"]
}
```

- Prices are whole rupees (the site formats with `Intl.NumberFormat('en-IN', …INR)`).
- `variety` must be `Veg`, `Vegan` or `Non-Veg` to match the diet filter.
- Images are WebP files (mostly portrait, 720 px tall) displayed with `object-fit: cover` in square cards.
- The 97 dishes were extracted from the original menu page and taste-board data; the original mismatched `addToCart(...)` names/prices (for example every early Italian dish adding "Kung Pao Chicken") are fixed, and duplicate dishes were merged.

## Accessibility & performance notes

- Semantic landmarks, skip link, visible focus styles, labelled controls and `aria-live` result counts.
- Native `<dialog>` for modals with built-in focus trapping/Esc handling.
- Mobile navigation uses a `<button>` with `aria-expanded`, closes on Esc/link/backdrop, and sets `inert` when off-screen.
- Hero slideshow pauses on hover/focus, when the tab is hidden, and does not autoplay with `prefers-reduced-motion`.
- Images use `loading="lazy"` below the fold, explicit dimensions, and WebP (assets total ≈ 7.3 MB; the menu loads 24 cards at a time).
- Print styles for order/reservation confirmations.
- No third-party JavaScript. Only Google Fonts is external; the CSS has system-font fallbacks.

## Known limitations (static site)

- No payment gateway, inventory, delivery-radius calculation or staff dashboard.
- Orders/reservations are **requests** delivered by the configured form endpoint or the customer's email/WhatsApp app; the site cannot confirm them by itself.
- Cart is per-device (no accounts).
- The placeholder contact details must be replaced before launch.

## License / content

Photography and menu copy are from the original Epicuria project. Review image and font licensing before commercial launch.
