import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { isProduction, serverEnvironment } from "@/lib/config";

import * as schema from "./schema";

const globalForDatabase = globalThis as typeof globalThis & {
  deepstationDatabasePool?: Pool;
};

export function createDatabase(connectionString: string) {
  const databasePool =
    globalForDatabase.deepstationDatabasePool ??
    new Pool({
      connectionString,
      idleTimeoutMillis: 10_000,
      max: isProduction ? 1 : 5,
      ssl: isProduction ? true : undefined
    });

  if (!isProduction) {
    globalForDatabase.deepstationDatabasePool = databasePool;
  }

  return drizzle(databasePool, { schema });
}

export const database = serverEnvironment.DATABASE_URL
  ? createDatabase(serverEnvironment.DATABASE_URL)
  : null;
