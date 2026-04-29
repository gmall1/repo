import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { RepoHeader } from "@/components/repo-header";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isStarred } from "@/lib/repo-data";
import { db } from "@/lib/db";
import { pullRequests, prComments, users } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { Markdown } from "@/lib/markdown";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GitPullRequest, GitMerge, CircleCheck, Bot, Sparkles } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { repoFsPath, mergeBase, diff } from "@/lib/git";
import { DiffView } from "@/components/diff-view";
import { CommentForm } from "../../issues/[number]/comment-form";
import { PRActions } from "./pr-actions";

type Props = { params: Promise<{ owner: string; name: string; number: string }> };

export default async function PRDetail({ params }: Props) {
  const { owner, name, number } = await params;
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) notFound();
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) notFound();
  const starred = user ? await isStarred(user.id, repo.id) : false;
  const num = Number(number);
  if (!Number.isInteger(num)) notFound();

  const prRows = await db
    .select({
      pr: pullRequests,
      author: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
    })
    .from(pullRequests)
    .innerJoin(users, eq(pullRequests.authorId, users.id))
    .where(and(eq(pullRequests.repoId, repo.id), eq(pullRequests.number, num)))
    .limit(1);
  const data = prRows[0];
  if (!data) notFound();
  const pr = data.pr;

  const comments = await db
    .select({
      comment: prComments,
      author: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
    })
    .from(prComments)
    .innerJoin(users, eq(prComments.authorId, users.id))
    .where(eq(prComments.prId, pr.id))
    .orderBy(asc(prComments.createdAt));

  const repoPath = repoFsPath(repo.ownerName, repo.name);
  const mb = await mergeBase(repoPath, pr.baseBranch, pr.headBranch);
  const files = mb ? await diff(repoPath, pr.baseBranch, pr.headBranch) : [];
  const totalAdd = files.reduce((a, f) => a + f.additions, 0);
  const totalDel = files.reduce((a, f) => a + f.deletions, 0);

  const isOwner = user && user.id === repo.ownerId;
  const isAuthor = user && user.id === pr.authorId;

  return (
    <div>
      <Nav />
      <RepoHeader repo={repo} starred={starred} loggedIn={!!user} active="pulls" />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold">
          {pr.title} <span className="text-[var(--fg-muted)]">#{pr.number}</span>
        </h1>
        <div className="mt-2 mb-5 flex flex-wrap items-center gap-2">
          {pr.state === "open" ? (
            <Badge variant="open">
              <GitPullRequest size={11} /> Open
            </Badge>
          ) : pr.state === "merged" ? (
            <Badge variant="merged">
              <GitMerge size={11} /> Merged
            </Badge>
          ) : (
            <Badge variant="closed">
              <CircleCheck size={11} /> Closed
            </Badge>
          )}
          <span className="text-sm text-[var(--fg-muted)]">
            <strong>{data.author.username}</strong> wants to merge into{" "}
            <span className="font-mono">{pr.baseBranch}</span> from{" "}
            <span className="font-mono">{pr.headBranch}</span> · opened{" "}
            {formatRelative(pr.createdAt)}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-elev-2)] px-4 py-2 text-xs">
            <Avatar name={data.author.username} src={data.author.avatarUrl} size={20} />
            <span>
              <strong>{data.author.username}</strong> opened {formatRelative(pr.createdAt)}
            </span>
          </div>
          <div className="p-5">
            {pr.body ? (
              <Markdown>{pr.body}</Markdown>
            ) : (
              <span className="text-sm text-[var(--fg-muted)]">No description.</span>
            )}
          </div>
        </div>

        {(pr.aiSummary || pr.aiReview) && (
          <div className="mt-4 rounded-xl border border-[var(--accent-2)]/40 bg-gradient-to-br from-[var(--bg-elev)] to-[var(--bg-elev-2)]">
            <div className="flex items-center gap-2 border-b border-[var(--accent-2)]/30 px-4 py-2 text-xs">
              <Bot size={13} className="text-[var(--accent-2)]" />
              <strong className="text-[var(--accent-2)]">Repo AI</strong>
              <span className="text-[var(--fg-muted)]">— summary & review</span>
            </div>
            <div className="p-5">
              {pr.aiSummary && (
                <div className="mb-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--fg-muted)]">
                    <Sparkles size={11} /> Summary
                  </div>
                  <Markdown>{pr.aiSummary}</Markdown>
                </div>
              )}
              {pr.aiReview && (
                <div>
                  <div className="mb-2 text-xs font-semibold text-[var(--fg-muted)]">Review</div>
                  <Markdown>{pr.aiReview}</Markdown>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-3 text-base font-semibold">
            Diff{" "}
            <span className="text-xs font-normal text-[var(--fg-muted)]">
              ({files.length} files,{" "}
              <span className="text-[var(--success)]">+{totalAdd}</span>{" "}
              <span className="text-[var(--danger)]">−{totalDel}</span>)
            </span>
          </h2>
          <DiffView files={files} />
        </div>

        <div className="mt-6 space-y-4">
          {comments.map(({ comment: c, author }) => (
            <div key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
              <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-elev-2)] px-4 py-2 text-xs">
                <Avatar name={author.username} src={author.avatarUrl} size={20} />
                <span>
                  <strong>{author.username}</strong> commented {formatRelative(c.createdAt)}
                </span>
              </div>
              <div className="p-5">
                <Markdown>{c.body}</Markdown>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          {user ? (
            <CommentForm
              owner={owner}
              name={name}
              number={num}
              canClose={false}
              isOpen={pr.state === "open"}
            />
          ) : (
            <div className="rounded-md border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--fg-muted)]">
              <a href={`/login?next=/${owner}/${name}/pulls/${number}`} className="text-[var(--accent)]">
                Sign in
              </a>{" "}
              to comment.
            </div>
          )}
          {(isOwner || isAuthor) && (
            <PRActions
              owner={owner}
              name={name}
              number={num}
              state={pr.state}
              isOwner={!!isOwner}
            />
          )}
        </div>
      </div>
    </div>
  );
}
