import { useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Section, PageHeader } from "../components/ui";
import { RecordModal, type Field } from "../components/RecordModal";
import { useStore } from "../store";
import { insurance as insSeed } from "../data";
import { useExchangeRate, fmtRate100 } from "../lib/fx";
import { buildShareUrl } from "../lib/share";
import type { BudgetFixed, TourItem, Insurer } from "../types";

const won = (n: number) => (n || 0).toLocaleString("ko-KR") + "원";
const TABS = [
  { id: "packing", label: "🧳 준비물" },
  { id: "budget", label: "💰 경비" },
  { id: "tours", label: "🚌 버스투어" },
  { id: "insurance", label: "🛡️ 보험" },
  { id: "backup", label: "💾 백업" },
];

export function Extras() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "packing";
  return (
    <Section>
      <PageHeader eyebrow="여행 정보" title="준비물 · 경비 · 투어 · 보험"
        desc="모든 항목을 직접 추가·수정·삭제할 수 있어요. 변경 내용은 이 브라우저에 저장됩니다." />
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setParams({ tab: t.id })}
            className="btn" style={{
              flex: "0 0 auto",
              background: tab === t.id ? "var(--accent)" : "var(--bg-elev)",
              color: tab === t.id ? "#fff" : "var(--ink)",
              borderColor: tab === t.id ? "var(--accent)" : "var(--line-strong)",
            }}>{t.label}</button>
        ))}
      </div>
      <div key={tab} className="fade-up">
        {tab === "packing" && <Packing />}
        {tab === "budget" && <Budget />}
        {tab === "tours" && <Tours />}
        {tab === "insurance" && <Insurance />}
        {tab === "backup" && <Backup />}
      </div>
    </Section>
  );
}

