import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { RepoHeader } from "@/components/repo-header";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isStarred } from "@/lib/repo-data";
import { repoFsPath, listCommits, listBranches } from "@/lib/git";
import { formatRelative } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

type Props = { params: Promise<{ owner: string; name: string; branch: string }> };

export default async function CommitsPage({ params }: Props) {
  const { owner, name, branch } = await params;
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) notFound();
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) notFound();

  const repoPath = repoFsPath(repo.ownerName, repo.name);
  const branches = await listBranches(repoPath);
  if (!branches.includes(branch)) notFound();
  const commits = await listCommits(repoPath, branch, { limit: 100 });
  const starred = user ? await isStarred(user.id, repo.id) : false;
  const base = `/${repo.ownerName}/${repo.name}`;

  return (
    <div>
      <Nav />
      <RepoHeader repo={repo} starred={starred} loggedIn={!!user} />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h2 className="mb-4 text-base font-semibold">Commits on {branch}</h2>
        <ul className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] divide-y divide-[var(--border)]">
          {commits.length === 0 && (
            <li className="p-8 text-center text-sm text-[var(--fg-muted)]">No commits yet.</li>
          )}
          {commits.map((c) => (
            <li key={c.sha} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--bg-elev-2)]">
              <Avatar name={c.authorName || c.authorEmail} size={28} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`${base}/commit/${c.sha}`}
                  className="block truncate font-medium hover:text-[var(--accent)]"
                >
                  {c.message.split("\n")[0]}
                </Link>
                <div className="text-xs text-[var(--fg-muted)]">
                  {c.authorName} committed {formatRelative(c.date)}
                </div>
              </div>
              <Link
                href={`${base}/commit/${c.sha}`}
                className="rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-2 py-1 font-mono text-xs hover:bg-[var(--bg)]"
              >
                {c.sha.slice(0, 7)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
