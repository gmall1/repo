import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { RepoHeader } from "@/components/repo-header";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isStarred } from "@/lib/repo-data";
import { repoFsPath, listBranches, lsTree, readmeFor, isEmpty, listCommits } from "@/lib/git";
import { Markdown } from "@/lib/markdown";
import { CodeIcon, FileText, Folder, GitBranch, Clock, Copy } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { CloneBox } from "@/components/clone-box";

type Props = { params: Promise<{ owner: string; name: string }> };

export default async function RepoHome({ params }: Props) {
  const { owner, name } = await params;
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) notFound();
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) notFound();

  const path = repoFsPath(repo.ownerName, repo.name);
  const empty = await isEmpty(path);
  const starred = user ? await isStarred(user.id, repo.id) : false;

  return (
    <div>
      <Nav />
      <RepoHeader repo={repo} starred={starred} loggedIn={!!user} />
      <div className="mx-auto max-w-7xl px-4 py-6">
        {empty ? <EmptyRepo owner={repo.ownerName} name={repo.name} /> : await CodeView({ repo, path })}
      </div>
    </div>
  );
}

async function CodeView({ repo, path }: { repo: Awaited<ReturnType<typeof getRepoByOwnerAndName>> & {}; path: string }) {
  const branches = await listBranches(path);
  const branch = branches.includes(repo.defaultBranch) ? repo.defaultBranch : branches[0] ?? "main";
  const tree = await lsTree(path, branch, "");
  const readme = await readmeFor(path, branch);
  const commits = await listCommits(path, branch, { limit: 1 });
  const lastCommit = commits[0];

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Link
          href={`/${repo.ownerName}/${repo.name}/tree/${branch}`}
          className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elev)] px-3 text-xs hover:bg-[var(--bg-elev-2)]"
        >
          <GitBranch size={13} /> {branch}
        </Link>
        <span className="text-xs text-[var(--fg-muted)]">
          {branches.length} {branches.length === 1 ? "branch" : "branches"}
        </span>
        <Link
          href={`/${repo.ownerName}/${repo.name}/commits/${branch}`}
          className="ml-auto flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elev)] px-3 text-xs hover:bg-[var(--bg-elev-2)]"
        >
          <Clock size={13} /> History
        </Link>
        <CloneBox owner={repo.ownerName} name={repo.name} />
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
        {lastCommit && (
          <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-elev-2)] px-4 py-2.5 text-sm">
            <Link
              href={`/${repo.ownerName}/${repo.name}/commit/${lastCommit.sha}`}
              className="font-mono text-xs text-[var(--accent)] hover:underline"
            >
              {lastCommit.sha.slice(0, 7)}
            </Link>
            <span className="truncate">{lastCommit.message}</span>
            <span className="ml-auto text-xs text-[var(--fg-muted)]">
              {formatRelative(lastCommit.date)}
            </span>
          </div>
        )}
        <ul className="divide-y divide-[var(--border)]">
          {tree.map((e) => (
            <li
              key={e.name}
              className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-[var(--bg-elev-2)]"
            >
              {e.type === "tree" ? (
                <Folder size={14} className="text-[var(--accent-2)]" />
              ) : (
                <FileText size={14} className="text-[var(--fg-muted)]" />
              )}
              <Link
                href={`/${repo.ownerName}/${repo.name}/${e.type === "tree" ? "tree" : "blob"}/${branch}/${e.name}`}
                className="flex-1 truncate hover:text-[var(--accent)]"
              >
                {e.name}
              </Link>
              {e.size !== undefined && (
                <span className="text-xs text-[var(--fg-dim)]">{formatBytes(e.size)}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {readme && (
        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
            <FileText size={14} className="text-[var(--fg-muted)]" />
            <span className="text-sm font-medium">{readme.path}</span>
          </div>
          <div className="p-6">
            <Markdown>{readme.content}</Markdown>
          </div>
        </div>
      )}
    </>
  );
}

function EmptyRepo({ owner, name }: { owner: string; name: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">Quick setup</h2>
      <p className="mt-1 text-sm text-[var(--fg-muted)]">
        Get started by pushing an existing project, or create one from scratch.
      </p>
      <div className="mt-4 max-w-2xl">
        <CloneBox owner={owner} name={name} />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-5">
          <div className="text-sm font-semibold">Push an existing repo</div>
          <pre className="mt-3 overflow-x-auto rounded-md bg-[var(--bg)] p-3 font-mono text-xs leading-5">
            {`git remote add origin <url>\ngit push -u origin main`}
          </pre>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-5">
          <div className="text-sm font-semibold">Create from scratch</div>
          <pre className="mt-3 overflow-x-auto rounded-md bg-[var(--bg)] p-3 font-mono text-xs leading-5">
            {`echo "# ${name}" > README.md\ngit init -b main\ngit add . && git commit -m "init"\ngit remote add origin <url>\ngit push -u origin main`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
