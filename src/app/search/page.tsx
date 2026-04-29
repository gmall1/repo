import Link from "next/link";
import { Nav } from "@/components/nav";
import { db } from "@/lib/db";
import { repos, users, issues } from "@/lib/db/schema";
import { sql, eq, desc, and, or } from "drizzle-orm";
import { formatRelative, formatNumber } from "@/lib/utils";
import { BookMarked, Star, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { getSessionUser } from "@/lib/auth";

type Props = { searchParams: Promise<{ q?: string; type?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", type = "repos" } = await searchParams;
  const me = await getSessionUser();
  const ql = `%${q.toLowerCase()}%`;

  let repoResults: typeof repos.$inferSelect[] = [];
  let userResults: typeof users.$inferSelect[] = [];

  if (q.trim()) {
    if (type === "users") {
      userResults = await db
        .select()
        .from(users)
        .where(
          or(
            sql`lower(${users.username}) like ${ql}`,
            sql`lower(coalesce(${users.name}, '')) like ${ql}`,
          ),
        )
        .limit(50);
    } else {
      repoResults = await db
        .select()
        .from(repos)
        .where(
          and(
            eq(repos.visibility, "public"),
            or(
              sql`lower(${repos.name}) like ${ql}`,
              sql`lower(${repos.ownerName}) like ${ql}`,
              sql`lower(coalesce(${repos.description}, '')) like ${ql}`,
            ),
          ),
        )
        .orderBy(desc(repos.starsCount))
        .limit(50);
    }
  }

  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Search</h1>
        <form className="mt-4 flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search repos, users…"
            className="h-10 flex-1 rounded-md border border-[var(--border)] bg-[var(--bg-elev)] px-3 text-sm placeholder:text-[var(--fg-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <select
            name="type"
            defaultValue={type}
            className="h-10 rounded-md border border-[var(--border)] bg-[var(--bg-elev)] px-2 text-sm"
          >
            <option value="repos">Repositories</option>
            <option value="users">Users</option>
          </select>
          <button
            type="submit"
            className="h-10 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)]"
          >
            Search
          </button>
        </form>

        {!q.trim() ? (
          <p className="mt-10 text-center text-sm text-[var(--fg-muted)]">
            Type a query and hit search.
          </p>
        ) : type === "repos" ? (
          <div className="mt-6 space-y-3">
            <div className="text-xs text-[var(--fg-muted)]">
              {repoResults.length} repositor{repoResults.length === 1 ? "y" : "ies"}
            </div>
            {repoResults.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4"
              >
                <div className="flex items-center gap-2">
                  <BookMarked size={14} className="text-[var(--fg-muted)]" />
                  <Link
                    href={`/${r.ownerName}/${r.name}`}
                    className="font-semibold text-[var(--accent)] hover:underline"
                  >
                    {r.ownerName}/{r.name}
                  </Link>
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--fg-muted)]">
                    <Star size={11} /> {formatNumber(r.starsCount)}
                  </span>
                </div>
                {r.description && (
                  <p className="mt-1 text-sm text-[var(--fg-muted)]">{r.description}</p>
                )}
                <div className="mt-2 text-xs text-[var(--fg-dim)]">
                  Updated {formatRelative(r.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {userResults.map((u) => (
              <Link
                key={u.id}
                href={`/${u.username}`}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 hover:bg-[var(--bg-elev-2)]"
              >
                <Avatar name={u.username} src={u.avatarUrl} size={42} />
                <div>
                  <div className="font-semibold">{u.name || u.username}</div>
                  <div className="text-xs text-[var(--fg-muted)]">@{u.username}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
