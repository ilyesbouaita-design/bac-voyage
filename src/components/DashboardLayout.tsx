import { Link, useNavigate, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { dashboardTranslations, type DashboardTranslations } from "@/lib/i18n-dashboard";
import { useLocale } from "@/lib/useLocale";
import type { Locale } from "@/lib/i18n";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  t?: DashboardTranslations;
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
  role: "admin" | "student";
  displayName?: string | null;
  navItems?: NavItem[];
}

export function DashboardLayout({
  children,
  t: tProp,
  locale: localeProp,
  onLocaleChange: onLocaleChangeProp,
  role,
  displayName: displayNameProp,
  navItems,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const localeHook = useLocale();

  // Fallbacks: use props if provided, otherwise use hook/defaults
  const locale = localeProp ?? localeHook.locale;
  const t = tProp ?? dashboardTranslations[locale] ?? dashboardTranslations["fr"];
  const onLocaleChange = onLocaleChangeProp ?? localeHook.setLocale;
  const displayName = displayNameProp ?? null;
  const safeNavItems = navItems ?? [];

  function toggleTheme() {
    const el = document.documentElement;
    const dark = el.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("demo-mode");
    localStorage.removeItem("demo-role");
    localStorage.removeItem("demo-user");
    navigate({ to: "/login" });
  }

  const nextLocale: Locale = locale === "fr" ? "ar" : "fr";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 z-50 flex w-64 flex-col border-e border-border bg-card transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white text-base font-bold bg-gradient-to-br from-brand-violet to-brand-coral">
            B
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">BacAllemand</p>
            <p className="text-[11px] text-muted-foreground capitalize">{role}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {safeNavItems.map((item) => {
            const isActive = matchRoute({ to: item.to, fuzzy: true });
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-violet/10 text-brand-violet font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <span className="shrink-0 [&>svg]:h-[18px] [&>svg]:w-[18px]">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-border px-3 py-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            {t.sidebar_back_home}
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {t.sidebar_logout}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-5">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden grid h-9 w-9 place-items-center rounded-xl hover:bg-accent transition-colors"
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
            </button>
            <span className="text-sm font-medium text-muted-foreground">
              {displayName ? `${role === "admin" ? t.admin_welcome : t.student_welcome}, ${displayName}` : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLocaleChange(nextLocale)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {locale === "fr" ? "العربية" : "Français"}
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <span className="dark:hidden text-sm">🌙</span>
              <span className="hidden dark:inline text-sm">☀️</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
