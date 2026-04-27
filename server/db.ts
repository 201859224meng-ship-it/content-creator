/**
 * server/db.ts — 数据库查询辅助函数
 *
 * 所有数据库操作都封装在此文件，供 routers.ts 调用。
 * 表结构定义在 drizzle/schema.ts 中。
 *
 * 【包含的查询函数】
 *   - upsertUser / getUserByOpenId     用户相关（框架内置）
 *   - createProject / getProjectsByUser / getProjectById / updateProject / deleteProject
 *   - createUpload / getUploadsByUser / getUploadsByProject
 *   - createPptSlides / getSlidesByProject / deleteSlidesByProject
 *
 * 【交接注意】
 *   - 修改表结构时：先改 drizzle/schema.ts → pnpm drizzle-kit generate 生成 SQL →
 *     通过 webdev_execute_sql 工具应用（不要直接运行 migrate 命令）
 */
import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  projects,
  uploads,
  pptSlides,
  InsertProject,
  InsertUpload,
  InsertPptSlide,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Project helpers ──────────────────────────────────────────────────────────

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return result;
}

export async function getProjectsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateProject(
  id: number,
  userId: number,
  data: Partial<InsertProject>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(projects)
    .set(data)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

export async function deleteProject(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

// ─── Upload helpers ───────────────────────────────────────────────────────────

export async function createUpload(data: InsertUpload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(uploads).values(data);
  return result;
}

export async function getUploadsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(uploads)
    .where(eq(uploads.userId, userId))
    .orderBy(desc(uploads.createdAt));
}

export async function getUploadsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(uploads).where(eq(uploads.projectId, projectId));
}

// ─── PPT Slide helpers ────────────────────────────────────────────────────────

export async function createPptSlides(slides: InsertPptSlide[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (slides.length === 0) return;
  await db.insert(pptSlides).values(slides);
}

export async function getSlidesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(pptSlides)
    .where(eq(pptSlides.projectId, projectId))
    .orderBy(pptSlides.slideIndex);
}

export async function updateSlide(id: number, data: Partial<InsertPptSlide>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pptSlides).set(data).where(eq(pptSlides.id, id));
}

export async function deleteSlidesByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pptSlides).where(eq(pptSlides.projectId, projectId));
}
