import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Section, PageHeader } from "../components/ui";
import { useStore } from "../store";
import type { Ref, Block } from "../types";

function RefLink({ r }: { r: Ref }) {
  const isYt = r.type === "youtube" || /youtu\.?be/.test(r.url);
  return (
    <a className="chip chip-muted" href={r.url} target="_blank" rel="noreferrer"
      style={{ textDecoration: "none", fontWeight: 600 }}>
      {isYt ? "▶︎" : "🔗"} {r.label}
    </a>
  );
}

const startMin = (time: string) => {
  const m = time.match(/(\d{1,2}):(\d{2})/);
  return m ? +m[1] * 60 + +m[2] : 9999;
};

export function Schedule() {
  const [params, setParams] = useSearchParams();
  const itinerary = useStore((s) => s.itinerary);
  const { addBlock, updateBlock, removeBlock, addDay, removeDay, updateDayMeta } = useStore();

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<null | { blockIdx: number | null; data: Block }>(null);
  const [dayEdit, setDayEdit] = useState(false);

  const dayNum = Number(params.get("day")) || 1;
  const dayIdx = Math.max(0, itinerary.findIndex((d) => d.day === dayNum));
  const day = itinerary[dayIdx] ?? itinerary[0];
  if (!day) return <Section><p className="muted">일정이 없습니다.</p></Section>;

  const blocks = day.blocks;

  function openAdd() { setForm({ blockIdx: null, data: { time: "", title: "" } }); }
  function openEdit(i: number) { setForm({ blockIdx: i, data: { ...blocks[i] } }); }
  function save() {
    if (!form) return;
    if (!form.data.title.trim()) { alert("일정 내용을 입력해 주세요."); return; }
    if (form.blockIdx === null) addBlock(dayIdx, form.data);
    else updateBlock(dayIdx, form.blockIdx, form.data);
    setForm(null);
  }

  return (
    <Section>
      <PageHeader eyebrow="세부 일정" title="날짜별 상세 스케줄"
        desc="탭을 눌러 날짜별 동선을 확인하세요. 편집 모드에서 일정을 추가·수정·삭제할 수 있어요."
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <button className={"btn " + (edit ? "btn-primary" : "")} onClick={() => setEdit((v) => !v)}>
              {edit ? "✓ 편집 완료" : "✎ 편집 모드"}
            </button>
          </div>
        } />

      {/* Day tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 20 }}>
        {itinerary.map((d) => {
          const active = d.day === day.day;
          return (
            <button key={d.day} onClick={() => setParams({ day: String(d.day) })}
              style={{
                flex: "0 0 auto", textAlign: "left", padding: "10px 16px", borderRadius: 14,
                border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
                background: active ? "var(--accent)" : "var(--bg-elev)",
                color: active ? "#fff" : "var(--ink)", cursor: "pointer", minWidth: 128,
              }}>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: active ? 0.9 : 0.6 }}>{d.day}일차 · {d.date}</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 15, marginTop: 3 }}>{d.theme}</div>
            </button>
          );
        })}
        {edit && (
          <button className="btn" style={{ flex: "0 0 auto", borderStyle: "dashed" }} onClick={addDay}>＋ 날짜 추가</button>
        )}
      </div>

      {/* Day meta edit */}
      {edit && (
        <div className="card" style={{ padding: 14, marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {dayEdit ? (
            <>
              <input style={{ width: 130 }} value={day.date} onChange={(e) => updateDayMeta(dayIdx, { date: e.target.value })} placeholder="7/9 (목)" />
              <input style={{ flex: 1, minWidth: 180 }} value={day.theme} onChange={(e) => updateDayMeta(dayIdx, { theme: e.target.value })} placeholder="테마" />
              <button className="btn btn-sm btn-primary" onClick={() => setDayEdit(false)}>완료</button>
            </>
          ) : (
            <>
              <span className="muted" style={{ fontSize: 13 }}>{day.day}일차 · {day.date} · {day.theme}</span>
              <button className="btn btn-sm" onClick={() => setDayEdit(true)}>날짜·테마 수정</button>
              <button className="btn btn-sm btn-danger" style={{ marginLeft: "auto" }}
                onClick={() => { if (confirm(`${day.day}일차를 삭제할까요?`)) { removeDay(dayIdx); setParams({ day: "1" }); } }}>
                이 날짜 삭제
              </button>
            </>
          )}
        </div>
      )}

      {/* Timeline */}
      <div key={day.day} className="fade-up" style={{ position: "relative", paddingLeft: 8 }}>
        {blocks.map((b, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 14 }}>
            <div style={{ textAlign: "right", paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-ink)" }}>{b.time.split("~")[0] || "–"}</div>
              {b.time.includes("~") && b.time.split("~")[1] &&
                <div className="muted" style={{ fontSize: 11 }}>~{b.time.split("~")[1]}</div>}
            </div>
            <div style={{ position: "relative", paddingLeft: 22, paddingBottom: 12 }}>
              {i < blocks.length - 1 &&
                <span style={{ position: "absolute", left: 6, top: 22, bottom: -2, width: 2, background: "var(--line)" }} />}
              <span style={{ position: "absolute", left: 0, top: 18, width: 14, height: 14, borderRadius: 999,
                background: "var(--bg-elev)", border: "3px solid var(--accent)" }} />
              <div className="card" style={{ padding: "13px 15px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15.5 }}>{b.title}</div>
                    {b.note && <div className="soft" style={{ fontSize: 13.5, marginTop: 3 }}>{b.note}</div>}
                  </div>
                  {edit && (
                    <div style={{ display: "flex", gap: 4, flex: "0 0 auto" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(i)}>✎</button>
                      <button className="btn btn-ghost btn-sm btn-danger" onClick={() => removeBlock(dayIdx, i)}>🗑</button>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: (b.refs || b.place) ? 10 : 0 }}>
                  {b.place &&
                    <Link className="chip" to={`/map?place=${encodeURIComponent(b.place)}`} style={{ textDecoration: "none" }}>📍 {b.place}</Link>}
                  {b.refs?.map((r, j) => <RefLink key={j} r={r} />)}
                </div>
              </div>
            </div>
          </div>
        ))}
        {blocks.length === 0 && <p className="muted" style={{ paddingLeft: 22 }}>이 날짜엔 일정이 없어요.</p>}
      </div>

      {edit && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, paddingLeft: 106 }}>
          <button className="btn btn-primary" onClick={openAdd}>＋ 일정 추가</button>
          <button className="btn" onClick={() => {
            const sorted = [...blocks].sort((a, b) => startMin(a.time) - startMin(b.time));
            sorted.forEach((blk, idx) => updateBlock(dayIdx, idx, blk));
          }}>시간순 정렬</button>
        </div>
      )}

      {/* Block form modal */}
      {form && (
        <div onClick={() => setForm(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ padding: 20, width: 440, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ marginTop: 0 }}>{form.blockIdx === null ? "일정 추가" : "일정 수정"}</h3>
            <label>시간</label>
            <input value={form.data.time} placeholder="예: 09:00~10:00 또는 ~13:00"
              onChange={(e) => setForm({ ...form, data: { ...form.data, time: e.target.value } })} style={{ margin: "4px 0 10px" }} />
            <label>일정 내용 *</label>
            <input value={form.data.title} placeholder="예: 오타루 운하 산책"
              onChange={(e) => setForm({ ...form, data: { ...form.data, title: e.target.value } })} style={{ margin: "4px 0 10px" }} />
            <label>비고 / 메모</label>
            <textarea rows={2} value={form.data.note || ""} placeholder="팁·주의사항"
              onChange={(e) => setForm({ ...form, data: { ...form.data, note: e.target.value } })} style={{ margin: "4px 0 10px", resize: "vertical" }} />
            <label>연결 장소 (지도 마커 이름, 선택)</label>
            <input value={form.data.place || ""} placeholder="예: 오타루 운하"
              onChange={(e) => setForm({ ...form, data: { ...form.data, place: e.target.value } })} style={{ margin: "4px 0 10px" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button className="btn btn-primary" onClick={save}>저장</button>
              <button className="btn" onClick={() => setForm(null)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
