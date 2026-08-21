# rank.fish

A hybrid **pay-to-appear** website with two pages:

- **Field (`/`):** full-viewport canvas — badges drift left → right; higher level = bigger, denser, slower
- **Rank (`/rank`):** vertical leaderboard — boost any link, leave a message + optional X handle
- **Payments:** Polar.sh (Merchant of Record)
- **Database:** Neon Postgres + Drizzle ORM

You do **not** need to know how to code. Follow the steps below.

---

## How pricing works (levels)

Bids use a **Lv 1–100 slider**. The dollar range scales with board activity:

| Effective links | Range (Lv 1 → Lv 100) |
|---|---|
| 1–10 | $1 – $100 |
| 11–20 | $2 – $200 |
| 21–30 | $3 – $300 |
| … | tier × $1 – tier × $100 |

**Effective links** = real listings + `floor(total clicks / 100)`.  
Traffic raises the rate: early adopters get the cheap band; more clicks → higher tiers.

Anyone can **boost anytime** and only pays the **difference** above the current bid.

---

## What you need (accounts)

1. A free [Neon](https://neon.tech) account (database)
2. A [Polar.sh](https://polar.sh) account (payments)
3. A [Vercel](https://vercel.com) account (hosting) — your GitHub repo is already connected

---

## Environment variables

Copy these into:

- Local file: `.env.local` (for your computer), **and**
- Vercel → Project → **Settings → Environment Variables**

| Variable | What it is | Where to find it |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string | Neon dashboard → your project → **Connection string** (use the one labeled “pooled” / with `-pooler` if available) |
| `POLAR_ACCESS_TOKEN` | Secret API token for Polar | Polar → **Settings → Developers → Access Tokens** → create one |
| `POLAR_WEBHOOK_SECRET` | Secret used to verify Polar webhooks | Polar → **Settings → Webhooks** → after you create a webhook, copy the signing secret |
| `POLAR_PRODUCT_ID` | ID of a **one-time** product | Polar → **Products** → create a one-time product → copy its ID |
| `POLAR_SERVER` | `sandbox` or `production` | Use `sandbox` while testing, then `production` when live |
| `NEXT_PUBLIC_APP_URL` | Your public site URL | Example: `https://rank.fish` or your Vercel URL `https://your-app.vercel.app` |

### Example `.env.local`

```bash
DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require

POLAR_ACCESS_TOKEN=polar_oat_xxxxxxxx
POLAR_WEBHOOK_SECRET=polar_whs_xxxxxxxx
POLAR_PRODUCT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
POLAR_SERVER=sandbox

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Simple setup steps (do these in order)

### 1) Create the database tables

In the Neon SQL Editor, paste and run the SQL from `drizzle/0000_init.sql`, then `drizzle/0001_boost_messages.sql`.

Or from your computer (after adding `DATABASE_URL` to `.env.local`):

```bash
npm install
npm run db:push
```

### 2) Create a Polar product

1. Open Polar (use **Sandbox** first if you are testing)
2. Create a **one-time** product (any name/price is fine — the app overrides the price per checkout)
3. Copy the product ID into `POLAR_PRODUCT_ID`

### 3) Create a Polar access token

Polar → Settings → Developers → create an access token → paste into `POLAR_ACCESS_TOKEN`.

### 4) Deploy to Vercel

1. Import / connect the `rank-fish` GitHub repo in Vercel
2. Add all environment variables above
3. Deploy

### 5) Add the Polar webhook (important!)

After the site is live:

1. Polar → Settings → Webhooks → **Add endpoint**
2. URL:

```text
https://YOUR_DOMAIN/api/webhooks/polar
```

3. Subscribe at least to:
   - `order.paid`
   - `checkout.updated`
4. Copy the webhook secret into `POLAR_WEBHOOK_SECRET` on Vercel
5. Redeploy once so the new secret is available

Without this webhook, payments can succeed but listings may not appear until the success page runs its backup check.

---

## How the payment flow works (plain English)

1. Someone clicks **Add link** or **Boost**
2. They pick a **level** on the slider (server maps level → dollars from the current tier)
3. Polar opens a checkout page
4. After payment, Polar calls our webhook
5. We create the listing (or raise the bid) and crawl a favicon when possible
6. The field / rank pages refresh

---

## Local development (optional)

```bash
npm install
cp .env.example .env.local
# fill in the values
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For webhooks on localhost, use a tunnel (like ngrok) and point Polar at:

```text
https://YOUR_TUNNEL_URL/api/webhooks/polar
```

---

## Useful scripts

| Command | Meaning |
|---|---|
| `npm run dev` | Start the site locally |
| `npm run build` | Production build check |
| `npm run db:push` | Create/update database tables from the schema |
| `npm run db:studio` | Open a visual database browser |

---

## Project structure (high level)

- `src/app` — pages and API routes
- `src/components` — field, rank, dialogs
- `src/db` — database schema + connection
- `src/lib` — Polar, pricing levels, favicon crawl, validation
- `drizzle/` — SQL migration files you can paste into Neon

---

## Notes

- Bids are stored in **USD cents** (example: `$12.50` → `1250`)
- Clicking a badge / rank link goes through `/api/click` so clicks are counted (and feed the price tier)
- The field scales **size** and **drift speed** from the listing **level** (higher level → bigger, slower). Type tracks the viewport on resize. Each listing picks one of eight pill color themes.
- Badges show a favicon only when one was found — no placeholder circle
- Boosts can include an optional message + X handle, shown under the listing on `/rank`
