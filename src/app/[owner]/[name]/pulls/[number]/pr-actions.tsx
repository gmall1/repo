"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PRActions({
  owner,
  name,
  number,
  state,
  isOwner,
}: {
  owner: string;
  name: string;
  number: number;
  state: "open" | "merged" | "closed";
  isOwner: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function action(act: "merge" | "close" | "reopen") {
    setError(null);
    setBusy(act);
    try {
      const res = await fetch(`/api/repos/${owner}/${name}/pulls/${number}/${act}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      window.location.reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
      setBusy(null);
    }
  }

  return (
    <div className="mt-3">
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      <div className="flex justify-end gap-2">
        {state === "open" && isOwner && (
          <Button variant="success" onClick={() => action("merge")} disabled={!!busy}>
            {busy === "merge" ? "Merging…" : "Merge pull request"}
          </Button>
        )}
        {state === "open" && (
          <Button variant="danger" onClick={() => action("close")} disabled={!!busy}>
            {busy === "close" ? "Closing…" : "Close pull request"}
          </Button>
        )}
        {state === "closed" && (
          <Button variant="secondary" onClick={() => action("reopen")} disabled={!!busy}>
            {busy === "reopen" ? "Reopening…" : "Reopen"}
          </Button>
        )}
      </div>
    </div>
  );
}
