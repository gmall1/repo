import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { createSession, generateId, hashPassword } from "@/lib/auth";
import { isReservedSlug, isValidName } from "@/lib/utils";

const Body = z.object({
  username: z.string().min(1).max(39),
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
  name: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  let body;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const username = body.username.trim();
  const email = body.email.trim();
  if (!isValidName(username)) {
    return NextResponse.json(
      { error: "Username must be 1-39 chars, alphanumeric/-/_, no leading/trailing dash" },
      { status: 400 },
    );
  }
  if (isReservedSlug(username)) {
    return NextResponse.json({ error: "That username is reserved" }, { status: 400 });
  }
  const lower = username.toLowerCase();
  const emailLower = email.toLowerCase();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.usernameLower, lower), eq(users.emailLower, emailLower)))
    .limit(1);
  if (existing.length) {
    return NextResponse.json(
      { error: "Username or email already in use" },
      { status: 400 },
    );
  }
  const id = generateId("u");
  const passwordHash = await hashPassword(body.password);
  await db.insert(users).values({
    id,
    username,
    usernameLower: lower,
    email,
    emailLower,
    passwordHash,
    name: body.name || null,
  });
  await createSession(id, {
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  return NextResponse.json({ ok: true, username });
}
