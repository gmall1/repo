import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { repos, stars, events, users as usersT } from "@/lib/db/schema";
import { eq, desc, and, or } from "drizzle-orm";
import { formatRelative, formatNumber } from "@/lib/utils";
import { BookMarked, GitFork, Plus, Star } from "lucide-react";

export default async function Dashboard() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const myRepos = await db
    .select()
    .from(repos)
    .where(and(eq(repos.ownerType, "user"), eq(repos.ownerId, user.id)))
    .orderBy(desc(repos.updatedAt))
    .limit(20);

  const recentPublic = await db
    .select()
    .from(repos)
    .where(eq(repos.visibility, "public"))
    .orderBy(desc(repos.createdAt))
    .limit(8);

  const recentEvents = await db
    .select({
      e: events,
      u: { id: usersT.id, username: usersT.username, avatarUrl: usersT.avatarUrl },
    })
    .from(events)
    .innerJoin(usersT, eq(events.actorId, usersT.id))
    .orderBy(desc(events.createdAt))
    .limit(15);

  return (
    <div>
      <Nav />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[280px_1fr_320px]">
        <aside className="space-y-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4">
            <div className="flex items-center gap-3">
              <Avatar name={user.username} src={user.avatarUrl} size={40} />
              <div>
                <div className="font-semibold">{user.name || user.username}</div>
                <div className="text-xs text-[var(--fg-muted)]">@{user.username}</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
              <h2 className="text-sm font-semibold">Your repositories</h2>
              <Link
                href="/new"
                className="flex h-7 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-2 text-xs hover:bg-[var(--bg)]"
              >
                <Plus size={12} /> New
              </Link>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {myRepos.length === 0 ? (
                <div className="p-4 text-xs text-[var(--fg-muted)]">
                  No repos yet.{" "}
                  <Link href="/new" className="text-[var(--accent)]">
                    Create one
                  </Link>
                  .
                </div>
              ) : (
                myRepos.map((r) => (
                  <Link
                    key={r.id}
                    href={`/${r.ownerName}/${r.name}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg-elev-2)]"
                  >
                    <BookMarked size={13} className="text-[var(--fg-dim)]" />
                    <span className="truncate">{r.name}</span>
                    {r.visibility === "private" && (
                      <Badge variant="private" className="ml-auto text-[10px]">
                        Private
                      </Badge>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>

        <main>
          <h1 className="mb-4 text-xl font-semibold">Home</h1>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-elev)]/50 p-10 text-center">
                <h3 className="text-base font-semibold">Welcome to Repo</h3>
                <p className="mt-2 text-sm text-[var(--fg-muted)]">
                  Create your first repo to get started.
                </p>
                <Link
                  href="/new"
                  className="mt-5 inline-flex h-9 items-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)]"
                >
                  <Plus size={14} /> New repository
                </Link>
              </div>
            ) : (
              recentEvents.map(({ e, u }) => (
                <div
                  key={e.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={u.username} src={u.avatarUrl} size={22} />
                    <Link href={`/${u.username}`} className="font-medium hover:text-[var(--accent)]">
                      {u.username}
                    </Link>
                    <span className="text-[var(--fg-muted)]">{describeEvent(e.type)}</span>
                    <span className="ml-auto text-xs text-[var(--fg-dim)]">
                      {formatRelative(e.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        <aside className="space-y-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
            <div className="border-b border-[var(--border)] px-4 py-2.5">
              <h2 className="text-sm font-semibold">Trending public repos</h2>
            </div>
            <div>
              {recentPublic.length === 0 ? (
                <div className="p-4 text-xs text-[var(--fg-muted)]">
                  Nothing trending yet — be the first.
                </div>
              ) : (
                recentPublic.map((r) => (
                  <Link
                    key={r.id}
                    href={`/${r.ownerName}/${r.name}`}
                    className="block border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--bg-elev-2)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {r.ownerName}/{r.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[var(--fg-muted)]">
                        <Star size={11} /> {formatNumber(r.starsCount)}
                      </div>
                    </div>
                    {r.description && (
                      <div className="mt-1 line-clamp-2 text-xs text-[var(--fg-muted)]">
                        {r.description}
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 text-xs text-[var(--fg-muted)]">
            <div className="mb-1 text-sm font-semibold text-[var(--fg)]">Quick start</div>
            Use the global &ldquo;<kbd className="rounded bg-[var(--bg-elev-2)] px-1">+</kbd>&rdquo; in
            the nav to create a new repo, then push:
            <pre className="mt-2 overflow-x-auto rounded-md bg-[var(--bg)] p-2 font-mono text-[11px] leading-5">
              {`git init -b main\ngit remote add origin <repo-url>\ngit add .\ngit commit -m "init"\ngit push -u origin main`}
            </pre>
          </div>
        </aside>
      </div>
    </div>
  );
}

function describeEvent(type: string): string {
  switch (type) {
    case "repo.create":
      return "created a repo";
    case "repo.push":
      return "pushed to a repo";
    case "issue.open":
      return "opened an issue";
    case "issue.close":
      return "closed an issue";
    case "pr.open":
      return "opened a pull request";
    case "pr.merge":
      return "merged a pull request";
    case "star":
      return "starred a repo";
    default:
      return type;
  }
}
