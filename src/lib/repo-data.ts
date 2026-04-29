import { db } from "./db";
import { repos, stars } from "./db/schema";
import { and, eq } from "drizzle-orm";
import type { Repo } from "./db/schema";

export async function getRepoByOwnerAndName(
  ownerName: string,
  name: string,
): Promise<Repo | null> {
  const rows = await db
    .select()
    .from(repos)
    .where(and(eq(repos.ownerName, ownerName), eq(repos.nameLower, name.toLowerCase())))
    .limit(1);
  return rows[0] ?? null;
}

export async function isStarred(userId: string, repoId: string): Promise<boolean> {
  const rows = await db
    .select({ ok: stars.userId })
    .from(stars)
    .where(and(eq(stars.userId, userId), eq(stars.repoId, repoId)))
    .limit(1);
  return rows.length > 0;
}

export function canSeeRepo(
  repo: Repo,
  user: { id: string; username: string } | null,
): boolean {
  if (repo.visibility === "public") return true;
  return !!user && user.id === repo.ownerId;
}

export function isOwner(
  repo: Repo,
  user: { id: string; username: string } | null,
): boolean {
  return !!user && user.id === repo.ownerId;
}
