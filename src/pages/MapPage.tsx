import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Section, PageHeader } from "../components/ui";
import { useStore } from "../store";
import { gmapDir, gmapSearch } from "../lib/maps";
import { geocode, type GeoResult } from "../lib/geocode";
import type { Place } from "../types";

function numIcon(n: number) {
  return L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;
      background:#2b6cb0;color:#fff;border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700">${n}</div>`,
    iconSize: [0, 0], iconAnchor: [0, 0],
  });
}
const ME_ICON = L.divIcon({
  className: "",
  html: `<div style="transform:translate(-50%,-50%)"><div style="width:16px;height:16px;border-radius:50%;
    background:#2b6cb0;border:3px solid #fff;box-shadow:0 0 0 4px rgba(43,108,176,.35)"></div></div>`,
  iconSize: [0, 0], iconAnchor: [0, 0],
});

type Kind = "attraction" | "food" | "tour" | "custom";
function kindOf(p: Place): Kind {
  if (p.custom) return "custom";
  if (p.tag === "tour") return "tour";
  return p.category === "food" ? "food" : "attraction";
}
const KIND_META: Record<Kind, { label: string; color: string; emoji: string }> = {
  attraction: { label: "관광지", color: "#d97757", emoji: "📍" },
  food: { label: "맛집", color: "#6a7f6a", emoji: "🍽️" },
  tour: { label: "투어 코스", color: "#c99a3f", emoji: "🚌" },
  custom: { label: "내 장소", color: "#7c5cbf", emoji: "⭐" },
};

