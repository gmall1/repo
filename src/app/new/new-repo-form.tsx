"use client";

import { useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewRepoForm({ username }: { username: string }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [initReadme, setInitReadme] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description, visibility, initReadme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      window.location.href = `/${username}/${name}`;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Owner / Name</Label>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-3 py-2 text-sm font-mono text-[var(--fg-muted)]">
            {username}/
          </span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-awesome-project"
            required
            pattern="[a-zA-Z0-9][a-zA-Z0-9_\-]*"
            maxLength={64}
          />
        </div>
      </div>
      <div>
        <Label>Description (optional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What does this repo do?"
        />
      </div>
      <div>
        <Label>Visibility</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setVisibility("public")}
            className={`rounded-md border p-3 text-left text-sm ${visibility === "public" ? "border-[var(--accent)] bg-[var(--bg-elev-2)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"}`}
          >
            <div className="font-medium">Public</div>
            <div className="text-xs text-[var(--fg-muted)]">Anyone can see this repo.</div>
          </button>
          <button
            type="button"
            onClick={() => setVisibility("private")}
            className={`rounded-md border p-3 text-left text-sm ${visibility === "private" ? "border-[var(--accent)] bg-[var(--bg-elev-2)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"}`}
          >
            <div className="font-medium">Private</div>
            <div className="text-xs text-[var(--fg-muted)]">Only you and collaborators.</div>
          </button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={initReadme}
          onChange={(e) => setInitReadme(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Initialize with README
      </label>
      {error && (
        <div className="rounded-md border border-[var(--danger)]/40 bg-[rgba(248,81,73,0.1)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create repository"}
      </Button>
    </form>
  );
}
