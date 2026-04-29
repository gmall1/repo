import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { pullRequests, prComments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { generateId, getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName } from "@/lib/repo-data";

const Body = z.object({ body: z.string().min(1).max(40000) });

export async function POST(
  req: NextRequest,
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

  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  await db.insert(prComments).values({
    id: generateId("c"),
    prId: pr.id,
    authorId: user.id,
    body: body.body,
  });
  return NextResponse.json({ ok: true });
}
