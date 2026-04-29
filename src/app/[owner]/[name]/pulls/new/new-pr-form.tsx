"use client";

import { useEffect, useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewPRForm({
  owner,
  name,
  branches,
  baseBranch,
  headBranch,
  commitCount,
  fileCount,
  additions,
  deletions,
  firstCommitTitle,
}: {
  owner: string;
  name: string;
  branches: string[];
  baseBranch: string;
  headBranch: string;
  commitCount: number;
  fileCount: number;
  additions: number;
  deletions: number;
  firstCommitTitle: string;
}) {
  const [title, setTitle] = useState(firstCommitTitle || `Merge ${headBranch} into ${baseBranch}`);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function changeBranch(role: "base" | "head", v: string) {
    const url = new URL(window.location.href);
    url.searchParams.set(role, v);
    window.location.href = url.toString();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/repos/${owner}/${name}/pulls`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body, baseBranch, headBranch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      window.location.href = `/${owner}/${name}/pulls/${data.number}`;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[var(--fg-muted)]">Base:</span>
          <select
            value={baseBranch}
            onChange={(e) => changeBranch("base", e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-2 py-1 text-sm"
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <span className="text-[var(--fg-muted)]">←</span>
          <span className="text-[var(--fg-muted)]">Compare:</span>
          <select
            value={headBranch}
            onChange={(e) => changeBranch("head", e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-2 py-1 text-sm"
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <span className="ml-auto text-xs text-[var(--fg-muted)]">
            {commitCount} commits · {fileCount} files ·{" "}
            <span className="text-[var(--success)]">+{additions}</span>{" "}
            <span className="text-[var(--danger)]">−{deletions}</span>
          </span>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-5">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={300} />
        </div>
        <div>
          <Label>Description (markdown)</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
        </div>
        {error && <div className="text-sm text-[var(--danger)]">{error}</div>}
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--fg-muted)]">
            AI will summarize and review this PR after creation.
          </p>
          <Button type="submit" disabled={loading || baseBranch === headBranch}>
            {loading ? "Creating…" : "Create pull request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
