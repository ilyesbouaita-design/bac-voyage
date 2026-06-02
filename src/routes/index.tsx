import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/lib/useLocale";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

/* ---------- Icons for feature cards ---------- */

function GrammatikIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function WortschatzIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function BacIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
    </svg>
  );
}

function CredentialIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ---------- Main Component ---------- */

function LandingPage() {
  const { locale, t, setLocale } = useLocale();
  const navigate = useNavigate();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .single();
      const role = profile?.role ?? "student";
      navigate({ to: role === "admin" ? "/admin" : "/dashboard" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar t={t} locale={locale} onLocaleChange={setLocale} />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* Background decorations */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-brand-violet/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-brand-coral/8 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-brand-gold/6 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-5 text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-violet/20 bg-brand-violet/5 px-4 py-1.5 text-sm font-medium text-brand-violet dark:border-brand-violet/30 dark:bg-brand-violet/10">
            <span className="h-2 w-2 rounded-full bg-brand-teal animate-pulse" />
            {locale === "fr" ? "Plateforme bilingue" : "منصة ثنائية اللغة"}
            {" · "}
            {locale === "fr" ? "Français & العربية" : "الفرنسية والعربية"}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight font-[var(--font-display)] whitespace-pre-line">
            {t.hero_title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {t.hero_subtitle}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-violet/25 bg-gradient-to-r from-brand-violet to-brand-coral hover:opacity-90 transition"
            >
              {t.hero_cta}
            </Link>
            <a
              href="#about"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-border px-7 py-3.5 text-sm font-semibold hover:bg-accent transition-colors"
            >
              {t.hero_cta_secondary}
            </a>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-brand-violet">3</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {locale === "fr" ? "Modules" : "وحدات"}
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-brand-coral">AI</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {locale === "fr" ? "Correction IA" : "تصحيح ذكي"}
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-brand-teal">2</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {locale === "fr" ? "Langues" : "لغتان"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="py-20 sm:py-28 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-[var(--font-display)]">
              {t.features_title}
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              {t.features_subtitle}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Grammatik */}
            <div className="group rounded-2xl border bg-card p-7 shadow-sm hover:shadow-md hover:border-brand-violet/30 transition-all duration-300">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet group-hover:bg-brand-violet group-hover:text-white transition-colors duration-300">
                <GrammatikIcon />
              </div>
              <h3 className="text-lg font-bold mb-2">{t.feature_grammatik_title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.feature_grammatik_desc}
              </p>
            </div>

            {/* Wortschatz */}
            <div className="group rounded-2xl border bg-card p-7 shadow-sm hover:shadow-md hover:border-brand-gold/30 transition-all duration-300">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-gold/10 text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-colors duration-300">
                <WortschatzIcon />
              </div>
              <h3 className="text-lg font-bold mb-2">{t.feature_wortschatz_title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.feature_wortschatz_desc}
              </p>
            </div>

            {/* Bac */}
            <div className="group rounded-2xl border bg-card p-7 shadow-sm hover:shadow-md hover:border-brand-coral/30 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-coral/10 text-brand-coral group-hover:bg-brand-coral group-hover:text-white transition-colors duration-300">
                <BacIcon />
              </div>
              <h3 className="text-lg font-bold mb-2">{t.feature_bac_title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.feature_bac_desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section id="about" className="py-20 sm:py-28 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-[var(--font-display)]">
              {t.about_title}
            </h2>
            <p className="mt-3 text-muted-foreground">{t.about_subtitle}</p>
          </div>

          <div className="grid gap-10 lg:grid-cols-5 items-start">
            {/* Photo */}
            <div className="lg:col-span-2 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-brand-violet/20 via-brand-coral/10 to-brand-gold/20 blur-xl" />
                <img
                  src="/teacher.jpg"
                  alt={locale === "fr" ? "Photo du professeur" : "صورة الأستاذ"}
                  className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl object-cover shadow-lg border-2 border-card"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="lg:col-span-3">
              {/* Credentials */}
              <div className="mb-6 flex flex-wrap gap-3">
                {[t.about_credential_1, t.about_credential_2, t.about_credential_3].map(
                  (cred, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold bg-card"
                    >
                      <span className="text-brand-teal">
                        <CredentialIcon />
                      </span>
                      {cred}
                    </span>
                  ),
                )}
              </div>

              {/* Bio text */}
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                {t.about_bio.split("\n\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <div className="rounded-3xl border bg-gradient-to-br from-brand-violet/5 via-transparent to-brand-coral/5 p-10 sm:p-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-[var(--font-display)]">
              {locale === "fr"
                ? "Prêt à commencer ?"
                : "مستعد للبدء؟"}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {locale === "fr"
                ? "Rejoins BacAllemand et commence ton parcours vers la réussite."
                : "انضمّ إلى BacAllemand وابدأ رحلتك نحو النجاح."}
            </p>
            <Link
              to="/login"
              className="mt-7 inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-violet/25 bg-gradient-to-r from-brand-violet to-brand-coral hover:opacity-90 transition"
            >
              {t.hero_cta}
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg text-white text-xs font-bold bg-gradient-to-br from-brand-violet to-brand-coral">
              B
            </div>
            <span className="font-semibold text-foreground">BacAllemand</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{t.footer_tagline}</span>
          </div>
          <p>
            &copy; {new Date().getFullYear()} BacAllemand. {t.footer_rights}
          </p>
        </div>
      </footer>
    </div>
  );
}
