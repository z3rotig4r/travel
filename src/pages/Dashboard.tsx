import { Link } from "react-router-dom";
import { Section } from "../components/ui";
import { trip, budget } from "../data";
import { useStore } from "../store";
import { useExchangeRate, fmtRate100 } from "../lib/fx";

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

export function Dashboard() {
  const itinerary = useStore((s) => s.itinerary);
  const fx = useExchangeRate();
  const rateWhen = fx.updatedAt ? new Date(fx.updatedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(160deg, var(--accent-soft), var(--bg) 70%)",
        borderBottom: "1px solid var(--line)",
      }}>
        <div className="container fade-up" style={{ padding: "48px 20px 40px" }}>
          <div className="chip" style={{ marginBottom: 14 }}>🇯🇵 홋카이도 · 삿포로</div>
          <h1 style={{ fontSize: "clamp(34px, 6vw, 52px)", margin: 0, lineHeight: 1.08 }}>
            삿포로 4박 5일
          </h1>
          <p className="soft" style={{ fontSize: 18, margin: "12px 0 0" }}>{trip.subtitle}</p>
          <p className="muted" style={{ fontSize: 14, margin: "4px 0 0" }}>
            {trip.people} · {trip.flight}
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
            <Link className="btn btn-primary" to="/schedule">🗓️ 상세 일정 보기</Link>
            <Link className="btn" to="/map">🗺️ 지도에서 보기</Link>
            <Link className="btn" to="/guide">🎬 영상 가이드</Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <Section>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {[
            { icon: "💰", label: "총 경비", value: won(trip.budgetTotalKRW), sub: `1인당 ${won(trip.budgetPerPersonKRW)}` },
            { icon: "🏨", label: "숙소", value: "게이오 프렐리아", sub: `${trip.hotel.name.replace("게이오 프렐리아 호텔 ", "")} · ${trip.hotel.zip}` },
            { icon: "✈️", label: "항공", value: "진에어 왕복", sub: "ICN ⇄ CTS" },
            {
              icon: "💱",
              label: (<>환율 {fx.live ? <span className="chip" style={{ fontSize: 10, padding: "1px 7px" }}>● 실시간</span> : <span className="chip chip-muted" style={{ fontSize: 10, padding: "1px 7px" }}>기준값</span>}</>),
              value: fx.loading ? "…" : `100엔 = ${fmtRate100(fx.rate)}원`,
              sub: fx.live && rateWhen ? `${rateWhen} 기준` : "100엔당 원화",
            },
          ].map((s, i) => (
            <div key={i} className="card fade-up" style={{ padding: "18px 18px" }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 8, fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 21, marginTop: 2 }}>{s.value}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Day cards */}
      <Section>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>일정 한눈에</h2>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
          {itinerary.map((d) => (
            <Link key={d.day} to={`/schedule?day=${d.day}`} className="card fade-up"
              style={{ padding: 18, textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="chip">{d.day}일차</span>
                <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>{d.date}</span>
              </div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>{d.theme}</div>
              <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.7 }}>
                {d.blocks.slice(0, 3).map((b, i) => (
                  <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span style={{ color: "var(--accent-ink)", fontWeight: 600 }}>{b.time.split("~")[0]}</span> {b.title}
                  </div>
                ))}
                {d.blocks.length > 3 && <div>+ {d.blocks.length - 3}개 일정…</div>}
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Budget mini */}
      <Section style={{ paddingBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>여행중 카테고리별 예상 지출</h2>
            <Link className="btn btn-sm" to="/extras?tab=budget">경비 자세히 →</Link>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {budget.categorySummary.map((c: any) => (
              <div key={c.cat} className="chip chip-muted" style={{ fontSize: 13 }}>
                {c.cat} · {won(c.krw)}
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
