import type { ReactNode } from "react";

type SectionCardProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function SectionCard({ eyebrow, title, children }: SectionCardProps) {
  return (
    <article
      style={{
        border: "1px solid rgba(30, 123, 255, 0.35)",
        borderRadius: "var(--radius-lg)",
        background:
          "linear-gradient(140deg, rgba(10, 30, 69, 0.86), rgba(7, 11, 18, 0.95))",
        boxShadow: "var(--shadow-premium)",
        padding: "1rem",
      }}
    >
      <p style={{ color: "var(--kcd-gold)", fontWeight: 700, fontSize: "0.78rem" }}>
        {eyebrow}
      </p>
      <h2 style={{ marginTop: "0.35rem", marginBottom: "0.7rem" }}>{title}</h2>
      <div style={{ display: "grid", gap: "0.7rem", color: "var(--kcd-muted)" }}>
        {children}
      </div>
    </article>
  );
}
