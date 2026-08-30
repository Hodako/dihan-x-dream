# BUILD PROMPT: "Dream Fashion" — Full-Stack Fashion E-Commerce Platform (Bangladesh)

Paste this entire document into your AI coding tool (Claude Code, Cursor, v0, etc.) as a single build brief. It specifies a Zara-inspired, trend-forward fashion storefront + a custom admin panel, backed by Firebase and imgbb, with full Bangladesh geo-based delivery logistics.

---

## 1. Project Identity

- **Brand name:** Dream Fashion
- **Tagline direction:** confident, minimal, trend-led — e.g. "Fashion, Now." / "Wear the Trend."
- **Design language:** Zara-inspired — generous white space, large full-bleed editorial photography, thin typographic hierarchy, monochrome base with sharp accent moments, subtle micro-interactions (not playful/cartoonish — sleek and premium).
- **Target device parity:** must look and feel equally polished on mobile (primary traffic) and desktop.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) + TypeScript |
| Styling | Tailwind CSS + CSS variables for theming |
| State | Zustand or React Context for cart/auth/UI state |
| Backend/DB | Firebase Firestore (NoSQL, real-time) |
| Auth | Firebase Authentication (email/password + phone OTP for BD numbers + Google sign-in) |
| Image hosting | imgbb API (product images, banner images, category images) — NOT Firebase Storage, per project requirement |
| Analytics | Firebase Analytics |
| Hosting | Vercel (frontend) — Firebase only used as backend services, not App Hosting |
| Geo data | `bd-geodata` dataset (division → district → sub-district/upazila → union), vendored locally as JSON, not fetched live |

### 2.1 Firebase initialization (use exactly this config)

```javascript
// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBMUSJeg0dXzqLwxmjOh-l4eNuHrSy7BUs",
  authDomain: "dreamfashionbd.firebaseapp.com",
  projectId: "dreamfashionbd",
  storageBucket: "dreamfashionbd.firebasestorage.app",
  messagingSenderId: "233395454592",
  appId: "1:233395454592:web:a4e82a21ac4145d9811c65",
  measurementId: "G-3QW3822P7Z",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export let analytics: ReturnType<typeof getAnalytics> | undefined;
if (typeof window !== "undefined") {
  isSupported().then((ok) => {
    if (ok) analytics = getAnalytics(app);
  });
}
```

> Security note for the implementer: this config is safe to ship client-side (Firebase web config is public by design), but **all write access must be locked down with Firestore Security Rules** keyed to `request.auth.uid` and a `role` field on the user doc (`customer` / `admin` / `staff`). Never trust client-supplied prices, stock counts, or order totals — always recompute and validate order totals in a Cloud Function or server action before marking an order "confirmed."

### 2.2 imgbb image upload (use exactly this key)

```javascript
// lib/imgbb.ts
const IMGBB_API_KEY = "04c0280a69c2c685602a6996bcf038c2";

export async function uploadToImgbb(file: File): Promise<{ url: string; deleteUrl: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error("Image upload failed");
  return { url: data.data.url, deleteUrl: data.data.delete_url };
}
```

- Use this for: product gallery images, product variant swatches, homepage banner slides, category tiles, brand logo, admin-uploaded promo graphics.
- Store only the returned `url` (and `deleteUrl` for later cleanup) inside the relevant Firestore document — Firestore holds all structured data, imgbb holds all binary images.
- All upload UI must show a **progress spinner** on the drop-zone/thumbnail while `uploadToImgbb` is in flight, and a red inline error state with a retry button on failure.

### 2.3 Bangladesh geo data

- Vendor the dataset from `https://github.com/DarkAsfu/bd-geodata` into `/data/bd-geodata/` as static JSON: `divisions.json`, `districts.json`, `upazilas.json`, `unions.json`, each cross-referenced by parent ID.
- Build a `useBdGeo()` hook exposing cascading selectors:
  - Selecting a **Division** filters the **District** dropdown.
  - Selecting a **District** filters the **Upazila/Sub-district** dropdown.
  - Selecting an **Upazila** filters the **Union** dropdown (optional final level; not all addresses require it — allow skipping to a manual "Area/Village + landmark" free-text field).
- Address form fields: Division → District → Upazila → Union (optional) → free-text Area/Road/House → Postal Code (auto-suggested if available in dataset, editable) → Phone (BD format validation, `01XXXXXXXXX`).

---

## 3. Color System (full hex reference)

