import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stars, repos, events } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { generateId, getSessionUser } from "@/lib/auth";

async function getRepo(owner: string, name: string) {
  const rows = await db
    .select()
    .from(repos)
    .where(and(eq(repos.ownerName, owner), eq(repos.nameLower, name.toLowerCase())))
    .limit(1);
  return rows[0];
}

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ owner: string; name: string }> },
) {
  const { owner, name } = await ctx.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const repo = await getRepo(owner, name);
  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.insert(stars).values({ userId: user.id, repoId: repo.id }).onConflictDoNothing();
  await db
    .update(repos)
    .set({ starsCount: sql`${repos.starsCount} + 1` })
    .where(eq(repos.id, repo.id));
  await db.insert(events).values({
    id: generateId("e"),
    actorId: user.id,
    repoId: repo.id,
    type: "star",
    payload: JSON.stringify({ ownerName: repo.ownerName, name: repo.name }),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ owner: string; name: string }> },
) {
  const { owner, name } = await ctx.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const repo = await getRepo(owner, name);
  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await db
    .delete(stars)
    .where(and(eq(stars.userId, user.id), eq(stars.repoId, repo.id)))
    .returning({ id: stars.userId });
  if (result.length) {
    await db
      .update(repos)
      .set({ starsCount: sql`GREATEST(${repos.starsCount} - 1, 0)` })
      .where(eq(repos.id, repo.id));
  }
  return NextResponse.json({ ok: true });
}
