import Link from "next/link";
import { Star, GitFork, Eye, BookMarked, Lock } from "lucide-react";
import { Badge } from "./ui/badge";
import { formatNumber } from "@/lib/utils";
import { StarButton } from "./star-button";
import type { Repo } from "@/lib/db/schema";

export function RepoHeader({
  repo,
  starred,
  loggedIn,
  active = "code",
}: {
  repo: Repo;
  starred: boolean;
  loggedIn: boolean;
  active?: "code" | "issues" | "pulls" | "settings";
}) {
  const base = `/${repo.ownerName}/${repo.name}`;
  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-elev)]">
      <div className="mx-auto max-w-7xl px-4 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          {repo.visibility === "private" ? (
            <Lock size={16} className="text-[var(--fg-muted)]" />
          ) : (
            <BookMarked size={16} className="text-[var(--fg-muted)]" />
          )}
          <h1 className="text-xl">
            <Link
              href={`/${repo.ownerName}`}
              className="text-[var(--accent)] hover:underline"
            >
              {repo.ownerName}
            </Link>
            <span className="mx-1 text-[var(--fg-muted)]">/</span>
            <Link href={base} className="font-semibold text-[var(--accent)] hover:underline">
              {repo.name}
            </Link>
          </h1>
          {repo.visibility === "private" && <Badge variant="private">Private</Badge>}
          <div className="ml-auto flex items-center gap-2">
            <button className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-3 text-xs hover:bg-[var(--bg)]">
              <Eye size={13} /> Watch
            </button>
            <StarButton
              repoId={repo.id}
              ownerName={repo.ownerName}
              name={repo.name}
              starred={starred}
              count={repo.starsCount}
              loggedIn={loggedIn}
            />
            <button className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-3 text-xs hover:bg-[var(--bg)]">
              <GitFork size={13} /> Fork{" "}
              <span className="rounded bg-[var(--bg)] px-1.5 text-[10px]">
                {formatNumber(repo.forksCount)}
              </span>
            </button>
          </div>
        </div>
        {repo.description && (
          <p className="mt-2 text-sm text-[var(--fg-muted)]">{repo.description}</p>
        )}
        <nav className="mt-4 flex gap-1 overflow-x-auto">
          {[
            { href: base, label: "Code", key: "code" },
            { href: `${base}/issues`, label: "Issues", key: "issues", count: repo.issuesCount },
            { href: `${base}/pulls`, label: "Pull requests", key: "pulls", count: repo.pullsCount },
            { href: `${base}/settings`, label: "Settings", key: "settings" },
          ].map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={
                "flex items-center gap-2 px-3 py-2 text-sm border-b-2 -mb-px " +
                (active === t.key
                  ? "border-[var(--accent)] text-[var(--fg)] font-medium"
                  : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]")
              }
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="rounded-full bg-[var(--bg-elev-2)] px-1.5 text-[10px]">
                  {formatNumber(t.count)}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
