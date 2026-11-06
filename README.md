# Media Saver

**Post images and videos to Buffer from any automation, with one request.**

Live at **[mediasaver.si](https://mediasaver.si)** · [API docs](https://mediasaver.si/docs) · Built for the Buffer Commit hackathon (October–November 2026)

![Media Saver icon](./public/media-saver-icon.svg)

## The problem

The Buffer API can schedule posts with images and video, but it has no upload endpoint. Every file has to be hosted somewhere public first, stay online until the post publishes (which can be days later), and then be cleaned up by hand.

These are the top two requests on Buffer’s API roadmap: image upload, and copying media after a post. Anyone automating posts with n8n, Zapier, Make, scripts or AI agents hits this wall.

## What Media Saver does

You send the file and the post details. Media Saver:

1. stores the file and gives Buffer a stable public link,
2. creates the post on one or more channels,
3. tracks every post until Buffer reports it published,
4. then deletes the file automatically.

```bash
curl -X POST https://mediasaver.si/api/v1/posts \
  -H "Authorization: Bearer ms_live_your_key_here" \
  -F "file=@launch.jpg" \
  -F "channelId=FIRST_CHANNEL_ID" \
  -F "channelId=SECOND_CHANNEL_ID" \
  -F "text=We just shipped it."
```

## Features

- **One-call posting**: upload and schedule in a single multipart request.
- **Images and video**: JPEG, PNG and GIF up to 20 MB, MP4 up to 100 MB.
- **Large files go straight to storage** through a short-lived upload address, so they never pass through the app’s servers.
- **Multiple channels per post**, up to 10. Each channel is handled separately, so one failure doesn’t stop the others, and the response says exactly which channel failed and why.
- **Automatic cleanup** once every post has published, plus removal of uploads that never got a post.
- **Network-aware posting**: Instagram images go out as feed posts and videos as reels.
- **Schedule, queue or draft**: a set time, the next queue slot, or a Buffer draft.
- **A dashboard** to schedule posts, manage API keys, copy channel IDs and follow each upload’s status.
- **A ready-made n8n workflow** that can be imported in two minutes, linked from the docs.

## How it works

```
Automation ──► Media Saver API ──► Cloudflare R2 (public file)
                     │                       ▲
                     ▼                       │ fetched at publish time
                Buffer API ──────────────────┘
                     ▲
Daily cleanup ───────┘ checks each post; deletes the file when all are published
```

- **Login** uses Buffer’s OAuth with PKCE. Access and refresh tokens are encrypted with AES-256-GCM before they are stored.
- **Uploads** are stored in Cloudflare R2 and served from `media.mediasaver.si`, a stable custom domain (networks such as TikTok require domain verification for pulled media).
- **Posts** are created through Buffer’s GraphQL API. Each upload is linked to one post per channel, so cleanup can wait until every post is out.
- **Cleanup** runs daily as a Vercel cron job. It asks Buffer for each post’s status, and deletes a file only when every linked post is published or removed.

## Security choices

- **API keys** are shown once, stored only as SHA-256 hashes, can be revoked instantly, and show when they were last used. The docs include a guide to keeping keys safe and rotating them.
- **Buffer tokens** are encrypted at rest and refreshed five minutes before they expire, and a database lock makes sure only one request refreshes a token at a time, because Buffer’s refresh tokens are single-use.
- **Upload addresses** expire after 10 minutes and are signed for one exact file type and size.
- **Rate limits** are respected: channel lists are cached, and a 429 from Buffer is passed on with its Retry-After time instead of being retried.

## Tech stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS · Neon Postgres with Drizzle ORM · Cloudflare R2 · Vercel (hosting and cron) · iron-session

## Running it locally

You need Node.js 20 or newer, a Buffer OAuth app client, a Cloudflare R2 bucket and a Postgres database.

```bash
git clone https://github.com/abelUche/media-saver.git
cd media-saver
npm install
cp .env.example .env.local   # then fill in the values below
npx drizzle-kit migrate
npm run dev                  # https://localhost:3000
```

| Variable | What it is |
| --- | --- |
| `BUFFER_CLIENT_ID`, `BUFFER_CLIENT_SECRET` | Your Buffer OAuth app client |
| `BUFFER_REDIRECT_URI` | `https://localhost:3000/api/auth/callback` locally |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API token |
| `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | The bucket and its public domain |
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY` | Random secrets for sessions and token encryption |
| `CRON_SECRET` | Protects the cleanup endpoint |

The dev server runs over HTTPS, because Buffer only accepts HTTPS redirect addresses. The R2 bucket needs a CORS rule allowing `PUT` from your site’s address for direct uploads.

## What’s next

- TikTok, now that files are served from a verifiable custom domain
- More media types, such as documents and image carousels
- Upload progress for large videos

## Licence

MIT
