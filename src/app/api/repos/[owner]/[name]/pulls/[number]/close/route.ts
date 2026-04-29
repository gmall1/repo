import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pullRequests } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName } from "@/lib/repo-data";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ owner: string; name: string; number: string }> },
) {
  const { owner, name, number } = await ctx.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo || !canSeeRepo(repo, user))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prRows = await db
    .select()
    .from(pullRequests)
    .where(and(eq(pullRequests.repoId, repo.id), eq(pullRequests.number, Number(number))))
    .limit(1);
  const pr = prRows[0];
  if (!pr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAuthorOrOwner = user.id === pr.authorId || user.id === repo.ownerId;
  if (!isAuthorOrOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db
    .update(pullRequests)
    .set({ state: "closed", closedAt: new Date(), updatedAt: new Date() })
    .where(eq(pullRequests.id, pr.id));
  return NextResponse.json({ ok: true });
}
