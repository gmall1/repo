import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { createSession, verifyPassword } from "@/lib/auth";

const Body = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const id = body.identifier.trim().toLowerCase();
  const rows = await db
    .select()
    .from(users)
    .where(or(eq(users.usernameLower, id), eq(users.emailLower, id)))
    .limit(1);
  const user = rows[0];
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await createSession(user.id, {
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  return NextResponse.json({ ok: true, username: user.username });
}
