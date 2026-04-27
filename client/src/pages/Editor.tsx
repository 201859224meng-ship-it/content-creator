import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Wand2,
  Upload,
  Copy,
  RotateCcw,
  Save,
  FileText,
  ImageIcon,
  X,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Edit3,
  SplitSquareHorizontal,
  Eye,
} from "lucide-react";

const AI_MODES = [
  { key: "polish", label: "润色", desc: "语言更流畅优美" },
  { key: "expand", label: "扩写", desc: "丰富细节内容" },
  { key: "shorten", label: "缩写", desc: "精简保留核心" },
  { key: "rewrite", label: "改写", desc: "换种表达方式" },
  { key: "formal", label: "正式化", desc: "书面专业风格" },
  { key: "casual", label: "口语化", desc: "轻松自然风格" },
] as const;

type AiMode = (typeof AI_MODES)[number]["key"];
type ViewMode = "single" | "compare";

interface UploadedImage {
  name: string;
  url: string;
}

export default function Editor() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [editedText, setEditedText] = useState("");
  const [selectedMode, setSelectedMode] = useState<AiMode>("polish");
  const [useAI, setUseAI] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const processText = trpc.ai.processText.useMutation({
    onSuccess: (data) => {
      setOutputText(data.result);
      setEditedText(data.result);
      toast.success("AI 处理完成");
    },
    onError: (err) => {
      toast.error("AI 处理失败：" + err.message);
    },
  });

  const uploadMutation = trpc.uploads.upload.useMutation();

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      setSaveDialogOpen(false);
      toast.success("项目已保存");
    },
    onError: () => toast.error("保存失败"),
  });

  const handleTextFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setInputText((prev) => (prev ? prev + "\n\n" : "") + ((e.target?.result as string) ?? ""));
      toast.success(`已导入：${file.name}`);
    };
    reader.readAsText(file);
  }, []);

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!isAuthenticated) return;
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
          toast.success(`图片已上传：${file.name}`);
        } catch {
          toast.error(`上传失败：${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    },
    [isAuthenticated, uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => {
        if (file.type.startsWith("image/")) {
          handleImageFile(file);
        } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
          handleTextFile(file);
        }
      });
    },
    [handleImageFile, handleTextFile]
  );

  const handleProcess = () => {
    if (!inputText.trim()) {
      toast.error("请先输入或上传文字内容");
      return;
    }
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }
    processText.mutate({ text: inputText, mode: selectedMode });
  };

  const handleCopy = () => {
    const text = isEditing ? editedText : outputText;
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setEditedText("");
    setIsEditing(false);
    setUploadedImages([]);
    setViewMode("single");
  };

  const handleSave = () => {
    if (!outputText && !inputText) {
      toast.error("暂无内容可保存");
      return;
    }
    setProjectTitle("AI 文字编辑 - " + new Date().toLocaleDateString("zh-CN"));
    setSaveDialogOpen(true);
  };

  const confirmSave = () => {
    const content = isEditing ? editedText : (outputText || inputText);
    createProject.mutate({
      title: projectTitle || "未命名文字项目",
      type: "article",
      description: `${AI_MODES.find((m) => m.key === selectedMode)?.label || "原文"} · ${content.slice(0, 50)}...`,
      content,
      meta: {
        mode: selectedMode,
        originalText: inputText,
        processedText: outputText,
        images: uploadedImages,
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
          <Wand2 className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            AI 文字编辑器
          </h2>
          <p className="text-muted-foreground">登录后即可使用 AI 文字处理功能</p>
        </div>
        <Button onClick={() => (window.location.href = getLoginUrl())} size="lg">
          登录开始使用
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>创作工坊</span>
          <ChevronRight className="w-3 h-3" />
          <span>AI 文字编辑</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
          AI 文字编辑器
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          上传或输入文字，选择 AI 处理模式，支持原文对比与精细编辑
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Panel */}
        <div className="space-y-4">
          {/* Upload zone */}
          <div
            className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="p-5">
              <div className="text-center mb-3">
                <Upload className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">拖拽文件到此处，或点击按钮上传</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">支持 .txt 文字文件（可批量）和图片文件</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  导入文字
                </Button>
                <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  上传图片
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept=".txt,text/plain" multiple className="hidden"
                onChange={(e) => Array.from(e.target.files ?? []).forEach(handleTextFile)} />
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => Array.from(e.target.files ?? []).forEach(handleImageFile)} />
            </div>
          </div>

          {/* Uploaded images */}
          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
            </div>
          )}

          {/* Text input */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              输入文字
            </Label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="在此输入或粘贴您的文字内容..."
              className="min-h-[220px] resize-none text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground mt-1.5 text-right">{inputText.length} 字</p>
          </div>

          {/* AI Controls */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">启用 AI 处理</Label>
              <Switch checked={useAI} onCheckedChange={setUseAI} />
            </div>

            {useAI && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">
                    处理模式
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {AI_MODES.map((mode) => (
                      <button
                        key={mode.key}
                        onClick={() => setSelectedMode(mode.key)}
                        className={`p-2.5 rounded-lg border text-left transition-all duration-200 ${
                          selectedMode === mode.key
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/40 hover:bg-secondary/50"
                        }`}
                      >
                        <div className="text-xs font-semibold mb-0.5">{mode.label}</div>
                        <div className="text-[10px] text-muted-foreground">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button
              className="w-full gap-2"
              onClick={useAI ? handleProcess : () => { setOutputText(inputText); setEditedText(inputText); }}
              disabled={processText.isPending}
            >
              {processText.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />AI 处理中...</>
              ) : (
                <><Wand2 className="w-4 h-4" />{useAI ? "AI 处理" : "直接使用"}</>
              )}
            </Button>
          </div>
        </div>

        {/* Right: Output Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              处理结果
            </Label>
            {outputText && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {useAI ? AI_MODES.find((m) => m.key === selectedMode)?.label : "原文"}
                </Badge>
                {/* View mode toggle */}
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setViewMode("single")}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs transition-colors ${
                      viewMode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    单栏
                  </button>
                  <button
                    onClick={() => setViewMode("compare")}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs transition-colors ${
                      viewMode === "compare" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <SplitSquareHorizontal className="w-3 h-3" />
                    对比
                  </button>
                </div>
              </div>
            )}
          </div>

          {outputText ? (
            viewMode === "compare" ? (
              /* Compare view */
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-3 py-2 border-b border-border bg-secondary/30">
                    <span className="text-xs font-medium text-muted-foreground">原文</span>
                  </div>
                  <div className="p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap min-h-[350px]" style={{ fontFamily: "var(--font-body)" }}>
                    {inputText}
                  </div>
                </div>
                <div className="rounded-xl border border-primary/30 bg-card overflow-hidden">
                  <div className="px-3 py-2 border-b border-border bg-primary/5">
                    <span className="text-xs font-medium text-primary">AI 处理后</span>
                  </div>
                  <div className="p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap min-h-[350px]" style={{ fontFamily: "var(--font-body)" }}>
                    {outputText}
                  </div>
                </div>
              </div>
            ) : (
              /* Single view */
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors ${
                      isEditing ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    {isEditing ? "编辑中" : "手动编辑"}
                  </button>
                  <div className="flex-1" />
                  <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md hover:bg-secondary transition-colors">
                    <Copy className="w-3 h-3" />
                    复制
                  </button>
                  <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md hover:bg-secondary transition-colors">
                    <RotateCcw className="w-3 h-3" />
                    重置
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  {isEditing ? (
                    <Textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="min-h-[380px] resize-none text-sm leading-relaxed border-0 shadow-none focus-visible:ring-0 p-0"
                    />
                  ) : (
                    <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap min-h-[380px]" style={{ fontFamily: "var(--font-body)" }}>
                      {outputText}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-border bg-secondary/20 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {(isEditing ? editedText : outputText).length} 字
                  </p>
                  <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={handleSave}>
                    <Save className="w-3 h-3" />
                    保存到项目
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <Wand2 className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">AI 处理结果将在此显示</p>
              <p className="text-xs text-muted-foreground/70">在左侧输入文字，选择处理模式后点击「AI 处理」</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>保存到项目</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs text-muted-foreground mb-2 block">项目名称</Label>
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="为项目起个名字..."
              className="text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>取消</Button>
            <Button onClick={confirmSave} disabled={createProject.isPending} className="gap-1.5">
              {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
