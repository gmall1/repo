import { NextRequest, NextResponse } from "next/server";
import path from "path";
import os from "os";
import { promises as fs } from "fs";
import { db } from "@/lib/db";
import { pullRequests, repos, events } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { generateId, getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isOwner } from "@/lib/repo-data";
import { mergeBase, repoFsPath, resolveRef, runGit } from "@/lib/git";

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
  if (!isOwner(repo, user))
    return NextResponse.json({ error: "Only the repo owner can merge" }, { status: 403 });

  const prRows = await db
    .select()
    .from(pullRequests)
    .where(and(eq(pullRequests.repoId, repo.id), eq(pullRequests.number, Number(number))))
    .limit(1);
  const pr = prRows[0];
  if (!pr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pr.state !== "open")
    return NextResponse.json({ error: "PR is not open" }, { status: 400 });

  const repoPath = repoFsPath(repo.ownerName, repo.name);
  const baseSha = await resolveRef(repoPath, pr.baseBranch);
  const headSha = await resolveRef(repoPath, pr.headBranch);
  if (!baseSha || !headSha)
    return NextResponse.json({ error: "Could not resolve refs" }, { status: 400 });

  const mb = await mergeBase(repoPath, baseSha, headSha);
  if (!mb) return NextResponse.json({ error: "No common ancestor" }, { status: 400 });

  let mergeSha = headSha;

  if (mb === baseSha) {
    // Fast-forward
    const r = await runGit(["update-ref", `refs/heads/${pr.baseBranch}`, headSha, baseSha], {
      cwd: repoPath,
    });
    if (r.code !== 0)
      return NextResponse.json({ error: "Failed to fast-forward: " + r.stderr }, { status: 500 });
    mergeSha = headSha;
  } else {
    // Real merge via temp clone
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "repo-merge-"));
    try {
      const c1 = await runGit(["clone", repoPath, tmp]);
      if (c1.code !== 0) throw new Error(c1.stderr);
      await runGit(["-C", tmp, "config", "user.email", `merge@repo.dev`]);
      await runGit(["-C", tmp, "config", "user.name", user.username]);
      await runGit(["-C", tmp, "checkout", pr.baseBranch]);
      const m = await runGit(
        [
          "-C",
          tmp,
          "merge",
          "--no-ff",
          "-m",
          `Merge pull request #${pr.number} from ${pr.headBranch}\n\n${pr.title}`,
          `origin/${pr.headBranch}`,
        ],
        {},
      );
      if (m.code !== 0)
        return NextResponse.json(
          { error: "Merge conflict — resolve in a clone and push.\n" + m.stderr },
          { status: 409 },
        );
      const p = await runGit(["-C", tmp, "push", "origin", pr.baseBranch]);
      if (p.code !== 0) throw new Error(p.stderr);
      const sha = await runGit(["-C", tmp, "rev-parse", "HEAD"]);
      mergeSha = sha.stdout.toString("utf8").trim();
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  }

  await db
    .update(pullRequests)
    .set({
      state: "merged",
      mergedAt: new Date(),
      mergedBy: user.id,
      mergeSha,
      updatedAt: new Date(),
    })
    .where(eq(pullRequests.id, pr.id));
  await db
    .update(repos)
    .set({ pushedAt: new Date(), updatedAt: new Date() })
    .where(eq(repos.id, repo.id));
  await db.insert(events).values({
    id: generateId("e"),
    actorId: user.id,
    repoId: repo.id,
    type: "pr.merge",
    payload: JSON.stringify({ number: pr.number, title: pr.title }),
  });

  return NextResponse.json({ ok: true });
}
