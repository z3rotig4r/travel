import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useStore } from "../store";

const NAV = [
  { to: "/", label: "대시보드", icon: "🏠", end: true },
  { to: "/schedule", label: "일정", icon: "🗓️" },
  { to: "/guide", label: "영상 가이드", icon: "🎬" },
  { to: "/map", label: "지도", icon: "🗺️" },
  { to: "/shopping", label: "쇼핑", icon: "🛍️" },
  { to: "/extras", label: "정보", icon: "📋" },
];

export function Layout() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const loc = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 500,
        background: "color-mix(in srgb, var(--bg) 88%, transparent)",
        backdropFilter: "saturate(1.4) blur(10px)",
        borderBottom: "1px solid var(--line)",
      }}>
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 16, height: 60 }}>
          <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <span style={{ fontSize: 22 }}>✈️</span>
            <strong style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--ink)" }}>
              삿포로 2026
            </strong>
          </NavLink>
          <nav className="topnav" style={{ display: "flex", gap: 2, marginLeft: "auto", overflowX: "auto" }}>
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                  padding: "8px 13px", borderRadius: 999, fontSize: 14, fontWeight: 600,
                  textDecoration: "none",
                  color: isActive ? "#fff" : "var(--ink-soft)",
                  background: isActive ? "var(--accent)" : "transparent",
                })}>
                <span style={{ fontSize: 15 }}>{n.icon}</span>
                <span className="nav-label">{n.label}</span>
              </NavLink>
            ))}
          </nav>
          <button className="btn btn-ghost btn-sm" onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title="테마 전환" aria-label="테마 전환">
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ borderTop: "1px solid var(--line)", marginTop: 40 }}>
        <div className="container muted" style={{ padding: "22px 20px", fontSize: 13, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <span>삿포로 여행 가이드 · 2026.7.9 – 7.13</span>
          <span>메모·북마크는 이 브라우저에 저장됩니다 · 정보 탭에서 백업</span>
        </div>
      </footer>

      <style>{`
        @media (max-width: 720px) {
          .nav-label { display:none; }
          .topnav a { padding:8px 10px !important; }
        }
      `}</style>
    </div>
  );
}
