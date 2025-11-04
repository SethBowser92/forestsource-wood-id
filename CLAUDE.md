# CLAUDE.md — GrainScout (Wood ID by ForestSource)

You are an autonomous code assistant tasked to **stand up, wire, and ship** the GrainScout web app. Your job is to take the provided repo bundle, publish it, configure cloud services, and validate an end‑to‑end path: **upload image → identify → upsell → checkout → Pro features**.

---

## Product Overview (One-Pager)
**Product name:** GrainScout — Wood ID by ForestSource  
**Goal:** Identify wood species from a single photo; show top predictions, connect to verified species data, and monetize via subscriptions.  
**Users:** Hobbyists, woodworkers, retailers, sawmills.  
**Core value:** Fast, credible suggestions with simple UI and clear upsell to Pro.

### Problem Hypothesis
- Users can’t easily distinguish similar species from photos (grain/endgrain).  
- They need a quick shortlist, references, and confidence levels.  
- Will pay for unlimited use, history, and exports if the UX is seamless.

### Success Metrics
- p50 inference latency < 4s, p95 < 8s
- Conversion: free→Pro ≥ 5% at 30-day mark
- Model Top-3 accuracy ≥ 85% on verified test set

---

## PRD (Product Requirements Document)

### MVP Scope
1) **Upload & Identify**
   - Upload image (mobile-friendly).  
   - Return **Top-3** predictions with confidence bars.
   - Canonicalize labels to **verified species** + aliases.
   - Cache by image SHA-256 to avoid re-billing.
2) **Auth**
   - Email magic-link with Supabase Auth.
3) **Quota & Monetization**
   - Free: 10 identifications per month.
   - Pro: unlimited* (with fair use). Stripe Checkout (monthly/annual), coupons, webhook sync.
   - Upsell nudges when remaining ≤ 3 and hard paywall at 0.
4) **Species CMS**
   - `species`, `species_aliases`, `species_images` (thumbnails, banners, grain, endgrain, tree, leaves, product).
   - Admin import from Airtable into Supabase Storage + DB.
5) **Feedback Loop**
   - “Was this correct?” with optional correction to canonical species.
6) **History**
   - User’s last 100 identifications.

### Out of Scope (for MVP)
- Native iOS/Android app
- Advanced batches > 5 images at once
- On-device inference / offline

### Non-Functional
- Privacy: keep uploaded images unlisted, store only hashes and minimal logs.
- Reliability: graceful errors; never expose tokens to client.
- Observability: minimal logs; Sentry optional.

---

## Architecture

**Frontend:** Next.js 14 (App Router) on Vercel.  
**Auth/DB/Storage:** Supabase.  
**Inference:** Hugging Face Inference API (model hosted in your HF repo).  
**Payments:** Stripe Checkout + Webhook → `subscriptions` table.  
**Admin:** Next route to pull Airtable attachments → Supabase Storage + DB rows.

```
Next.js (Vercel) ──→ Supabase Edge Function (identify-wood) ──→ HF Inference API
      │                     │    ↑                                     │
      │                     │    └─ Supabase (quota/cache/species map) │
      └─ Stripe Checkout ←─┴───────────────────────────────────────────┘
```

---

## Repositories & Assets

- **Repo name:** `forestsource-wood-id` (public).  
- **Weights/Model:** pushed to `huggingface.co/<you>/wood-species-classifier`.  
- **Dataset:** stays in Google Drive / R2; **not** committed.  
- **Artifacts:** saved to Drive during training; app only needs the HF endpoint.

---

## Implementation Guide (Step-by-Step)

### 1) Unpack & Initialize GitHub
```bash
unzip grainscout-wood-id.zip -d forestsource-wood-id
cd forestsource-wood-id

git init
git add .
git commit -m "init: GrainScout (Next.js + Supabase + Stripe + HF + Admin)"
# preferred:
gh repo create forestsource-wood-id --public --source=. --remote=origin --push
# fallback:
# git remote add origin https://github.com/<me>/forestsource-wood-id.git
# git branch -M main && git push -u origin main
```

### 2) Install & Local Build Check
```bash
npm i
npm run build
```

### 3) Vercel Project
- Import repo in Vercel.  
- Set **Environment Variables** (same values in `.env.local` locally):

**Public**
```
NEXT_PUBLIC_SITE_URL=https://grainscout.forestsource.io
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_FUNCTION_IDENTIFY_URL=
```
**Server**
```
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_PRICE_ID_ANNUAL=
STRIPE_WEBHOOK_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=you@yourdomain.com
AIRTABLE_BASE_ID=
AIRTABLE_API_KEY=
AIRTABLE_IMAGES_TABLE=Images
SUPABASE_BUCKET=species-images
```

### 4) Supabase (Schema + Edge Function)
- In the SQL editor, run migrations under `supabase/migrations/` **in numeric order** (`001` → `007`).  
  These create: `profiles`, `identifications`, `subscriptions`, RLS, `species`, `species_aliases`, `user_feedback`, `species_images` (with unique thumbnail/banner and “single primary per type”).

