import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalPath: text("original_path").notNull(), // <--- ADD THIS LINE
  status: varchar("status", { length: 50 }).default("PENDING").notNull(),
  streamUrl: text("stream_url"),
  thumbnailPath: text("thumbnail_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Video = typeof videos.$inferSelect
export type NewVideo = typeof videos.$inferInsert

