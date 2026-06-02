import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!active) return;
      if (!session) {
        setLoading(false);
        return;
      }
      setEmail(session.user.email ?? null);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, display_name")
        .eq("id", session.user.id)
        .single();
      if (!active) return;
      setRole(profile?.role ?? null);
      setName(profile?.display_name ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card text-card-foreground shadow-sm p-8 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl text-white text-2xl font-bold bg-gradient-to-br from-[#FFB200] to-[#FF5A5F]">
          B
        </div>
        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : email ? (
          <>
            <h1 className="text-2xl font-bold mb-1">
              Bonjour{name ? `, ${name}` : ""} 👋
            </h1>
            <p className="text-muted-foreground text-sm mb-1">{email}</p>
            <p className="text-sm mb-5">
              Rôle&nbsp;:{" "}
              <span className="font-semibold">{role ?? "—"}</span>
              {role === "admin" && (
                <span className="ml-2 rounded-full bg-[#FFB200]/15 px-2 py-0.5 text-xs font-semibold text-[#946400]">
                  accès admin
                </span>
              )}
            </p>
            <button
              onClick={signOut}
              className="w-full rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-accent transition-colors"
            >
              Se déconnecter
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">BacAllemand</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Apprends l'allemand pour le bac.
            </p>
            <Link
              to="/login"
              className="inline-block w-full rounded-xl px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#6C4CE0] to-[#FF5A5F] hover:opacity-95 transition"
            >
              Se connecter
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
