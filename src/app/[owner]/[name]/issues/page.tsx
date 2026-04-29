import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { RepoHeader } from "@/components/repo-header";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isStarred } from "@/lib/repo-data";
import { db } from "@/lib/db";
import { issues, users } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Avatar } from "@/components/ui/avatar";
import { formatRelative } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertCircle, CircleDot, CircleCheck } from "lucide-react";

type Props = {
  params: Promise<{ owner: string; name: string }>;
  searchParams: Promise<{ state?: string }>;
};

export default async function IssuesPage({ params, searchParams }: Props) {
  const { owner, name } = await params;
  const { state = "open" } = await searchParams;
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) notFound();
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) notFound();
  const starred = user ? await isStarred(user.id, repo.id) : false;

  const stateValue = state === "closed" ? "closed" : "open";
  const list = await db
    .select({
      issue: issues,
      author: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
    })
    .from(issues)
    .innerJoin(users, eq(issues.authorId, users.id))
    .where(and(eq(issues.repoId, repo.id), eq(issues.state, stateValue)))
    .orderBy(desc(issues.createdAt))
    .limit(100);

  const base = `/${repo.ownerName}/${repo.name}`;
  return (
    <div>
      <Nav />
      <RepoHeader repo={repo} starred={starred} loggedIn={!!user} active="issues" />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 overflow-hidden rounded-md border border-[var(--border)]">
            <Link
              href={`${base}/issues?state=open`}
              className={`flex items-center gap-1.5 px-3 text-sm ${stateValue === "open" ? "bg-[var(--bg-elev-2)]" : "bg-[var(--bg-elev)] text-[var(--fg-muted)]"}`}
            >
              <CircleDot size={13} className="text-[var(--success)]" /> Open
            </Link>
            <Link
              href={`${base}/issues?state=closed`}
              className={`flex items-center gap-1.5 border-l border-[var(--border)] px-3 text-sm ${stateValue === "closed" ? "bg-[var(--bg-elev-2)]" : "bg-[var(--bg-elev)] text-[var(--fg-muted)]"}`}
            >
              <CircleCheck size={13} /> Closed
            </Link>
          </div>
          <Link
            href={`${base}/issues/new`}
            className="ml-auto flex h-9 items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 text-sm font-medium text-[var(--accent-fg)]"
          >
            <Plus size={14} /> New issue
          </Link>
        </div>
        <ul className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] divide-y divide-[var(--border)]">
          {list.length === 0 && (
            <li className="p-12 text-center text-sm text-[var(--fg-muted)]">
              No {stateValue} issues. Be the first to{" "}
              <Link href={`${base}/issues/new`} className="text-[var(--accent)]">
                open one
              </Link>
              .
            </li>
          )}
          {list.map(({ issue: i, author }) => (
            <li key={i.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-elev-2)]">
              {i.state === "open" ? (
                <CircleDot size={16} className="mt-0.5 text-[var(--success)]" />
              ) : (
                <CircleCheck size={16} className="mt-0.5 text-[var(--accent-2)]" />
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`${base}/issues/${i.number}`}
                  className="block font-medium hover:text-[var(--accent)]"
                >
                  {i.title}
                </Link>
                <div className="mt-1 text-xs text-[var(--fg-muted)]">
                  #{i.number} opened {formatRelative(i.createdAt)} by {author.username}
                </div>
              </div>
              <Avatar name={author.username} src={author.avatarUrl} size={20} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