function Packing() {
  const packing = useStore((s) => s.packing);
  const { checked, toggleCheck, addPackingItem, removePackingItem, addPackingCategory, removePackingCategory } = useStore();
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [newCat, setNewCat] = useState("");

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="새 카테고리 이름" style={{ maxWidth: 240 }} />
        <button className="btn btn-primary" onClick={() => { if (newCat.trim()) { addPackingCategory(newCat.trim()); setNewCat(""); } }}>＋ 카테고리</button>
      </div>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {Object.entries(packing).map(([cat, items]) => (
          <div key={cat} className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ fontSize: 15, margin: 0 }}>{cat}</h3>
              <button className="btn btn-ghost btn-sm btn-danger" title="카테고리 삭제"
                onClick={() => confirm(`'${cat}' 카테고리를 삭제할까요?`) && removePackingCategory(cat)}>🗑</button>
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              {items.map((it) => {
                const key = cat + "/" + it; const on = !!checked[key];
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ display: "flex", gap: 9, alignItems: "center", cursor: "pointer", fontSize: 14, flex: 1, color: on ? "var(--ink-faint)" : "var(--ink)" }}>
                      <input type="checkbox" checked={on} onChange={() => toggleCheck(key)} style={{ width: 17, height: 17 }} />
                      <span style={{ textDecoration: on ? "line-through" : "none" }}>{it}</span>
                    </label>
                    <button className="btn btn-ghost btn-sm btn-danger" onClick={() => removePackingItem(cat, it)}>×</button>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <input value={inputs[cat] || ""} placeholder="항목 추가" style={{ fontSize: 13, padding: "6px 10px" }}
                onChange={(e) => setInputs({ ...inputs, [cat]: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter" && inputs[cat]?.trim()) { addPackingItem(cat, inputs[cat].trim()); setInputs({ ...inputs, [cat]: "" }); } }} />
              <button className="btn btn-sm" onClick={() => { if (inputs[cat]?.trim()) { addPackingItem(cat, inputs[cat].trim()); setInputs({ ...inputs, [cat]: "" }); } }}>＋</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Converter() {
  const fx = useExchangeRate();
  const [jpy, setJpy] = useState("1000");
  const krw = Math.round((Number(jpy) || 0) * fx.rate);
  return (
    <div className="card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontWeight: 600 }}>💱 실시간 환율 계산기</span>
      <input value={jpy} onChange={(e) => setJpy(e.target.value.replace(/[^0-9]/g, ""))} style={{ width: 120 }} inputMode="numeric" />
      <span>엔 =</span>
      <span style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--accent-ink)" }}>{krw.toLocaleString("ko-KR")}원</span>
      <span className="muted" style={{ fontSize: 12 }}>
        {fx.live ? `실시간 (100엔=${fmtRate100(fx.rate)}원)` : "기준값"}
      </span>
    </div>
  );
}

const budgetFields: Field[] = [
  { key: "cat", label: "분류", placeholder: "항공+숙소 / 기타 등" },
  { key: "item", label: "항목", placeholder: "왕복 항공권" },
  { key: "krw", label: "지출(원)", type: "number" },
  { key: "note", label: "비고", full: true },
];

function Budget() {
  const { budgetFixed, budgetCats, addBudgetFixed, updateBudgetFixed, removeBudgetFixed } = useStore();
  const [modal, setModal] = useState<null | { i: number | null }>(null);
  const total = budgetFixed.reduce((s, r) => s + (r.krw || 0), 0);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Converter />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>고정 지출 합계</div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, marginTop: 4 }}>{won(total)}</div>
        </div>
        {budgetCats.map((c, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>여행중 · {c.cat}</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, marginTop: 4 }}>{won(c.krw)}</div>
            <div className="muted" style={{ fontSize: 12 }}>{(c.jpy || 0).toLocaleString()}엔</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>고정 지출 (항공·숙소·투어 등)</strong>
          <button className="btn btn-sm btn-primary" onClick={() => setModal({ i: null })}>＋ 항목 추가</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 480 }}>
            <tbody>
              {budgetFixed.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "11px 18px" }}><span className="chip chip-muted" style={{ fontSize: 11 }}>{r.cat}</span></td>
                  <td style={{ padding: "11px 8px" }}>{r.item}<div className="muted" style={{ fontSize: 12 }}>{r.note}</div></td>
                  <td style={{ padding: "11px 8px", textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>{won(r.krw)}</td>
                  <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal({ i })}>✎</button>
                    <button className="btn btn-ghost btn-sm btn-danger" onClick={() => removeBudgetFixed(i)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <RecordModal title={modal.i === null ? "지출 항목 추가" : "지출 항목 수정"} fields={budgetFields}
          initial={modal.i === null ? { cat: "", item: "", krw: 0, note: "" } : budgetFixed[modal.i]}
          onClose={() => setModal(null)}
          onSave={(rec) => {
            const row = { ...rec, krw: Number(rec.krw) || 0 } as BudgetFixed;
            if (modal.i === null) addBudgetFixed(row); else updateBudgetFixed(modal.i, row);
            setModal(null);
          }} />
      )}
    </div>
  );
}

const tourFields: Field[] = [
  { key: "name", label: "투어명" },
  { key: "price", label: "가격(원)", type: "number" },
  { key: "time", label: "투어시간", placeholder: "09:30~19:00" },
  { key: "pickup", label: "승차장소" },
  { key: "photo", label: "사진서비스", placeholder: "O / X / DSLR / 무료" },
  { key: "junpei", label: "준페이", placeholder: "식당예약 / 도시락" },
  { key: "rating", label: "평점", placeholder: "5.0 (9143)" },
  { key: "pros", label: "장점", type: "textarea" },
  { key: "cons", label: "단점", type: "textarea" },
  { key: "url", label: "예약 링크", full: true },
];