### 3.1 Storefront palette (Zara-inspired monochrome + one sharp accent)

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#FFFFFF` | Page background |
| `--bg-subtle` | `#F5F4F2` | Section alternation, card backgrounds |
| `--ink-900` | `#0E0E0E` | Primary text, headings, primary buttons |
| `--ink-700` | `#2B2B2B` | Body text |
| `--ink-500` | `#6B6B6B` | Secondary/muted text, placeholder |
| `--ink-300` | `#A8A8A8` | Disabled text |
| `--line-100` | `#ECECEC` | Hairline dividers |
| `--line-200` | `#DEDEDE` | Input borders, card borders |
| `--accent-red` | `#C8102E` | Sale price, discount ribbons, error states |
| `--accent-red-soft` | `#FBE8EA` | Sale badge background |
| `--accent-gold` | `#B8955A` | Premium/"trending" tags, editorial highlight text |
| `--accent-gold-soft` | `#F4ECDD` | Gold badge background |
| `--success` | `#1E7D46` | In-stock, order confirmed, success toasts |
| `--success-soft` | `#E5F4EA` | Success banner background |
| `--warning` | `#B7791F` | Low-stock warning, pending payment |
| `--warning-soft` | `#FBF0DD` | Warning banner background |
| `--overlay-scrim` | `rgba(14,14,14,0.55)` | Modal/drawer/lightbox backdrops |
| `--white` | `#FFFFFF` | Text-on-dark, button labels |

### 3.2 Admin panel palette (distinct from storefront — data-dense, "advanced SaaS" feel)

| Token | Hex | Usage |
|---|---|---|
| `--admin-bg` | `#0B0F19` | Sidebar background (dark mode default) |
| `--admin-bg-elevated` | `#131826` | Cards, panels, table headers |
| `--admin-bg-canvas` | `#F7F8FA` | Main content area background (light) |
| `--admin-border` | `#1F2534` (dark) / `#E4E7EC` (light) | Dividers |
| `--admin-text-primary` | `#F5F6F8` (dark) / `#101828` (light) | Headings |
| `--admin-text-secondary` | `#9AA3B2` (dark) / `#667085` (light) | Labels, meta text |
| `--admin-accent` | `#6C5CE7` | Primary buttons, active nav item, links |
| `--admin-accent-hover` | `#5A48D6` | Hover state |
| `--admin-accent-soft` | `#EFEBFD` | Selected row highlight, active tab background |
| `--admin-success` | `#12B76A` | Delivered/paid status chips |
| `--admin-warning` | `#F79009` | Pending/processing status chips |
| `--admin-danger` | `#F04438` | Cancelled/refunded/failed status chips |
| `--admin-info` | `#2E90FA` | Shipped/in-transit status chips |

### 3.3 Typography

- Headings/wordmark: `"Neue Montreal"`, `"Helvetica Now"`, or fallback `Inter`/`system-ui`, weight 500–700, uppercase for nav/labels with `letter-spacing: 0.06em`.
- Body: `Inter` or `"General Sans"`, weight 400, 15–16px base, 1.55 line-height.
- Admin panel: `Inter` throughout, tighter tracking, 13–14px base for data density.

---

## 4. Storefront — Homepage

### 4.1 Header (sticky, transitions from transparent-over-hero to solid-white on scroll)

- Desktop: logo centered, left = nav links with hover mega-menus (Women / Men / New In / Trending / Sale — adapt categories to your catalog), right = search (expandable), account, wishlist (heart icon w/ count), cart (bag icon w/ count badge in `--accent-red`).
- Mobile: hamburger (left) → slide-in drawer with accordion categories, centered logo, cart icon (right).
- Cart icon opens a right-side slide-in drawer (line items, qty steppers, subtotal, sticky "Checkout" CTA in `--ink-900`).

### 4.2 Hero — **slideable image carousel** (replaces video banner)

- Full-bleed hero, 80–90vh desktop / 55–65vh mobile, **image slider** (not video): 3–5 high-fashion lifestyle images, admin-managed (uploaded via imgbb, ordered/reordered in admin panel).
- Auto-advance every 5s, pause on hover/touch; swipeable on mobile (`scroll-snap-type: x mandatory`); small dot indicators bottom-center (active dot = `--ink-900`/white depending on image contrast).
- Each slide supports: headline text overlay, subtext, CTA button, and a target link (admin-configurable per slide) — all optional per slide.
- Ken Burns-style slow zoom (`transform: scale(1.0 → 1.06)` over the slide duration) for a premium editorial feel.

### 4.3 Trending strip

