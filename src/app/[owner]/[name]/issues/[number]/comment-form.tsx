"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CommentForm({
  owner,
  name,
  number,
  canClose,
  isOpen,
}: {
  owner: string;
  name: string;
  number: number;
  canClose: boolean;
  isOpen: boolean;
}) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    await fetch(`/api/repos/${owner}/${name}/issues/${number}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4">
      <Textarea
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Leave a comment…"
      />
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button type="submit" disabled={loading || !body.trim()}>
          {loading ? "Submitting…" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
