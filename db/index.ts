import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "⚠️ Warning: DATABASE_URL is not set. A fallback placeholder will be used during compilation/build.\n" +
      "Make sure to define DATABASE_URL in your runtime environment variables (e.g. Supabase Dashboard)."
  );
}

const activeConnectionString = connectionString || "postgresql://postgres:postgres@localhost:5432/postgres";

declare global {
  var postgresClient: ReturnType<typeof postgres> | undefined;
}

// Disable prefetch as it is not supported for "Transaction" pool mode (PgBouncer)
let client: ReturnType<typeof postgres>;

if (process.env.NODE_ENV === "production") {
  client = postgres(activeConnectionString, { prepare: false, max: 2 });
} else {
  if (!globalThis.postgresClient) {
    globalThis.postgresClient = postgres(activeConnectionString, { prepare: false, max: 1 });
  }
  client = globalThis.postgresClient;
}

export const db = drizzle(client, { schema });
