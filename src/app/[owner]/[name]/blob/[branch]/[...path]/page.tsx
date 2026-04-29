import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { RepoHeader } from "@/components/repo-header";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isStarred } from "@/lib/repo-data";
import { repoFsPath, readBlob, listBranches } from "@/lib/git";
import { Markdown } from "@/lib/markdown";
import { highlightCode, detectLang } from "@/lib/highlight";
import { ChevronRight, FileText, GitBranch } from "lucide-react";

type Props = {
  params: Promise<{ owner: string; name: string; branch: string; path: string[] }>;
};

export default async function BlobPage({ params }: Props) {
  const { owner, name, branch, path } = await params;
  const filePath = path.map((p) => decodeURIComponent(p)).join("/");
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) notFound();
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) notFound();

  const repoPath = repoFsPath(repo.ownerName, repo.name);
  const branches = await listBranches(repoPath);
  if (!branches.includes(branch)) notFound();
  const blob = await readBlob(repoPath, branch, filePath);
  if (!blob) notFound();

  const starred = user ? await isStarred(user.id, repo.id) : false;
  const base = `/${repo.ownerName}/${repo.name}`;
  const segments = filePath.split("/");
  const isMarkdown = filePath.toLowerCase().endsWith(".md");

  let html = "";
  if (!blob.binary) {
    const lang = detectLang(filePath);
    html = await highlightCode(blob.content.toString("utf8"), lang);
  }

  const rawHref = `${base}/raw/${branch}/${filePath}`;

  return (
    <div>
      <Nav />
      <RepoHeader repo={repo} starred={starred} loggedIn={!!user} />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elev)] px-3 text-xs">
            <GitBranch size={13} /> {branch}
          </span>
        </div>
        <div className="mb-3 flex items-center gap-1 text-sm">
          <Link href={`${base}/tree/${branch}`} className="text-[var(--accent)] hover:underline">
            {repo.name}
          </Link>
          {segments.map((seg, i) => {
            const upto = segments.slice(0, i + 1).join("/");
            const isLast = i === segments.length - 1;
            const isFile = isLast;
            return (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight size={12} className="text-[var(--fg-dim)]" />
                {isLast ? (
                  <span className="text-[var(--fg)]">{seg}</span>
                ) : (
                  <Link
                    href={
                      isFile
                        ? `${base}/blob/${branch}/${upto}`
                        : `${base}/tree/${branch}/${upto}`
                    }
                    className="text-[var(--accent)] hover:underline"
                  >
                    {seg}
                  </Link>
                )}
              </span>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
          <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-elev-2)] px-4 py-2 text-xs text-[var(--fg-muted)]">
            <FileText size={13} />
            <span>{filePath}</span>
            <span className="ml-auto">{blob.size.toLocaleString()} bytes</span>
            <a
              href={rawHref}
              className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 hover:bg-[var(--bg-elev)]"
            >
              Raw
            </a>
          </div>
          <div className="p-0">
            {blob.binary ? (
              <div className="p-6 text-center text-sm text-[var(--fg-muted)]">
                Binary file ({blob.size.toLocaleString()} bytes) — view raw to download.
              </div>
            ) : isMarkdown ? (
              <div className="p-6">
                <Markdown>{blob.content.toString("utf8")}</Markdown>
              </div>
            ) : (
              <div className="overflow-x-auto p-3 text-[13px]" dangerouslySetInnerHTML={{ __html: html }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
