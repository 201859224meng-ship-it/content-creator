import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  FolderOpen,
  FileText,
  Table2,
  Layout,
  Presentation,
  MoreHorizontal,
  Trash2,
  Edit3,
  Plus,
  ChevronRight,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

const TYPE_CONFIG = {
  article: {
    icon: FileText,
    label: "AI 文字",
    color: "text-amber-700",
    bg: "bg-amber-50",
    href: "/editor",
  },
  table: {
    icon: Table2,
    label: "表格",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    href: "/table",
  },
  layout: {
    icon: Layout,
    label: "图文排版",
    color: "text-rose-700",
    bg: "bg-rose-50",
    href: "/layout",
  },
  ppt: {
    icon: Presentation,
    label: "PPT",
    color: "text-violet-700",
    bg: "bg-violet-50",
    href: "/ppt",
  },
};

export default function Projects() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: projects, isLoading } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      toast.success("项目已删除");
    },
    onError: () => toast.error("删除失败"),
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
          <FolderOpen className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            我的项目
          </h2>
          <p className="text-muted-foreground">登录后查看您的创作项目</p>
        </div>
        <Button onClick={() => (window.location.href = getLoginUrl())} size="lg">
          登录查看
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>创作工坊</span>
            <ChevronRight className="w-3 h-3" />
            <span>我的项目</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
            我的项目
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {projects?.length ?? 0} 个项目
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/editor">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              新建项目
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-secondary rounded w-full mb-2" />
              <div className="h-3 bg-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const typeConfig = TYPE_CONFIG[project.type];
            const Icon = typeConfig.icon;
            return (
              <div
                key={project.id}
                className="group rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${typeConfig.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${typeConfig.color}`} />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="text-sm font-semibold text-foreground truncate"
                        style={{ fontFamily: "var(--font-serif)" }}
                      >
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {typeConfig.label}
                        </Badge>
                        <Badge
                          variant={project.status === "completed" ? "default" : "outline"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {project.status === "completed" ? "已完成" : "草稿"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={typeConfig.href}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          继续编辑
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteProject.mutate({ id: project.id })}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除项目
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {project.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(project.updatedAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-secondary/20 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-muted-foreground mb-1">暂无项目</p>
          <p className="text-sm text-muted-foreground/70 mb-6">
            开始创作您的第一个项目
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            {Object.entries(TYPE_CONFIG).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <Link key={type} href={config.href}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
