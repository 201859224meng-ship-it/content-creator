import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      httpOnly: true,
    });
  });
});

describe("pptStyles", () => {
  it("returns 6 PPT styles", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const styles = await caller.pptStyles();

    expect(styles).toHaveLength(6);
    const keys = styles.map((s) => s.key);
    expect(keys).toContain("coquette");
    expect(keys).toContain("dark_academia");
    expect(keys).toContain("cottagecore");
    expect(keys).toContain("minimalism");
    expect(keys).toContain("vaporwave");
    expect(keys).toContain("bauhaus");
  });

  it("each style has required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const styles = await caller.pptStyles();

    for (const style of styles) {
      expect(style).toHaveProperty("key");
      expect(style).toHaveProperty("name");
      expect(style).toHaveProperty("nameZh");
      expect(style).toHaveProperty("colors");
      expect(style.colors).toHaveProperty("bg");
      expect(style.colors).toHaveProperty("primary");
    }
  });
});

describe("auth.me", () => {
  it("returns current user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).not.toBeNull();
    expect(user?.name).toBe("Test User");
    expect(user?.email).toBe("test@example.com");
  });

  it("returns null when not authenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});
