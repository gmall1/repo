import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { issues, repos, events } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { generateId, getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName } from "@/lib/repo-data";

const Patch = z.object({ state: z.enum(["open", "closed"]) });

export async function PATCH(
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

  const isAuthorOrOwner = user.id === issue.authorId || user.id === repo.ownerId;
  if (!isAuthorOrOwner)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = Patch.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await db
    .update(issues)
    .set({
      state: body.state,
      closedAt: body.state === "closed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(issues.id, issue.id));

  await db.insert(events).values({
    id: generateId("e"),
    actorId: user.id,
    repoId: repo.id,
    type: body.state === "closed" ? "issue.close" : "issue.reopen",
    payload: JSON.stringify({ number: issue.number }),
  });

  return NextResponse.json({ ok: true });
}
