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
 * Hook that loads the current user session + profile.
 * - If not authenticated, redirects to /login.
 * - If `requiredRole` is set and doesn't match, redirects to the correct dashboard.
 */
export function useAuth(requiredRole?: UserRole): AuthState {
  const [state, setState] = useState<AuthState>(initialState);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

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
      if (!session && active) {
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
