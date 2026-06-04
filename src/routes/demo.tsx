import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
});

function DemoPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"admin" | "student" | null>(null);

  useEffect(() => {
    if (role) {
      // Store demo mode in localStorage
      localStorage.setItem("demo-mode", "true");
      localStorage.setItem("demo-role", role);
      localStorage.setItem("demo-user", JSON.stringify({
        id: "demo-user-001",
        email: "ilyesbouaita@gmail.com",
        role: role,
        display_name: role === "admin" ? "Admin Ilyes" : "Ilyes (Étudiant)",
        xp: 1250,
        level: 13,
        current_streak: 7,
      }));
      navigate({ to: role === "admin" ? "/admin" : "/dashboard" });
    }
  }, [role, navigate]);

  return (
    <main
      style={{
        fontFamily: "'Times New Roman', Georgia, serif",
        fontSize: "12px",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#fafaf8",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #6C4CE0, #FF5A5F)",
            color: "#fff",
            fontSize: "20px",
            fontWeight: "bold",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
          }}
        >
          B
        </div>
        <h1 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
          BacAllemand — Mode Démo
        </h1>
        <p style={{ color: "#6b6580", marginBottom: "32px" }}>
          Choisissez un rôle pour explorer la plateforme sans connexion.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button
            onClick={() => setRole("admin")}
            style={{
              flex: 1,
              padding: "20px 16px",
              borderRadius: "16px",
              border: "2px solid #e5e3dc",
              background: "#fff",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Times New Roman', Georgia, serif",
              fontSize: "12px",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#6C4CE0";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(108,76,224,0.15)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#e5e3dc";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>👨‍🏫</div>
            <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>Admin</div>
            <div style={{ color: "#6b6580" }}>Créer et gérer les examens</div>
          </button>

          <button
            onClick={() => setRole("student")}
            style={{
              flex: 1,
              padding: "20px 16px",
              borderRadius: "16px",
              border: "2px solid #e5e3dc",
              background: "#fff",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Times New Roman', Georgia, serif",
              fontSize: "12px",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#0FB6A3";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,182,163,0.15)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#e5e3dc";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎓</div>
            <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>Étudiant</div>
            <div style={{ color: "#6b6580" }}>Passer les examens et exercices</div>
          </button>
        </div>

        <p style={{ color: "#a09bb0", marginTop: "24px", fontSize: "11px" }}>
          Mode démo — les données ne seront pas sauvegardées dans Supabase.
        </p>
      </div>
    </main>
  );
}
