import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

const connectionString = process.env.TURSO_DATABASE_URL!;
const token = process.env.TURSO_TOKEN;

const client = createClient({
  url: connectionString,
  authToken: token,
});

const db = drizzle(client);

export { db };
