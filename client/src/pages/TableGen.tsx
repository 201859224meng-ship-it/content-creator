import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Table2,
  Wand2,
  Download,
  ChevronRight,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react";

const TABLE_TYPES = [
  { key: "auto", label: "自动识别", desc: "AI 自动选择最合适的表格类型" },
  { key: "comparison", label: "对比表", desc: "多项目横向对比" },
  { key: "summary", label: "汇总表", desc: "信息归纳整理" },
  { key: "timeline", label: "时间线", desc: "按时间顺序排列" },
  { key: "data", label: "数据表", desc: "结构化数据展示" },
] as const;

type TableType = (typeof TABLE_TYPES)[number]["key"];

interface TableData {
  title: string;
  headers: string[];
  rows: string[][];
  summary: string;
}

export default function TableGen() {
  const { isAuthenticated } = useAuth();
  const [inputText, setInputText] = useState("");
  const [tableType, setTableType] = useState<TableType>("auto");
  const [tableData, setTableData] = useState<TableData | null>(null);

  const utils = trpc.useUtils();
  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); toast.success("项目已保存"); },
    onError: () => toast.error("保存失败"),
  });

  const generateTable = trpc.ai.generateTable.useMutation({
    onSuccess: (data) => {
      setTableData(data);
      toast.success("表格生成成功");
    },
    onError: (err) => {
      toast.error("生成失败：" + err.message);
    },
  });

  const handleGenerate = () => {
    if (!inputText.trim()) {
      toast.error("请先输入文字内容");
      return;
    }
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }
    generateTable.mutate({ text: inputText, tableType });
  };

  const handleExportCSV = () => {
    if (!tableData) return;
    const rows = [tableData.headers, ...tableData.rows];
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableData.title || "table"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV 已下载");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
          <Table2 className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            表格生成
          </h2>
          <p className="text-muted-foreground">登录后即可使用 AI 表格生成功能</p>
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
          <span>表格生成</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
          智能表格生成
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          输入文字数据，AI 自动转换为结构化表格
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              输入文字数据
            </Label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="粘贴或输入您的文字内容，例如：&#10;&#10;产品A：价格100元，重量500g，颜色红色&#10;产品B：价格200元，重量800g，颜色蓝色&#10;产品C：价格150元，重量600g，颜色绿色"
              className="min-h-[280px] resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Table type selector */}
          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">
              表格类型
            </Label>
            <div className="space-y-2">
              {TABLE_TYPES.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setTableType(type.key)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                    tableType === type.key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-secondary/30"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${tableType === type.key ? "bg-primary" : "bg-border"}`} />
                  <div>
                    <div className="text-xs font-semibold text-foreground">{type.label}</div>
                    <div className="text-[10px] text-muted-foreground">{type.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={generateTable.isPending}
          >
            {generateTable.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                生成表格
              </>
            )}
          </Button>
        </div>

        {/* Table Output */}
        <div className="lg:col-span-3">
          {tableData ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Table header */}
              <div className="px-5 py-3.5 border-b border-border bg-secondary/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
                    {tableData.title}
                  </h3>
                  {tableData.summary && (
                    <p className="text-xs text-muted-foreground mt-0.5">{tableData.summary}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7 text-xs"
                    onClick={() => setTableData(null)}
                  >
                    <RotateCcw className="w-3 h-3" />
                    重置
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7 text-xs"
                    onClick={() => {
                      if (!tableData) return;
                      createProject.mutate({
                        title: tableData.title || "表格项目",
                        type: "table",
                        description: tableData.summary,
                        content: JSON.stringify(tableData),
                        meta: { tableType, inputText },
                      });
                    }}
                    disabled={createProject.isPending}
                  >
                    <Save className="w-3 h-3" />
                    保存
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 h-7 text-xs"
                    onClick={handleExportCSV}
                  >
                    <Download className="w-3 h-3" />
                    导出 CSV
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/40">
                      {tableData.headers.map((header, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider border-b border-border"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b border-border/50 transition-colors hover:bg-secondary/20 ${
                          i % 2 === 0 ? "bg-transparent" : "bg-secondary/10"
                        }`}
                      >
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-3 text-sm text-foreground">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-2.5 border-t border-border bg-secondary/10">
                <p className="text-xs text-muted-foreground">
                  共 {tableData.rows.length} 行 × {tableData.headers.length} 列
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/20 min-h-[500px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Table2 className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                表格将在此显示
              </p>
              <p className="text-xs text-muted-foreground/70 max-w-xs">
                在左侧输入文字数据，选择表格类型后点击「生成表格」
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
