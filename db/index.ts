import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Please add it to your .env.local file.\n" +
      "Get it from Supabase Dashboard: Project Settings → Database → Connection String → URI (Transaction tab)",
  );
}

declare global {
  var postgresClient: ReturnType<typeof postgres> | undefined;
}

// Disable prefetch as it is not supported for "Transaction" pool mode (PgBouncer)
let client: ReturnType<typeof postgres>;

if (process.env.NODE_ENV === "production") {
  client = postgres(connectionString, { prepare: false, max: 2 });
} else {
  if (!globalThis.postgresClient) {
    globalThis.postgresClient = postgres(connectionString, { prepare: false, max: 1 });
  }
  client = globalThis.postgresClient;
}

export const db = drizzle(client, { schema });