- Horizontal scroll-snap row of circular or rounded-square category tiles ("New In", "Dresses", "Outerwear", "Denim", "Accessories", "Sale") each with a small image + label — mimics Zara/Instagram-story-style quick nav. Skeleton-shimmer placeholder while tile images load.

### 4.4 "New Arrivals" & "Trending Now" — horizontal scroll-snap product rails

- Same product card component reused across the whole site (see §6).
- Section header includes a "View All →" link, right-aligned on desktop.
- Left/right nav arrows appear on hover (desktop), pure swipe on mobile, with a thin scroll-progress bar under the rail instead of dots (more Zara-like than dot pagination).

### 4.5 Editorial lookbook block

- 2-up or asymmetric image grid (one large image + two stacked smaller ones) styled like a fashion lookbook spread, each image clickable through to a curated collection page. Admin can upload/replace these via imgbb.

### 4.6 Best Sellers grid (static, not scrolling)

- `grid-cols-2` mobile → `grid-cols-4` desktop, standard product cards.

### 4.7 Promotional/Sale banner

- Full-width colored band, bold headline, countdown-timer component (reuse the PDP countdown pattern) if it's a flash sale, CTA button.

### 4.8 Trust row

- 3–4 column icon row: Free Delivery over ৳X / Cash on Delivery Available / Easy 7-Day Exchange / Nationwide Shipping — icons in `--ink-900`, short label + 1-line description.

### 4.9 Newsletter + Footer

- Multi-column footer (collapsible accordions on mobile): Shop links, Help/Policy links, Company, Social icons, Newsletter email capture with imgbb-hosted small brand mark, payment method icons row, copyright line.

---

## 5. Storefront — Product Listing / Collection Page

- Left sidebar filters (desktop) / bottom-sheet filter drawer (mobile): Category, Size, Color (swatch chips using actual hex from product data), Price range slider, Sort dropdown (Newest / Price ↑↓ / Popularity).
- Grid: `grid-cols-2` mobile, `grid-cols-3` tablet, `grid-cols-4` desktop.
- Infinite scroll or "Load more" button with a centered spinner while fetching the next Firestore page (`startAfter` cursor pagination).
- Active filter chips row above the grid, each removable with an "×".

---

## 6. Shared Product Card Component

- 3:4 image, hover cross-fade to second image (desktop), skeleton shimmer while loading.
- Quick-add "+" circular button bottom-right on image hover (desktop) → opens a mini size-picker popover without leaving the page; shows a spinner on the button while adding to cart, then a checkmark pulse.
- Wishlist heart icon top-right of image, toggles filled/outline, optimistic UI update.
- Title (2-line clamp), price row (strike-through regular + red sale price when discounted), color-swatch dots row beneath price if the product has color variants, small "New" or "Trending" tag chip (`--accent-gold-soft` bg) top-left when flagged by admin.
- "Sold out" state: image slightly desaturated (`filter: grayscale(30%)`), badge overlay, card still clickable.

---

## 7. Storefront — Product Detail Page (PDP)

Same structural pattern as a standard Shopify-style PDP, adapted:

