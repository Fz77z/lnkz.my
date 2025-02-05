import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// New table to store user information (or whoever is shortening links)
export const usersTable = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  username: text().notNull().unique(), // You can extend with more fields (e.g., email)
  createdAt: text().notNull(),
});

// Update linksTable to associate shortened URLs with a user
export const linksTable = sqliteTable("links_table", {
  id: int().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(),
  url: text().notNull(),
  createdAt: text().notNull(),
  clicks: int().notNull().default(0),
  ipAddress: text().notNull(), // Store the browser's IP address when the link is shortened.
});

export const userAnalyticsTable = sqliteTable("user_analytics", {
  id: int().primaryKey({ autoIncrement: true }),
  linkId: int()
    .notNull()
    .references(() => linksTable.id),
  userAgent: text().notNull(),
  ipAddress: text().notNull(),
  language: text().notNull().default(""),
  referrer: text().notNull().default(""),
  createdAt: text().notNull(),
});
