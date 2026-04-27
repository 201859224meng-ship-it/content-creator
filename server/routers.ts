import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import {
  createProject,
  getProjectsByUser,
  getProjectById,
  updateProject,
  deleteProject,
  createUpload,
  getUploadsByUser,
  getUploadsByProject,
  createPptSlides,
  getSlidesByProject,
  deleteSlidesByProject,
} from "./db";

// ─── PPT style definitions ────────────────────────────────────────────────────
const PPT_STYLES = {
  coquette: {
    name: "Coquette",
    nameZh: "可可特",
    description: "粉色蕾丝蝴蝶结，浪漫少女感",
    colors: { bg: "#FFF0F5", primary: "#E8A0BF", accent: "#C06080", text: "#4A2030" },
    font: "Playfair Display",
  },
  dark_academia: {
    name: "Dark Academia",
    nameZh: "暗黑学院",
    description: "深棕暗红，复古书卷气",
    colors: { bg: "#1C1410", primary: "#8B6914", accent: "#C4A35A", text: "#E8DCC8" },
    font: "EB Garamond",
  },
  cottagecore: {
    name: "Cottagecore",
    nameZh: "田园核",
    description: "米白花卉，温柔自然感",
    colors: { bg: "#F5F0E8", primary: "#8B7355", accent: "#C8A882", text: "#3D2B1F" },
    font: "Lora",
  },
  minimalism: {
    name: "Minimalism",
    nameZh: "极简主义",
    description: "留白克制，高级线条感",
    colors: { bg: "#FAFAFA", primary: "#1A1A1A", accent: "#888888", text: "#1A1A1A" },
    font: "Inter",
  },
  vaporwave: {
    name: "Vaporwave",
    nameZh: "蒸汽波",
    description: "霓虹紫粉，赛博复古感",
    colors: { bg: "#0D0221", primary: "#FF71CE", accent: "#01CDFE", text: "#FFFB96" },
    font: "Space Grotesk",
  },
  bauhaus: {
    name: "Bauhaus",
    nameZh: "包豪斯",
    description: "几何色块，现代构成感",
    colors: { bg: "#F5F5F0", primary: "#E63946", accent: "#1D3557", text: "#1D3557" },
    font: "Bebas Neue",
  },
} as const;

type PptStyleKey = keyof typeof PPT_STYLES;

