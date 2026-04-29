"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
      title="Sign out"
      className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg-elev)] hover:text-[var(--fg)]"
    >
      <LogOut size={15} />
    </button>
  );
}
