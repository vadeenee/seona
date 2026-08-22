# Seona — AI SEO/AEO audit tool ("Grammarly for SEO")

Paste content or a URL, get one audit covering on-page SEO, content quality, search
intent, topical coverage, technical SEO, and AEO/AI-search readiness — explained in
plain English with one-click fixes, not just a scorecard. Freemium: free tier is
fully real and fully fixable, deeper strategic/AEO fixes are paywalled.

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4. No backend yet —
everything currently runs off mock data.

**Read `node_modules/next/dist/docs/` before assuming any Next.js API** — this repo
was scaffolded against a very recent Next.js version and some conventions (e.g.
`searchParams`/`params` typing) differ from older training data. Don't guess; check.

## Current state (what's real vs. fake)

- `/` — landing page, single input (URL or pasted content), links to `/audit`. **The
  input doesn't actually do anything yet** — it always routes to the same static
  `/audit` page regardless of what's typed in.
- `/audit` — results screen, currently renders `src/lib/mock-audit.ts` (100% fake
  data) via `src/components/AuditView.tsx`. The free/pro toggle in the UI is a demo
  affordance for showing both states, not real plan logic.
- No auth, no database, no billing, no real analysis of any kind yet.
- Deployed on Vercel (auto-deploys on push to `main`), repo at
  `github.com/vadeenee/seona`.

## Design system

All colors/spacing driven by CSS custom properties defined in `src/app/globals.css`
(status colors for severity: critical/serious/warning/good; brand blue; light+dark
mode via `prefers-color-scheme` and a `data-theme` override). Reuse these tokens —
don't hardcode new hex values. Components: `ScoreRing.tsx`, `CategoryCard.tsx`,
`AuditView.tsx`.

## The freemium/tier model (already implemented in the UI, needs real logic behind it)

Every `AuditCategory` has a `tier` (see `src/lib/types.ts`):

- `free` — issue diagnosed AND fixed for free. These are the cheap/deterministic
  checks: meta title/description, headings, alt text, canonical tag, readability.
- `diagnosis-free` — issue is explained for free, but the generated fix requires
  Pro. Search intent, topical coverage, tables/FAQs, internal linking.
- `pro-locked` — entire category hidden (blurred) on free plan, only an issue count
  shows. AEO/AI Overview readiness, schema markup. This is the core differentiator
  vs. every existing competitor (see project docs — competitive-landscape.md if it
  gets copied in, otherwise ask the user, they have it saved in a Claude Cowork
  project called "okokok").

## Build priorities, in order

1. **Real audit engine for the `free` tier.** Parse a real URL (fetch + cheerio) or
   raw pasted text; run real checks (title/meta length, heading structure, alt
   text, canonical tag, sentence length, passive-voice heuristic, a Flesch-style
   readability score). Replace the mock data in these categories. No external API
   keys needed for this tier — it's all deterministic.
2. **Auth + database.** Recommend Supabase (Postgres + Auth, generous free tier,
   pairs well with Next.js) unless the user prefers something else.
3. **Billing.** Stripe, gated behind the tier system already in the UI. Note:
   Stripe account verification can take longer than a coding session — don't block
   other work on it.
4. **Real `diagnosis-free` and `pro-locked` checks.** These need a SERP data API
   (e.g. SerpApi, DataForSEO) for competitor/intent comparison, and an LLM API key
   for AI-generated fixes, FAQ/table generation, and schema JSON-LD generation.

## Known constraints

- Vercel's free Hobby plan is **not licensed for commercial use** — fine for
  testing, but this needs to move to Vercel Pro (~$20/mo) before real users/payment
  are live.
- The user (building this solo, non-technical-leaning) explicitly wants a
  step-by-step, no-jargon collaboration style. Confirm before assuming an account/
  API key exists — walk through signup steps rather than assuming familiarity.
