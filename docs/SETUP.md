# Media Saver: Setup Guide

Media Saver gives the Buffer API the media upload it is missing. Automations, AI agents and other tools send Media Saver a file and the post text; Media Saver hosts the file on Cloudflare R2, creates the post in Buffer with a public link to the file, and deletes the file once the post has been published.

This guide records how the project's accounts and services were set up, and why each choice was made.

---

## 1. Buffer app client

**Where:** publish.buffer.com/settings/api → App Clients → New Client

| Setting | Value | Why |
|---|---|---|
| Name | Media Saver | Buffer's brand rules forbid "Buffer" in an app's name. |
| Public client | **Unticked** (private) | The app runs on a server (Vercel), so it can keep a client secret safe. A public client is only for apps whose code runs on users' devices. This choice is permanent. |
| Permissions | `account:read`, `posts:read`, `posts:write` | Only what the app needs. Granted permissions can't be removed later. |
| Redirect URIs | `https://localhost:3000/api/auth/callback` and `https://media-saver-six.vercel.app/api/auth/callback` | One for local development, one for the live site. |

**What each permission is for**

- `account:read`: fetch the user's organisation and connected channels, so they can choose where to post.
- `posts:write`: create posts in Buffer with the text, media link and scheduled time.
- `posts:read`: check whether a post has been published, so the cleanup job knows when it is safe to delete the file.

**Refresh tokens:** `offline_access` is not a checkbox on this page. The app requests it during login, which lets it stay connected without users logging in again.

**Credentials**

- The **client ID** is not secret. It goes in the app's settings and on the competition submission form.
- The **client secret** must stay private. It lives only in environment variables (see section 5), never in code, GitHub or chat.

**Redirect URI rules**

- A redirect URI is the address Buffer sends users back to after they log in, carrying a one-time code. The app's route at that address swaps the code for an access token.
- In Next.js, the file `app/api/auth/callback/route.ts` creates the `/api/auth/callback` address.
- The URI must match character for character in three places: the Buffer settings, the login request and the token exchange. A trailing slash, a different port, `http` instead of `https`, or `127.0.0.1` instead of `localhost` all cause a `redirect_uri_mismatch` error.
- Buffer requires HTTPS, even for localhost.

---

## 2. Cloudflare R2 storage

**Where:** dash.cloudflare.com → Storage & databases → R2 Object Storage

| Setting | Value | Why |
|---|---|---|
| Bucket name | `media-saver-uploads` | Permanent; can't be changed later. |
| Location | Automatic (Western Europe) | Buffer can fetch files from anywhere, so location barely matters. |
| Storage class | Standard | "Infrequent Access" charges extra each time a file is read. Buffer reads every file and the app deletes them soon after, so Standard is cheaper. |
| Public Development URL | Enabled: `https://pub-1b8ecb56e1e246899b41ee32660e3af3.r2.dev` | The Buffer API has no upload endpoint, so media must sit at a public URL that Buffer can fetch. |

**Why R2:** the free tier covers 10 GB of storage, and downloads are free, which matters because Buffer downloads every file. Beyond the free tier, storage costs about $0.015 per GB per month.

**Notes**

- Cloudflare rate-limits the `r2.dev` development URL and recommends a custom domain for production. It is fine for building and the competition.
- Anyone with a file's link can see that file. The app therefore gives every upload a long, random, unguessable name.
- Public access was tested by opening an uploaded image in a private browser window, which is the check the Buffer handbook recommends.

---

## 3. Next.js project

**Requirements:** Node.js 20 or newer (check with `node -v`).

```bash
npx create-next-app@latest media-saver
```

- `npx` runs a tool without installing it permanently.
- `create-next-app@latest` is Next.js's official project generator, at its newest version.
- `media-saver` is the project folder name.

| Prompt | Answer | Why |
|---|---|---|
| TypeScript | Yes | Catches mistakes before the code runs, and documents the shape of the data. |
| ESLint | Yes | Flags likely mistakes while you type. |
| Tailwind CSS | Yes | Quick styling. |
| `src/` directory | No | Keeps the structure simple. |
| App Router | Yes | The current way of building Next.js apps. |
| Turbopack | Yes | A faster development server. |
| Import alias | No (default) | |

### Running locally over HTTPS

```bash
cd media-saver
npm run dev -- --experimental-https
```

- `npm run dev` starts the development server.
- `--` passes the following option through to Next.js.
- `--experimental-https` makes Next.js create a self-signed certificate, so the app runs on `https://localhost:3000`. Buffer requires HTTPS redirect URIs, even on localhost.

The certificate files go in a `certificates` folder, which must be listed in `.gitignore` so it never reaches GitHub.

---

## 4. GitHub and Vercel

### Pushing to GitHub

First create an **empty** repository called `media-saver` on github.com, without a README.

