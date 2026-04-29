"use client";

import { useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RepoSettingsForm({
  owner,
  name,
  description: initDesc,
  visibility: initVis,
}: {
  owner: string;
  name: string;
  description: string;
  visibility: "public" | "private";
}) {
  const [description, setDescription] = useState(initDesc);
  const [visibility, setVisibility] = useState(initVis);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/repos/${owner}/${name}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description, visibility }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSavedAt(Date.now());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function del() {
    if (!confirm(`Delete ${owner}/${name}? This cannot be undone.`)) return;
    if (prompt(`Type ${name} to confirm`) !== name) return;
    const res = await fetch(`/api/repos/${owner}/${name}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete");
      return;
    }
    window.location.href = `/${owner}`;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-5">
        <h3 className="text-base font-semibold">General</h3>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Visibility</Label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "public" | "private")}
              className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-3 text-sm"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          {error && <div className="text-sm text-[var(--danger)]">{error}</div>}
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={loading}>
              {loading ? "Saving…" : "Save changes"}
            </Button>
            {savedAt && <span className="text-xs text-[var(--success)]">Saved.</span>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--bg-elev)] p-5">
        <h3 className="text-base font-semibold text-[var(--danger)]">Danger zone</h3>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Permanently delete this repository, its issues, and pull requests. This action cannot be
          undone.
        </p>
        <Button variant="danger" className="mt-4" onClick={del}>
          Delete this repository
        </Button>
      </div>
    </div>
  );
}
