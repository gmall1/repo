import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { issues, repos, events, labels, issueLabels } from "@/lib/db/schema";
import { and, eq, max, sql } from "drizzle-orm";
import { generateId, getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName } from "@/lib/repo-data";
import { triageIssue } from "@/lib/ai";

const Body = z.object({
  title: z.string().min(1).max(300),
  body: z.string().max(20000).default(""),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ owner: string; name: string }> },
) {
  const { owner, name } = await ctx.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canSeeRepo(repo, user))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const maxRow = await db
    .select({ m: max(issues.number) })
    .from(issues)
    .where(eq(issues.repoId, repo.id));
  const number = (maxRow[0]?.m ?? 0) + 1;

  const id = generateId("i");
  await db.insert(issues).values({
    id,
    repoId: repo.id,
    number,
    title: body.title,
    body: body.body,
    authorId: user.id,
  });
  await db
    .update(repos)
    .set({ issuesCount: sql`${repos.issuesCount} + 1` })
    .where(eq(repos.id, repo.id));
  await db.insert(events).values({
    id: generateId("e"),
    actorId: user.id,
    repoId: repo.id,
    type: "issue.open",
    payload: JSON.stringify({ number, title: body.title }),
  });

  // Fire-and-forget AI triage
  void (async () => {
    try {
      const triage = await triageIssue({ title: body.title, body: body.body });
      if (!triage) return;
      for (const labelName of triage.labels.slice(0, 5)) {
        const lname = String(labelName).slice(0, 32);
        if (!lname) continue;
        const existing = await db
          .select()
          .from(labels)
          .where(and(eq(labels.repoId, repo.id), eq(labels.name, lname)))
          .limit(1);
        let labelId = existing[0]?.id;
        if (!labelId) {
          labelId = generateId("l");
          const colors = ["#3fb950", "#a78bfa", "#6ee7ff", "#d29922", "#f85149", "#7d8590"];
          await db
            .insert(labels)
            .values({
              id: labelId,
              repoId: repo.id,
              name: lname,
              color: colors[Math.floor(Math.random() * colors.length)],
            })
            .onConflictDoNothing();
        }
        await db.insert(issueLabels).values({ issueId: id, labelId }).onConflictDoNothing();
      }
    } catch (e) {
      console.error("triage failed", e);
    }
  })();

  return NextResponse.json({ ok: true, number });
}
