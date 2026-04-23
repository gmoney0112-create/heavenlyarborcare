# Heavenly Arbor Care — Portal Deployment Checklist

Next.js 14 estimate portal. Complete these steps in order before going live.

---

## Step 1 — Supabase Setup

1. Go to https://supabase.com and open project `horqwtdcsfynbjhxbsrv`
   (or create a new project if starting fresh)
2. In the SQL Editor, run **in order**:
   - `supabase/001_initial_schema.sql`
   - `supabase/002_fix_rls.sql`
3. From **Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Stripe Setup

1. Go to https://dashboard.stripe.com/apikeys
2. Copy the **Secret key** (starts with `sk_live_`) → `STRIPE_SECRET_KEY`
3. Go to **Developers → Webhooks → Add endpoint**
   - URL: `https://portal.heavenlyarbor.com/api/webhooks/stripe`
   - Event: `checkout.session.completed`
4. Copy the **Signing secret** (starts with `whsec_`) → `STRIPE_WEBHOOK_SECRET`

---

## Step 3 — GoHighLevel Setup

1. In GHL go to **Settings → Integrations → API Keys**
2. Copy your API Key → `GHL_API_KEY`
3. Copy your Location ID → `GHL_LOCATION_ID`

---

## Step 4 — Google Review Link

1. Go to https://business.google.com → your Heavenly Arbor Care listing
2. Click **Get more reviews** → copy the short review URL
3. Paste into → `GOOGLE_REVIEW_LINK`

---

## Step 5 — Deploy to Railway

1. Go to https://railway.app → New Project → Deploy from GitHub Repo
2. Select `gmoney0112-create/heavenlyarborcare`
3. Add all environment variables from `.env.example` with real values:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_BASE_URL=https://portal.heavenlyarbor.com
GHL_API_KEY=
GHL_LOCATION_ID=
NEXT_PUBLIC_PHONE_NUMBER=(210) 815-5498
GOOGLE_REVIEW_LINK=
```

4. Railway will auto-detect Next.js and run `npm run build` + `npm start`
5. Set custom domain: `portal.heavenlyarbor.com` → point DNS CNAME to Railway domain

---

## Step 6 — Smoke Test

- [ ] Visit `https://portal.heavenlyarbor.com` — page loads
- [ ] n8n POST to `/api/estimates/create` — returns `portal_url`
- [ ] Open portal URL — estimate page loads
- [ ] Click "Approve & Pay" — Stripe checkout launches
- [ ] Complete test payment (`4242 4242 4242 4242`) — redirects to success page
- [ ] Pick service date — GHL SMS fires
- [ ] Admin login at `/admin` — dashboard shows estimate
- [ ] Mark job complete — GHL review request SMS fires

---

## Notes

- Admin login uses Supabase Auth — create your admin user at:
  `https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users`
- The `NEXT_PUBLIC_BASE_URL` must match the deployed domain exactly (no trailing slash)
- Stripe webhook must be updated if domain changes
