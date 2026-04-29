import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { RepoHeader } from "@/components/repo-header";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isStarred } from "@/lib/repo-data";
import { db } from "@/lib/db";
import { pullRequests, users } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Avatar } from "@/components/ui/avatar";
import { formatRelative } from "@/lib/utils";
import { GitPullRequest, GitMerge, Plus, CircleCheck } from "lucide-react";

type Props = {
  params: Promise<{ owner: string; name: string }>;
  searchParams: Promise<{ state?: string }>;
};

export default async function PullsPage({ params, searchParams }: Props) {
  const { owner, name } = await params;
  const { state = "open" } = await searchParams;
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) notFound();
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) notFound();
  const starred = user ? await isStarred(user.id, repo.id) : false;

  const stateValue = state === "closed" ? "closed" : state === "merged" ? "merged" : "open";
  const list = await db
    .select({
      pr: pullRequests,
      author: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
    })
    .from(pullRequests)
    .innerJoin(users, eq(pullRequests.authorId, users.id))
    .where(and(eq(pullRequests.repoId, repo.id), eq(pullRequests.state, stateValue)))
    .orderBy(desc(pullRequests.createdAt))
    .limit(100);

  const base = `/${repo.ownerName}/${repo.name}`;
  return (
    <div>
      <Nav />
      <RepoHeader repo={repo} starred={starred} loggedIn={!!user} active="pulls" />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 overflow-hidden rounded-md border border-[var(--border)]">
            <Link
              href={`${base}/pulls?state=open`}
              className={`flex items-center gap-1.5 px-3 text-sm ${stateValue === "open" ? "bg-[var(--bg-elev-2)]" : "bg-[var(--bg-elev)] text-[var(--fg-muted)]"}`}
            >
              <GitPullRequest size={13} className="text-[var(--success)]" /> Open
            </Link>
            <Link
              href={`${base}/pulls?state=merged`}
              className={`flex items-center gap-1.5 border-l border-[var(--border)] px-3 text-sm ${stateValue === "merged" ? "bg-[var(--bg-elev-2)]" : "bg-[var(--bg-elev)] text-[var(--fg-muted)]"}`}
            >
              <GitMerge size={13} className="text-[var(--accent-2)]" /> Merged
            </Link>
            <Link
              href={`${base}/pulls?state=closed`}
              className={`flex items-center gap-1.5 border-l border-[var(--border)] px-3 text-sm ${stateValue === "closed" ? "bg-[var(--bg-elev-2)]" : "bg-[var(--bg-elev)] text-[var(--fg-muted)]"}`}
            >
              <CircleCheck size={13} /> Closed
            </Link>
          </div>
          <Link
            href={`${base}/pulls/new`}
            className="ml-auto flex h-9 items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 text-sm font-medium text-[var(--accent-fg)]"
          >
            <Plus size={14} /> New pull request
          </Link>
        </div>
        <ul className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] divide-y divide-[var(--border)]">
          {list.length === 0 && (
            <li className="p-12 text-center text-sm text-[var(--fg-muted)]">
              No {stateValue} pull requests.
            </li>
          )}
          {list.map(({ pr, author }) => (
            <li key={pr.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-elev-2)]">
              {pr.state === "open" ? (
                <GitPullRequest size={16} className="mt-0.5 text-[var(--success)]" />
              ) : pr.state === "merged" ? (
                <GitMerge size={16} className="mt-0.5 text-[var(--accent-2)]" />
              ) : (
                <CircleCheck size={16} className="mt-0.5 text-[var(--fg-muted)]" />
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`${base}/pulls/${pr.number}`}
                  className="block font-medium hover:text-[var(--accent)]"
                >
                  {pr.title}
                </Link>
                <div className="mt-1 text-xs text-[var(--fg-muted)]">
                  #{pr.number} opened {formatRelative(pr.createdAt)} by {author.username}
                  {" · "}
                  <span className="font-mono text-[var(--fg-dim)]">
                    {pr.headBranch} → {pr.baseBranch}
                  </span>
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
