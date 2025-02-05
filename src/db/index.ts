import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";

const connectionString = process.env.TURSO_DATABASE_URL!;
const token = process.env.TURSO_TOKEN;
const dbConnectionString = token
  ? `${connectionString}?token=${token}`
  : connectionString;

const db = drizzle(dbConnectionString);

export { db };
