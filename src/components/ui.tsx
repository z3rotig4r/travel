import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, desc, right }: {
  eyebrow?: string; title: string; desc?: ReactNode; right?: ReactNode;
}) {
  return (
    <div className="fade-up" style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        {eyebrow && <div className="chip" style={{ marginBottom: 10 }}>{eyebrow}</div>}
        <h1 style={{ margin: 0, fontSize: 30 }}>{title}</h1>
        {desc && <p className="soft" style={{ margin: "8px 0 0", fontSize: 15 }}>{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function Section({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <section className="container" style={{ padding: "30px 20px 10px", ...style }}>{children}</section>;
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div className="card" style={{ padding: "26px 20px", textAlign: "center", color: "var(--ink-faint)", fontSize: 14 }}>
      {children}
    </div>
  );
}