// ─── Generate slide HTML for a given style ────────────────────────────────────
function generateSlideHtml(
  title: string,
  content: string,
  style: PptStyleKey,
  slideIndex: number
): string {
  const s = PPT_STYLES[style];
  const { bg, primary, accent, text } = s.colors;

  const styleMap: Record<PptStyleKey, string> = {
    coquette: `
      <div style="width:100%;height:100%;background:${bg};font-family:'${s.font}',serif;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:60px;">
        <div style="position:absolute;top:0;left:0;right:0;height:8px;background:linear-gradient(90deg,${primary},${accent});"></div>
        <div style="position:absolute;bottom:20px;right:30px;font-size:11px;color:${accent};letter-spacing:3px;text-transform:uppercase;">✦ ${slideIndex + 1} ✦</div>
        <div style="position:absolute;top:20px;right:30px;font-size:24px;color:${primary};opacity:0.3;">❀</div>
        <h2 style="font-size:36px;font-weight:700;color:${accent};margin:0 0 24px;line-height:1.3;font-style:italic;">${title}</h2>
        <div style="width:60px;height:2px;background:${primary};margin-bottom:24px;"></div>
        <p style="font-size:16px;color:${text};line-height:1.9;margin:0;max-width:80%;">${content}</p>
      </div>`,
    dark_academia: `
      <div style="width:100%;height:100%;background:${bg};font-family:'${s.font}',serif;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:60px;">
        <div style="position:absolute;top:0;left:0;width:4px;height:100%;background:${primary};"></div>
        <div style="position:absolute;top:20px;right:30px;font-size:11px;color:${accent};letter-spacing:4px;text-transform:uppercase;opacity:0.7;">— ${slideIndex + 1} —</div>
        <div style="position:absolute;bottom:30px;left:60px;right:60px;height:1px;background:${primary};opacity:0.3;"></div>
        <h2 style="font-size:38px;font-weight:400;color:${accent};margin:0 0 20px;line-height:1.2;letter-spacing:1px;">${title}</h2>
        <div style="width:80px;height:1px;background:${primary};margin-bottom:24px;"></div>
        <p style="font-size:15px;color:${text};line-height:2;margin:0;max-width:75%;opacity:0.9;">${content}</p>
      </div>`,
    cottagecore: `
      <div style="width:100%;height:100%;background:${bg};font-family:'${s.font}',serif;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:60px;">
        <div style="position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle,${primary}22,transparent);border-radius:50%;transform:translate(30%,-30%);"></div>
        <div style="position:absolute;bottom:0;left:0;width:150px;height:150px;background:radial-gradient(circle,${accent}22,transparent);border-radius:50%;transform:translate(-30%,30%);"></div>
        <div style="font-size:11px;color:${accent};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;opacity:0.7;">✿ ${slideIndex + 1}</div>
        <h2 style="font-size:34px;font-weight:600;color:${text};margin:0 0 20px;line-height:1.4;">${title}</h2>
        <div style="width:50px;height:3px;background:${primary};border-radius:2px;margin-bottom:24px;"></div>
        <p style="font-size:15px;color:${text};line-height:1.9;margin:0;max-width:78%;opacity:0.85;">${content}</p>
      </div>`,
    minimalism: `
      <div style="width:100%;height:100%;background:${bg};font-family:'${s.font}',sans-serif;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:80px;">
        <div style="position:absolute;top:40px;right:40px;font-size:11px;color:${accent};letter-spacing:4px;">0${slideIndex + 1}</div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:1px;background:${text};opacity:0.08;"></div>
        <h2 style="font-size:40px;font-weight:700;color:${text};margin:0 0 28px;line-height:1.2;letter-spacing:-1px;">${title}</h2>
        <div style="width:40px;height:2px;background:${text};margin-bottom:28px;"></div>
        <p style="font-size:15px;color:${accent};line-height:1.9;margin:0;max-width:70%;font-weight:300;">${content}</p>
      </div>`,
    vaporwave: `
      <div style="width:100%;height:100%;background:${bg};font-family:'${s.font}',sans-serif;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:60px;">
        <div style="position:absolute;top:0;left:0;right:0;height:100%;background:linear-gradient(180deg,#1a0533 0%,${bg} 100%);opacity:0.5;"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:40%;background:repeating-linear-gradient(0deg,${accent}11 0px,transparent 1px,transparent 20px);"></div>
        <div style="position:relative;z-index:1;">
          <div style="font-size:10px;color:${accent};letter-spacing:6px;text-transform:uppercase;margin-bottom:16px;opacity:0.8;">${slideIndex + 1} / SLIDE</div>
          <h2 style="font-size:38px;font-weight:700;color:${primary};margin:0 0 20px;line-height:1.2;text-shadow:0 0 30px ${primary}88;">${title}</h2>
          <div style="width:100px;height:2px;background:linear-gradient(90deg,${primary},${accent});margin-bottom:24px;"></div>
          <p style="font-size:14px;color:${text};line-height:1.9;margin:0;max-width:75%;">${content}</p>
        </div>
      </div>`,
    bauhaus: `
      <div style="width:100%;height:100%;background:${bg};font-family:'${s.font}',sans-serif;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:60px;">
        <div style="position:absolute;top:0;right:0;width:180px;height:180px;background:${primary};clip-path:polygon(100% 0,100% 100%,0 0);"></div>
        <div style="position:absolute;bottom:0;left:0;width:120px;height:120px;background:${accent};clip-path:circle(50% at 0% 100%);"></div>
        <div style="position:absolute;top:40px;right:50px;width:60px;height:60px;border-radius:50%;background:${accent};opacity:0.7;"></div>
        <div style="position:relative;z-index:1;">
          <div style="font-size:11px;color:${accent};letter-spacing:5px;text-transform:uppercase;margin-bottom:12px;font-weight:700;">${slideIndex + 1}</div>
          <h2 style="font-size:42px;font-weight:900;color:${text};margin:0 0 20px;line-height:1.1;text-transform:uppercase;letter-spacing:-1px;">${title}</h2>
          <div style="width:80px;height:4px;background:${primary};margin-bottom:24px;"></div>
          <p style="font-size:14px;color:${text};line-height:1.8;margin:0;max-width:72%;font-weight:400;">${content}</p>
        </div>
      </div>`,
  };

  return styleMap[style] || styleMap.minimalism;
}

