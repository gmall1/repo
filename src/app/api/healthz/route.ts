import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: "ok" });
  } catch {
    return NextResponse.json({ ok: false, db: "down" }, { status: 500 });
  }
}
