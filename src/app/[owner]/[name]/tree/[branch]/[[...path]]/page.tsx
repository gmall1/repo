import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { RepoHeader } from "@/components/repo-header";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isStarred } from "@/lib/repo-data";
import { repoFsPath, lsTree, listCommits, readmeFor, listBranches } from "@/lib/git";
import { Markdown } from "@/lib/markdown";
import { Folder, FileText, GitBranch, ChevronRight } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { CloneBox } from "@/components/clone-box";

type Props = {
  params: Promise<{ owner: string; name: string; branch: string; path?: string[] }>;
};

export default async function TreePage({ params }: Props) {
  const { owner, name, branch, path: rawPath = [] } = await params;
  const subPath = rawPath.map((p) => decodeURIComponent(p)).join("/");
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) notFound();
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) notFound();

  const path = repoFsPath(repo.ownerName, repo.name);
  const branches = await listBranches(path);
  if (!branches.includes(branch)) notFound();

  const tree = await lsTree(path, branch, subPath);
  if (!tree.length && subPath) notFound();

  const lastCommits = await listCommits(path, branch, { limit: 1, subPath: subPath || undefined });
  const last = lastCommits[0];
  const readme = subPath ? null : await readmeFor(path, branch);
  const starred = user ? await isStarred(user.id, repo.id) : false;

  const segments = subPath ? subPath.split("/") : [];
  const base = `/${repo.ownerName}/${repo.name}`;

  return (
    <div>
      <Nav />
      <RepoHeader repo={repo} starred={starred} loggedIn={!!user} />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elev)] px-3 text-xs">
            <GitBranch size={13} /> {branch}
          </span>
          <span className="ml-auto" />
          <CloneBox owner={repo.ownerName} name={repo.name} />
        </div>

        {segments.length > 0 && (
          <div className="mb-3 flex items-center gap-1 text-sm">
            <Link href={`${base}/tree/${branch}`} className="text-[var(--accent)] hover:underline">
              {repo.name}
            </Link>
            {segments.map((seg, i) => {
              const upto = segments.slice(0, i + 1).join("/");
              const isLast = i === segments.length - 1;
              return (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight size={12} className="text-[var(--fg-dim)]" />
                  {isLast ? (
                    <span className="text-[var(--fg)]">{seg}</span>
                  ) : (
                    <Link
                      href={`${base}/tree/${branch}/${upto}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      {seg}
                    </Link>
                  )}
                </span>
              );
            })}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
          {last && (
            <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-elev-2)] px-4 py-2.5 text-sm">
              <Link
                href={`${base}/commit/${last.sha}`}
                className="font-mono text-xs text-[var(--accent)] hover:underline"
              >
                {last.sha.slice(0, 7)}
              </Link>
              <span className="truncate">{last.message}</span>
              <span className="ml-auto text-xs text-[var(--fg-muted)]">
                {formatRelative(last.date)}
              </span>
            </div>
          )}
          <ul className="divide-y divide-[var(--border)]">
            {segments.length > 0 && (
              <li className="px-4 py-2 text-sm">
                <Link
                  href={
                    segments.length === 1
                      ? `${base}/tree/${branch}`
                      : `${base}/tree/${branch}/${segments.slice(0, -1).join("/")}`
                  }
                  className="text-[var(--fg-muted)] hover:text-[var(--accent)]"
                >
                  ..
                </Link>
              </li>
            )}
            {tree.map((e) => {
              const fullPath = subPath ? `${subPath}/${e.name}` : e.name;
              return (
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
                    href={`${base}/${e.type === "tree" ? "tree" : "blob"}/${branch}/${fullPath}`}
                    className="flex-1 truncate hover:text-[var(--accent)]"
                  >
                    {e.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {readme && (
          <div className="mt-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
            <div className="border-b border-[var(--border)] px-4 py-2.5 text-sm font-medium">
              {readme.path}
            </div>
            <div className="p-6">
              <Markdown>{readme.content}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
