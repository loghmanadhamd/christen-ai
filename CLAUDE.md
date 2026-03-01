# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server
bun build        # Production build
bun lint         # ESLint
bun test         # Run tests once (vitest)
bun test:watch   # Run tests in watch mode
```

## Architecture

**PowderPlan** is a ski trip planning app. Users create a trip, invite guests (who fill in their own preferences via a share link), and receive AI-generated resort recommendations.

### Routing (`src/App.tsx`)
| Route | Page | Purpose |
|---|---|---|
| `/` | `Index` | Multi-step trip planning wizard |
| `/auth` | `Auth` | Supabase auth (sign in / sign up) |
| `/invite/:tripId` | `GuestInvite` | Invited guests enter their preferences |
| `/results/:tripId` | `Results` | View AI-generated resort recommendations |
| `/share/:tripId` | `ShareResults` | Public shareable results view |

### Step wizard (`src/components/steps/`)
The main flow on `/` walks through: **Basics → Budget → Invites → Skills → Review**, then calls the AI to generate recommendations.

### Backend (Supabase)
All data lives in Supabase. Key tables:
- `trips` — trip metadata (dates, group size, vibe, pass types, geography, skill range)
- `guests` — per-guest preferences (airport, budget, skill level)
- `recommendations` — AI results stored as JSON blob (`results` column)
- `flight_cache` — cached flight price lookups

Three public Postgres functions bypass RLS for the share/invite flows: `get_public_trip`, `get_public_guests`, `get_public_recommendations`.

The typed Supabase client is at `src/integrations/supabase/client.ts`. The full DB type is in `src/integrations/supabase/types.ts` (auto-generated — don't edit manually).

### Auth (`src/hooks/useAuth.tsx`)
`AuthProvider` wraps the app and exposes `useAuth()` which returns `{ user, session, loading, signOut }`.

### UI
- Components from **shadcn/ui** live in `src/components/ui/` (generated — prefer editing sparingly)
- Path alias `@/` maps to `src/`
- Tailwind CSS with custom `glass` / `glass-strong` utility classes and `gradient-text`
- **framer-motion** for animations, **lucide-react** for icons

### Environment variables
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

## Deploy

**Supabase project ref:** `exqitxkenafhllrgxhoj`

```bash
# Deploy an edge function
npx supabase@2.76.15 functions deploy <function-name> --project-ref exqitxkenafhllrgxhoj

# Push DB migrations  (NOTE: use --linked, NOT --project-ref — db push doesn't support that flag)
npx supabase@2.76.15 db push --linked --yes
```

Edge functions live in `supabase/functions/<name>/index.ts` (Deno runtime).
Migrations live in `supabase/migrations/`. Use timestamp prefix `YYYYMMDDHHMMSS_description.sql`.

## Data format conventions

**Vibe preferences** — stored in `trips.vibe` as a comma-separated key:value string:
```
energy:50,budget:25,skill:75,ski-in-out:false
```
Values are one of [0, 25, 50, 75, 100]. Parsed in edge function with `split(',')` then `split(':')`.

**Airport codes** — stored in `guests.airport_code` as comma-separated IATA codes (1–3):
```
SFO,OAK,SJC
```
DB trigger validates format `^[A-Z]{3,4}(,[A-Z]{3,4}){0,2}$`. Display by splitting on `,` and joining with ` · `.

**AI model:** Gemini 2.5 Flash via `generationConfig: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } }`

**vibeAlignment** — JSON field in AI response, per-dimension preference fit score:
```json
{ "energy": { "score": 85, "label": "string" }, "budget": { ... }, "skill": { ... } }
```

## Post-Implementation Standards

Every feature, bugfix, or refactor must pass these checks before being declared complete. Do not ask the user to verify — do it yourself.

### Deployment Verification

After ANY changes to Supabase Edge Functions:

1. Deploy all new functions with `--no-verify-jwt` (they are called internally by other functions using the anon key, not directly by authenticated users):
   ```bash
   npx supabase@2.76.15 functions deploy <function-name> --project-ref exqitxkenafhllrgxhoj --no-verify-jwt
   ```

2. Redeploy any modified existing functions:
   ```bash
   npx supabase@2.76.15 functions deploy <function-name> --project-ref exqitxkenafhllrgxhoj
   ```

3. Confirm deployment by running:
   ```bash
   npx supabase@2.76.15 functions list --project-ref exqitxkenafhllrgxhoj
   ```
   Every new/modified function must appear as ACTIVE.

4. If there are new database tables or migrations, push them BEFORE deploying functions:
   ```bash
   npx supabase@2.76.15 db push --linked --yes
   ```

### End-to-End Verification

After deploying, verify the feature works by checking the actual system — do not assume it works because the code looks correct.

1. **Check function logs** for every function in the call chain:
   ```bash
   npx supabase@2.76.15 functions logs <function-name> --project-ref exqitxkenafhllrgxhoj --limit 10
   ```
   Look for errors, 401s, 404s, timeouts, or missing log lines that should be present.

2. **Check the data** — query the DB to confirm the new data is actually being written/attached:
   ```bash
   curl -s "https://exqitxkenafhllrgxhoj.supabase.co/rest/v1/recommendations?order=created_at.desc&limit=1&select=results" \
     -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" | head -c 2000
   ```

3. **Check the frontend** — confirm the component that renders the new data:
   - Is imported in the parent component
   - Has a fallback for when the new data is null/undefined (backward compatibility with old saved data)
   - Doesn't break the build: run `bun build` and confirm zero errors

### Logging Standards

Every new edge function or pipeline step must include console.log breadcrumbs:
- At the start: `console.log('<function-name>: starting, inputs:', summarizedInputs);`
- On success: `console.log('<function-name>: done, results:', resultCount);`
- On failure: `console.error('<function-name>: failed:', error);`
- At key decision points: `console.log('<function-name>: <what happened and why>');`

These logs are the primary debugging tool when something goes wrong in production.

### Error Handling Pattern

All edge function calls within `generate-recommendations` (or any orchestrator) must be:
- Wrapped in try/catch
- Non-fatal (log the error, continue with degraded data)
- Timeout-protected with `AbortSignal.timeout()`
- Return a valid response shape even on failure

### Self-Diagnosis on Failure

If ANY verification step fails, do not report the failure and stop. Instead:
1. Read the error/logs
2. Identify the root cause
3. Fix it
4. Redeploy
5. Re-verify
6. Repeat until all checks pass

Only then report what happened: what broke, why, and what you did to fix it.

### Reporting

After completing all checks, provide a brief summary:
```
✅ Deployed: fetch-real-lodging (v2), generate-recommendations (v29)
✅ Logs: no errors, "Real lodging keys: 3" confirmed
✅ Data: realLodging present on all 3 recommendations
✅ Build: bun build passed
⚠️ Note: Amadeus test API returned 0 hotels for Steamboat, fallback search links used
```