```bash
git add .
git commit -m "Initial Next.js setup"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/media-saver.git
git push -u origin main
```

- `git add .` stages every file in the project.
- `git commit -m "..."` saves a snapshot with a message.
- `git branch -M main` names the main branch `main`.
- `git remote add origin ...` tells Git where the GitHub repository is.
- `git push -u origin main` uploads the code, and `-u` remembers the destination for future pushes.

### Deploying on Vercel

Vercel → Add New → Project → import `media-saver` → Deploy, with the default settings.

- **Live URL:** https://media-saver-six.vercel.app
- Every push to the `main` branch redeploys the site automatically.

---

## 5. R2 API token

The public URL only lets Buffer *read* files. The app also needs to upload and delete them, which takes a separate key.

**Where:** R2 Object Storage overview → Manage API tokens → Create API token

| Setting | Value | Why |
|---|---|---|
| Name | `media-saver-app` | |
| Permissions | Object Read & Write | Upload, check and delete files, but not create or delete buckets. |
| Bucket | `media-saver-uploads` only | If the key leaked, it couldn't touch anything else in the account. |
| TTL | Forever, or past the judging period | |

It produces an **Access Key ID** (like a username), a **Secret Access Key** (like a password, shown once) and an **S3 endpoint**. All are stored in a password manager.

---

## 6. Environment variables

Environment variables hold settings and secrets outside the code, so secrets never end up in GitHub.

### `.env.local` (local development only, never committed)

```bash
# Buffer OAuth app client
BUFFER_CLIENT_ID=your-client-id
BUFFER_CLIENT_SECRET=your-client-secret
BUFFER_REDIRECT_URI=https://localhost:3000/api/auth/callback

# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=media-saver-uploads
R2_PUBLIC_URL=https://pub-1b8ecb56e1e246899b41ee32660e3af3.r2.dev

# Encrypts the login session cookie
SESSION_SECRET=a-long-random-string
```

| Variable | Secret? | Purpose |
|---|---|---|
| `BUFFER_CLIENT_ID` | No | Identifies the app to Buffer during login. |
| `BUFFER_CLIENT_SECRET` | **Yes** | Proves to Buffer that a token request really comes from this app. |
| `BUFFER_REDIRECT_URI` | No | Where Buffer sends users after login. Differs locally and on Vercel. |
| `R2_ACCOUNT_ID` | No | Builds the R2 upload address: `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`. |
| `R2_ACCESS_KEY_ID` | No | The R2 token's "username". |
| `R2_SECRET_ACCESS_KEY` | **Yes** | The R2 token's "password". |
| `R2_BUCKET_NAME` | No | Which bucket to upload to. |
| `R2_PUBLIC_URL` | No | Start of every public file link sent to Buffer. |
| `SESSION_SECRET` | **Yes** | Encrypts the session cookie, so login state survives on serverless without an in-memory store (as the handbook recommends). |

**Generating `SESSION_SECRET`:**

```bash
openssl rand -base64 32
```

This prints 32 random bytes as text, which is long enough that nobody can guess it.

**Why no `NEXT_PUBLIC_` prefix:** in Next.js, variables starting with `NEXT_PUBLIC_` are bundled into the code sent to browsers. These variables are only read on the server, so they stay hidden from users.

### `.env.example` (committed)

The same file with placeholder values only. It documents which variables the project needs, so anyone setting up the project knows what to fill in. Because the default `.gitignore` ignores `.env*`, it needs the line `!.env.example` to allow this one file through.

### On Vercel

Project → Settings → Environment Variables. Add each variable for Production and Preview, using the live redirect URI:

```
BUFFER_REDIRECT_URI=https://media-saver-six.vercel.app/api/auth/callback
```

Then redeploy, because new variables only take effect on the next deployment.

---

## 7. Database (Neon Postgres + Drizzle)

The database stores each user's Buffer tokens and the link between every uploaded file and its Buffer post, which the cleanup job needs.

### Creating the database on Vercel

Vercel → project → **Storage** → Neon:

