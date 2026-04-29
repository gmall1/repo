import Link from "next/link";
import { Nav } from "@/components/nav";
import { db } from "@/lib/db";
import { repos } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { BookMarked, Star } from "lucide-react";
import { formatNumber, formatRelative } from "@/lib/utils";

export default async function ExplorePage() {
  const list = await db
    .select()
    .from(repos)
    .where(eq(repos.visibility, "public"))
    .orderBy(desc(repos.starsCount), desc(repos.createdAt))
    .limit(60);
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Explore</h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Public repositories from the community.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {list.length === 0 && (
            <div className="col-span-2 rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--fg-muted)]">
              Nothing here yet — be the first.
            </div>
          )}
          {list.map((r) => (
            <Link
              key={r.id}
              href={`/${r.ownerName}/${r.name}`}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 hover:bg-[var(--bg-elev-2)]"
            >
              <div className="flex items-center gap-2">
                <BookMarked size={14} className="text-[var(--fg-muted)]" />
                <span className="font-semibold text-[var(--accent)]">
                  {r.ownerName}/{r.name}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--fg-muted)]">
                  <Star size={11} /> {formatNumber(r.starsCount)}
                </span>
              </div>
              {r.description && (
                <p className="mt-1 text-sm text-[var(--fg-muted)] line-clamp-2">
                  {r.description}
                </p>
              )}
              <div className="mt-2 text-xs text-[var(--fg-dim)]">
                Updated {formatRelative(r.updatedAt)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
