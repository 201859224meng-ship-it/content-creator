import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Projects table - stores user's creative projects
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull().default("未命名项目"),
  description: text("description"),
  type: mysqlEnum("type", ["article", "table", "layout", "ppt"]).notNull().default("article"),
  status: mysqlEnum("status", ["draft", "completed"]).default("draft").notNull(),
  // Stores the main content (text, table data, layout html, ppt slides JSON)
  content: text("content"),
  // Stores metadata like PPT style, layout options, etc.
  meta: json("meta"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// Uploads table - stores uploaded files (images, text files)
export const uploads = mysqlTable("uploads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  filename: varchar("filename", { length: 500 }).notNull(),
  originalName: varchar("originalName", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  size: int("size").notNull(),
  storageKey: varchar("storageKey", { length: 1000 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1000 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

// PPT Slides table - stores individual slides for a PPT project
export const pptSlides = mysqlTable("ppt_slides", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  slideIndex: int("slideIndex").notNull(),
  title: varchar("title", { length: 500 }),
  content: text("content"),
  // HTML/CSS content for the slide
  htmlContent: text("htmlContent"),
  // Style theme: coquette | dark_academia | cottagecore | minimalism | vaporwave | bauhaus
  style: varchar("style", { length: 50 }).default("minimalism"),
  // JSON for layout metadata
  layoutMeta: json("layoutMeta"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PptSlide = typeof pptSlides.$inferSelect;
export type InsertPptSlide = typeof pptSlides.$inferInsert;