- Set **Edge Function secrets** and deploy:
```bash
npm i -g supabase
supabase link --project-ref <PROJECT_REF>
supabase secrets set   SUPABASE_URL=https://<project>.supabase.co   SUPABASE_SERVICE_ROLE=<service-role>   HUGGING_FACE_TOKEN=<hf>   HF_MODEL=<you>/wood-species-classifier

supabase functions deploy identify-wood --no-verify-jwt
```

### 5) Stripe
- Create prices (**monthly** and **annual**) and set IDs in Vercel env.  
- Add webhook endpoint:
```
https://grainscout.forestsource.io/api/stripe-webhook
```
- Enable events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`.

**Local test (optional)**
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
stripe trigger checkout.session.completed
```

### 6) Airtable → Supabase Importer (Admin)
- Sign in as `ADMIN_EMAIL`.  
- Visit `/admin/species` → paste an Airtable **Images** record ID.  
- Preview thumbnails → Import.  
- Verify in Supabase Storage (`species-images` bucket) and `species_images` table.

### 7) End-to-End Smoke Tests
- `/identify` → upload → see top-3 predictions + remaining quota.  
- `/pricing` → choose monthly/annual → Stripe Checkout → success → `/account` shows Pro; `/api/subscription/status` returns `{ plan: 'pro', status: 'active' }`.  
- `/admin/species` → import record.  
- Feedback loop on `/identify` (“Was this correct?”) saves to `user_feedback`.

---

## Notebook & Training Guidance

Open Colab and use the **golden notebook** structure (see `notebooks/wood_species_training.md`). Configure:
- `train_dir`, `val_dir`, `test_dir` to Google Drive splits.
- `save_dir` to a Drive folder for artifacts.

**Hardware:** Colab GPU (**A100** best; **L4/V100** good; **T4** works with smaller batch).  
**Recipe (baseline):** EfficientNet-B3 @ 300px, batch 24 (reduce if OOM), OneCycle max_lr=3e-4, epochs 50, early-stop 6, class-weighted CE with label smoothing 0.1.  
**Exports:** ONNX (dynamic axes) + TorchScript.  
**Artifacts:** `wood_classifier_best.pth`, `class_mapping.json`, `classification_report.txt`, `confusion_matrix.png`, `train_log.csv`, `tb/`.

Push weights to **Hugging Face**: `huggingface.co/<you>/wood-species-classifier`.

---

## Git Best Practices

- **Main** is protected; work in feature branches: `feature/identify-edge-cache`, `feat/pricing-annual`.
- PRs require: build passing, migrations reviewed, env diffs noted.
- Keep commits atomic and messages meaningful (`feat:`, `fix:`, `chore:`, `docs:`…).
- **Do not commit** large binaries: weights (`.onnx`, `.pth`, `.pt`), dataset, `tb/`, `train_log.csv`.
- Use `.env.local` locally; never commit secrets.
- Tag deploys: `v0.1.0`, `v0.2.0` (changelog in PR body).

---

## Operational Playbook

- **Quota**: Hard block at free quota 10/mo; show low-quota banner at ≤3.
- **Upsell**: CTA on identify results; paywall on 402 with link to `/pricing`.
- **Support**: Errors bubble with friendly messages; logs via Vercel + (optional) Sentry.
- **Data hygiene**: Keep `species` verified; use `species_aliases` to map model labels.
- **Feedback loop**: Use `user_feedback` for retraining sets monthly.

---

## Tools to Leverage (if available)

- **GitHub CLI** (`gh`) — repo create, PRs, releases.
- **Vercel CLI** — env sync (`vercel env pull`/`vercel env add`), previews.
- **Supabase CLI** — link, secrets, edge function deploy.
- **Stripe CLI** — webhook testing, event triggers.
- **Airtable API** — attachments fetch for admin importer.
- **Hugging Face Hub** — push/pull model and artifacts.

---

## Claude Code Operating Instructions

When I provide `forestsource-wood-id.zip`:
1. Unzip, `cd` into the folder, run `npm i` and `npm run build` to ensure clean build.
2. Initialize a Git repo, create the public GitHub repo, push.
3. Print a **Vercel env checklist** for me to paste, then confirm that the Next build succeeds with env placeholders.
4. For Supabase, if CLI is available, run the secrets + deploy; otherwise output exact SQL run order and UI steps to set secrets.
5. For Stripe, print the UI steps and CLI test commands; **do not** log secrets.
6. Finish by printing the **smoke-test checklist** and any unresolved TODOs (missing envs).

**Guardrails**
- Do not hardcode secrets. Prompt where values are missing.
- Keep operations idempotent (safe to re-run if partially configured).
- If a tool/CLI isn’t installed, print equivalent manual steps.

---

## Release Checklist (ready to ship)
- [ ] DB migrated (`001`..`007`), RLS enabled.
- [ ] Edge Function deployed, HF model reachable.
- [ ] Env vars set in Vercel + Supabase function.
- [ ] `/identify` works; cache + quota verified.
- [ ] Stripe checkout+webhook flips user to Pro.
- [ ] Admin import pulls an Airtable record successfully.
- [ ] Feedback flow writes to `user_feedback`.
- [ ] Privacy & ToS pages live.