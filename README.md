# Repo

> Modern, self-hostable Git hosting that doesn't go down. Built for the post-GitHub era.

Repo is a standalone alternative to GitHub: real Git over HTTPS, issues, pull requests with built-in AI review, and a fast modern UI. Bring your own server, your own domain, your own AI key. No vendor lock-in.

## Features

- **Real Git hosting**: full `git clone`/`push`/`pull` over HTTPS using a built-in `git http-backend`. Bare repos live on disk.
- **Pull requests with AI review**: every PR gets an automatic summary and code review from your LLM provider. Opt-in.
- **Issues**: markdown-rendered, AI-triaged labels, comments.
- **Multi-tenant from day 1**: users, orgs, members, roles, plans.
- **Fast UI**: Next.js 15, Tailwind, dark mode, syntax highlighting (Shiki).
- **Boring tech**: Postgres + bare git on disk. No bespoke storage layer to fail.
- **Self-host in 60 seconds**: `docker compose up -d`.
- **Open source**: MIT license. Read the source, audit the security model, run it yourself.

## Quick start (self-hosted)

```bash
git clone https://github.com/gmall1/repo.git
cd repo
cp .env.example .env  # edit values (SESSION_SECRET, OPENAI_API_KEY, etc.)
docker compose up -d
open http://localhost:3000
```

That's it. You now have a private Git host. Create an account, create a repo, and `git push` to it.

## Development

Requires Node 22+, pnpm 10+, and Postgres 16+.

```bash
pnpm install
# Start local Postgres (or point DATABASE_URL at your own)
docker run -d --name repo-pg -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:16
# Apply schema
pnpm drizzle-kit push
# Run dev server
pnpm dev
```

## Configuration

Set in `.env`:

| Var | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `SESSION_SECRET` | yes (production) | HMAC secret for session cookies |
| `NEXT_PUBLIC_APP_URL` | yes | Public origin (used in clone URLs) |
| `REPO_STORAGE_PATH` | no | Where bare repos live. Default `./data/repos` |
| `OPENAI_API_KEY` | no | Enables AI review/summary/triage |
| `RESEND_API_KEY` | no | Enables transactional email |
| `EMAIL_FROM` | no | Sender for outgoing email |

## Architecture

```
Browser ──┬── /api/...     (Next.js App Router, server components & API routes)
          ├── /signup, /login, /[owner], /[owner]/[repo]/...
          ├── /[owner]/[repo].git/... (proxied to git-http-backend internally)
          └── /api/healthz
                 │
                 ├── Postgres (Drizzle ORM)
                 │     users · sessions · api_tokens · repos · issues · prs · stars · events …
                 │
                 └── Disk: bare git repos at $REPO_STORAGE_PATH/{owner}/{name}.git
```

- All HTTP requests go through one Next.js process. No separate "git server".
- Auth: email/password + bcrypt + signed cookies. Personal access tokens for git CLI.
- Git protocol: native `git upload-pack` / `receive-pack` shelled from the server, fed via stateless RPC.
- AI: optional, async. Diffs/issue text are sent to OpenAI when keys are configured.

## License

MIT. See [LICENSE](LICENSE).