function Tours() {
  const { tours, addTour, updateTour, removeTour } = useStore();
  const [modal, setModal] = useState<null | { group: "biei_furano" | "shakotan_otaru"; i: number | null }>(null);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {(["biei_furano", "shakotan_otaru"] as const).map((key) => {
        const g = tours[key];
        return (
          <div key={key}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, margin: 0 }}>{g.title} <span className="chip chip-muted">{g.date}</span></h3>
              <button className="btn btn-sm btn-primary" style={{ marginLeft: "auto" }} onClick={() => setModal({ group: key, i: null })}>＋ 투어 추가</button>
            </div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", marginTop: 12 }}>
              {g.items.map((t, i) => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <strong style={{ fontSize: 15.5 }}>{t.name}</strong>
                    <span style={{ fontFamily: "var(--font-serif)", fontSize: 17, color: "var(--accent-ink)" }}>{won(t.price)}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>⏰ {t.time} · 🚏 {t.pickup}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {t.photo && <span className="chip chip-muted" style={{ fontSize: 11 }}>📷 {t.photo}</span>}
                    {t.junpei && <span className="chip chip-muted" style={{ fontSize: 11 }}>🍤 준페이 {t.junpei}</span>}
                    {t.rating && <span className="chip" style={{ fontSize: 11 }}>⭐ {t.rating}</span>}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 10 }}>
                    {t.pros && <div style={{ color: "var(--accent-2)" }}>👍 {t.pros}</div>}
                    {t.cons && <div className="muted" style={{ marginTop: 2 }}>👎 {t.cons}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    {t.url && <a className="btn btn-sm" href={t.url} target="_blank" rel="noreferrer">예약 ↗</a>}
                    <button className="btn btn-sm" onClick={() => setModal({ group: key, i })}>✎ 수정</button>
                    <button className="btn btn-sm btn-danger" style={{ marginLeft: "auto" }} onClick={() => removeTour(key, i)}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {modal && (
        <RecordModal title={modal.i === null ? "버스투어 추가" : "버스투어 수정"} fields={tourFields}
          initial={modal.i === null ? { name: "", price: 0, time: "", pickup: "", photo: "", junpei: "", rating: "", pros: "", cons: "", url: "" } : tours[modal.group].items[modal.i]}
          onClose={() => setModal(null)}
          onSave={(rec) => {
            const t = { ...rec, price: Number(rec.price) || 0 } as TourItem;
            if (modal.i === null) addTour(modal.group, t); else updateTour(modal.group, modal.i, t);
            setModal(null);
          }} />
      )}
    </div>
  );
}

const insFields: Field[] = [
  { key: "name", label: "보험사" },
  { key: "limit", label: "의료비 한도", placeholder: "최대 3천만원" },
  { key: "fee", label: "예상 보험료", placeholder: "약 1~2만원" },
  { key: "note", label: "특징·메모", type: "textarea" },
  { key: "url", label: "가입 링크", full: true },
];

function Insurance() {
  const { insurers, addInsurer, updateInsurer, removeInsurer } = useStore();
  const [modal, setModal] = useState<null | { i: number | null }>(null);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card" style={{ padding: 16 }}>
        <div className="muted" style={{ fontSize: 13 }}>{insSeed.condition}</div>
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.7 }}>
          {insSeed.checkpoints.map((c: string, i: number) => <li key={i}>{c}</li>)}
        </ul>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 16, margin: 0 }}>보험사 비교 <span className="chip chip-muted">{insurers.length}</span></h3>
        <button className="btn btn-sm btn-primary" onClick={() => setModal({ i: null })}>＋ 보험사 추가</button>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {insurers.map((c, i) => (
          <div key={i} className="card" style={{ padding: 15 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <strong>{c.name}</strong>
              <span className="chip chip-muted" style={{ fontSize: 11 }}>{c.limit}</span>
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, marginTop: 6, color: "var(--accent-ink)" }}>{c.fee}</div>
            <div className="soft" style={{ fontSize: 13, marginTop: 4 }}>{c.note}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              {c.url && <a className="btn btn-sm" href={c.url} target="_blank" rel="noreferrer">홈페이지 ↗</a>}
              <button className="btn btn-sm" onClick={() => setModal({ i })}>✎</button>
              <button className="btn btn-sm btn-danger" style={{ marginLeft: "auto" }} onClick={() => removeInsurer(i)}>삭제</button>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 16, background: "var(--accent-soft)", borderColor: "var(--accent)" }}>
        <strong>✓ 권장</strong>
        <div style={{ fontSize: 13.5, marginTop: 6 }}>{insSeed.recommend}</div>
      </div>

      {modal && (
        <RecordModal title={modal.i === null ? "보험사 추가" : "보험사 수정"} fields={insFields}
          initial={modal.i === null ? { name: "", limit: "", fee: "", note: "", url: "" } : insurers[modal.i]}
          onClose={() => setModal(null)}
          onSave={(rec) => {
            const x = rec as Insurer;
            if (modal.i === null) addInsurer(x); else updateInsurer(modal.i, x);
            setModal(null);
          }} />
      )}
    </div>
  );
}

