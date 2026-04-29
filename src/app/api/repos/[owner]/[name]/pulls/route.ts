import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { pullRequests, repos, events } from "@/lib/db/schema";
import { and, eq, max, sql } from "drizzle-orm";
import { generateId, getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName } from "@/lib/repo-data";
import { repoFsPath, resolveRef, listBranches, mergeBase, diff } from "@/lib/git";
import { aiEnabled, summarizePR, reviewPR } from "@/lib/ai";

const Body = z.object({
  title: z.string().min(1).max(300),
  body: z.string().max(40000).default(""),
  baseBranch: z.string().min(1).max(255),
  headBranch: z.string().min(1).max(255),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ owner: string; name: string }> },
) {
  const { owner, name } = await ctx.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo || !canSeeRepo(repo, user))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (body.baseBranch === body.headBranch)
    return NextResponse.json({ error: "Base and compare are the same branch" }, { status: 400 });

  const repoPath = repoFsPath(repo.ownerName, repo.name);
  const branches = await listBranches(repoPath);
  if (!branches.includes(body.baseBranch) || !branches.includes(body.headBranch))
    return NextResponse.json({ error: "Branch not found" }, { status: 400 });

  const baseSha = await resolveRef(repoPath, body.baseBranch);
  const headSha = await resolveRef(repoPath, body.headBranch);
  if (!baseSha || !headSha)
    return NextResponse.json({ error: "Could not resolve refs" }, { status: 400 });

  const maxRow = await db
    .select({ m: max(pullRequests.number) })
    .from(pullRequests)
    .where(eq(pullRequests.repoId, repo.id));
  const number = (maxRow[0]?.m ?? 0) + 1;

  const id = generateId("p");
  await db.insert(pullRequests).values({
    id,
    repoId: repo.id,
    number,
    title: body.title,
    body: body.body,
    authorId: user.id,
    state: "open",
    headBranch: body.headBranch,
    baseBranch: body.baseBranch,
    headSha,
    baseSha,
  });
  await db
    .update(repos)
    .set({ pullsCount: sql`${repos.pullsCount} + 1` })
    .where(eq(repos.id, repo.id));
  await db.insert(events).values({
    id: generateId("e"),
    actorId: user.id,
    repoId: repo.id,
    type: "pr.open",
    payload: JSON.stringify({ number, title: body.title }),
  });

  // Fire-and-forget AI summary + review
  if (aiEnabled()) {
    void (async () => {
      try {
        const files = await diff(repoPath, body.baseBranch, body.headBranch);
        const totalDiff = files.map((f) => f.patch).join("\n");
        const summary = await summarizePR({
          title: body.title,
          body: body.body,
          diff: totalDiff,
          files,
        });
        const review = await reviewPR({ title: body.title, diff: totalDiff, files });
        await db
          .update(pullRequests)
          .set({ aiSummary: summary || null, aiReview: review || null, updatedAt: new Date() })
          .where(eq(pullRequests.id, id));
      } catch (e) {
        console.error("AI PR analysis failed", e);
      }
    })();
  }

  return NextResponse.json({ ok: true, number });
}
