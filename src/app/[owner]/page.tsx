import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { users, repos } from "@/lib/db/schema";
import { eq, desc, and, or } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { formatRelative, formatNumber } from "@/lib/utils";
import { BookMarked, Star, GitBranch } from "lucide-react";

type Props = { params: Promise<{ owner: string }> };

export default async function ProfilePage({ params }: Props) {
  const { owner } = await params;
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.usernameLower, owner.toLowerCase()))
    .limit(1);
  const profile = userRows[0];
  if (!profile) notFound();

  const me = await getSessionUser();
  const isMe = me?.id === profile.id;

  const visibleRepos = await db
    .select()
    .from(repos)
    .where(
      and(
        eq(repos.ownerType, "user"),
        eq(repos.ownerId, profile.id),
        or(eq(repos.visibility, "public"), isMe ? eq(repos.ownerId, profile.id) : eq(repos.visibility, "public")),
      ),
    )
    .orderBy(desc(repos.updatedAt))
    .limit(50);

  return (
    <div>
      <Nav />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <div className="text-center md:text-left">
            <Avatar
              name={profile.username}
              src={profile.avatarUrl}
              size={160}
              className="mx-auto md:mx-0"
            />
            <h1 className="mt-4 text-xl font-semibold">{profile.name || profile.username}</h1>
            <div className="text-sm text-[var(--fg-muted)]">@{profile.username}</div>
            {profile.bio && <p className="mt-3 text-sm">{profile.bio}</p>}
            <div className="mt-3 text-xs text-[var(--fg-muted)]">
              Joined {formatRelative(profile.createdAt)}
            </div>
          </div>
        </aside>
        <main>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Repositories
              <span className="ml-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-2 py-0.5 text-xs text-[var(--fg-muted)]">
                {visibleRepos.length}
              </span>
            </h2>
            {isMe && (
              <Link
                href="/new"
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-fg)]"
              >
                New repository
              </Link>
            )}
          </div>
          {visibleRepos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-elev)]/50 p-10 text-center text-sm text-[var(--fg-muted)]">
              No public repositories yet.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
              {visibleRepos.map((r) => (
                <li key={r.id} className="p-4 hover:bg-[var(--bg-elev-2)]">
                  <div className="flex items-center gap-3">
                    <BookMarked size={14} className="text-[var(--fg-muted)]" />
                    <Link
                      href={`/${r.ownerName}/${r.name}`}
                      className="font-semibold text-[var(--accent)] hover:underline"
                    >
                      {r.name}
                    </Link>
                    {r.visibility === "private" && <Badge variant="private">Private</Badge>}
                    <span className="ml-auto flex items-center gap-3 text-xs text-[var(--fg-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Star size={11} /> {formatNumber(r.starsCount)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <GitBranch size={11} /> {r.defaultBranch}
                      </span>
                    </span>
                  </div>
                  {r.description && (
                    <p className="mt-1 text-sm text-[var(--fg-muted)]">{r.description}</p>
                  )}
                  <div className="mt-2 text-xs text-[var(--fg-dim)]">
                    Updated {formatRelative(r.updatedAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
