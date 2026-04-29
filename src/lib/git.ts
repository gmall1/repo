import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export const STORAGE_PATH = process.env.REPO_STORAGE_PATH || "./data/repos";

export function repoFsPath(ownerName: string, repoName: string): string {
  return path.resolve(STORAGE_PATH, ownerName.toLowerCase(), `${repoName.toLowerCase()}.git`);
}

export async function ensureStorageRoot() {
  await fs.mkdir(STORAGE_PATH, { recursive: true });
}

export async function repoExists(ownerName: string, repoName: string): Promise<boolean> {
  try {
    const p = repoFsPath(ownerName, repoName);
    const s = await fs.stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

export async function initBareRepo(
  ownerName: string,
  repoName: string,
  defaultBranch = "main",
): Promise<string> {
  const p = repoFsPath(ownerName, repoName);
  await fs.mkdir(p, { recursive: true });
  await runGit(["init", "--bare", `--initial-branch=${defaultBranch}`, p]);
  return p;
}

export async function deleteRepo(ownerName: string, repoName: string) {
  const p = repoFsPath(ownerName, repoName);
  await fs.rm(p, { recursive: true, force: true });
}

export interface GitRunResult {
  stdout: Buffer;
  stderr: string;
  code: number;
}

export function runGit(
  args: string[],
  opts: { cwd?: string; input?: string | Buffer; env?: NodeJS.ProcessEnv } = {},
): Promise<GitRunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd: opts.cwd,
      env: { ...process.env, ...(opts.env || {}) },
    });
    const out: Buffer[] = [];
    const err: string[] = [];
    child.stdout.on("data", (d) => out.push(d));
    child.stderr.on("data", (d) => err.push(d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ stdout: Buffer.concat(out), stderr: err.join(""), code: code ?? 0 });
    });
    if (opts.input) {
      child.stdin.write(opts.input);
      child.stdin.end();
    }
  });
}

export async function listBranches(repoPath: string): Promise<string[]> {
  const r = await runGit(["for-each-ref", "--format=%(refname:short)", "refs/heads/"], {
    cwd: repoPath,
  });
  if (r.code !== 0) return [];
  return r.stdout
    .toString("utf8")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function listTags(repoPath: string): Promise<string[]> {
  const r = await runGit(["for-each-ref", "--format=%(refname:short)", "refs/tags/"], {
    cwd: repoPath,
  });
  if (r.code !== 0) return [];
  return r.stdout
    .toString("utf8")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function resolveRef(repoPath: string, ref: string): Promise<string | null> {
  const r = await runGit(["rev-parse", "--verify", `${ref}^{commit}`], { cwd: repoPath });
  if (r.code !== 0) return null;
  return r.stdout.toString("utf8").trim();
}

export async function isEmpty(repoPath: string): Promise<boolean> {
  const branches = await listBranches(repoPath);
  return branches.length === 0;
}

export interface TreeEntry {
  mode: string;
  type: "blob" | "tree" | "commit";
  sha: string;
  name: string;
  size?: number;
  lastCommit?: { sha: string; message: string; author: string; date: string };
}

export async function lsTree(
  repoPath: string,
  ref: string,
  subPath = "",
): Promise<TreeEntry[]> {
  const target = subPath ? `${ref}:${subPath}` : ref;
  const r = await runGit(["ls-tree", "--long", target], { cwd: repoPath });
  if (r.code !== 0) return [];
  const lines = r.stdout.toString("utf8").split("\n").filter(Boolean);
  const entries: TreeEntry[] = [];
  for (const ln of lines) {
    const m = ln.match(/^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\t(.+)$/);
    if (!m) continue;
    const [, mode, type, sha, sizeStr, name] = m;
    entries.push({
      mode,
      type: type as TreeEntry["type"],
      sha,
      name,
      size: sizeStr === "-" ? undefined : Number(sizeStr),
    });
  }
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return entries;
}

export async function readBlob(
  repoPath: string,
  ref: string,
  filePath: string,
): Promise<{ content: Buffer; size: number; binary: boolean } | null> {
  const target = `${ref}:${filePath}`;
  const sizeR = await runGit(["cat-file", "-s", target], { cwd: repoPath });
  if (sizeR.code !== 0) return null;
  const size = Number(sizeR.stdout.toString("utf8").trim());
  const r = await runGit(["cat-file", "-p", target], { cwd: repoPath });
  if (r.code !== 0) return null;
  const content = r.stdout;
  const sample = content.subarray(0, Math.min(content.length, 8000));
  let binary = false;
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] === 0) {
      binary = true;
      break;
    }
  }
  return { content, size, binary };
}

export interface Commit {
  sha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  date: string;
}

export async function listCommits(
  repoPath: string,
  ref: string,
  opts: { limit?: number; skip?: number; subPath?: string } = {},
): Promise<Commit[]> {
  const args = [
    "log",
    `--max-count=${opts.limit ?? 30}`,
    `--skip=${opts.skip ?? 0}`,
    "--pretty=format:%H%x1f%an%x1f%ae%x1f%aI%x1f%s%x1e",
    ref,
  ];
  if (opts.subPath) args.push("--", opts.subPath);
  const r = await runGit(args, { cwd: repoPath });
  if (r.code !== 0) return [];
  const text = r.stdout.toString("utf8");
  return text
    .split("\x1e")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((rec) => {
      const [sha, authorName, authorEmail, date, message] = rec.split("\x1f");
      return { sha, authorName, authorEmail, date, message };
    });
}

