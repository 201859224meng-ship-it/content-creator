import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Table2,
  Layout,
  Presentation,
  Sparkles,
  ArrowRight,
  Wand2,
  Layers,
  Palette,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "AI 文字编辑",
    titleEn: "AI Text Editor",
    desc: "上传文字，选择润色、扩写、缩写等 AI 处理模式，再进行精细手动编辑",
    href: "/editor",
    color: "from-amber-50 to-orange-50",
    iconColor: "text-amber-700",
    iconBg: "bg-amber-100",
  },
  {
    icon: Table2,
    title: "表格生成",
    titleEn: "Table Generator",
    desc: "将文字数据智能转换为结构化表格，支持对比表、时间线、数据汇总等多种类型",
    href: "/table",
    color: "from-emerald-50 to-teal-50",
    iconColor: "text-emerald-700",
    iconBg: "bg-emerald-100",
  },
  {
    icon: Layout,
    title: "图文排版",
    titleEn: "Layout Designer",
    desc: "上传文字与图片，AI 自动生成精美图文排版页面，多种排版风格可选",
    href: "/layout",
    color: "from-rose-50 to-pink-50",
    iconColor: "text-rose-700",
    iconBg: "bg-rose-100",
  },
  {
    icon: Presentation,
    title: "PPT 生成",
    titleEn: "PPT Creator",
    desc: "6 种精美美学风格模板，一键将内容转化为精致幻灯片，支持导出",
    href: "/ppt",
    color: "from-violet-50 to-purple-50",
    iconColor: "text-violet-700",
    iconBg: "bg-violet-100",
  },
];

const pptStyles = [
  { name: "Coquette", nameZh: "可可特", color: "#E8A0BF", bg: "#FFF0F5" },
  { name: "Dark Academia", nameZh: "暗黑学院", color: "#8B6914", bg: "#1C1410" },
  { name: "Cottagecore", nameZh: "田园核", color: "#8B7355", bg: "#F5F0E8" },
  { name: "Minimalism", nameZh: "极简主义", color: "#1A1A1A", bg: "#FAFAFA" },
  { name: "Vaporwave", nameZh: "蒸汽波", color: "#FF71CE", bg: "#0D0221" },
  { name: "Bauhaus", nameZh: "包豪斯", color: "#E63946", bg: "#F5F5F0" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.97_0.01_80)] via-[oklch(0.96_0.015_70)] to-[oklch(0.95_0.018_60)] px-6 py-20 lg:py-28">
        {/* Decorative elements */}
        <div className="absolute top-12 right-16 w-64 h-64 rounded-full bg-[var(--dusty-rose)] opacity-[0.06] blur-3xl pointer-events-none" />
        <div className="absolute bottom-8 left-8 w-48 h-48 rounded-full bg-[var(--gold)] opacity-[0.08] blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-[var(--sage)] opacity-[0.05] blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/80 text-xs text-muted-foreground mb-8 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
            <span>AI 驱动的内容创作与排版工具</span>
          </div>

          <h1
            className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            优雅创作，
            <span className="italic text-primary"> 精致呈现</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            上传您的文字与图片，借助 AI 的力量润色内容、生成表格、设计排版，
            <br className="hidden lg:block" />
            并以 6 种精美美学风格一键生成 PPT。
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {isAuthenticated ? (
              <Link href="/editor">
                <Button size="lg" className="gap-2 px-8">
                  <Wand2 className="w-4 h-4" />
                  开始创作
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                className="gap-2 px-8"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                <Sparkles className="w-4 h-4" />
                登录开始使用
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            <Link href="/ppt">
              <Button variant="outline" size="lg" className="gap-2 px-8">
                <Palette className="w-4 h-4" />
                浏览风格模板
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
            核心功能
          </p>
          <h2
            className="text-3xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            四大创作模块
          </h2>
          <div className="w-12 h-0.5 bg-primary mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} href={feature.href}>
                <div
                  className={`group relative p-6 rounded-xl border border-border bg-gradient-to-br ${feature.color} hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-0.5`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-lg ${feature.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="text-base font-semibold text-foreground"
                          style={{ fontFamily: "var(--font-serif)" }}
                        >
                          {feature.title}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {feature.titleEn}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* PPT Styles Showcase */}
      <section className="px-6 py-16 bg-gradient-to-b from-transparent to-[oklch(0.96_0.008_78)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
              美学风格
            </p>
            <h2
              className="text-3xl font-semibold text-foreground"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              六种精美 PPT 风格
            </h2>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-4 mb-4" />
            <p className="text-sm text-muted-foreground">
              从浪漫可可特到极简主义，每种风格都经过精心设计
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {pptStyles.map((style) => (
              <Link key={style.name} href="/ppt">
                <div className="group cursor-pointer">
                  <div
                    className="aspect-[4/3] rounded-lg mb-3 flex items-center justify-center border border-border/50 overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:scale-105"
                    style={{ background: style.bg }}
                  >
                    <div className="text-center p-3">
                      <div
                        className="text-sm font-bold mb-1"
                        style={{ color: style.color, fontFamily: "var(--font-serif)" }}
                      >
                        Aa
                      </div>
                      <div
                        className="w-8 h-0.5 mx-auto mb-1.5"
                        style={{ background: style.color }}
                      />
                      <div
                        className="w-6 h-0.5 mx-auto opacity-50"
                        style={{ background: style.color }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-foreground">{style.nameZh}</p>
                    <p className="text-[10px] text-muted-foreground">{style.name}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
            使用流程
          </p>
          <h2
            className="text-3xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            三步完成精美内容
          </h2>
          <div className="w-12 h-0.5 bg-primary mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              icon: Layers,
              title: "上传内容",
              desc: "拖拽上传文字和图片，支持批量导入，快速整理您的素材",
            },
            {
              step: "02",
              icon: Wand2,
              title: "AI 智能处理",
              desc: "选择 AI 处理模式，自动润色文字、生成表格或设计排版",
            },
            {
              step: "03",
              icon: Sparkles,
              title: "导出精美成品",
              desc: "预览并微调细节，一键导出 PPT 或图文排版页面",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="text-center group">
                <div className="relative inline-flex mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {item.step.slice(-1)}
                  </span>
                </div>
                <h3
                  className="text-base font-semibold text-foreground mb-2"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          <span style={{ fontFamily: "var(--font-serif)" }} className="italic">
            创作工坊 AI Studio
          </span>
          {" · "}优雅精致，由 AI 驱动
        </p>
      </footer>
    </div>
  );
}
