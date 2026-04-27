import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Presentation,
  Wand2,
  ChevronRight,
  Loader2,
  ChevronLeft,
  Download,
  RotateCcw,
  Check,
  Save,
  LogIn,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const PPT_STYLES = [
  {
    key: "coquette",
    name: "Coquette",
    nameZh: "可可特",
    desc: "粉色蕾丝蝴蝶结，浪漫少女感",
    bg: "#FFF0F5",
    primary: "#E8A0BF",
    accent: "#C06080",
    preview: "linear-gradient(135deg, #FFF0F5 0%, #FFD6E7 100%)",
  },
  {
    key: "dark_academia",
    name: "Dark Academia",
    nameZh: "暗黑学院",
    desc: "深棕暗红，复古书卷气",
    bg: "#1C1410",
    primary: "#C4A35A",
    accent: "#8B6914",
    preview: "linear-gradient(135deg, #1C1410 0%, #2D1F0E 100%)",
  },
  {
    key: "cottagecore",
    name: "Cottagecore",
    nameZh: "田园核",
    desc: "米白花卉，温柔自然感",
    bg: "#F5F0E8",
    primary: "#8B7355",
    accent: "#C8A882",
    preview: "linear-gradient(135deg, #F5F0E8 0%, #EDE0CC 100%)",
  },
  {
    key: "minimalism",
    name: "Minimalism",
    nameZh: "极简主义",
    desc: "留白克制，高级线条感",
    bg: "#FAFAFA",
    primary: "#1A1A1A",
    accent: "#888888",
    preview: "linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)",
  },
  {
    key: "vaporwave",
    name: "Vaporwave",
    nameZh: "蒸汽波",
    desc: "霓虹紫粉，赛博复古感",
    bg: "#0D0221",
    primary: "#FF71CE",
    accent: "#01CDFE",
    preview: "linear-gradient(135deg, #0D0221 0%, #1A0533 50%, #0D0221 100%)",
  },
  {
    key: "bauhaus",
    name: "Bauhaus",
    nameZh: "包豪斯",
    desc: "几何色块，现代构成感",
    bg: "#F5F5F0",
    primary: "#E63946",
    accent: "#1D3557",
    preview: "linear-gradient(135deg, #F5F5F0 0%, #E8E8E3 100%)",
  },
] as const;

type PptStyleKey = (typeof PPT_STYLES)[number]["key"];

interface Slide {
  slideIndex: number;
  title: string;
  content: string;
  htmlContent: string;
  style: string;
}