- **Gallery:** vertical thumbnail rail (desktop) / swipeable carousel (mobile), full-screen lightbox on click, pinch-zoom on mobile.
- **Info panel (sticky on desktop):** vendor label, title, price block, color swatches (real color chips, selecting one swaps the gallery images to that color's set), size selector with sold-out states struck through, quantity stepper, **Add to Cart** button with the border-spinner loading state described below, wishlist button, short description, expandable accordions (Fabric & Care, Size Guide table, Shipping & Returns), urgency microcopy (stock count, live countdown to same-day dispatch cutoff), trust strip, share row.
- **Reviews section:** star rating summary + histogram bar chart, individual review cards with reviewer name/date/verified-purchase badge, "Write a review" button (auth required).
- **"Complete the Look" / "You may also like":** horizontal product rail reusing §6 card.

### 7.1 Spinner component (used everywhere: add-to-cart, image upload, checkout submit, filters loading, infinite scroll)

```css
.df-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: df-spin 0.7s linear infinite;
}
.df-spinner--dark {
  border: 2px solid rgba(14,14,14,0.15);
  border-top-color: var(--ink-900);
}
@keyframes df-spin { to { transform: rotate(360deg); } }
```

- On dark buttons (`--ink-900` bg): use `.df-spinner` (white).
- On light surfaces (page loaders, admin tables): use `.df-spinner--dark`.
- Full-page transitions (route change, initial catalog load): a slim top progress bar (`--admin-accent` on admin, `--ink-900` on storefront) rather than a full-page spinner, for a more premium feel.

---

## 8. Checkout Flow & Delivery/Payment Logistics

### 8.1 Address step

- Cascading BD geo selectors (Division → District → Upazila → Union) from §2.3, plus free-text detail line, postal code, phone (OTP-verifiable via Firebase Auth phone provider), and a "Save this address" toggle for logged-in users (stored in `users/{uid}/addresses`).

### 8.2 Delivery charge computation (admin-configurable)

Admin can choose one of two delivery-pricing modes globally, and additionally override per area:

1. **Global flat mode:** one delivery charge for "Inside Dhaka" and one for "Outside Dhaka" (or fully flat nationwide) — admin sets these two numbers in Settings.
2. **Area-based mode:** admin defines charges keyed to geo levels — e.g. a specific Division/District can have its own override, falling back to the global default if unset. Store as a Firestore collection `deliveryZones` with documents like:

```json
{
  "id": "dhaka-city",
  "type": "district",
  "divisionId": "dhaka",
  "districtId": "dhaka",
  "charge": 60,
  "estimatedDays": "1-2"
}
```

- Resolution order at checkout: exact **union** override → **upazila** override → **district** override → **division** override → **global default**. Show the resolved delivery fee live as the customer completes the address form, with a small spinner while it (re)computes after each selection.
- Admin Settings page must expose: global default charges, a searchable table of zone overrides (add/edit/delete rows using the same cascading Division→District→Upazila→Union pickers), and a toggle for which mode is currently active.

### 8.3 Payment method selection (three options, radio-card style)

1. **Full Cash on Delivery** — customer pays the entire order total (items + delivery) to the courier on arrival. No online payment step; order is created with `paymentStatus: "cod_pending"`.
2. **Partial Payment (Advance + COD)** — customer pays a small advance online now (admin-configurable: fixed amount, e.g. ৳100, or a percentage of order total) to confirm the order, and pays the remainder in cash on delivery. Order stores `advancePaid`, `remainingDue`, `paymentStatus: "partial_paid"`.
3. **Full Payment Online** — customer pays the entire order total upfront via an online payment gateway (e.g. bKash/Nagad/card — integrate via a payment aggregator like SSLCommerz, which is the common BD choice; scaffold the integration point clearly even if you stub the actual gateway call). Order stores `paymentStatus: "paid"`.

- Each radio card shows an icon, title, one-line description, and dynamically updates the order summary's "Due now" vs "Due on delivery" split.
- Admin Settings → Payments page lets the admin: toggle each of the 3 methods on/off storefront-wide, set the advance amount/percentage for partial payment, and (later) plug in gateway credentials.
- Order confirmation screen and confirmation email/SMS must clearly restate: amount paid now, amount due on delivery, and expected delivery window from the resolved zone's `estimatedDays`.

### 8.4 Order review + place order

- Full order summary card: line items, subtotal, delivery fee (from §8.2), discount/coupon field (validate against a `coupons` Firestore collection), grand total, due-now/due-later split.
- "Place Order" button uses the same spinner pattern; on success, redirect to an order-confirmation page with order number, and write the order doc transactionally (decrement stock, clear cart) via a Firestore transaction or Cloud Function to avoid race conditions on low-stock items.

---

## 9. Firestore Data Model (collections)

```
users/{uid}                – { name, phone, email, role, addresses: [...] }
products/{productId}       – { title, slug, description, brand, category, tags[],
                                basePrice, salePrice, isTrending, isNew, status,
                                variants: [{ color, colorHex, size, sku, stock, images:[imgbbUrl] }],
                                createdAt, updatedAt }
categories/{categoryId}    – { name, slug, parentId, imageUrl, order }
banners/{bannerId}         – { imageUrl, headline, subtext, ctaText, ctaLink, order, active }
orders/{orderId}           – { userId, items:[...], address, deliveryZoneId, deliveryCharge,
                                paymentMethod, paymentStatus, advancePaid, remainingDue,
                                subtotal, discount, grandTotal, status, timeline:[...], createdAt }
deliveryZones/{zoneId}     – { type, divisionId, districtId, upazilaId, unionId, charge, estimatedDays }
settings/logistics         – { mode: "global"|"area", globalInsideDhaka, globalOutsideDhaka,
                                paymentMethods: { cod:true, partial:true, full:true },
                                partialAdvanceType: "fixed"|"percent", partialAdvanceValue }
coupons/{couponId}         – { code, type, value, minOrder, expiresAt, usageLimit, usedCount }
reviews/{reviewId}         – { productId, userId, rating, comment, verifiedPurchase, createdAt }
wishlists/{uid}            – { productIds: [...] }
```

---

## 10. Custom Admin Panel

Route-protected under `/admin/*`, guarded by `role === "admin"` check (server-side, not just client-side hiding).

### 10.1 Layout
- Fixed dark sidebar (`--admin-bg`) with icon+label nav: Dashboard, Products, Orders, Customers, Banners/Homepage, Delivery Zones, Coupons, Reviews, Settings.
- Top bar: search, notifications bell, admin profile menu.
- Main canvas (`--admin-bg-canvas`), card-based sections with soft shadows, data tables with sticky headers, sortable columns, pagination.

### 10.2 Dashboard
- KPI cards: Today's Orders, Revenue (with sparkline), Pending COD collections, Low-stock alerts.
- Order status funnel chart and a recent-orders table.

### 10.3 Products
- Table view + "Add Product" form: title, category, description, variant builder (color/size/stock matrix), price/sale price, **drag-and-drop image uploader wired to `uploadToImgbb`** with per-image upload progress spinners and reordering, trending/new toggles, publish/draft status.

### 10.4 Orders
- Table with filters (status, payment method, date range), status chips using the admin status colors from §3.2, click-through to an order detail page showing timeline, customer, address, payment breakdown (paid now vs due), and manual status-update controls (Processing → Shipped → Delivered / Cancelled / Returned).

### 10.5 Delivery / Logistics Settings (per §8.2–8.3)
- Mode toggle (Global vs Area-based), global charge inputs, zone-override table with cascading BD geo pickers to add new overrides, payment-method toggles, partial-advance configuration.

### 10.6 Banners/Homepage
- Manage hero slider images (upload via imgbb, drag-to-reorder, headline/CTA fields, active toggle), manage trending strip tiles, manage lookbook block images.

### 10.7 Customers, Coupons, Reviews
- Standard CRUD tables: customers (view profile/order history), coupons (create/edit/expire), reviews (approve/hide moderation queue).

---

## 11. Motion, Accessibility & Performance

- Respect `prefers-reduced-motion`: disable Ken Burns zoom, shakes, and slide transitions, replacing with instant/fade-only changes.
- All interactive controls keyboard-navigable with visible focus rings (`outline: 2px solid var(--admin-accent)` or `--ink-900` depending on surface).
- Images: `next/image` with blur placeholder, lazy-loaded below the fold, eager for the hero's first slide only.
- Firestore reads: paginate everything (products, orders), never fetch unbounded collections client-side.
- All monetary values stored as integers (paisa/smallest unit) or clearly documented as BDT decimals — pick one convention and apply it everywhere to avoid rounding bugs in delivery-charge + discount + advance-payment math.

---

## 12. Deliverable Checklist

- [ ] Firebase app initialized with the provided config; Firestore + Auth wired up
- [ ] imgbb upload utility used for all product/banner/category images, with progress spinners
- [ ] BD geodata vendored + cascading Division→District→Upazila→Union selector hook
- [ ] Homepage: image-slider hero (not video), trending strip, scroll-snap rails, lookbook block, best-sellers grid, promo/countdown banner, trust row, footer
- [ ] Full color tokens from §3 applied consistently (storefront palette + separate admin palette)
- [ ] Reusable product card with hover cross-fade, quick-add spinner, wishlist toggle
- [ ] PDP with gallery, variant/size selection, spinner-driven add-to-cart, countdown urgency block, reviews
- [ ] Checkout: cascading address form, live delivery-fee resolution (zone override chain), 3-way payment method selector with due-now/due-later split
- [ ] Firestore data model per §9 implemented with security rules restricting writes by role
- [ ] Admin panel: dashboard, products (with imgbb uploader), orders, delivery-zone/logistics settings (global or area-based, admin-editable), banners/homepage manager, coupons, reviews moderation
- [ ] Spinners/skeletons used consistently across all async actions (uploads, cart actions, pagination, checkout submission, filter changes)
- [ ] Reduced-motion and keyboard-accessibility fallbacks in place

---

**Security reminder for whoever implements this:** the Firebase config and imgbb key above are meant to be embedded in your own client bundle for *your* project (`dreamfashionbd`) — that's normal for Firebase web apps and imgbb's client-key model. Still, lock down Firestore Security Rules by role, validate all order totals and stock decrements server-side/in a transaction, and never expose an admin-only write path to unauthenticated or non-admin users.