export async function getCommit(repoPath: string, sha: string): Promise<Commit | null> {
  const r = await runGit(
    ["log", "-1", "--pretty=format:%H%x1f%an%x1f%ae%x1f%aI%x1f%B", sha],
    { cwd: repoPath },
  );
  if (r.code !== 0) return null;
  const [hash, authorName, authorEmail, date, message] = r.stdout
    .toString("utf8")
    .split("\x1f");
  if (!hash) return null;
  return { sha: hash, authorName, authorEmail, date, message: message?.trimEnd() ?? "" };
}

export interface DiffFile {
  path: string;
  oldPath?: string;
  status: "A" | "M" | "D" | "R" | "C" | "T" | "U";
  additions: number;
  deletions: number;
  binary: boolean;
  patch: string;
}

export async function diff(
  repoPath: string,
  base: string,
  head: string,
  opts: { contextLines?: number } = {},
): Promise<DiffFile[]> {
  const ctx = opts.contextLines ?? 3;
  const numstatR = await runGit(
    ["diff", "--no-color", "--numstat", `-U${ctx}`, `${base}...${head}`],
    { cwd: repoPath },
  );
  const stats = new Map<string, { add: number; del: number; binary: boolean }>();
  for (const ln of numstatR.stdout.toString("utf8").split("\n").filter(Boolean)) {
    const parts = ln.split("\t");
    if (parts.length < 3) continue;
    const [add, del, p] = parts;
    stats.set(p, {
      add: add === "-" ? 0 : Number(add),
      del: del === "-" ? 0 : Number(del),
      binary: add === "-" && del === "-",
    });
  }
  const patchR = await runGit(
    ["diff", "--no-color", "--find-renames", `-U${ctx}`, `${base}...${head}`],
    { cwd: repoPath },
  );
  return parsePatch(patchR.stdout.toString("utf8"), stats);
}

function parsePatch(
  text: string,
  stats: Map<string, { add: number; del: number; binary: boolean }>,
): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    if (!lines[i].startsWith("diff --git ")) {
      i++;
      continue;
    }
    const header = lines[i];
    const m = header.match(/^diff --git a\/(.+) b\/(.+)$/);
    let oldPath = m?.[1] ?? "";
    let newPath = m?.[2] ?? "";
    let status: DiffFile["status"] = "M";
    let binary = false;
    const start = i;
    i++;
    while (
      i < lines.length &&
      !lines[i].startsWith("diff --git ") &&
      !lines[i].startsWith("@@")
    ) {
      const l = lines[i];
      if (l.startsWith("new file mode")) status = "A";
      else if (l.startsWith("deleted file mode")) status = "D";
      else if (l.startsWith("rename from")) {
        oldPath = l.slice("rename from ".length);
        status = "R";
      } else if (l.startsWith("rename to")) {
        newPath = l.slice("rename to ".length);
      } else if (l.startsWith("Binary files ")) {
        binary = true;
      }
      i++;
    }
    const patchStart = i;
    while (i < lines.length && !lines[i].startsWith("diff --git ")) i++;
    const patch = lines.slice(start, i).join("\n");
    void patchStart;
    const path = newPath || oldPath;
    const stat = stats.get(path) ?? { add: 0, del: 0, binary: false };
    files.push({
      path,
      oldPath: oldPath !== newPath ? oldPath : undefined,
      status,
      additions: stat.add,
      deletions: stat.del,
      binary: binary || stat.binary,
      patch,
    });
  }
  return files;
}

export async function mergeBase(
  repoPath: string,
  base: string,
  head: string,
): Promise<string | null> {
  const r = await runGit(["merge-base", base, head], { cwd: repoPath });
  if (r.code !== 0) return null;
  return r.stdout.toString("utf8").trim();
}

export async function commitsBetween(
  repoPath: string,
  base: string,
  head: string,
  limit = 100,
): Promise<Commit[]> {
  const args = [
    "log",
    `--max-count=${limit}`,
    "--pretty=format:%H%x1f%an%x1f%ae%x1f%aI%x1f%s%x1e",
    `${base}..${head}`,
  ];
  const r = await runGit(args, { cwd: repoPath });
  if (r.code !== 0) return [];
  return r.stdout
    .toString("utf8")
    .split("\x1e")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((rec) => {
      const [sha, authorName, authorEmail, date, message] = rec.split("\x1f");
      return { sha, authorName, authorEmail, date, message };
    });
}

export async function readmeFor(
  repoPath: string,
  ref: string,
): Promise<{ content: string; path: string } | null> {
  const candidates = ["README.md", "README.MD", "README", "readme.md", "Readme.md"];
  for (const c of candidates) {
    const blob = await readBlob(repoPath, ref, c);
    if (blob && !blob.binary) {
      return { content: blob.content.toString("utf8"), path: c };
    }
  }
  return null;
}
