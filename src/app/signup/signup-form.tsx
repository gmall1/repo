"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      window.location.href = "/dashboard";
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Signup failed";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          autoComplete="username"
          required
          minLength={1}
          maxLength={39}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="octocat"
        />
        <div className="mt-1 text-xs text-[var(--fg-dim)]">
          Letters, numbers, hyphens, underscores. Public profile URL: /{username || "you"}
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="name">Display name (optional)</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="mt-1 text-xs text-[var(--fg-dim)]">At least 8 characters.</div>
      </div>
      {error && (
        <div className="rounded-md border border-[var(--danger)]/40 bg-[rgba(248,81,73,0.1)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-xs text-[var(--fg-dim)]">
        By signing up you agree to our{" "}
        <a href="/legal/terms" className="underline">
          Terms
        </a>{" "}
        and{" "}
        <a href="/legal/privacy" className="underline">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
