import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Home,
  FolderOpen,
  FileText,
  Table2,
  Layout,
  Presentation,
  Menu,
  X,
  Sparkles,
  LogOut,
  LogIn,
} from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "首页", labelEn: "Home" },
  { href: "/projects", icon: FolderOpen, label: "我的项目", labelEn: "Projects" },
  { href: "/editor", icon: FileText, label: "AI 文字编辑", labelEn: "AI Editor" },
  { href: "/table", icon: Table2, label: "表格生成", labelEn: "Table Gen" },
  { href: "/layout", icon: Layout, label: "图文排版", labelEn: "Layout" },
  { href: "/ppt", icon: Presentation, label: "PPT 生成", labelEn: "PPT Gen" },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      toast.success("已退出登录");
    },
  });

  const isHomePage = location === "/";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--sidebar)] border-r border-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:flex`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div
                className="text-sm font-semibold text-foreground leading-tight"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                创作工坊
              </div>
              <div className="text-[10px] text-muted-foreground tracking-widest uppercase">
                AI Studio
              </div>
            </div>
          </Link>
          <button
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-3 mb-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              功能模块
            </p>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[var(--sidebar-accent)] transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.name ?? "用户"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email ?? ""}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              <LogIn className="w-4 h-4 mr-2" />
              登录
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="h-14 flex items-center px-4 border-b border-border bg-background lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground mr-3"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div
            className="text-base font-semibold text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            创作工坊
          </div>
          {!isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              登录
            </Button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
