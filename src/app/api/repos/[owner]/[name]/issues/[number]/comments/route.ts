import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { issues, issueComments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { generateId, getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName } from "@/lib/repo-data";

const Body = z.object({ body: z.string().min(1).max(20000) });

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

  const issueRows = await db
    .select()
    .from(issues)
    .where(and(eq(issues.repoId, repo.id), eq(issues.number, Number(number))))
    .limit(1);
  const issue = issueRows[0];
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const id = generateId("c");
  await db.insert(issueComments).values({
    id,
    issueId: issue.id,
    authorId: user.id,
    body: body.body,
  });
  return NextResponse.json({ ok: true });
}
