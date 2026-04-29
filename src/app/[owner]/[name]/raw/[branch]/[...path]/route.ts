import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName } from "@/lib/repo-data";
import { repoFsPath, readBlob } from "@/lib/git";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ owner: string; name: string; branch: string; path: string[] }> },
) {
  const { owner, name, branch, path } = await ctx.params;
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) return new Response("Not found", { status: 404 });
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) return new Response("Not found", { status: 404 });
  const filePath = path.map((p) => decodeURIComponent(p)).join("/");
  const blob = await readBlob(repoFsPath(repo.ownerName, repo.name), branch, filePath);
  if (!blob) return new Response("Not found", { status: 404 });
  const ct = blob.binary ? "application/octet-stream" : "text/plain; charset=utf-8";
  return new Response(new Uint8Array(blob.content), {
    headers: { "Content-Type": ct, "Content-Length": String(blob.size) },
  });
}
