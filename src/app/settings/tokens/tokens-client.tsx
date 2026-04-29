"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatRelative } from "@/lib/utils";

export function TokensClient({
  existing,
}: {
  existing: { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null }[];
}) {
  const [name, setName] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [tokens, setTokens] = useState(existing);
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      alert(data.error || "Failed");
      return;
    }
    setCreated(data.token);
    setTokens([
      {
        id: data.id,
        name,
        prefix: data.prefix,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      },
      ...tokens,
    ]);
    setName("");
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this token? Any clients using it will stop working.")) return;
    const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
    if (res.ok) setTokens(tokens.filter((t) => t.id !== id));
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-5">
        <h3 className="text-sm font-semibold">Generate new token</h3>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="What's this for? e.g. macbook"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
          />
          <Button onClick={create} disabled={!name.trim() || loading}>
            {loading ? "Generating…" : "Generate"}
          </Button>
        </div>
        {created && (
          <div className="mt-4 rounded-md border border-[var(--success)]/40 bg-[rgba(63,185,80,0.08)] p-3">
            <div className="text-xs text-[var(--success)]">
              Copy your token now — you won&apos;t see it again.
            </div>
            <code className="mt-2 block break-all rounded bg-black/30 p-2 font-mono text-xs">
              {created}
            </code>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
        <div className="border-b border-[var(--border)] px-4 py-2 text-xs text-[var(--fg-muted)]">
          {tokens.length} token{tokens.length === 1 ? "" : "s"}
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {tokens.length === 0 ? (
            <li className="p-6 text-center text-sm text-[var(--fg-muted)]">
              No tokens yet.
            </li>
          ) : (
            tokens.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-[var(--fg-muted)] font-mono">
                    {t.prefix}…
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--fg-dim)]">
                    Created {formatRelative(t.createdAt)}
                    {t.lastUsedAt
                      ? ` · last used ${formatRelative(t.lastUsedAt)}`
                      : " · never used"}
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={() => revoke(t.id)}>
                  Revoke
                </Button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
