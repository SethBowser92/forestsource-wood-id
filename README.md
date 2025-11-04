<p align="center">
  <img src="public/logo.svg" alt="GrainScout" width="420" />
  <br/>
  <b>Know your wood.</b>
</p>

# GrainScout — Wood ID by ForestSource

A full-stack wood species identification app:
- Next.js (App Router) on Vercel
- Supabase (DB, Auth, Storage, Edge Function)
- Stripe (subscriptions: monthly/annual, coupons)
- Hugging Face Inference API (model)
- Admin importer from Airtable → Supabase Storage

## Quick start

```bash
npm i
npm run dev
```

### Required environment variables
Copy `.env.example` → `.env.local` and fill in values (also add them in Vercel Project settings).

### Deploy steps
1. Create project in **Supabase**, run SQL migrations in `supabase/migrations/` in order.
2. Set Supabase Edge Function secrets and deploy `identify-wood` (see below).
3. Create **Stripe** prices (monthly + annual), set env, add webhook.
4. Import repo in **Vercel**, add env vars, deploy.
5. Sign in as `ADMIN_EMAIL` → `/admin/species` → import images from Airtable.

See `scripts/` for Airtable import and dataset registration helpers.


## Branding
**Product name:** GrainScout  
**Public URL (recommended):** https://grainscout.forestsource.io  
(You can point your DNS subdomain to Vercel.)



## Observability (optional)
- Add `@sentry/nextjs`, then wire `sentry.client.ts` and `sentry.server.ts`. Set `SENTRY_DSN`, `SENTRY_ENV`.
- Minimal metrics: count identifications, cache hits, and HF errors via Vercel logs or Supabase views.


## New features
- **/account** page with Stripe **Customer Portal**.
- **Rate limiting** on `/api/identify`: max 3 req / 10s per user/IP (in addition to monthly quota).
- **Pro** users see **Top-5** predictions; Free sees Top-3.
- **Species pages** now render verified images by type (thumbnail, banner, grain, endgrain, tree, leaves, product).
- **Pricing variant flag**: set `NEXT_PUBLIC_PRICING_VARIANT=B` to emphasize annual plan first.
- **Postman** collection/environment updated.


## Added in this drop
- **Account nav** and Stripe **Customer Portal** link
- **Sentry** wiring: `@sentry/nextjs`, `next.config.mjs` wrapper, CI release workflow (set repo secrets: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`)
- **Similar species** section via `/api/species/similar` (alias-token overlap heuristic)
