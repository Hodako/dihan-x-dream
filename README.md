# dihan-x-dream

## Dream Fashion Bangladesh (DF-X)

A modern, high-performance, full-stack fashion e-commerce storefront for Bangladesh built with Next.js 14, Tailwind CSS, TypeScript, Firebase Firestore, bKash Payment Gateway, and Steadfast Courier API.

---

### 🌟 Key Features

1. **Next.js 14 & Tailwind CSS Storefront:**
   - Responsive mobile-first design with bottom drawer, dynamic headers, and category navigation.
   - Rich product rails, lookbook editorial sections, and 4-column trending fashion tiles.
   - Instant live search modal and animated toast notifications.

2. **bKash Tokenized Checkout Payment Gateway:**
   - Full Payment & Partial Advance (Pay delivery charge via bKash, remaining on delivery).
   - Cash on Delivery (COD).

3. **Steadfast Courier API Integration:**
   - 1-click parcel generation directly from Admin Orders to Steadfast Courier.
   - Automated COD amount calculation and tracking link generation (`https://steadfast.com.bd/t/:tracking_code`).
   - Live courier wallet balance lookup and dispatch status management.

4. **Lucky Spin-to-Win Wheel:**
   - Daily 3-spin quota per user.
   - Dynamic slices with discount caps and "Try Again" slices.
   - Full Admin Spinner CMS (`/admin/spinner`).

5. **Theme & UI Customizer (`/admin/theme`):**
   - Live palette presets (*Dream Noir*, *Crimson Elegance*, *Emerald Royal*, *Sapphire Modern*, *Minimalist Slate*).
   - Custom hex color builder with live interactive storefront preview card.

6. **Complete Admin CMS Center (`/admin`):**
   - Products CMS with multiple image uploads to ImgBB CDN and variant management.
   - Categories & Top Header Navigation manager.
   - Banners, 2nd Grids, and Lookbook CMS.
   - Order tracking and fulfillment inspector.
   - Coupons and Promo Engine.

---

### 🚀 Getting Started

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Run Local Development Server
```bash
npm run dev
# or
npm start
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

#### 3. Production Build & Deployment

##### Deploy to Vercel:
Push this repository to GitHub and connect it to Vercel. Provide environment variables in Vercel Project Settings:
- `STEADFAST_API_KEY`: `iinibtkjqm3kpsgfshtsrcushxkngusu`
- `STEADFAST_SECRET_KEY`: `pk80ijvyno2jotz9xvdze1my`
- `STEADFAST_BASE_URL`: `https://portal.packzy.com/api/v1`
- `IMGBB_API_KEY`: `04c0280a69c2c685602a6996bcf038c2`
- `NEXT_PUBLIC_IMGBB_API_KEY`: `04c0280a69c2c685602a6996bcf038c2`
- All `NEXT_PUBLIC_FIREBASE_*` credentials (see `.env.example`).

##### Deploy to Firebase:
```bash
npm run build
firebase deploy --only hosting,firestore
```

---

### 👨‍💻 Created with ❤️ by Azizul Hakim Khan
- **Facebook:** [https://facebook.com/hodako17](https://facebook.com/hodako17)
- **Live Firebase Domain:** [https://dreamfashionbd.web.app](https://dreamfashionbd.web.app)
