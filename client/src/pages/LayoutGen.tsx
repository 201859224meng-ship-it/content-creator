import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Layout,
  Wand2,
  Upload,
  ImageIcon,
  X,
  ChevronRight,
  Loader2,
  Download,
  RotateCcw,
  Eye,
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

const LAYOUT_STYLES = [
  { key: "magazine", label: "杂志风", desc: "大图配文，高级感" },
  { key: "card", label: "卡片式", desc: "信息卡片排列" },
  { key: "timeline", label: "时间线", desc: "纵向时间流" },
  { key: "hero", label: "主视觉", desc: "突出主图" },
  { key: "grid", label: "网格式", desc: "均衡网格布局" },
] as const;

type LayoutStyle = (typeof LAYOUT_STYLES)[number]["key"];

interface UploadedImage {
  name: string;
  url: string;
}

export default function LayoutGen() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [inputText, setInputText] = useState("");
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>("magazine");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.uploads.upload.useMutation();

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); toast.success("项目已保存"); },
    onError: () => toast.error("保存失败"),
  });

  const generateLayout = trpc.ai.generateLayout.useMutation({
    onSuccess: (data) => {
      setGeneratedHtml(data.html);
      toast.success("排版生成成功");
    },
    onError: (err) => {
      toast.error("生成失败：" + err.message);
    },
  });

  const handleImageFile = useCallback(
    async (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        try {
          const result = await uploadMutation.mutateAsync({
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            base64Data: base64,
          });
          setUploadedImages((prev) => [...prev, { name: file.name, url: result.url }]);
          toast.success(`已上传：${file.name}`);
        } catch {
          toast.error(`上传失败：${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    },
    [uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      Array.from(e.dataTransfer.files).forEach((file) => {
        if (file.type.startsWith("image/")) handleImageFile(file);
      });
    },
    [handleImageFile]
  );

  const handleGenerate = () => {
    if (!inputText.trim()) {
      toast.error("请先输入文字内容");
      return;
    }
    generateLayout.mutate({
      text: inputText,
      imageUrls: uploadedImages.map((img) => img.url),
      layoutStyle,
    });
  };

  const handleExportHtml = () => {
    if (!generatedHtml) return;
    const fullHtml = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>图文排版</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:wght@400;500&display=swap" rel="stylesheet">
<style>body{margin:0;padding:20px;background:#f9f7f4;font-family:Georgia,serif;}</style>
</head>
<body>${generatedHtml}</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "layout.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML 已下载");
  };

  const handleSave = () => {
    if (!generatedHtml) return;
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    createProject.mutate({
      title: `图文排版 - ${LAYOUT_STYLES.find(s => s.key === layoutStyle)?.label}`,
      type: "layout",
      description: inputText.slice(0, 100),
      content: generatedHtml,
      meta: { layoutStyle, imageCount: uploadedImages.length },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>创作工坊</span>
          <ChevronRight className="w-3 h-3" />
          <span>图文排版</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
          AI 图文排版
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          上传文字与图片，AI 自动生成精美图文排版页面
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Image upload */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              上传图片（可选）
            </Label>
            <div
              className={`rounded-xl border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/20"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => imageInputRef.current?.click()}
            >
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">拖拽或点击上传图片</p>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => Array.from(e.target.files ?? []).forEach(handleImageFile)}
              />
            </div>

            {uploadedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {uploadedImages.map((img, i) => (
                  <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border">
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setUploadedImages((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>

          {/* Text input */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              文字内容
            </Label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入您想要排版的文字内容..."
              className="min-h-[200px] resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Layout style */}
          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">
              排版风格
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUT_STYLES.map((style) => (
                <button
                  key={style.key}
                  onClick={() => setLayoutStyle(style.key)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    layoutStyle === style.key
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40 hover:bg-secondary/30"
                  }`}
                >
                  <div className="text-xs font-semibold mb-0.5">{style.label}</div>
                  <div className="text-[10px] text-muted-foreground">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={generateLayout.isPending}
          >
            {generateLayout.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                生成排版
              </>
            )}
          </Button>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-3">
          {generatedHtml ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">排版预览</span>
                <div className="flex-1" />
                <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setGeneratedHtml("")}>
                  <RotateCcw className="w-3 h-3" />
                  重置
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={handleSave} disabled={createProject.isPending}>
                  <Save className="w-3 h-3" />
                  保存
                </Button>
                <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={handleExportHtml}>
                  <Download className="w-3 h-3" />
                  导出 HTML
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-[#f9f7f4]">
                <div
                  className="text-sm"
                  style={{ fontFamily: "var(--font-body)" }}
                  dangerouslySetInnerHTML={{ __html: generatedHtml }}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 min-h-[600px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Layout className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                排版预览将在此显示
              </p>
              <p className="text-xs text-muted-foreground/70 max-w-xs">
                在左侧输入文字，上传图片，选择排版风格后点击「生成排版」
              </p>
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
