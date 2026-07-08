import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Section } from "../components/ui";
import { WeatherBadge } from "../components/WeatherBadge";
import { useStore } from "../store";
import { trip } from "../data";
import { jstParts, jstClock, tripStatus, parseRange, fmtMin, dateKeyForDay } from "../lib/time";
import { useWeather } from "../lib/weather";
import type { Block } from "../types";

// 30초마다 갱신되는 현재 시각 훅
function useTick(ms = 30000) {
  const [, set] = useState(0);
  useEffect(() => { const t = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(t); }, [ms]);
  return new Date();
}

type Status = "past" | "current" | "next" | "upcoming";

export function Today() {
  const itinerary = useStore((s) => s.itinerary);
  const now = useTick();
  const weather = useWeather();
  const ts = tripStatus(trip.startDate, trip.days, now);
  const nowMin = jstParts(now).minutesOfDay;

  const clock = jstClock(now);

  // 여행 전/후
  if (ts.status !== "during" || ts.dayIndex === null) {
    const before = ts.status === "before";
    const firstDay = itinerary[0];
    return (
      <Section>
        <div className="card fade-up" style={{ padding: "34px 24px", textAlign: "center",
          background: "linear-gradient(160deg, var(--accent-soft), var(--bg-elev))" }}>
          <div className="chip" style={{ marginBottom: 12 }}>🇯🇵 삿포로 · JST {clock}</div>
          {before ? (
            <>
              <h1 style={{ fontSize: 40, margin: "6px 0" }}>D-{ts.dDay}</h1>
              <p className="soft" style={{ fontSize: 16 }}>출발까지 {ts.dDay}일 · {trip.subtitle}</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
                <Link className="btn btn-primary" to="/extras?tab=packing">🧳 준비물 체크</Link>
                <Link className="btn" to="/schedule?day=1">1일차 일정 보기</Link>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 34, margin: "6px 0" }}>여행이 끝났어요 ✈️</h1>
              <p className="soft">즐거운 삿포로 여행이었길 바라요. 지출·기록은 정보 탭에서 정리할 수 있어요.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18 }}>
                <Link className="btn btn-primary" to="/expenses">💴 지출 정산 보기</Link>
              </div>
            </>
          )}
        </div>
        {before && firstDay && (
          <div className="card" style={{ padding: 18, marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontFamily: "var(--font-serif)" }}>1일차 · {firstDay.date} — {firstDay.theme}</strong>
              <WeatherBadge w={weather.byDate[dateKeyForDay(trip.startDate, 0)]} />
            </div>
          </div>
        )}
      </Section>
    );
  }

  // 여행 중
  const day = itinerary[ts.dayIndex];
  const dayKey = dateKeyForDay(trip.startDate, ts.dayIndex);

  // 현재/다음 판별
  const ranges = day.blocks.map((b) => parseRange(b.time));
  let currentIdx = -1, nextIdx = -1;
  for (let i = 0; i < day.blocks.length; i++) {
    const { start, end } = ranges[i];
    if (start != null && start <= nowMin && (end == null ? (ranges[i + 1]?.start ?? 1e9) > nowMin : end > nowMin)) { currentIdx = i; break; }
  }
  for (let i = 0; i < day.blocks.length; i++) {
    if ((ranges[i].start ?? -1) > nowMin) { nextIdx = i; break; }
  }
  const statusOf = (i: number): Status => {
    if (i === currentIdx) return "current";
    if (i === nextIdx) return "next";
    const s = ranges[i].start, e = ranges[i].end;
    if ((e != null && e <= nowMin) || (e == null && s != null && s < nowMin && i !== currentIdx)) return "past";
    return "upcoming";
  };
  const minsToNext = nextIdx >= 0 && ranges[nextIdx].start != null ? ranges[nextIdx].start! - nowMin : null;

  return (
    <Section>
      {/* 헤더 */}
      <div className="card fade-up" style={{ padding: "22px 22px", marginBottom: 18,
        background: "linear-gradient(160deg, var(--accent-soft), var(--bg-elev))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <div className="chip" style={{ marginBottom: 8 }}>오늘 · {day.day}일차</div>
            <h1 style={{ fontSize: 26, margin: 0 }}>{day.theme}</h1>
            <p className="soft" style={{ margin: "4px 0 0" }}>{day.date}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 30 }}>{clock}</div>
            <div className="muted" style={{ fontSize: 12 }}>삿포로 (JST)</div>
            <div style={{ marginTop: 8 }}><WeatherBadge w={weather.byDate[dayKey]} /></div>
          </div>
        </div>
        {minsToNext != null && minsToNext >= 0 && (
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, background: "var(--bg)", border: "1px solid var(--line)" }}>
            ⏳ 다음 일정 <b>{day.blocks[nextIdx].title}</b> 까지 <b style={{ color: "var(--accent-ink)" }}>{minsToNext}분</b>
            <span className="muted"> ({fmtMin(ranges[nextIdx].start!)})</span>
          </div>
        )}
      </div>

      {/* 타임라인 */}
      <div style={{ display: "grid", gap: 10 }}>
        {day.blocks.map((b, i) => <TodayBlock key={i} b={b} status={statusOf(i)} range={ranges[i]} />)}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
        <Link className="btn" to={`/schedule?day=${day.day}`}>전체 일정 편집</Link>
        <Link className="btn" to="/map">지도</Link>
        <Link className="btn btn-primary" to="/expenses">💴 지출 기록</Link>
      </div>
    </Section>
  );
}

function TodayBlock({ b, status, range }: { b: Block; status: Status; range: { start: number | null; end: number | null } }) {
  const isCur = status === "current";
  const dim = status === "past";
  return (
    <div className="card" style={{
      padding: "13px 15px", display: "flex", gap: 12, alignItems: "flex-start",
      borderColor: isCur ? "var(--accent)" : "var(--line)",
      borderWidth: isCur ? 2 : 1, opacity: dim ? 0.5 : 1,
      background: isCur ? "var(--accent-soft)" : "var(--bg-elev)",
    }}>
      <div style={{ flex: "0 0 auto", textAlign: "center", minWidth: 52 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: isCur ? "var(--accent-ink)" : "var(--ink-soft)" }}>
          {range.start != null ? fmtMin(range.start) : b.time.split("~")[0] || "–"}
        </div>
        {status === "current" && <div className="chip" style={{ fontSize: 10, marginTop: 4 }}>진행중</div>}
        {status === "next" && <div className="chip chip-muted" style={{ fontSize: 10, marginTop: 4 }}>다음</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, textDecoration: dim ? "line-through" : "none" }}>{b.title}</div>
        {b.note && <div className="soft" style={{ fontSize: 13, marginTop: 2 }}>{b.note}</div>}
        {b.place && <Link className="chip" to={`/map?place=${encodeURIComponent(b.place)}`} style={{ textDecoration: "none", marginTop: 8, display: "inline-flex" }}>📍 {b.place}</Link>}
      </div>
    </div>
  );
}