- **Region:** Washington, D.C., USA (East). The database talks to the Vercel server, not the user's browser, and Vercel runs server code in Washington by default.
- **Auth:** off. Users log in with their Buffer account through OAuth, not Neon's login system.
- **Realtime:** off.
- **Plan:** Free (1 GB).
- **Database name:** `media-saver-db`.
- **Environments:** Production, Preview and Development.
- **Create database branch for deployment:** both unticked, so every environment shares one database.
- **Custom prefix:** `DATABASE`, so the main variable is `DATABASE_URL`.
- **Sensitive:** switched itself off when Development was added (Vercel doesn't allow sensitive values in Development). Fine for a solo project.

The integration adds several variables. The two that matter:

| Variable | Used by | Why |
|---|---|---|
| `DATABASE_URL` | The app | Pooled connection, suited to many short-lived serverless functions. |
| `DATABASE_URL_UNPOOLED` | `drizzle-kit` | Direct connection, for setup jobs like creating tables. |

The `PG...` variables are the same details split into pieces and can be ignored.

### Pulling the variables locally

```bash
npx vercel link
npx vercel env pull .env.local
```

`vercel link` connects the folder to the Vercel project (once only). `env pull` downloads the **Development** values into `.env.local`.

> **Watch out:** after any `env pull`, check that `BUFFER_REDIRECT_URI` in `.env.local` still says `https://localhost:3000/api/auth/callback`. Only the Vercel address is stored on Vercel, so a pull could change it, and local login would then send you to the live site.

### Installing Drizzle

```bash
npm i drizzle-orm @neondatabase/serverless dotenv
npm i -D drizzle-kit
```

- `drizzle-orm`: reads and writes the database from app code.
- `@neondatabase/serverless`: Neon's driver, which connects over HTTP or WebSockets, suited to serverless.
- `dotenv`: lets `drizzle-kit` read `.env.local` (Next.js does this itself, but `drizzle-kit` runs outside Next.js).
- `drizzle-kit` (dev only): the command-line tool that creates and changes tables.

### Files

- `drizzle.config.ts` (project root): loads `.env.local`, points at `./lib/db/schema.ts`, writes migrations to `./drizzle`, and connects with `DATABASE_URL_UNPOOLED`.
- `lib/db/schema.ts`: the table definitions.
- `lib/db/index.ts`: creates the `db` object the app imports (`import { db } from '@/lib/db'`), using the pooled `DATABASE_URL`.
- `drizzle/`: generated migration files. Commit this folder.

### Tables

**`users`**: one row per connected Buffer account.

| Column | Purpose |
|---|---|
| `id` | Random UUID, primary key. |
| `buffer_account_id` | Buffer's account ID. Unique, so a returning user updates their row. |
| `access_token` | Encrypted. Expires after about an hour. |
| `refresh_token` | Encrypted. Single-use and rotating. |
| `token_expires_at` | When the access token expires. |
| `created_at`, `updated_at` | Timestamps (`updated_at` changes automatically). |

**`uploads`**: one row per file stored in R2.

| Column | Purpose |
|---|---|
| `id` | Random UUID, primary key. |
| `user_id` | Foreign key to `users`. A user with uploads can't be deleted, which protects against orphaned R2 files. |
| `r2_key` | The file's name in R2. Unique. Needed to delete it. |
| `public_url` | The address Buffer fetches the file from. |
| `buffer_post_id` | The Buffer post, used by the cleanup job to check status. |
| `status` | `pending`, `scheduled`, `published`, `deleted` or `failed`. Indexed, because the cleanup job searches by it. |
| `created_at`, `deleted_at` | Timestamps. |

`pending` covers the moment after the file is in R2 but before Buffer confirms the post.

### Creating and changing tables

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

`generate` writes a SQL migration file into `drizzle/` from the schema. `migrate` runs it against Neon. Run them one at a time. `migrate` may print a WebSocket warning and no success message; check the **Tables** page in the Neon console to confirm. If it ever fails silently, `npm i -D pg` gives `drizzle-kit` a standard Postgres driver.

To change a table later: edit `schema.ts`, then run both commands again. Each change gets its own migration file.

### Token encryption key

Tokens are encrypted before they're saved, so a copy of the database alone is useless.

```bash
openssl rand -base64 32
```

Save the result as `TOKEN_ENCRYPTION_KEY` in `.env.local`, in Vercel (all environments) and in a password manager. Add the name with no value to `.env.example`. Use a different value from `SESSION_SECRET`. If this key is lost, every stored token becomes unreadable and all users must log in again.

---

## Setup checklist

- [x] Registered for Buffer Commit
- [x] Buffer app client created (private; `account:read`, `posts:read`, `posts:write`)
- [x] Redirect URIs added for localhost and Vercel
- [x] R2 bucket created, public development URL enabled and tested
- [x] Next.js project created (TypeScript, App Router, Tailwind)
- [x] Pushed to GitHub and deployed on Vercel
- [x] R2 API token created (Object Read & Write, this bucket only)
- [x] `.env.local` filled in locally
- [x] `.env.example` created (renamed from `.env-example`)
- [x] Environment variables added on Vercel
- [x] Neon database created and connected to all environments
- [x] Drizzle installed; `users` and `uploads` tables created
- [x] `TOKEN_ENCRYPTION_KEY` added locally and on Vercel
- [x] Buffer API tested by hand in the Explorer (see `BUFFER-API.md`)
- [ ] Optional: custom domain for R2 instead of the rate-limited `r2.dev` URL
- [ ] Optional: privacy policy URL for the Buffer app client
