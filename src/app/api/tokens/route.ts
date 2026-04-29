import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiTokens } from "@/lib/db/schema";
import { generateApiToken, generateId, getSessionUser } from "@/lib/auth";

const Body = z.object({ name: z.string().min(1).max(64) });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { token, prefix, hash } = generateApiToken();
  const id = generateId("t");
  await db.insert(apiTokens).values({
    id,
    userId: user.id,
    name: body.name,
    tokenHash: hash,
    prefix,
  });
  return NextResponse.json({ ok: true, id, token, prefix });
}
