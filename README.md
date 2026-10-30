# Aj's Freeze

An e-commerce storefront built with Next.js (App Router), Supabase (Postgres, Auth, Storage), and Paystack.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4 + shadcn/ui
- Supabase: Postgres database, Auth (email + password), Storage (product images)
- Paystack: checkout/payment processing
- Upstash Redis: rate limiting on auth and checkout endpoints
- Google Analytics 4 (optional)

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com/), then from Project Settings -> API, copy the values into `.env.local` (copy `.env.local.example` first):

   ```bash
   cp .env.local.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

3. **Run the database schema**: open the Supabase SQL editor and run [`supabase/schema.sql`](supabase/schema.sql), then optionally [`supabase/seed.sql`](supabase/seed.sql) for sample categories/products.

4. **Set Auth redirect URLs**: in the Supabase dashboard, go to Authentication -> URL Configuration and set Site URL / Redirect URLs to match `NEXT_PUBLIC_SITE_URL` (and your production URL once deployed). Signup confirmation uses Supabase's default email (a confirmation link) out of the box - no extra setup needed. If you later want a 6-digit code instead of a link, you'd need to configure custom SMTP (Authentication -> Emails -> SMTP Settings) with a provider like Resend or Postmark, since Supabase's built-in email sender only supports its default link-based templates.

5. **Promote your first admin**: sign up normally through the app once, then in the Supabase SQL editor run:

   ```sql
   update profiles set role = 'admin' where id = '<your-user-uuid>';
   ```

   (Find the uuid in Authentication -> Users.)

6. **Create a Paystack account** at [paystack.com](https://paystack.com/), grab your test-mode keys from Settings -> API Keys & Webhooks, and add them to `.env.local`:

   - `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

   In the same dashboard page, set the webhook URL to `https://<your-deployed-domain>/api/paystack/webhook`. Paystack can't reach `localhost`, so for local testing use Paystack's dashboard test-webhook tool or a tunnel (e.g. `ngrok http 3000`) and point the webhook URL at the tunnel.

7. **Create an Upstash Redis database** at [console.upstash.com](https://console.upstash.com/) (free tier is fine), and add the REST URL/token to `.env.local`:

   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

   Without these set, rate limiting silently fails open (logs a console warning) - fine for local dev, but set them before going live so login/signup/checkout endpoints are actually protected against abuse.

8. **(Optional) Google Analytics**: create a GA4 property, copy its Measurement ID (`G-XXXXXXX`), and set `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Leave blank to skip GA entirely.

9. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Security notes

- **Admin vs customer separation**: `/admin/*` is gated by `requireAdmin()` (checked in `admin/layout.tsx` and again in every admin API route handler). Customer account pages (`/account`, `/account/orders`) redirect admins to `/admin` instead - the two roles never see each other's views.
- **Passwords**: enforced server-side (not just in the UI) to be at least 10 characters with upper/lower/number/symbol - see `src/lib/validation.ts`.
- **Signup verification**: a confirmation link email (Supabase's default) - the user must click it before they can log in.
- **Rate limiting**: login, signup, resend-email, forgot-password, and checkout are all rate-limited via Upstash Redis (`src/lib/rate-limit.ts`). Fails open (no limiting) if Upstash isn't configured, so this must be set before production use.
- **Payments**: an order is only ever marked `paid` after the Paystack webhook verifies the transaction server-side (signature check + a second `verify` API call) - a client-side redirect alone never marks an order paid. Failed/declined payments are marked `failed`, never left stuck `pending`. Checkout requests carry a client-generated idempotency key so a retried/duplicated submission reuses the same order instead of double-charging or double-reserving stock.
- **Scaling**: this app is stateless aside from Supabase/Upstash, so it scales horizontally on any platform that runs Next.js in multiple instances (e.g. Vercel does this automatically). Actual load capacity depends on your Supabase plan's connection limits and Upstash's request quota - review both before high-traffic launches.

## Project structure

The data model lives in [`supabase/schema.sql`](supabase/schema.sql). Routes are organized under `src/app/` into `(storefront)` (public store), `(auth)` (login/signup/account), and `admin` (role-gated dashboard) route groups, plus `api/` for route handlers.
