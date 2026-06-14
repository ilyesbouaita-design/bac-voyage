import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "./supabase";
import type { Database } from "./database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface AuthState {
  loading: boolean;
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  displayName: string | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
  currentStreak: number;
}

const initialState: AuthState = {
  loading: true,
  userId: null,
  email: null,
  role: null,
  displayName: null,
  avatarUrl: null,
  xp: 0,
  level: 1,
  currentStreak: 0,
};

/**
 * Check if we're in demo mode (set by /demo route).
 */
function getDemoUser(): AuthState | null {
  try {
    if (localStorage.getItem("demo-mode") !== "true") return null;
    const raw = localStorage.getItem("demo-user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return {
      loading: false,
      userId: u.id ?? "demo-user-001",
      email: u.email ?? "demo@bacallemand.com",
      role: (u.role ?? "student") as UserRole,
      displayName: u.display_name ?? "Demo User",
      avatarUrl: null,
      xp: u.xp ?? 0,
      level: u.level ?? 1,
      currentStreak: u.current_streak ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Hook that loads the current user session + profile.
 * Supports demo mode (localStorage) and real Supabase auth.
 * - If not authenticated, redirects to /login.
 * - If `requiredRole` is set and doesn't match, redirects to the correct dashboard.
 */
export function useAuth(requiredRole?: UserRole): AuthState {
  const [state, setState] = useState<AuthState>(initialState);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function load() {
      // Check demo mode first
      const demoUser = getDemoUser();

      // Real Supabase auth
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // If a real session exists, clear any lingering demo flags so they don't
      // shadow the authenticated user on subsequent loads.
      if (session && demoUser) {
        localStorage.removeItem("demo-mode");
        localStorage.removeItem("demo-user");
      }

      if (demoUser && !session) {
        if (!active) return;
        // Role-based redirect in demo mode
        if (requiredRole && demoUser.role !== requiredRole) {
          navigate({ to: demoUser.role === "admin" ? "/admin" : "/dashboard" });
          return;
        }
        setState(demoUser);
        return;
      }

      if (!session) {
        navigate({ to: "/login" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, display_name, avatar_url, xp, level, current_streak")
        .eq("id", session.user.id)
        .single();

      if (!active) return;

      const role = (profile?.role ?? "student") as UserRole;

      // Role-based redirect
      if (requiredRole && role !== requiredRole) {
        navigate({ to: role === "admin" ? "/admin" : "/dashboard" });
        return;
      }

      setState({
        loading: false,
        userId: session.user.id,
        email: session.user.email ?? null,
        role,
        displayName: profile?.display_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        xp: profile?.xp ?? 0,
        level: profile?.level ?? 1,
        currentStreak: profile?.current_streak ?? 0,
      });
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && active && !getDemoUser()) {
        navigate({ to: "/login" });
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, requiredRole]);

  return state;
}
