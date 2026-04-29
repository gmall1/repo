import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { RepoHeader } from "@/components/repo-header";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isStarred } from "@/lib/repo-data";
import { repoFsPath, getCommit, diff, runGit } from "@/lib/git";
import { DiffView } from "@/components/diff-view";
import { formatRelative } from "@/lib/utils";

type Props = { params: Promise<{ owner: string; name: string; sha: string }> };

export default async function CommitPage({ params }: Props) {
  const { owner, name, sha } = await params;
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) notFound();
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) notFound();

  const repoPath = repoFsPath(repo.ownerName, repo.name);
  const commit = await getCommit(repoPath, sha);
  if (!commit) notFound();
  const parentR = await runGit(["rev-parse", `${sha}^`], { cwd: repoPath });
  const parent = parentR.code === 0 ? parentR.stdout.toString("utf8").trim() : null;
  const files = parent ? await diff(repoPath, parent, sha) : [];
  const starred = user ? await isStarred(user.id, repo.id) : false;
  const totalAdd = files.reduce((a, f) => a + f.additions, 0);
  const totalDel = files.reduce((a, f) => a + f.deletions, 0);

  return (
    <div>
      <Nav />
      <RepoHeader repo={repo} starred={starred} loggedIn={!!user} />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4">
          <h2 className="text-lg font-semibold">{commit.message.split("\n")[0]}</h2>
          {commit.message.split("\n").slice(1).join("\n").trim() && (
            <pre className="mt-2 whitespace-pre-wrap text-sm text-[var(--fg-muted)]">
              {commit.message.split("\n").slice(1).join("\n").trim()}
            </pre>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--fg-muted)]">
            <span>
              <strong>{commit.authorName}</strong> &lt;{commit.authorEmail}&gt;
            </span>
            <span>committed {formatRelative(commit.date)}</span>
            <span className="ml-auto rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-2 py-0.5 font-mono">
              {commit.sha}
            </span>
          </div>
        </div>
        <div className="mb-3 flex items-center gap-3 text-xs text-[var(--fg-muted)]">
          <span>
            {files.length} file{files.length === 1 ? "" : "s"} changed
          </span>
          <span className="text-[var(--success)]">+{totalAdd}</span>
          <span className="text-[var(--danger)]">−{totalDel}</span>
        </div>
        <DiffView files={files} />
      </div>
    </div>
  );
}