function pinIcon(kind: Kind, active = false) {
  const c = KIND_META[kind].color;
  return L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%);">
      <div style="width:${active ? 30 : 24}px;height:${active ? 30 : 24}px;border-radius:50% 50% 50% 0;
        background:${c};transform:rotate(-45deg);border:2px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,.4);${active ? "outline:3px solid " + c + "55;" : ""}"></div>
    </div>`,
    iconSize: [0, 0], iconAnchor: [0, 0],
  });
}

function Flyer({ target }: { target: Place | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.tag === "tour" ? 11 : 15, { duration: 0.8 });
  }, [target, map]);
  return null;
}
function FlyTo({ pos, zoom = 15 }: { pos: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(pos, zoom, { duration: 0.8 }); }, [pos, map, zoom]);
  return null;
}
function ClickCatcher({ active, onPick }: { active: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { if (active) onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

const HOTEL_ICON = L.divIcon({
  className: "",
  html: `<div style="transform:translate(-50%,-50%);font-size:22px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))">🏨</div>`,
  iconSize: [0, 0], iconAnchor: [0, 0],
});

interface Draft { id?: string; name: string; category: "attraction" | "food"; memo: string; lat: number; lng: number }

export function MapPage() {
  const [params] = useSearchParams();
  const focusName = params.get("place");
  const itinerary = useStore((s) => s.itinerary);
  const trip = useStore((s) => s.trip);
  const all = useStore((s) => s.places);
  const { addPlace, updatePlace, removePlace } = useStore();

  const [filters, setFilters] = useState<Record<Kind, boolean>>({ attraction: true, food: true, tour: true, custom: true });
  const [selected, setSelected] = useState<Place | null>(null);
  const [routeDay, setRouteDay] = useState(0);
  const [myPos, setMyPos] = useState<[number, number] | null>(null);
  const [geoErr, setGeoErr] = useState("");
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  // 장소 등록
  const [addMode, setAddMode] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  const visible = useMemo(() => all.filter((p) => filters[kindOf(p)]), [all, filters]);

  const routePlaces = useMemo(() => {
    if (!routeDay) return [] as Place[];
    const day = itinerary.find((d) => d.day === routeDay);
    if (!day) return [];
    const seq: Place[] = [];
    for (const b of day.blocks) {
      if (!b.place) continue;
      const p = all.find((x) => x.name === b.place || x.name.includes(b.place!) || b.place!.includes(x.name));
      if (p && !seq.some((s) => s.id === p.id)) seq.push(p);
    }
    return seq;
  }, [routeDay, itinerary, all]);

  function locate() {
    if (!navigator.geolocation) { setGeoErr("위치 기능을 지원하지 않아요."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMyPos([pos.coords.latitude, pos.coords.longitude]); setGeoErr(""); },
      () => setGeoErr("위치 권한이 거부되었어요."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function runSearch() {
    if (!q.trim()) return;
    setSearching(true);
    setResults(await geocode(q));
    setSearching(false);
  }
  function pickResult(r: GeoResult) {
    setFlyTarget([r.lat, r.lng]);
    const short = r.label.split(",")[0];
    setDraft({ name: short, category: "food", memo: "", lat: r.lat, lng: r.lng });
    setResults([]); setAddMode(false);
  }
  function onMapPick(lat: number, lng: number) {
    setDraft({ name: "", category: "food", memo: "", lat, lng });
    setAddMode(false);
  }
  function saveDraft() {
    if (!draft) return;
    if (!draft.name.trim()) { alert("장소 이름을 입력해 주세요."); return; }
    if (draft.id) updatePlace(draft.id, { name: draft.name.trim(), category: draft.category, memo: draft.memo });
    else addPlace({ name: draft.name.trim(), category: draft.category, memo: draft.memo, lat: draft.lat, lng: draft.lng, area: "내 장소" });
    setDraft(null);
  }
  function editPlace(p: Place) {
    setDraft({ id: p.id, name: p.name, category: p.category, memo: p.memo || p.note || "", lat: p.lat, lng: p.lng });
  }
  function delPlace(p: Place) {
    if (confirm(`'${p.name}' 장소를 삭제할까요?`)) { removePlace(p.id); if (selected?.id === p.id) setSelected(null); }
  }

  useEffect(() => {
    if (!focusName) return;
    const p = all.find((x) => x.name === focusName || x.name.includes(focusName));
    if (p) { setSelected(p); setFilters((f) => ({ ...f, [kindOf(p)]: true })); }
  }, [focusName, all]);

  useEffect(() => {
    if (selected) {
      const m = markerRefs.current[selected.id];
      const t = setTimeout(() => m?.openPopup(), 850);
      return () => clearTimeout(t);
    }
  }, [selected]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    all.forEach((p) => { const k = kindOf(p); c[k] = (c[k] || 0) + 1; });
    return c;
  }, [all]);

  return (
    <Section>
      <PageHeader eyebrow="지도" title="관광지 · 맛집 지도"
        desc="장소를 직접 등록·편집·삭제하고, 일정의 ‘연결 장소’에서 불러와 동선을 그릴 수 있어요." />

      {/* 검색 + 등록 */}
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="장소·주소 검색 (예: 스미레 스스키노)" value={q}
            onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()}
            style={{ flex: 1, minWidth: 200 }} />
          <button className="btn" onClick={runSearch} disabled={searching}>{searching ? "검색 중…" : "🔍 검색"}</button>
          <button className={"btn " + (addMode ? "btn-primary" : "")} onClick={() => { setAddMode((v) => !v); setResults([]); }}>
            {addMode ? "지도를 탭하세요…" : "➕ 내 장소 추가"}
          </button>
        </div>
        {results.length > 0 && (
          <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
            {results.map((r, i) => (
              <button key={i} className="card" style={{ textAlign: "left", padding: "8px 11px", cursor: "pointer", fontSize: 13 }}
                onClick={() => pickResult(r)}>📍 {r.label}</button>
            ))}
          </div>
        )}
        {addMode && <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>지도에서 원하는 위치를 탭하면 등록 창이 열려요.</div>}
      </div>

      {/* Filters + 동선 + 내위치 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {(Object.keys(KIND_META) as Kind[]).map((k) => {
          const on = filters[k]; const m = KIND_META[k];
          return (
            <button key={k} onClick={() => setFilters((f) => ({ ...f, [k]: !f[k] }))}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 999,
                border: `1px solid ${on ? m.color : "var(--line)"}`, cursor: "pointer",
                background: on ? m.color : "var(--bg-elev)", color: on ? "#fff" : "var(--ink-faint)",
                fontSize: 13.5, fontWeight: 600,
              }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: on ? "#fff" : m.color }} />
              {m.emoji} {m.label} <span style={{ opacity: 0.8 }}>{counts[k] || 0}</span>
            </button>
          );
        })}
        <div style={{ width: 1, alignSelf: "stretch", background: "var(--line)", margin: "0 4px" }} />
        <select value={routeDay} onChange={(e) => setRouteDay(+e.target.value)} style={{ width: "auto", padding: "7px 12px", borderRadius: 999 }}>
          <option value={0}>🧭 동선 보기 끄기</option>
          {itinerary.map((d) => <option key={d.day} value={d.day}>{d.day}일차 동선</option>)}
        </select>
        <button className="btn" onClick={locate}>📍 내 위치</button>
      </div>
      {geoErr && <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{geoErr}</div>}

      {/* 등록/편집 폼 */}
      {draft && (
        <div className="card fade-up" style={{ padding: 16, marginBottom: 12, borderColor: "var(--accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong style={{ fontFamily: "var(--font-serif)" }}>{draft.id ? "장소 편집" : "새 장소 등록"}</strong>
            <span className="muted" style={{ fontSize: 12 }}>{draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}</span>
          </div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr" }}>
            <div><label>이름 *</label><input value={draft.name} placeholder="예: 스미레 미소라멘" onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={{ marginTop: 4 }} /></div>
            <div><label>분류</label>
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as any })} style={{ marginTop: 4 }}>
                <option value="food">맛집</option>
                <option value="attraction">관광지</option>
              </select>
            </div>
          </div>
          <label style={{ display: "block", marginTop: 10 }}>메모</label>
          <textarea rows={2} value={draft.memo} onChange={(e) => setDraft({ ...draft, memo: e.target.value })} style={{ marginTop: 4, resize: "vertical" }} placeholder="가격·추천메뉴·팁" />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={saveDraft}>저장</button>
            <button className="btn" onClick={() => setDraft(null)}>취소</button>
            {draft.id && <button className="btn btn-danger" style={{ marginLeft: "auto" }} onClick={() => { const p = all.find((x) => x.id === draft.id); if (p) delPlace(p); setDraft(null); }}>삭제</button>}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16 }} className="map-grid">
        {/* Map */}
        <div className="card" style={{ overflow: "hidden", height: 560, cursor: addMode ? "crosshair" : undefined }}>
          <MapContainer center={[43.062, 141.352]} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickCatcher active={addMode} onPick={onMapPick} />
            <Marker position={[trip.hotel.lat, trip.hotel.lng]} icon={HOTEL_ICON}>
              <Popup><b>🏨 {trip.hotel.name}</b><br />숙소 · {trip.hotel.zip}</Popup>
            </Marker>
            {visible.map((p) => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(kindOf(p), selected?.id === p.id)}
                ref={(m) => { markerRefs.current[p.id] = m; }}
                eventHandlers={{ click: () => setSelected(p) }}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <b>{KIND_META[kindOf(p)].emoji} {p.name}</b>
                    <div style={{ fontSize: 12, color: "#555", margin: "4px 0" }}>{p.desc || p.menu || p.memo}</div>
                    {p.category === "food" && (p.tabelog || p.google) && <div style={{ fontSize: 12 }}>타베로그 {p.tabelog} · 구글 {p.google}</div>}
                    <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <a href={gmapDir(p.lat, p.lng, p.name)} target="_blank" rel="noreferrer">길찾기</a>
                      <a href={gmapSearch(p.name + " 삿포로")} target="_blank" rel="noreferrer">구글맵</a>
                      <a href="#" onClick={(e) => { e.preventDefault(); editPlace(p); }}>편집</a>
                      <a href="#" onClick={(e) => { e.preventDefault(); delPlace(p); }} style={{ color: "#c1543a" }}>삭제</a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            {routePlaces.length > 1 && (
              <Polyline positions={routePlaces.map((p) => [p.lat, p.lng] as [number, number])}
                pathOptions={{ color: "#2b6cb0", weight: 3, opacity: 0.8, dashArray: "6 6" }} />
            )}
            {routePlaces.map((p, i) => (
              <Marker key={"rt-" + p.id} position={[p.lat, p.lng]} icon={numIcon(i + 1)}
                eventHandlers={{ click: () => setSelected(p) }}>
                <Popup><b>{i + 1}. {p.name}</b></Popup>
              </Marker>
            ))}
            {myPos && <Marker position={myPos} icon={ME_ICON}><Popup>내 위치</Popup></Marker>}
            <Flyer target={selected} />
            {myPos && <FlyTo pos={myPos} />}
            {flyTarget && <FlyTo pos={flyTarget} zoom={16} />}
          </MapContainer>
        </div>

        {/* List */}
        <div style={{ height: 560, overflowY: "auto", display: "grid", gap: 8, alignContent: "start", paddingRight: 4 }}>
          {visible.map((p) => (
            <div key={p.id} className="card" style={{ padding: "11px 13px", borderColor: selected?.id === p.id ? KIND_META[kindOf(p)].color : "var(--line)" }}>
              <button onClick={() => setSelected(p)} style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong style={{ fontSize: 14 }}>{KIND_META[kindOf(p)].emoji} {p.name}</strong>
                  <span className="chip chip-muted" style={{ fontSize: 11 }}>{p.area}</span>
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {p.desc || p.menu || p.memo}
                </div>
              </button>
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => editPlace(p)}>편집</button>
                <button className="btn btn-ghost btn-sm btn-danger" onClick={() => delPlace(p)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@media (max-width: 820px){ .map-grid{ grid-template-columns: 1fr !important; } .map-grid > div:last-child{ height:auto !important; max-height:420px; } }`}</style>
    </Section>
  );
}
