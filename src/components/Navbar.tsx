import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { Locale, Translations } from "@/lib/i18n";

interface NavbarProps {
  t: Translations;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export function Navbar({ t, locale, onLocaleChange }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleTheme() {
    const el = document.documentElement;
    const dark = el.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  const nextLocale: Locale = locale === "fr" ? "ar" : "fr";
  const localeLabel = locale === "fr" ? "العربية" : "Français";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl text-white text-base font-bold bg-gradient-to-br from-brand-violet to-brand-coral">
            B
          </div>
          <span className="text-lg font-semibold font-[var(--font-display)]">
            BacAllemand
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {/* Language switch */}
          <button
            onClick={() => onLocaleChange(nextLocale)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {localeLabel}
          </button>

          {/* Dark mode */}
          <button
            onClick={toggleTheme}
            aria-label={t.nav_dark_mode}
            className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <span className="dark:hidden text-base">🌙</span>
            <span className="hidden dark:inline text-base">☀️</span>
          </button>

          <div className="mx-2 h-5 w-px bg-border" />

          {/* Auth buttons */}
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            {t.nav_login}
          </Link>
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-brand-violet to-brand-coral hover:opacity-90 transition shadow-sm"
          >
            {t.nav_signup}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden grid h-10 w-10 place-items-center rounded-xl hover:bg-accent transition-colors"
          aria-label="Menu"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-5 pb-5 pt-3 space-y-2">
          <button
            onClick={() => {
              onLocaleChange(nextLocale);
              setMobileOpen(false);
            }}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium text-start hover:bg-accent transition-colors"
          >
            {localeLabel}
          </button>
          <button
            onClick={() => {
              toggleTheme();
              setMobileOpen(false);
            }}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium text-start hover:bg-accent transition-colors"
          >
            <span className="dark:hidden">🌙</span>
            <span className="hidden dark:inline">☀️</span>{" "}
            {t.nav_dark_mode}
          </button>
          <div className="h-px bg-border" />
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            className="block w-full rounded-xl px-4 py-3 text-sm font-semibold text-start hover:bg-accent transition-colors"
          >
            {t.nav_login}
          </Link>
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            className="block w-full rounded-xl px-4 py-3 text-sm font-bold text-center text-white bg-gradient-to-r from-brand-violet to-brand-coral hover:opacity-90 transition"
          >
            {t.nav_signup}
          </Link>
        </div>
      )}
    </nav>
  );
}
