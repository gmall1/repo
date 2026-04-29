import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import path from "path";
import { promises as fs } from "fs";
import os from "os";
import { db } from "@/lib/db";
import { repos, events } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId, getSessionUser } from "@/lib/auth";
import {
  ensureStorageRoot,
  initBareRepo,
  repoExists,
  repoFsPath,
  runGit,
  STORAGE_PATH,
} from "@/lib/git";
import { isReservedSlug, isValidName } from "@/lib/utils";

const Body = z.object({
  name: z.string().min(1).max(64),
  description: z.string().max(500).optional().default(""),
  visibility: z.enum(["public", "private"]).default("public"),
  initReadme: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (!isValidName(body.name) || isReservedSlug(body.name)) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  const lower = body.name.toLowerCase();
  const exists = await db
    .select({ id: repos.id })
    .from(repos)
    .where(and(eq(repos.ownerName, user.username), eq(repos.nameLower, lower)))
    .limit(1);
  if (exists.length) {
    return NextResponse.json({ error: "A repo with that name already exists" }, { status: 400 });
  }
  if (await repoExists(user.username, body.name)) {
    return NextResponse.json({ error: "Storage conflict" }, { status: 500 });
  }

  await ensureStorageRoot();
  const repoPath = await initBareRepo(user.username, body.name, "main");

  if (body.initReadme) {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "repo-init-"));
    try {
      await runGit(["clone", repoPath, tmp]);
      const readmePath = path.join(tmp, "README.md");
      const content = `# ${body.name}\n\n${body.description || "A new repository on Repo."}\n`;
      await fs.writeFile(readmePath, content, "utf8");
      await runGit(["-C", tmp, "config", "user.email", `${user.username}@users.repo.dev`]);
      await runGit(["-C", tmp, "config", "user.name", user.username]);
      await runGit(["-C", tmp, "add", "README.md"]);
      await runGit(["-C", tmp, "commit", "-m", "Initial commit"]);
      await runGit(["-C", tmp, "push", "origin", "main"]);
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  }

  const id = generateId("r");
  const storagePath = path.relative(path.resolve(STORAGE_PATH), repoFsPath(user.username, body.name));
  await db.insert(repos).values({
    id,
    ownerType: "user",
    ownerId: user.id,
    ownerName: user.username,
    name: body.name,
    nameLower: lower,
    description: body.description || null,
    visibility: body.visibility,
    defaultBranch: "main",
    storagePath,
    pushedAt: body.initReadme ? new Date() : null,
  });
  await db.insert(events).values({
    id: generateId("e"),
    actorId: user.id,
    repoId: id,
    type: "repo.create",
    payload: JSON.stringify({ ownerName: user.username, name: body.name }),
  });

  return NextResponse.json({ ok: true, ownerName: user.username, name: body.name });
}
