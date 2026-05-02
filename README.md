# Easymotor

A lightweight multilingual SEO issue-solving framework for the automotive and
motorcycle niche.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS with `@tailwindcss/typography`
- JSON files for CMS content
- Simple cookie-based admin login

## Setup

Copy `.env.local.example` to `.env.local`. Backoffice access uses
`ADMIN_USERNAME`, `ADMIN_PASSWORD`, and
`ADMIN_SESSION_SECRET` (defaults: `test` / `test123` for local dev if unset).

Content lives in `data/content.json`. `data/gemini-feed.json` is the raw seed
feed that can be normalized into the CMS file.

## Development

```bash
npm run dev
```

Public routes:

- `/en`, `/es`, `/pt`
- `/[lang]/[brand]`
- `/[lang]/[brand]/[model]`
- `/[lang]/[brand]/[model]/[issue]`

Admin routes:

- `/admin/login`
- `/admin`

## Feed Ingestion

```bash
npm run ingest -- ./feed.json
# Example seed (Gemini-style array in repo):
npm run ingest -- ./data/gemini-feed.json
```

See `scripts/README.md` for the supported JSON and CSV shapes.

## SEO Strategy

The landing page filters only link to real generated pages:

- `/[lang]/[brand]`
- `/[lang]/[brand]/[model]`
- `/[lang]/[brand]/[model]/[issue]`

Those pages generate metadata from the JSON content, including brand, model,
version/year text, and issue names.

## Deployment

Deploy with any Next.js-capable host. Firebase App Hosting can still host the
Next.js app, but no database or storage service is required for content.
