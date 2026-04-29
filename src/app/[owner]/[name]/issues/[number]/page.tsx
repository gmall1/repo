import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { RepoHeader } from "@/components/repo-header";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isStarred } from "@/lib/repo-data";
import { db } from "@/lib/db";
import { issues, issueComments, users, issueLabels, labels } from "@/lib/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { Markdown } from "@/lib/markdown";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CircleDot, CircleCheck } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { CommentForm } from "./comment-form";
import { IssueActions } from "./issue-actions";

type Props = { params: Promise<{ owner: string; name: string; number: string }> };

export default async function IssueDetail({ params }: Props) {
  const { owner, name, number } = await params;
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) notFound();
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) notFound();
  const starred = user ? await isStarred(user.id, repo.id) : false;

  const num = Number(number);
  if (!Number.isInteger(num)) notFound();

  const issueRows = await db
    .select({
      issue: issues,
      author: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
    })
    .from(issues)
    .innerJoin(users, eq(issues.authorId, users.id))
    .where(and(eq(issues.repoId, repo.id), eq(issues.number, num)))
    .limit(1);
  const data = issueRows[0];
  if (!data) notFound();
  const issue = data.issue;

  const comments = await db
    .select({
      comment: issueComments,
      author: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
    })
    .from(issueComments)
    .innerJoin(users, eq(issueComments.authorId, users.id))
    .where(eq(issueComments.issueId, issue.id))
    .orderBy(asc(issueComments.createdAt));

  const labelLinks = await db
    .select({ labelId: issueLabels.labelId })
    .from(issueLabels)
    .where(eq(issueLabels.issueId, issue.id));
  const labelIds = labelLinks.map((l) => l.labelId);
  const issueLabelRows = labelIds.length
    ? await db.select().from(labels).where(inArray(labels.id, labelIds))
    : [];

  const isOwnerOrAuthor = user && (user.id === repo.ownerId || user.id === issue.authorId);

  return (
    <div>
      <Nav />
      <RepoHeader repo={repo} starred={starred} loggedIn={!!user} active="issues" />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-2 flex items-start gap-3">
          <h1 className="text-2xl font-semibold">
            {issue.title}{" "}
            <span className="text-[var(--fg-muted)]">#{issue.number}</span>
          </h1>
        </div>
        <div className="mb-5 flex items-center gap-2">
          {issue.state === "open" ? (
            <Badge variant="open">
              <CircleDot size={11} /> Open
            </Badge>
          ) : (
            <Badge variant="closed">
              <CircleCheck size={11} /> Closed
            </Badge>
          )}
          <span className="text-sm text-[var(--fg-muted)]">
            <strong>{data.author.username}</strong> opened {formatRelative(issue.createdAt)}
          </span>
          <div className="ml-auto flex flex-wrap gap-1">
            {issueLabelRows.map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  background: l.color + "22",
                  color: l.color,
                  border: `1px solid ${l.color}55`,
                }}
              >
                {l.name}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-elev-2)] px-4 py-2 text-xs">
            <Avatar name={data.author.username} src={data.author.avatarUrl} size={20} />
            <span>
              <strong>{data.author.username}</strong> commented {formatRelative(issue.createdAt)}
            </span>
          </div>
          <div className="p-5">
            {issue.body ? (
              <Markdown>{issue.body}</Markdown>
            ) : (
              <span className="text-sm text-[var(--fg-muted)]">No description.</span>
            )}
          </div>
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
              canClose={!!isOwnerOrAuthor}
              isOpen={issue.state === "open"}
            />
          ) : (
            <div className="rounded-md border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--fg-muted)]">
              <a href={`/login?next=/${owner}/${name}/issues/${number}`} className="text-[var(--accent)]">
                Sign in
              </a>{" "}
              to comment.
            </div>
          )}
          {isOwnerOrAuthor && (
            <IssueActions
              owner={owner}
              name={name}
              number={num}
              isOpen={issue.state === "open"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
