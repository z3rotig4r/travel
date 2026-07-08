import { useMemo, useState } from "react";
import { Section, PageHeader, EmptyNote } from "../components/ui";
import { useStore } from "../store";
import { useExchangeRate, fmtRate100 } from "../lib/fx";
import { tripStatus } from "../lib/time";
import type { ExpenseCategory, ExpenseEntry } from "../types";

const CATS: ExpenseCategory[] = ["식비", "교통", "쇼핑", "관광", "기타"];
const CAT_ICON: Record<ExpenseCategory, string> = { 식비: "🍜", 교통: "🚉", 쇼핑: "🛍️", 관광: "🎫", 기타: "💠" };
const won = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";

export function Expenses() {
  const { expenses, addExpense, removeExpense, itinerary, trip, budgetCats } = useStore();
  const fx = useExchangeRate();
  const rate = fx.rate;

  const defaultDay = useMemo(() => {
    const ts = tripStatus(trip.startDate, trip.days);
    return ts.status === "during" && ts.dayIndex != null ? ts.dayIndex + 1 : 1;
  }, []);

  const [f, setF] = useState({ day: defaultDay, category: "식비" as ExpenseCategory, label: "", jpy: "", krw: "", people: 3 });

  const entryKRW = (e: ExpenseEntry) => Math.round(e.amountJPY * rate) + (e.krwDirect || 0);

  function submit() {
    const jpy = Number(f.jpy) || 0;
    const krw = Number(f.krw) || 0;
    if (!f.label.trim() && jpy === 0 && krw === 0) { alert("내용과 금액을 입력해 주세요."); return; }
    addExpense({ day: f.day, category: f.category, label: f.label.trim() || f.category,
      amountJPY: jpy, krwDirect: krw || undefined, people: f.people });
    setF({ ...f, label: "", jpy: "", krw: "" });
  }

  const grand = expenses.reduce((s, e) => s + entryKRW(e), 0);
  const perPerson = expenses.reduce((s, e) => s + entryKRW(e) / (e.people || 1), 0);
  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    expenses.forEach((e) => { m[e.category] = (m[e.category] || 0) + entryKRW(e); });
    return m;
  }, [expenses, rate]);
  const byDay = useMemo(() => {
    const m: Record<number, ExpenseEntry[]> = {};
    expenses.forEach((e) => { (m[e.day] ||= []).push(e); });
    return m;
  }, [expenses]);

  // 계획 예산 (시드 여행중 지출)
  const plannedByCat: Record<string, number> = {};
  budgetCats.forEach((c: any) => { plannedByCat[c.cat] = c.krw; });
  const plannedTotal = budgetCats.reduce((s: number, c: any) => s + c.krw, 0);

  return (
    <Section>
      <PageHeader eyebrow="여행중 지출" title="실시간 지출 기록"
        desc={<>엔화로 입력하면 실시간 환율로 원화 자동 환산돼요. {fx.live
          ? <span className="chip" style={{ fontSize: 11 }}>● 100엔 = {fmtRate100(rate)}원</span>
          : <span className="chip chip-muted" style={{ fontSize: 11 }}>기준환율</span>}</>} />

      {/* 요약 */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 18 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>실지출 합계</div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, marginTop: 4 }}>{won(grand)}</div>
          <div className="muted" style={{ fontSize: 12 }}>1인 평균 {won(perPerson)}</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>여행중 계획 예산</div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, marginTop: 4 }}>{won(plannedTotal)}</div>
          <div style={{ fontSize: 12, marginTop: 2, color: grand > plannedTotal ? "var(--danger)" : "var(--accent-2)" }}>
            {grand > plannedTotal ? `▲ ${won(grand - plannedTotal)} 초과` : `남은 ${won(plannedTotal - grand)}`}
          </div>
        </div>
        {CATS.map((c) => (
          <div key={c} className="card" style={{ padding: 14 }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{CAT_ICON[c]} {c}</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 17, marginTop: 3 }}>{won(byCat[c] || 0)}</div>
            {plannedByCat[c] != null && (
              <div style={{ height: 5, borderRadius: 3, background: "var(--bg-sunken)", marginTop: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, ((byCat[c] || 0) / (plannedByCat[c] || 1)) * 100)}%`,
                  background: (byCat[c] || 0) > plannedByCat[c] ? "var(--danger)" : "var(--accent)" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 입력 폼 */}
      <div className="card" style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
          <div>
            <label>일차</label>
            <select value={f.day} onChange={(e) => setF({ ...f, day: +e.target.value })} style={{ marginTop: 4 }}>
              {itinerary.map((d) => <option key={d.day} value={d.day}>{d.day}일차 ({d.date})</option>)}
            </select>
          </div>
          <div>
            <label>카테고리</label>
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as ExpenseCategory })} style={{ marginTop: 4 }}>
              {CATS.map((c) => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label>내용</label>
            <input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="예: 스미레 미소라멘" style={{ marginTop: 4 }} />
          </div>
          <div>
            <label>금액 (엔)</label>
            <input inputMode="numeric" value={f.jpy} onChange={(e) => setF({ ...f, jpy: e.target.value.replace(/[^0-9]/g, "") })}
              placeholder="0" style={{ marginTop: 4 }} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          <div>
            <label>원화 직접(선택)</label>
            <input inputMode="numeric" value={f.krw} onChange={(e) => setF({ ...f, krw: e.target.value.replace(/[^0-9]/g, "") })}
              placeholder="0" style={{ marginTop: 4 }} />
          </div>
          <div>
            <label>인원</label>
            <select value={f.people} onChange={(e) => setF({ ...f, people: +e.target.value })} style={{ marginTop: 4 }}>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}명</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <button className="btn btn-primary" onClick={submit}>＋ 기록</button>
          {(Number(f.jpy) > 0) && <span className="muted" style={{ fontSize: 13 }}>≈ {won(Number(f.jpy) * rate + (Number(f.krw) || 0))}</span>}
        </div>
      </div>

      {/* 일자별 목록 */}
      {expenses.length === 0
        ? <EmptyNote>아직 기록한 지출이 없어요. 위에서 첫 지출을 남겨보세요.</EmptyNote>
        : itinerary.filter((d) => byDay[d.day]?.length).map((d) => {
            const list = byDay[d.day];
            const dayTotal = list.reduce((s, e) => s + entryKRW(e), 0);
            return (
              <div key={d.day} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <strong style={{ fontFamily: "var(--font-serif)" }}>{d.day}일차 · {d.date}</strong>
                  <span className="chip chip-muted">{won(dayTotal)}</span>
                </div>
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  {list.map((e, i) => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                      borderTop: i ? "1px solid var(--line)" : "none" }}>
                      <span style={{ fontSize: 18 }}>{CAT_ICON[e.category]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{e.label}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {e.amountJPY > 0 && `${e.amountJPY.toLocaleString()}엔`}
                          {e.krwDirect ? `${e.amountJPY > 0 ? " + " : ""}${e.krwDirect.toLocaleString()}원` : ""}
                          {" · "}{e.people}명
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{won(entryKRW(e))}</div>
                      <button className="btn btn-ghost btn-sm btn-danger" onClick={() => removeExpense(e.id)}>🗑</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
    </Section>
  );
}
