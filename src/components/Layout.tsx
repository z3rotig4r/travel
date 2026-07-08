import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useStore } from "../store";
import { readShareFromHash } from "../lib/share";
import { isConfigured } from "../lib/supabase";
import { startSync } from "../lib/sync";

const SYNC_DOT: Record<string, string> = {
  online: "var(--accent-2)", syncing: "var(--gold)", offline: "var(--ink-faint)", error: "var(--danger)", off: "transparent",
};

const NAV = [
  { to: "/today", label: "오늘", icon: "📍" },
  { to: "/", label: "대시보드", icon: "🏠", end: true },
  { to: "/schedule", label: "일정", icon: "🗓️" },
  { to: "/guide", label: "영상", icon: "🎬" },
  { to: "/map", label: "지도", icon: "🗺️" },
  { to: "/shopping", label: "쇼핑", icon: "🛍️" },
  { to: "/expenses", label: "지출", icon: "💴" },
  { to: "/extras", label: "정보", icon: "📋" },
];
// 모바일 하단 탭바 (핵심 5개)
const BOTTOM = [
  { to: "/today", label: "오늘", icon: "📍" },
  { to: "/schedule", label: "일정", icon: "🗓️" },
  { to: "/map", label: "지도", icon: "🗺️" },
  { to: "/expenses", label: "지출", icon: "💴" },
  { to: "/extras", label: "정보", icon: "📋" },
];

export function Layout() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const importState = useStore((s) => s.importState);
  const roomId = useStore((s) => s.roomId);
  const syncStatus = useStore((s) => s.syncStatus);
  const loc = useLocation();
  const [shareData, setShareData] = useState<Record<string, any> | null>(null);

  // 실시간 공유 초기화: ?room=CODE 로 참여하거나, 저장된 방 자동 재연결
  useEffect(() => {
    if (!isConfigured) return;
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) {
      startSync(room);
      params.delete("room");
      const qs = params.toString();
      history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    } else if (useStore.getState().roomId) {
      startSync(useStore.getState().roomId!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // 공유 링크(#s=)로 진입 시 가져오기 배너
  useEffect(() => {
    const data = readShareFromHash();
    if (data) setShareData(data);
  }, []);
  function acceptShare() {
    if (shareData) importState(shareData);
    history.replaceState(null, "", location.pathname + location.search);
    setShareData(null);
  }
  function dismissShare() {
    history.replaceState(null, "", location.pathname + location.search);
    setShareData(null);
  }

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
          {roomId && (
            <NavLink to="/extras?tab=sync" title={`실시간 공유: ${syncStatus}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none",
                fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", padding: "5px 9px",
                border: "1px solid var(--line)", borderRadius: 999 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: SYNC_DOT[syncStatus] || "transparent" }} />
              <span className="nav-label">공유</span>
            </NavLink>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title="테마 전환" aria-label="테마 전환">
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      {shareData && (
        <div className="container" style={{ padding: "12px 20px 0" }}>
          <div className="card" style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", borderColor: "var(--accent)", background: "var(--accent-soft)" }}>
            <span style={{ fontSize: 14 }}>📨 공유된 여행 데이터를 받았어요. 지금 내용을 <b>대체</b>하고 가져올까요?</span>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button className="btn btn-primary btn-sm" onClick={acceptShare}>가져오기</button>
              <button className="btn btn-sm" onClick={dismissShare}>취소</button>
            </div>
          </div>
        </div>
      )}

      <main style={{ flex: 1 }} className="app-main">
        <Outlet />
      </main>

      <footer style={{ borderTop: "1px solid var(--line)", marginTop: 40 }} className="app-footer">
        <div className="container muted" style={{ padding: "22px 20px", fontSize: 13, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <span>삿포로 여행 가이드 · 2026.7.9 – 7.13</span>
          <span>메모·북마크는 이 브라우저에 저장됩니다 · 정보 탭에서 백업</span>
        </div>
      </footer>

      {/* 모바일 하단 탭바 */}
      <nav className="bottombar">
        {BOTTOM.map((n) => (
          <NavLink key={n.to} to={n.to} end={(n as any).end}
            style={({ isActive }) => ({
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              flex: 1, padding: "7px 0", textDecoration: "none", fontSize: 11, fontWeight: 600,
              color: isActive ? "var(--accent-ink)" : "var(--ink-faint)",
            })}>
            <span style={{ fontSize: 19 }}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <style>{`
        .bottombar { display: none; }
        @media (max-width: 720px) {
          .nav-label { display:none; }
          .topnav { display:none !important; }
          .app-footer { display:none; }
          .app-main { padding-bottom: 70px; }
          .bottombar {
            display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 600;
            background: color-mix(in srgb, var(--bg-elev) 94%, transparent);
            backdrop-filter: saturate(1.4) blur(10px);
            border-top: 1px solid var(--line);
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  );
}