export default function PptGen() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [inputText, setInputText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<PptStyleKey>("minimalism");
  const [slideCount, setSlideCount] = useState(8);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); toast.success("项目已保存"); },
    onError: () => toast.error("保存失败"),
  });

  const handleSave = () => {
    if (!slides.length) return;
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    const styleInfo = PPT_STYLES.find((s) => s.key === selectedStyle)!;
    createProject.mutate({
      title: `PPT - ${styleInfo.nameZh}风格`,
      type: "ppt",
      description: inputText.slice(0, 100),
      content: JSON.stringify(slides),
      meta: { style: selectedStyle, slideCount: slides.length },
    });
  };

  const generatePpt = trpc.ai.generatePpt.useMutation({
    onSuccess: (data) => {
      setSlides(data.slides as Slide[]);
      setCurrentSlide(0);
      toast.success(`已生成 ${data.slides.length} 张幻灯片`);
    },
    onError: (err) => {
      toast.error("生成失败：" + err.message);
    },
  });

  const handleGenerate = () => {
    if (!inputText.trim()) {
      toast.error("请先输入内容");
      return;
    }
    generatePpt.mutate({ text: inputText, style: selectedStyle, slideCount });
  };

  const handleExportHtml = () => {
    if (!slides.length) return;
    const style = PPT_STYLES.find((s) => s.key === selectedStyle)!;
    const slidesHtml = slides
      .map(
        (slide, i) => `
      <div class="slide" id="slide-${i + 1}" style="display:${i === 0 ? "flex" : "none"};width:100%;height:100%;position:absolute;top:0;left:0;">
        ${slide.htmlContent}
      </div>`
      )
      .join("\n");

    const fullHtml = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PPT - ${style.nameZh}风格</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Lora:wght@400;500&family=Space+Grotesk:wght@400;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #111; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
.slideshow { position: relative; width: 960px; height: 540px; overflow: hidden; border-radius: 8px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
.controls { margin-top: 20px; display: flex; align-items: center; gap: 16px; color: #fff; }
.controls button { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: background 0.2s; }
.controls button:hover { background: rgba(255,255,255,0.25); }
.counter { font-size: 13px; opacity: 0.7; }
</style>
</head>
<body>
<div class="slideshow">${slidesHtml}</div>
<div class="controls">
  <button onclick="prev()">← 上一张</button>
  <span class="counter" id="counter">1 / ${slides.length}</span>
  <button onclick="next()">下一张 →</button>
</div>
<script>
let current = 0;
const total = ${slides.length};
function show(n) {
  document.querySelectorAll('.slide').forEach((s, i) => s.style.display = i === n ? 'flex' : 'none');
  document.getElementById('counter').textContent = (n+1) + ' / ' + total;
  current = n;
}
function next() { show((current + 1) % total); }
function prev() { show((current - 1 + total) % total); }
document.addEventListener('keydown', e => { if(e.key==='ArrowRight'||e.key===' ') next(); if(e.key==='ArrowLeft') prev(); });
</script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ppt-${style.nameZh}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PPT HTML 已下载，可在浏览器中演示");
  };

  const currentStyleInfo = PPT_STYLES.find((s) => s.key === selectedStyle)!;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>创作工坊</span>
          <ChevronRight className="w-3 h-3" />
          <span>PPT 生成</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
          多风格 PPT 生成
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          选择美学风格，AI 将您的内容转化为精美幻灯片
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-2 space-y-5">
          {/* Style selector */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
              选择风格
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {PPT_STYLES.map((style) => (
                <button
                  key={style.key}
                  onClick={() => setSelectedStyle(style.key)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    selectedStyle === style.key
                      ? "border-primary shadow-md scale-[1.02]"
                      : "border-border hover:border-primary/40 hover:scale-[1.01]"
                  }`}
                >
                  {/* Style preview */}
                  <div
                    className="h-16 flex items-center justify-center"
                    style={{ background: style.preview }}
                  >
                    <div className="text-center">
                      <div
                        className="text-sm font-bold"
                        style={{ color: style.primary, fontFamily: "var(--font-serif)" }}
                      >
                        Aa
                      </div>
                      <div
                        className="w-8 h-0.5 mx-auto mt-1"
                        style={{ background: style.primary }}
                      />
                    </div>
                  </div>
                  <div
                    className="px-2.5 py-2 text-left"
                    style={{ background: style.bg }}
                  >
                    <div
                      className="text-xs font-semibold leading-tight"
                      style={{ color: style.primary }}
                    >
                      {style.nameZh}
                    </div>
                    <div
                      className="text-[9px] leading-tight mt-0.5 opacity-70"
                      style={{ color: style.primary }}
                    >
                      {style.name}
                    </div>
                  </div>
                  {selectedStyle === style.key && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Slide count */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                幻灯片数量
              </Label>
              <span className="text-sm font-semibold text-primary">{slideCount} 张</span>
            </div>
            <Slider
              value={[slideCount]}
              onValueChange={([v]) => setSlideCount(v)}
              min={3}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
              <span>3 张</span>
              <span>20 张</span>
            </div>
          </div>

          {/* Text input */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              内容文字
            </Label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入您想要制作成 PPT 的内容，可以是文章、报告、演讲稿等..."
              className="min-h-[200px] resize-none text-sm leading-relaxed"
            />
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={generatePpt.isPending}
          >
            {generatePpt.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中，请稍候...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                生成 PPT
              </>
            )}
          </Button>
        </div>

        {/* Right: Slide Preview */}
        <div className="lg:col-span-3 space-y-4">
          {slides.length > 0 ? (
            <>
              {/* Main slide preview */}
              <div className="rounded-xl overflow-hidden border border-border shadow-lg">
                <div
                  className="relative"
                  style={{ paddingBottom: "56.25%", background: currentStyleInfo.bg }}
                >
                  <div
                    className="absolute inset-0"
                    dangerouslySetInnerHTML={{
                      __html: slides[currentSlide]?.htmlContent ?? "",
                    }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                    disabled={currentSlide === 0}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-muted-foreground px-2">
                    {currentSlide + 1} / {slides.length}
                  </span>
                  <button
                    onClick={() => setCurrentSlide((p) => Math.min(slides.length - 1, p + 1))}
                    disabled={currentSlide === slides.length - 1}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => setSlides([])}
                  >
                    <RotateCcw className="w-3 h-3" />
                    重新生成
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={handleSave}
                    disabled={createProject.isPending}
                  >
                    <Save className="w-3 h-3" />
                    保存
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={handleExportHtml}
                  >
                    <Download className="w-3 h-3" />
                    导出演示文稿
                  </Button>
                </div>
              </div>

              {/* Slide thumbnails */}
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {slides.map((slide, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      currentSlide === i
                        ? "border-primary shadow-md"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div
                      className="relative"
                      style={{ paddingBottom: "56.25%", background: currentStyleInfo.bg }}
                    >
                      <div
                        className="absolute inset-0 scale-[0.25] origin-top-left"
                        style={{ width: "400%", height: "400%" }}
                        dangerouslySetInnerHTML={{ __html: slide.htmlContent }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[8px] px-1 py-0.5 truncate">
                      {i + 1}. {slide.title}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 min-h-[500px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Presentation className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                幻灯片预览将在此显示
              </p>
              <p className="text-xs text-muted-foreground/70 max-w-xs mb-6">
                在左侧选择风格，输入内容，点击「生成 PPT」
              </p>

              {/* Style preview cards */}
              <div className="flex gap-3 flex-wrap justify-center">
                {PPT_STYLES.map((style) => (
                  <div
                    key={style.key}
                    className="w-20 rounded-lg overflow-hidden border border-border/50 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSelectedStyle(style.key)}
                  >
                    <div
                      className="h-12 flex items-center justify-center"
                      style={{ background: style.preview }}
                    >
                      <span
                        className="text-xs font-bold"
                        style={{ color: style.primary, fontFamily: "var(--font-serif)" }}
                      >
                        Aa
                      </span>
                    </div>
                    <div
                      className="px-1.5 py-1 text-center"
                      style={{ background: style.bg }}
                    >
                      <span
                        className="text-[9px] font-medium"
                        style={{ color: style.primary }}
                      >
                        {style.nameZh}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Login Prompt */}
      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>保存项目需要登录</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">登录后即可将创作保存到项目中，随时查看和继续编辑。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginPromptOpen(false)}>稍后再说</Button>
            <Button onClick={() => (window.location.href = getLoginUrl())} className="gap-1.5">
              <LogIn className="w-4 h-4" />
              立即登录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
