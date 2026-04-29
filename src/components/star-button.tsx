"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";
import { formatNumber } from "@/lib/utils";

export function StarButton({
  repoId,
  ownerName,
  name,
  starred: initial,
  count: initialCount,
  loggedIn,
}: {
  repoId: string;
  ownerName: string;
  name: string;
  starred: boolean;
  count: number;
  loggedIn: boolean;
}) {
  const [starred, setStarred] = useState(initial);
  const [count, setCount] = useState(initialCount);
  const [, startTransition] = useTransition();

  function toggle() {
    if (!loggedIn) {
      window.location.href = `/login?next=/${ownerName}/${name}`;
      return;
    }
    const next = !starred;
    setStarred(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      await fetch(`/api/repos/${ownerName}/${name}/star`, {
        method: next ? "POST" : "DELETE",
      });
    });
    void repoId;
  }

  return (
    <button
      onClick={toggle}
      className={
        "flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs " +
        (starred
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/15"
          : "border-[var(--border)] bg-[var(--bg-elev-2)] hover:bg-[var(--bg)]")
      }
    >
      <Star size={13} fill={starred ? "currentColor" : "none"} />
      {starred ? "Starred" : "Star"}
      <span className="rounded bg-black/20 px-1.5 text-[10px]">{formatNumber(count)}</span>
    </button>
  );
}
