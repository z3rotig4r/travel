import { Section } from "../components/ui";
import { useStore } from "../store";
import { trip } from "../data";

const won = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";

export function Print() {
  const { itinerary, shopping, packing } = useStore();

  return (
    <Section style={{ paddingTop: 24 }}>
      <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨️ 인쇄 / PDF 저장</button>
        <span className="muted" style={{ fontSize: 13, alignSelf: "center" }}>브라우저 인쇄 대화상자에서 “PDF로 저장”을 고르면 파일로 저장돼요.</span>
      </div>

      <div className="printable">
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>{trip.title} — 여행 가이드</h1>
        <p className="muted" style={{ marginTop: 0 }}>{trip.subtitle} · {trip.people} · {trip.flight}</p>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>숙소: {trip.hotel.name} ({trip.hotel.zip})</p>

        {/* 일정 */}
        {itinerary.map((d) => (
          <div key={d.day} style={{ breakInside: "avoid", marginTop: 18 }}>
            <h2 style={{ fontSize: 17, borderBottom: "2px solid var(--ink)", paddingBottom: 4 }}>
              {d.day}일차 · {d.date} — {d.theme}
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                {d.blocks.map((b, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "5px 8px", width: 110, verticalAlign: "top", fontWeight: 600, whiteSpace: "nowrap" }}>{b.time}</td>
                    <td style={{ padding: "5px 8px", verticalAlign: "top" }}>
                      {b.title}{b.place ? ` · 📍${b.place}` : ""}
                      {b.note && <div style={{ color: "#555", fontSize: 12 }}>{b.note}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* 준비물 */}
        <div style={{ breakInside: "avoid", marginTop: 22 }}>
          <h2 style={{ fontSize: 17, borderBottom: "2px solid var(--ink)", paddingBottom: 4 }}>준비물 체크리스트</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px 24px", fontSize: 13 }}>
            {Object.entries(packing).map(([cat, items]) => (
              <div key={cat}><b>{cat}</b>: {items.join(", ")}</div>
            ))}
          </div>
        </div>

        {/* 쇼핑 */}
        {shopping.length > 0 && (
          <div style={{ breakInside: "avoid", marginTop: 22 }}>
            <h2 style={{ fontSize: 17, borderBottom: "2px solid var(--ink)", paddingBottom: 4 }}>쇼핑 위시리스트</h2>
            <ul style={{ fontSize: 13, margin: 0, paddingLeft: 18 }}>
              {shopping.map((s) => (
                <li key={s.id}>{s.name}{s.price ? ` (${s.price})` : ""}{s.memo ? ` — ${s.memo}` : ""}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="muted" style={{ fontSize: 11, marginTop: 24, textAlign: "center" }}>
          총 경비 {won(trip.budgetTotalKRW)} · 1인당 {won(trip.budgetPerPersonKRW)} · 삿포로 여행 가이드
        </p>
      </div>
    </Section>
  );
}
