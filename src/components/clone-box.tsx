"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";

export function CloneBox({ owner, name }: { owner: string; name: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/${owner}/${name}.git`;
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elev)] px-1 pl-3 max-w-full">
      <span className="font-mono text-xs text-[var(--fg-muted)] truncate">{url}</span>
      <button
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        title="Copy"
        className="ml-auto flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--bg-elev-2)]"
      >
        <Copy size={12} />
      </button>
      {copied && (
        <span className="pr-2 text-xs text-[var(--success)]">Copied</span>
      )}
    </div>
  );
}
