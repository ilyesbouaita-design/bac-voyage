import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type Mode = "signin" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // If already signed in, go home.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  function toggleTheme() {
    const el = document.documentElement;
    const dark = el.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success the browser redirects to Google.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate({ to: "/" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/" });
        } else {
          setNotice(
            "Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.",
          );
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-14 text-white bg-gradient-to-br from-[#6C4CE0] via-[#7d3fb0] to-[#FF5A5F]">
        <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-[#FFB200] opacity-50 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-24 h-80 w-80 rounded-full bg-[#0FB6A3] opacity-40 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/25 bg-white/15 text-2xl font-bold backdrop-blur">
            B
          </div>
          <span className="text-xl font-semibold">BacAllemand</span>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Apprends l'allemand.
            <br />
            Réussis ton bac.
          </h1>
          <p className="mt-3 text-lg opacity-90" dir="rtl">
            تعلّم الألمانية. انجح في الباكالوريا.
          </p>
          <ul className="mt-8 space-y-3 text-sm opacity-95">
            <li className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15">
                🧩
              </span>
              Grammatik, Wortschatz &amp; examens corrigés par IA
            </li>
            <li className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15">
                🔥
              </span>
              Séries, XP et badges pour rester motivé
            </li>
          </ul>
        </div>
        <div className="relative z-10 text-sm opacity-80">
          Apprentissage bilingue · français &amp; العربية
        </div>
      </aside>

      {/* Form panel */}
      <section className="relative flex items-center justify-center p-6 sm:p-10">
        <button
          onClick={toggleTheme}
          aria-label="Changer de thème"
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-xl border bg-card hover:bg-accent transition-colors"
        >
          <span className="dark:hidden">🌙</span>
          <span className="hidden dark:inline">☀️</span>
        </button>

        <div className="w-full max-w-sm">
          <div className="mb-7 lg:hidden flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl text-white text-xl font-bold bg-gradient-to-br from-[#6C4CE0] to-[#FF5A5F]">
              B
            </div>
            <span className="text-lg font-semibold">BacAllemand</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Se connecter" : "Créer un compte"}
          </h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            {mode === "signin" ? "Bienvenue ! · مرحبًا بك" : "Rejoins-nous · انضمّ إلينا"}
          </p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-accent disabled:opacity-60"
          >
            <GoogleIcon />
            {googleLoading ? "Redirection…" : "Continuer avec Google"}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou · أو
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field
                label="Nom · الاسم"
                value={name}
                onChange={setName}
                type="text"
                placeholder="Ton nom"
                autoComplete="name"
              />
            )}
            <Field
              label="E-mail · البريد الإلكتروني"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="toi@exemple.com"
              autoComplete="email"
              required
            />
            <Field
              label="Mot de passe · كلمة المرور"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
            />

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-lg bg-[#0FB6A3]/12 px-3 py-2 text-sm text-[#0a7f72]">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition bg-gradient-to-r from-[#6C4CE0] to-[#FF5A5F] hover:opacity-95 disabled:opacity-60"
            >
              {loading
                ? "Un instant…"
                : mode === "signin"
                  ? "Se connecter"
                  : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Nouveau sur BacAllemand ? " : "Déjà un compte ? "}
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setNotice(null);
              }}
              className="font-bold text-[#6C4CE0] hover:underline dark:text-[#9A82FF]"
            >
              {mode === "signin" ? "Créer un compte" : "Se connecter"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground/80">
        {props.label}
      </span>
      <input
        className="w-full rounded-xl border bg-secondary/40 px-4 py-3 text-sm outline-none transition focus:border-[#6C4CE0] focus:bg-card focus:ring-4 focus:ring-[#6C4CE0]/15"
        type={props.type}
        value={props.value}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        required={props.required}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
