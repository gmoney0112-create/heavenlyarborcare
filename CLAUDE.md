# Heavenly Arbor Care Services — Portal

Next.js 14 customer-facing estimate portal for a San Antonio tree care company.
Customers receive a unique link, view a video estimate, pay a 50% deposit via Stripe,
then pick a service date. GoHighLevel (GHL) sends SMS/email at every step.

## Architecture

```
n8n  →  POST /api/estimates/create  →  Supabase (estimates table)
                                    →  returns portal_url to n8n
                                    →  n8n sends SMS with link to customer

Customer visits /estimate/[id]
  → views estimate + video
  → clicks "Approve & Pay"  →  POST /api/checkout  →  Stripe session
  → Stripe redirect success  →  /estimate/[id]/success
  → picks service date  →  POST /api/estimates/[id]/schedule
  → GHL sends SMS + email confirmation

Admin marks job complete  →  POST /api/jobs/[id]/complete
  → GHL sends review request SMS + email
```

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** — Postgres DB + Auth (admin login)
- **Stripe** — checkout sessions + webhooks
- **GoHighLevel (GHL)** — SMS + email via LeadConnector API
- **Tailwind CSS** — green-900 primary color scheme

## Required Environment Variables

Copy `.env.example` → `.env.local` and fill in all values before running.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_BASE_URL          # e.g. https://portal.heavenlyarbor.com
GHL_API_KEY
GHL_LOCATION_ID
GOOGLE_REVIEW_LINK            # optional, falls back to placeholder
NEXT_PUBLIC_PHONE_NUMBER      # displayed business phone e.g. (210) 815-5498
```

## Database Setup

Run `supabase/001_initial_schema.sql` then `supabase/002_fix_rls.sql` in the
Supabase SQL editor (project: horqwtdcsfynbjhxbsrv).

## Key Files

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client (anon) + admin (service role) |
| `lib/stripe.ts` | Stripe SDK instance |
| `lib/ghl.ts` | GoHighLevel SMS + email via LeadConnector API |
| `lib/constants.ts` | Business phone, name, city — single source of truth |
| `app/api/estimates/create/route.ts` | Called by n8n to create estimate record |
| `app/api/checkout/route.ts` | Creates Stripe checkout session |
| `app/api/webhooks/stripe/route.ts` | Handles Stripe deposit confirmation |
| `app/api/estimates/[id]/schedule/route.ts` | Customer picks service date |
| `app/api/jobs/[id]/complete/route.ts` | Admin marks job done, triggers review request |
| `app/api/auth/signout/route.ts` | Admin sign-out |
| `app/admin/page.tsx` | Admin dashboard — list/manage all estimates |
| `app/estimate/[id]/page.tsx` | Customer estimate portal |

## Stripe Webhook Setup

In Stripe dashboard, point webhook to:
`https://YOUR_DOMAIN/api/webhooks/stripe`

Events to enable: `checkout.session.completed`

Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

## Admin Access

1. Create a user in Supabase Auth dashboard with admin email
2. Navigate to `/admin/login`
3. Sign in with Supabase email/password

## Known Remaining Items (post-MVP)

- RLS policies are intentionally permissive (UUID = secret link = auth for customers).
  Consider adding row-level IP logging for audit trail if needed.
- No reminder SMS (day-before service). Add a cron job or n8n scheduled workflow.
- No crew assignment UI in admin — `crew_assigned` field exists in DB but unused.
- Home page (`/`) is a redirect to admin login — add public marketing page if needed.
- Phone number `NEXT_PUBLIC_PHONE_NUMBER` in `.env.local` must be set to real business number.
- `GOOGLE_REVIEW_LINK` must be set to real Google Business review link.
