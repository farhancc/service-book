# Service Book

The sales team's reference for **attestation processes, translation prices and business setup / PRO services**: what each country's route looks like, which documents the client must bring, what we charge, and a ready-to-send WhatsApp message for the client.

Built with Next.js 16 (App Router, Cache Components), Drizzle ORM, PostgreSQL and Tailwind CSS 4.

## What it does

- **Search everything** from one box: "india degree", "russian", "free zone".
- **Attestation routes** per country + document (+ variant such as Urgent or Apostille): ordered steps, documents needed, our fee, government fees, turnaround.
- **Translation prices** by language pair, document and type (legal / certified / general), per page, word or document, with minimum charge.
- **Services**: business setup, PRO, visas and others, with what the client must provide.
- **Message for the client**: one tap copies a WhatsApp-formatted summary or opens WhatsApp, with or without prices. Internal notes are never included.
- **Stale price warnings**: every entry shows when its price was last confirmed. Anything older than 90 days (or never checked) is flagged on the home page. Change the window with `STALE_AFTER_DAYS` in `src/lib/format.ts`.
- **Price history**: every change to fees, turnaround or availability is logged with who and when.
- **Roles**: Viewer (search and copy), Editor (add and change entries, countries, document types), Admin (also delete and manage the team).
- Mobile first, with a bottom tab bar on phones.

## Run it locally

Requirements: Node 20.9+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL and SESSION_SECRET
npm run db:migrate            # creates the tables
SEED_ADMIN_EMAIL=you@company.com SEED_ADMIN_PASSWORD='a-strong-password' npm run db:seed
npm run dev                   # http://localhost:3000
```

`db:seed` adds 25 common countries, 18 document types and your admin account. It is safe to run again. Add `-- --sample` to also add three clearly marked sample entries to look around with, and delete them before real use.

## Deploy

Any Node host works. The quickest path:

1. Create a free Postgres database on [Neon](https://neon.tech) or [Supabase](https://supabase.com) and copy its connection string.
2. Push this folder to a private GitHub repo and import it in [Vercel](https://vercel.com).
3. Set `DATABASE_URL` and `SESSION_SECRET` in the Vercel project settings.
4. From your machine, with `DATABASE_URL` pointing at the new database, run `npm run db:migrate` and `npm run db:seed` once.
5. Sign in, go to **Settings → Team and access**, and add the team.

Tip for the team: open the site on your phone and choose "Add to Home Screen" so it opens like an app.

## Changing the data model

Edit `src/db/schema.ts`, then:

```bash
npm run db:generate   # writes a new SQL migration into drizzle/
npm run db:migrate    # applies it
```

`npm run db:studio` opens Drizzle Studio for browsing the tables directly.

## Project layout

```
src/
  app/
    login/                 sign-in page and actions
    (app)/                 everything behind sign-in
      page.tsx             search + dashboard
      attestation/         list, detail (stamp trail), new, edit, actions
      translation/         same pattern
      services/            same pattern
      settings/            countries, document types, team, own password
  components/              UI pieces (forms, lists, price card, nav)
  db/schema.ts             tables
  lib/
    auth.ts                session + role checks (used in every page and action)
    data.ts                all read queries
    whatsapp.ts            client message builders
    history.ts             price change log
    form.ts                validation helpers
  proxy.ts                 sends signed-out visitors to /login
scripts/seed.ts            reference data and first admin
drizzle/                   SQL migrations
```

## Security notes

- Passwords are hashed with bcrypt. Sessions are signed, http-only cookies that last 7 days.
- Every page and every Server Action checks the user's role on the server. Hiding buttons is only cosmetic.
- Turning a user's "Can sign in" off takes effect on their next click.
- The app always keeps at least one active admin.

## Ideas for later

- Import existing price lists from a spreadsheet (CSV upload).
- Pull prices from Odoo products instead of typing them twice.
- Quote builder: pick several items for one client and send one combined message.
- Arabic message templates for Arabic-speaking clients.
