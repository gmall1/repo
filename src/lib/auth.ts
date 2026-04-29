import { cookies } from "next/headers";
import { randomBytes, createHash, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { sessions, users, apiTokens } from "./db/schema";

const SESSION_COOKIE = "repo_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function generateId(prefix = ""): string {
  const buf = randomBytes(16).toString("hex");
  return prefix ? `${prefix}_${buf}` : buf;
}

export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: "free" | "pro" | "team";
};

export async function createSession(userId: string, meta?: { ip?: string; userAgent?: string }) {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({
    id,
    userId,
    expiresAt,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return id;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (id) {
    await db.delete(sessions).where(eq(sessions.id, id));
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const rows = await db
    .select({
      sId: sessions.id,
      sExpiresAt: sessions.expiresAt,
      uId: users.id,
      uUsername: users.username,
      uEmail: users.email,
      uName: users.name,
      uAvatarUrl: users.avatarUrl,
      uPlan: users.plan,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.sExpiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  return {
    id: row.uId,
    username: row.uUsername,
    email: row.uEmail,
    name: row.uName,
    avatarUrl: row.uAvatarUrl,
    plan: row.uPlan,
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Response("Unauthorized", { status: 401 });
  return u;
}

export function generateApiToken(): { token: string; prefix: string; hash: string } {
  const raw = randomBytes(24).toString("base64url");
  const token = `repo_pat_${raw}`;
  const prefix = token.slice(0, 14);
  const hash = hashToken(token);
  return { token, prefix, hash };
}

export async function verifyBasicAuth(
  authHeader: string | null,
): Promise<{ id: string; username: string } | null> {
  if (!authHeader || !authHeader.toLowerCase().startsWith("basic ")) return null;
  let decoded: string;
  try {
    decoded = Buffer.from(authHeader.slice(6).trim(), "base64").toString("utf8");
  } catch {
    return null;
  }
  const idx = decoded.indexOf(":");
  if (idx === -1) return null;
  const username = decoded.slice(0, idx);
  const password = decoded.slice(idx + 1);

  if (password.startsWith("repo_pat_")) {
    const hash = hashToken(password);
    const tokenRows = await db
      .select({ userId: apiTokens.userId })
      .from(apiTokens)
      .where(eq(apiTokens.tokenHash, hash))
      .limit(1);
    if (!tokenRows[0]) return null;
    const userRows = await db
      .select({ id: users.id, username: users.username, usernameLower: users.usernameLower })
      .from(users)
      .where(eq(users.id, tokenRows[0].userId))
      .limit(1);
    if (!userRows[0]) return null;
    if (userRows[0].usernameLower !== username.toLowerCase()) return null;
    await db
      .update(apiTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiTokens.tokenHash, hash));
    return { id: userRows[0].id, username: userRows[0].username };
  }

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.usernameLower, username.toLowerCase()))
    .limit(1);
  const u = userRows[0];
  if (!u) return null;
  if (!(await verifyPassword(password, u.passwordHash))) return null;
  return { id: u.id, username: u.username };
}
