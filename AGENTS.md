# Agent guide for Repo

This is "Repo" — a self-hostable Git host (modern alternative to GitHub).

## Quick orientation

- Stack: Next.js 15 (App Router) · TypeScript · Drizzle ORM · Postgres 16 · Tailwind · Shiki · OpenAI
- Real Git hosting via `git upload-pack` / `receive-pack` shelled from `src/app/api/git/.../route.ts`
- Bare repos live on disk at `$REPO_STORAGE_PATH/{owner}/{name}.git` (default `./data/repos`)
- DB schema: `src/lib/db/schema.ts`. Auth helpers: `src/lib/auth.ts`. Git helpers: `src/lib/git.ts`. AI helpers: `src/lib/ai.ts`.

## Setup

```bash
pnpm install
docker run -d --name repo-pg -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:16  # if you don't have one
cp .env.example .env
pnpm drizzle-kit push
pnpm dev
```

## Test/lint/build

```bash
pnpm lint
pnpm next build
```

## Don't break

- The git HTTP backend in `src/app/api/git/[owner]/[name]/[...action]/route.ts` is the load-bearing piece. Test `git clone` and `git push` after touching it.
- `src/proxy.ts` rewrites `/{owner}/{name}.git/...` to `/api/git/...` — keep it in sync if URL conventions change.
- Auth uses signed httpOnly cookies in dev *and* prod; `secure` is auto-toggled by `NODE_ENV`. API tokens are stored as SHA-256 hashes only.

## House style

- App Router server components for pages; client components only when needed for interactivity.
- API routes: keep validation with `zod`, return `NextResponse.json(...)`.
- DB writes: use Drizzle. Don't reach for raw SQL unless necessary.
