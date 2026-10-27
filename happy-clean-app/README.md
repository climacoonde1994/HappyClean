# Happy Clean website

Angular 20 storefront for Happy Clean dishwashing liquid and liquid handsoap. Customers choose products, enter their details and place an order. A Vercel serverless function emails each order to the store.

## Pages

| Path | What it does |
| --- | --- |
| `/` | Home: price list, products with star ratings, why Happy Clean, reviews, contact |
| `/order` | Step 1: choose products and quantities |
| `/checkout` | Step 2: contact details, delivery or pick-up, date, payment, notes |
| `/order/HC-…` | Step 3: confirmation with order number |

## Run it on your computer

You need Node.js 20.19+ or 22.12+ (https://nodejs.org).

```bash
npm install
npm start
```

Then open http://localhost:4200. The `/api/orders` function doesn't run under `npm start`. Orders still go through, and the confirmation page asks the customer to send the order by text or email. To test the real email flow locally, use `npx vercel dev`.

## Deploy to Vercel

1. Put this folder in a GitHub repository (or use the Vercel CLI: `npx vercel`).
2. In Vercel, click **Add New → Project** and import the repository. The settings come from `vercel.json`, so you don't need to change anything.
3. Turn on order emails (recommended):
   1. Create a free account at https://resend.com **using happyclean.info.ph@gmail.com**. Resend's test sender only delivers to the email you signed up with.
   2. Create an API key.
   3. In Vercel, open **Project → Settings → Environment Variables**, add `RESEND_API_KEY` with your key, then redeploy.
4. Optional variables:
   - `ORDER_TO_EMAIL`: where orders are sent. Default: happyclean.info.ph@gmail.com
   - `ORDER_FROM_EMAIL`: the sender. Default: `Happy Clean Orders <onboarding@resend.dev>`. Once you own a domain, verify it in Resend and use something like `orders@happyclean.ph`.

Without `RESEND_API_KEY` the site still works. Customers get an order number and a ready-made message to text or email you, so no order is silently lost.

## Everyday edits

| To change | Edit |
| --- | --- |
| Phone, email, Facebook link | `src/app/data/store.ts` |
| Products, prices, stock | `src/config/products.json` (see below). The website and the order server both read it. |
| Reviews and star ratings | `src/config/reviews.json` (see below) |
| Product photos, mascot, QR code | `public/images/` |
| Colors and fonts | `src/styles.css` |

Commit and push, and Vercel redeploys automatically.

## Adding or changing products

Products live in **`src/config/products.json`**. They appear on the site in the same order as in the file. The price list, product cards, order page, checkout and order emails all use this file. The server checks every order total against it, so customers can't change prices.

To add a product:

1. Save the product photo in `public/images/`, e.g. `public/images/lavender.webp`. A bottle on a transparent or white background looks best, about 500–900 px tall.
2. Copy a product block in `products.json`, paste it where you want it in the list, and change the values. Put a comma between blocks:

```json
    {
      "id": "lavender-handsoap",
      "name": "Liquid Handsoap",
      "scent": "Lavender",
      "category": "Handsoap",
      "size": "1 L",
      "unit": "bottle",
      "price": 65,
      "image": "images/lavender.webp",
      "color": "#9b7fd1",
      "features": ["Kills 99.9% of germs", "Gentle on hands", "Calming lavender scent"],
      "inStock": true
    }
```

| Field | What to put |
| --- | --- |
| `id` | Short unique code: lowercase letters, numbers and dashes, e.g. `lavender-handsoap`. Reviews use it to point to the product. Don't change it after customers have ordered or reviewed the product. |
| `name` | Product name, e.g. `Liquid Handsoap` |
| `scent` | Scent or variant, e.g. `Lavender` |
| `category` | Small label on the photo, e.g. `Dishwashing`, `Handsoap`, `Laundry` |
| `size` | Size badge, e.g. `3.8 L` or `1 L` |
| `unit` | What the price is per, e.g. `gallon`, `bottle`, `pack` |
| `price` | Pesos, numbers only, no ₱ sign or quotes, e.g. `65` |
| `image` | Path to the photo, starting with `images/` |
| `color` | Hex color for the scent dot and photo background, e.g. `#9b7fd1`. Search "color picker" on Google to find one. |
| `features` | 1 to 6 short selling points, each in quotes, separated by commas |
| `inStock` | `true` normally. Set to `false` to show "Out of stock" and block orders without deleting the product. |

To remove a product for good, delete its block. Check that no review in `reviews.json` still uses its `id`; if one does, that review is skipped.

When prices differ between products, the site switches from "₱140 per gallon on every product" to "prices from ₱…" by itself.

## Adding customer reviews

Reviews live in **`src/config/reviews.json`**. Star averages and review counts on the site are calculated from this file automatically.

To add a review, copy a block, paste it at the top of the list, and change the values. Put a comma between blocks, but not after the last one:

```json
{
  "$schema": "./reviews.schema.json",
  "reviews": [
    {
      "product": "calamansi",
      "stars": 5,
      "name": "Maria S.",
      "city": "Batangas City",
      "date": "2026-10-27",
      "text": "Smells fresh and a little goes a long way."
    },
    {
      "product": "lemon",
      "stars": 5,
      "name": "Reggie",
      "city": "",
      "date": "",
      "text": "Great value for the price. It cuts through grease and removes dirt easily."
    }
  ]
}
```

| Field | What to put |
| --- | --- |
| `product` | The product's `id` from `products.json`, e.g. `lemon`, `calamansi` or `apple` |
| `stars` | Whole number 1 to 5 |
| `name` | Customer name as shown, e.g. `Maria S.` |
| `city` | Optional. Leave `""` to hide |
| `date` | Optional, format `YYYY-MM-DD`. Leave `""` to hide |
| `text` | The review, in English |

Tips (these apply to `products.json` too):
- Open the file in VS Code. It checks your entries as you type, using `reviews.schema.json`, and underlines mistakes in red.
- If an entry has a mistake, the site skips only that review and explains why in the browser console. Use F12 → Console to see it.
- If the build fails after editing, the JSON is usually missing a comma or quote. Paste the file into https://jsonlint.com to find the line.
- Only add reviews customers actually gave you.

Save the file, commit and push, and Vercel redeploys with the new reviews.

## Project layout

```
api/orders.ts               Vercel function: validates the order, recalculates totals from products.json, emails the store
public/                     favicon, mascot, product photos, QR code
src/config/products.json    products, prices and stock (edit this to add products)
src/config/reviews.json     customer reviews (edit this to add reviews)
src/config/*.schema.json    rules VS Code uses to check the two files above
src/app/data/               store details, plus loaders that check products.json and reviews.json
src/app/services/           cart (saved in the browser), orders, toasts
src/app/components/         header, footer, stars, quantity stepper, order steps
src/app/pages/              home, order, checkout, confirmation
vercel.json                 build settings and page routing for Vercel
```
