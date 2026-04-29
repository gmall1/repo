import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { Avatar } from "./ui/avatar";
import { Search, Plus, BookMarked } from "lucide-react";
import { LogoutButton } from "./logout-button";

export async function Nav() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">Repo</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/explore" className="px-3 py-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]">
            Explore
          </Link>
          <Link href="/pricing" className="px-3 py-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]">
            Pricing
          </Link>
          <Link href="/docs" className="px-3 py-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]">
            Docs
          </Link>
        </nav>

        <form action="/search" method="get" className="ml-auto hidden flex-1 max-w-md md:block">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-dim)]" />
            <input
              name="q"
              placeholder="Search repos, issues, code…"
              className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--bg-elev)] pl-9 pr-3 text-sm placeholder:text-[var(--fg-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {user ? (
            <>
              <Link
                href="/new"
                className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elev)] px-3 text-sm hover:bg-[var(--bg-elev-2)]"
              >
                <Plus size={14} />
                New
              </Link>
              <Link
                href={`/${user.username}`}
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-[var(--bg-elev)]"
              >
                <Avatar name={user.username} src={user.avatarUrl} size={26} />
                <span className="hidden text-sm font-medium md:inline">{user.username}</span>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="flex h-9 items-center gap-1.5 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)] hover:brightness-110"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div
      aria-hidden
      className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[var(--accent-fg)]"
    >
      <BookMarked size={15} strokeWidth={2.4} />
    </div>
  );
}
