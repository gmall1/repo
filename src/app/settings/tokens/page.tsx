import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiTokens } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { TokensClient } from "./tokens-client";
import { formatRelative } from "@/lib/utils";

export default async function TokensPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/settings/tokens");
  const tokens = await db
    .select()
    .from(apiTokens)
    .where(eq(apiTokens.userId, user.id))
    .orderBy(desc(apiTokens.createdAt));

  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Personal access tokens</h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Use tokens to authenticate <code className="rounded bg-[var(--bg-elev-2)] px-1">git</code>{" "}
          push/pull and the API. Treat them like passwords.
        </p>
        <TokensClient
          existing={tokens.map((t) => ({
            id: t.id,
            name: t.name,
            prefix: t.prefix,
            createdAt: t.createdAt.toISOString(),
            lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}
