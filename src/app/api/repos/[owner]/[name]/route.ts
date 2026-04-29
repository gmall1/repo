import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { repos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isOwner } from "@/lib/repo-data";
import { deleteRepo } from "@/lib/git";

const Patch = z.object({
  description: z.string().max(500).optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ owner: string; name: string }> },
) {
  const { owner, name } = await ctx.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo || !canSeeRepo(repo, user))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isOwner(repo, user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = Patch.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await db
    .update(repos)
    .set({
      description: body.description ?? repo.description,
      visibility: body.visibility ?? repo.visibility,
      updatedAt: new Date(),
    })
    .where(eq(repos.id, repo.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ owner: string; name: string }> },
) {
  const { owner, name } = await ctx.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isOwner(repo, user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await db.delete(repos).where(eq(repos.id, repo.id));
  await deleteRepo(repo.ownerName, repo.name).catch(() => {});
  return NextResponse.json({ ok: true });
}
