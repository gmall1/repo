import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:password@localhost:5432/repo";

declare global {
  // eslint-disable-next-line no-var
  var __repoPgClient: ReturnType<typeof postgres> | undefined;
}

const client = global.__repoPgClient ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== "production") global.__repoPgClient = client;

export const db = drizzle(client, { schema });
export { schema };
