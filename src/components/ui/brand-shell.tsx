import type { ReactNode } from "react";

type BrandShellProps = {
  children: ReactNode;
};

export function BrandShell({ children }: BrandShellProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      {children}
    </section>
  );
}
