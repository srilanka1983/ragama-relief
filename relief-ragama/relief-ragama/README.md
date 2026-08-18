# Ragama Relief — Flood Aid Coordination

A small two-app system for coordinating flood relief in Ragama, Thuduwegedara:

- **`relief-map`** — a public, no-login live map. Anyone with the link can see which
  households need rescue, food, medical aid, etc., color-coded, updated every 30 seconds.
- **`relief-admin`** — a sign-in-required console for volunteers and admins to register
  households, update their status from the field (with GPS capture), search/sort/filter
  a dashboard, export CSV, and manage who has volunteer/admin access.

Both apps are Cloudflare Workers. They share one Cloudflare **D1** database (already
created and seeded for you — see "What's already done" below).

## What's already done

- The D1 database `ragama-relief-db` has been created in your Cloudflare account
  (APAC region, close to Sri Lanka) with the `households` and `user_roles` tables
  from `schema.sql`, already applied.
- **`helpdeskit@leco.lk` has been seeded as the first admin**, so once you sign in
  with that Google account on `relief-admin`, you can add other volunteers/admins
  from the Users page — no database work needed.
- Both `apps/*/wrangler.jsonc` files already point at that D1 database's real ID.

What's left is getting this code deployed, which this container can't do directly
(no access to the npm registry or a Workers-deploy API from here) — so you'll finish
it via Cloudflare **Workers Builds**, which builds and deploys straight from a GitHub
repo with no terminal required. It's about 15–20 minutes, mostly clicking through
two setup wizards.

## Step 1 — Get this code into a GitHub repository

1. Go to [github.com/new](https://github.com/new) and create a new **empty** repository
   (no README/gitignore/license — this project already has those), e.g. `ragama-relief`.
   Private or public both work.
2. Get the code into it. Easiest options:
   - **If you have git installed locally:** unzip the project I sent you, then inside
     the folder run:
     ```
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/<your-username>/ragama-relief.git
     git push -u origin main
     ```
   - **No git available:** unzip the project, then use GitHub's web UI — open your new
     repo, click **Add file → Upload files**, and drag the whole extracted folder in.
     (Do this from a machine where you've unzipped it; GitHub's uploader accepts folders.)

## Step 2 — Set up Google Sign-In (Google Cloud Console)

The admin app uses "Sign in with Google" so volunteers don't need separate passwords.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   and create a new project (or use an existing one) — e.g. "Ragama Relief".
2. Go to **APIs & Services → OAuth consent screen**. Choose **External**, fill in an
   app name ("Ragama Relief"), your email as support/developer contact, and publish it
   (or keep it in Testing and add your volunteers' Google accounts as test users while
   you try it out).
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**
   - Name: "Ragama Relief Admin"
   - **Authorized redirect URIs** — add (you'll get the exact URL in Step 3, it looks like):
     `https://ragama-relief-admin.<your-subdomain>.workers.dev/auth/callback`
     (You can add/edit this after Step 3 once you know the real URL — it's fine to
     save the credential now and come back to add the URI.)
4. Save the **Client ID** and **Client Secret** — you'll paste these into Cloudflare
   in Step 4.

## Step 3 — Connect the repo to Cloudflare Workers Builds

You'll create **two** Worker projects from the same repo — one per app — by setting a
different "root directory" for each.

For **each** app (`relief-map`, then `relief-admin`):

1. In the [Cloudflare dashboard](https://dash.cloudflare.com/) go to **Workers & Pages
   → Create → Import a repository** (or **Connect to Git** if importing an existing Worker).
2. Pick your `ragama-relief` GitHub repo and authorize Cloudflare's GitHub app if asked.
3. Set:
   - **Root directory**: `apps/relief-map` (or `apps/relief-admin` for the second one)
   - **Build command**: `npm run build`
   - **Deploy command**: `npx wrangler deploy`
   - Cloudflare should auto-detect these from `wrangler.jsonc` — confirm they match.
4. Click **Save and Deploy**. First build takes a couple of minutes.
5. Once deployed, note the live URL Cloudflare gives you
   (e.g. `https://ragama-relief-map.<subdomain>.workers.dev`).

Repeat for the second app.

## Step 4 — Configure the admin app's secrets

In the Cloudflare dashboard, open the **`ragama-relief-admin`** Worker → **Settings →
Variables and Secrets**, and add:

| Name | Value | Type |
|---|---|---|
| `GOOGLE_CLIENT_ID` | from Step 2 | Secret |
| `GOOGLE_CLIENT_SECRET` | from Step 2 | Secret |
| `SESSION_SECRET` | any long random string (32+ characters — a password generator works) | Secret |
| `PUBLIC_URL` | the real `relief-admin` URL from Step 3, e.g. `https://ragama-relief-admin.<subdomain>.workers.dev` (no trailing slash) | Variable |

Then go back to your Google Cloud OAuth client (Step 2) and set the **Authorized
redirect URI** to `<PUBLIC_URL>/auth/callback` using that same real URL, and save.

Redeploy the admin Worker once (push any small commit, or use **Deployments → Retry
deployment** in the dashboard) so it picks up the new variables.

## Step 5 — Try it

1. Open your `relief-admin` URL and click **Sign in with Google**, using
   `helpdeskit@leco.lk`. You should land on the Home page as an admin.
2. Go to **Users** and add your volunteers by email (choose "Volunteer" or "Admin").
   They'll get access the moment they sign in with that Google account — nothing
   else to configure per person.
3. Go to **Add** and register a test household with a status like "Needs Food".
4. Open your `relief-map` URL (no sign-in) — the household should appear as a
   colored pin within ~30 seconds.
5. Delete the test household from the Dashboard once you're satisfied.

## Day-to-day use during a flood

- **Volunteers on the ground**: open `relief-admin` on their phone, sign in with
  Google once, then use **Add** to register a household (GPS auto-captured) or find
  it on **Dashboard** and hit **Update** to change its status as things change.
- **Coordinators**: watch the public `relief-map` link (share it widely — it needs
  no login) to see the live picture, or use the admin **Dashboard** to search, filter
  by status, and **Export CSV** for handoff to other agencies.
- **Admins**: manage who has access from the **Users** page. Removing someone from
  there instantly revokes their access next time they'd sign in.
- Both apps switch between English and Sinhala with the language toggle in the top
  bar (public map) or nav bar (admin app). The Sinhala text was machine-authored for
  this build — please have a Sinhala speaker on your team review the wording in
  `packages/shared/src/i18n.ts` before relying on it during a real response, and let
  me know if you'd like corrections made.

## Local development (optional)

If you ever want to run this on a machine with normal npm access:

```
npm install
npm run dev:map      # relief-map on localhost
npm run dev:admin    # relief-admin on localhost
```

## Project structure

```
relief-ragama/
  packages/shared/        # DB helpers, auth/session, i18n dictionary — shared by both apps
  apps/relief-map/        # Public map (Worker + React client)
  apps/relief-admin/      # Volunteer/admin console (Worker + React client)
  schema.sql               # D1 schema (already applied to the live database)
```