function Backup() {
  const store = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [shared, setShared] = useState<string>("");

  async function makeShare() {
    const url = buildShareUrl(store);
    setShared(url);
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard 불가 시 표시만 */ }
  }

  function exportJson() {
    const { bookmarks, shopping, expenses, checked, itinerary, packing, budgetFixed, budgetCats, tours, insurers } = store;
    const data = { bookmarks, shopping, expenses, checked, itinerary, packing, budgetFixed, budgetCats, tours, insurers, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sapporo-travel-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importJson(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { store.importState(JSON.parse(String(reader.result))); alert("가져오기 완료! (이미지는 원본 기기에서만 표시됩니다)"); }
      catch { alert("올바른 백업 파일이 아닙니다."); }
    };
    reader.readAsText(file);
  }

  return (
    <div className="card" style={{ padding: 20, maxWidth: 560 }}>
      <h3 style={{ marginTop: 0 }}>데이터 백업 · 복원</h3>
      <p className="soft" style={{ fontSize: 14 }}>
        일정·준비물·경비·투어·보험 편집 내용과 영상 북마크·쇼핑 리스트가 이 브라우저에 저장됩니다.
        기기 변경·백업을 위해 JSON으로 내보내세요.
      </p>
      <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
        북마크 {store.bookmarks.length} · 쇼핑 {store.shopping.length} · 지출 {store.expenses.length} · 일정 {store.itinerary.length}일 · 투어 {store.tours.biei_furano.items.length + store.tours.shakotan_otaru.items.length} · 보험 {store.insurers.length}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={exportJson}>⬇️ JSON 내보내기</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>⬆️ JSON 가져오기</button>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => importJson(e.target.files?.[0])} />
        <button className="btn btn-danger" style={{ marginLeft: "auto" }}
          onClick={() => confirm("일정·준비물·경비·투어·보험을 원래 계획표 시드로 되돌릴까요? (북마크·쇼핑은 유지)") && store.resetSeed()}>
          ↺ 시드로 초기화
        </button>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "20px 0" }} />
      <h4 style={{ margin: "0 0 8px" }}>가족과 공유 · 인쇄</h4>
      <p className="soft" style={{ fontSize: 13, marginTop: 0 }}>
        공유 링크를 부모님께 보내면 같은 일정·정보를 열어볼 수 있어요(읽기용, 이미지 제외).
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={makeShare}>🔗 공유 링크 복사</button>
        <Link className="btn" to="/print">🖨️ 인쇄 / PDF 저장</Link>
      </div>
      {shared && (
        <div style={{ marginTop: 10 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>링크가 복사되었어요 (길이 {shared.length}자):</div>
          <input readOnly value={shared} onFocus={(e) => e.currentTarget.select()} style={{ fontSize: 12 }} />
        </div>
      )}

      <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>
        ⚠️ 첨부한 스크린샷 이미지는 브라우저(IndexedDB)에만 저장되어 JSON 백업·공유 링크에는 포함되지 않습니다.
      </p>
    </div>
  );
}
