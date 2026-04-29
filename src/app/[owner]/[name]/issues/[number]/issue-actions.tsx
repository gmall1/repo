"use client";

import { Button } from "@/components/ui/button";

export function IssueActions({
  owner,
  name,
  number,
  isOpen,
}: {
  owner: string;
  name: string;
  number: number;
  isOpen: boolean;
}) {
  async function toggle() {
    await fetch(`/api/repos/${owner}/${name}/issues/${number}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ state: isOpen ? "closed" : "open" }),
    });
    window.location.reload();
  }

  return (
    <div className="mt-3 flex justify-end">
      <Button variant={isOpen ? "danger" : "secondary"} onClick={toggle}>
        {isOpen ? "Close issue" : "Reopen issue"}
      </Button>
    </div>
  );
}
