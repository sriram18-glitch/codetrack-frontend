import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { GraduationCap, Moon, Sun, LayoutDashboard, Users, UserPlus, Search, Trophy, BarChart3, FileText, Settings, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/students/add", label: "Add Student", icon: UserPlus },
  { to: "/search", label: "Search Student", icon: Search },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("codetrack_theme") === "dark";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("codetrack_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const SidebarContent = (
    <>
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-base font-extrabold leading-tight text-transparent dark:from-indigo-400 dark:to-fuchsia-400">
            CodeTrack
          </p>
          <p className="text-[11px] text-muted-foreground">College performance analytics</p>
        </div>
      </div>

      <nav className="mt-3 flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-bold text-white">
            {admin?.email?.charAt(0).toUpperCase() ?? "A"}
          </div>
          <div className="truncate text-xs text-muted-foreground">{admin?.email}</div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card lg:flex">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r bg-card">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-sm font-semibold text-muted-foreground">CodeTrack</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark((v) => !v)}
              aria-label="Toggle dark mode"
              className="rounded-lg border"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <main className="relative mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute inset-x-0 -top-10 h-64 bg-gradient-to-br from-indigo-500/10 via-transparent to-fuchsia-500/10" />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