// ─── Main router ──────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Projects ───────────────────────────────────────────────────────────────
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getProjectsByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getProjectById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          type: z.enum(["article", "table", "layout", "ppt"]),
          description: z.string().optional(),
          content: z.string().optional(),
          meta: z.any().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createProject({
          userId: ctx.user.id,
          title: input.title,
          type: input.type,
          description: input.description ?? null,
          content: input.content ?? null,
          meta: input.meta ?? null,
        });
        const projects = await getProjectsByUser(ctx.user.id);
        return projects[0];
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(255).optional(),
          content: z.string().optional(),
          meta: z.any().optional(),
          status: z.enum(["draft", "completed"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateProject(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteProject(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Uploads ─────────────────────────────────────────────────────────────────
  uploads: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUploadsByUser(ctx.user.id);
    }),

    byProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getUploadsByProject(input.projectId);
      }),

    upload: protectedProcedure
      .input(
        z.object({
          filename: z.string(),
          mimeType: z.string(),
          size: z.number(),
          base64Data: z.string(),
          projectId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64Data, "base64");
        const key = `uploads/${ctx.user.id}/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.mimeType);

        await createUpload({
          userId: ctx.user.id,
          projectId: input.projectId ?? null,
          filename: input.filename,
          originalName: input.filename,
          mimeType: input.mimeType,
          size: input.size,
          storageKey: key,
          storageUrl: url,
        });

        return { url, key };
      }),
  }),

  // ─── AI Processing ────────────────────────────────────────────────────────────
  ai: router({
    processText: protectedProcedure
      .input(
        z.object({
          text: z.string().min(1),
          mode: z.enum(["polish", "expand", "shorten", "rewrite", "formal", "casual"]),
          customPrompt: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const modePrompts: Record<string, string> = {
          polish: "请对以下文字进行润色，保持原意，使语言更加流畅优美、表达更加精准：",
          expand: "请对以下文字进行扩写，丰富细节和内容，使其更加充实完整：",
          shorten: "请对以下文字进行精简缩写，保留核心信息，去除冗余内容：",
          rewrite: "请对以下文字进行改写，换一种表达方式，保持原意但风格有所变化：",
          formal: "请将以下文字改写为正式、专业的书面语风格：",
          casual: "请将以下文字改写为轻松、自然的口语化风格：",
        };

        const systemPrompt = input.customPrompt || modePrompts[input.mode];

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "你是一位专业的文字编辑和内容创作助手，擅长各种文字处理和风格转换。请直接输出处理后的文字，不要添加任何解释或前缀。",
            },
            {
              role: "user",
              content: `${systemPrompt}\n\n${input.text}`,
            },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const result = typeof rawContent === "string" ? rawContent : "";
        return { result };
      }),

    generateTable: protectedProcedure
      .input(
        z.object({
          text: z.string().min(1),
          tableType: z.enum(["comparison", "summary", "timeline", "data", "auto"]).default("auto"),
        })
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "你是一位专业的数据分析师，擅长将文字内容结构化为表格。请将用户提供的文字内容转换为结构化表格数据，以JSON格式返回。",
            },
            {
              role: "user",
              content: `请将以下文字内容转换为${input.tableType === "auto" ? "最合适类型的" : input.tableType}表格，以JSON格式返回，格式如下：
{
  "title": "表格标题",
  "headers": ["列1", "列2", "列3"],
  "rows": [["数据1", "数据2", "数据3"], ...],
  "summary": "表格说明"
}

文字内容：
${input.text}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "table_data",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  headers: { type: "array", items: { type: "string" } },
                  rows: {
                    type: "array",
                    items: { type: "array", items: { type: "string" } },
                  },
                  summary: { type: "string" },
                },
                required: ["title", "headers", "rows", "summary"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent2 = response.choices[0]?.message?.content;
        const content = typeof rawContent2 === "string" ? rawContent2 : "{}";
        return JSON.parse(content) as {
          title: string;
          headers: string[];
          rows: string[][];
          summary: string;
        };
      }),

    generateLayout: protectedProcedure
      .input(
        z.object({
          text: z.string().min(1),
          imageUrls: z.array(z.string()).optional(),
          layoutStyle: z
            .enum(["magazine", "card", "timeline", "hero", "grid"])
            .default("magazine"),
        })
      )
      .mutation(async ({ input }) => {
        const imagesInfo =
          input.imageUrls && input.imageUrls.length > 0
            ? `\n\n图片资源（${input.imageUrls.length}张）：${input.imageUrls.map((u, i) => `\n图片${i + 1}: ${u}`).join("")}`
            : "";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `你是一位专业的平面设计师，擅长创作精美的图文排版页面。请根据用户提供的文字和图片，生成一个${input.layoutStyle}风格的HTML排版页面。
要求：
- 使用内联CSS，风格优雅精致
- 配色方案：米白/金/深棕/暗红等高级色系
- 字体：使用Google Fonts中的优雅字体
- 布局：参考小红书精美图文排版风格
- 如有图片，合理融入排版
- 返回完整的HTML片段（不含html/body标签）`,
            },
            {
              role: "user",
              content: `请为以下内容生成${input.layoutStyle}风格的图文排版HTML：\n\n${input.text}${imagesInfo}`,
            },
          ],
        });

        const rawHtml = response.choices[0]?.message?.content;
        const html = typeof rawHtml === "string" ? rawHtml : "";
        return { html };
      }),

    generatePpt: protectedProcedure
      .input(
        z.object({
          text: z.string().min(1),
          style: z.enum([
            "coquette",
            "dark_academia",
            "cottagecore",
            "minimalism",
            "vaporwave",
            "bauhaus",
          ]),
          slideCount: z.number().min(3).max(20).default(8),
          projectId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Step 1: Generate slide outline
        const outlineResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "你是一位专业的PPT内容策划师，擅长将文字内容结构化为精美的幻灯片大纲。",
            },
            {
              role: "user",
              content: `请将以下内容整理为${input.slideCount}张幻灯片的大纲，以JSON格式返回：
{
  "slides": [
    {"title": "幻灯片标题", "content": "幻灯片正文内容（2-4句话）"},
    ...
  ]
}

内容：
${input.text}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "ppt_outline",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        content: { type: "string" },
                      },
                      required: ["title", "content"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["slides"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawOutline = outlineResponse.choices[0]?.message?.content;
        const outlineContent = typeof rawOutline === "string" ? rawOutline : "{}";
        const outline = JSON.parse(outlineContent) as {
          slides: { title: string; content: string }[];
        };

        // Step 2: Generate HTML for each slide
        const slidesData = outline.slides.map((slide, index) => ({
          projectId: input.projectId ?? 0,
          slideIndex: index,
          title: slide.title,
          content: slide.content,
          htmlContent: generateSlideHtml(slide.title, slide.content, input.style, index),
          style: input.style,
          layoutMeta: { style: input.style, styleInfo: PPT_STYLES[input.style] },
        }));

        // Step 3: Save to DB if projectId provided
        if (input.projectId) {
          await deleteSlidesByProject(input.projectId);
          await createPptSlides(
            slidesData.map((s) => ({
              ...s,
              layoutMeta: s.layoutMeta as Record<string, unknown>,
            }))
          );
        }

        return {
          slides: slidesData,
          style: PPT_STYLES[input.style],
        };
      }),

    getSlides: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getSlidesByProject(input.projectId);
      }),
  }),

  // ─── PPT Styles ───────────────────────────────────────────────────────────────
  pptStyles: publicProcedure.query(() => {
    return Object.entries(PPT_STYLES).map(([key, value]) => ({
      key,
      ...value,
    }));
  }),
});

export type AppRouter = typeof appRouter;
