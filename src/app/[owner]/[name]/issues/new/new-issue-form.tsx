"use client";

import { useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewIssueForm({ owner, name }: { owner: string; name: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/repos/${owner}/${name}/issues`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      window.location.href = `/${owner}/${name}/issues/${data.number}`;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-5">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={300} />
      </div>
      <div>
        <Label>Description (markdown supported)</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="What's the issue? Steps to reproduce, expected vs actual…"
        />
      </div>
      {error && <div className="text-sm text-[var(--danger)]">{error}</div>}
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting…" : "Submit issue"}
      </Button>
    </form>
  );
}
