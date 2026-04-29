import { NextRequest } from "next/server";
import { spawn } from "child_process";
import zlib from "zlib";
import { db } from "@/lib/db";
import { repos, events } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { repoFsPath } from "@/lib/git";
import { verifyBasicAuth, generateId } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ owner: string; name: string; action: string[] }> };

async function authChallenge() {
  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Repo git"' },
  });
}

async function findRepo(owner: string, name: string) {
  const rows = await db
    .select()
    .from(repos)
    .where(and(eq(repos.ownerName, owner), eq(repos.nameLower, name.toLowerCase())))
    .limit(1);
  return rows[0];
}

export async function GET(req: NextRequest, ctx: Params) {
  const { owner, name, action } = await ctx.params;
  const repo = await findRepo(owner, name);
  if (!repo) return new Response("Not found", { status: 404 });

  const service = req.nextUrl.searchParams.get("service") || "";
  const isUploadPack = service === "git-upload-pack";
  const isReceivePack = service === "git-receive-pack";
  const path = action.join("/");

  if (path !== "info/refs") return new Response("Not found", { status: 404 });

  const needsAuth = repo.visibility === "private" || isReceivePack;
  let authedUser: { id: string; username: string } | null = null;
  if (needsAuth) {
    authedUser = await verifyBasicAuth(req.headers.get("authorization"));
    if (!authedUser) return authChallenge();
    if (isReceivePack && authedUser.username.toLowerCase() !== owner.toLowerCase()) {
      return new Response("Forbidden", { status: 403 });
    }
    if (repo.visibility === "private" && authedUser.id !== repo.ownerId) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  if (!isUploadPack && !isReceivePack) return new Response("Bad request", { status: 400 });

  const repoPath = repoFsPath(owner, name);
  const subcmd = isUploadPack ? "upload-pack" : "receive-pack";
  const child = spawn("git", [subcmd, "--stateless-rpc", "--advertise-refs", repoPath]);

  const advertise = pktLine(`# service=${service}\n`) + "0000";
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(advertise));
      child.stdout.on("data", (d) => controller.enqueue(new Uint8Array(d)));
      child.stdout.on("end", () => controller.close());
      child.on("error", (e) => controller.error(e));
    },
    cancel() {
      child.kill();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": `application/x-${service}-advertisement`,
      "Cache-Control": "no-cache, max-age=0, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

export async function POST(req: NextRequest, ctx: Params) {
  const { owner, name, action } = await ctx.params;
  const repo = await findRepo(owner, name);
  if (!repo) return new Response("Not found", { status: 404 });

  const path = action.join("/");
  const isUpload = path === "git-upload-pack";
  const isReceive = path === "git-receive-pack";
  if (!isUpload && !isReceive) return new Response("Not found", { status: 404 });

  const needsAuth = repo.visibility === "private" || isReceive;
  let authedUser: { id: string; username: string } | null = null;
  if (needsAuth) {
    authedUser = await verifyBasicAuth(req.headers.get("authorization"));
    if (!authedUser) return authChallenge();
    if (isReceive && authedUser.id !== repo.ownerId) {
      return new Response("Forbidden", { status: 403 });
    }
    if (repo.visibility === "private" && authedUser.id !== repo.ownerId) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const subcmd = isUpload ? "upload-pack" : "receive-pack";
  const repoPath = repoFsPath(owner, name);
  const child = spawn("git", [subcmd, "--stateless-rpc", repoPath]);

  let bodyBuf = Buffer.from(await req.arrayBuffer());
  if (req.headers.get("content-encoding") === "gzip") {
    bodyBuf = zlib.gunzipSync(bodyBuf);
  }
  child.stdin.write(bodyBuf);
  child.stdin.end();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      child.stdout.on("data", (d) => controller.enqueue(new Uint8Array(d)));
      child.stdout.on("end", () => controller.close());
      child.on("error", (e) => controller.error(e));
    },
    cancel() {
      child.kill();
    },
  });

  if (isReceive && authedUser) {
    child.on("close", async () => {
      try {
        await db
          .update(repos)
          .set({ pushedAt: new Date(), updatedAt: new Date() })
          .where(eq(repos.id, repo.id));
        await db.insert(events).values({
          id: generateId("e"),
          actorId: authedUser!.id,
          repoId: repo.id,
          type: "repo.push",
          payload: JSON.stringify({ ownerName: owner, name }),
        });
      } catch (e) {
        console.error("post-receive update failed", e);
      }
    });
  }

  return new Response(stream, {
    headers: {
      "Content-Type": `application/x-${subcmd === "upload-pack" ? "git-upload-pack" : "git-receive-pack"}-result`,
      "Cache-Control": "no-cache, max-age=0, must-revalidate",
    },
  });
}

function pktLine(s: string): string {
  const len = (s.length + 4).toString(16).padStart(4, "0");
  return len + s;
}
