import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Section, PageHeader } from "../components/ui";
import { attractions, restaurants, trip } from "../data";
import { useStore } from "../store";
import { gmapDir, gmapSearch } from "../lib/maps";
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

type Kind = "attraction" | "food" | "tour";
function kindOf(p: Place): Kind {
  if (p.tag === "tour") return "tour";
  return p.category === "food" ? "food" : "attraction";
}
const KIND_META: Record<Kind, { label: string; color: string; emoji: string }> = {
  attraction: { label: "관광지", color: "#d97757", emoji: "📍" },
  food: { label: "맛집", color: "#6a7f6a", emoji: "🍽️" },
  tour: { label: "투어 코스", color: "#c99a3f", emoji: "🚌" },
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

function FlyTo({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(pos, 15, { duration: 0.8 }); }, [pos, map]);
  return null;
}

const HOTEL_ICON = L.divIcon({
  className: "",
  html: `<div style="transform:translate(-50%,-50%);font-size:22px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))">🏨</div>`,
  iconSize: [0, 0], iconAnchor: [0, 0],
});

export function MapPage() {
  const [params] = useSearchParams();
  const focusName = params.get("place");
  const itinerary = useStore((s) => s.itinerary);
  const [filters, setFilters] = useState<Record<Kind, boolean>>({ attraction: true, food: true, tour: true });
  const [selected, setSelected] = useState<Place | null>(null);
  const [routeDay, setRouteDay] = useState(0); // 0 = 동선 끄기
  const [myPos, setMyPos] = useState<[number, number] | null>(null);
  const [geoErr, setGeoErr] = useState("");
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  const all = useMemo(() => [...attractions, ...restaurants], []);
  const visible = useMemo(() => all.filter((p) => filters[kindOf(p)]), [all, filters]);

  // 선택 일차의 동선: 블록의 place를 좌표가 있는 장소와 매칭해 순서대로
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

  // ?place= 로 진입 시 포커스
  useEffect(() => {
    if (!focusName) return;
    const p = all.find((x) => x.name === focusName || x.name.includes(focusName));
    if (p) { setSelected(p); setFilters((f) => ({ ...f, [kindOf(p)]: true })); }
  }, [focusName, all]);

  useEffect(() => {
    if (selected) {
      const m = markerRefs.current[selected.id];
      // 팝업 열기 (약간의 지연으로 flyTo 이후)
      const t = setTimeout(() => m?.openPopup(), 850);
      return () => clearTimeout(t);
    }
  }, [selected]);

  return (
    <Section>
      <PageHeader eyebrow="지도" title="관광지 · 맛집 지도"
        desc="마커를 눌러 정보를 보고, 구글맵 길찾기로 대중교통 경로를 확인하세요." />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {(Object.keys(KIND_META) as Kind[]).map((k) => {
          const on = filters[k];
          const m = KIND_META[k];
          const count = all.filter((p) => kindOf(p) === k).length;
          return (
            <button key={k} onClick={() => setFilters((f) => ({ ...f, [k]: !f[k] }))}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 999,
                border: `1px solid ${on ? m.color : "var(--line)"}`, cursor: "pointer",
                background: on ? m.color : "var(--bg-elev)", color: on ? "#fff" : "var(--ink-faint)",
                fontSize: 13.5, fontWeight: 600,
              }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: on ? "#fff" : m.color }} />
              {m.emoji} {m.label} <span style={{ opacity: 0.8 }}>{count}</span>
            </button>
          );
        })}
        <div style={{ width: 1, alignSelf: "stretch", background: "var(--line)", margin: "0 4px" }} />
        <select value={routeDay} onChange={(e) => setRouteDay(+e.target.value)}
          style={{ width: "auto", padding: "7px 12px", borderRadius: 999 }}>
          <option value={0}>🧭 동선 보기 끄기</option>
          {itinerary.map((d) => <option key={d.day} value={d.day}>{d.day}일차 동선</option>)}
        </select>
        <button className="btn" onClick={locate}>📍 내 위치</button>
      </div>
      {geoErr && <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{geoErr}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16 }} className="map-grid">
        {/* Map */}
        <div className="card" style={{ overflow: "hidden", height: 560 }}>
          <MapContainer center={[43.062, 141.352]} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[trip.hotel.lat, trip.hotel.lng]} icon={HOTEL_ICON}>
              <Popup><b>🏨 {trip.hotel.name}</b><br />숙소 · {trip.hotel.zip}</Popup>
            </Marker>
            {visible.map((p) => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(kindOf(p), selected?.id === p.id)}
                ref={(m) => { markerRefs.current[p.id] = m; }}
                eventHandlers={{ click: () => setSelected(p) }}>
                <Popup>
                  <div style={{ minWidth: 170 }}>
                    <b>{KIND_META[kindOf(p)].emoji} {p.name}</b>
                    <div style={{ fontSize: 12, color: "#555", margin: "4px 0" }}>{p.desc || p.menu}</div>
                    {p.category === "food" && <div style={{ fontSize: 12 }}>타베로그 {p.tabelog} · 구글 {p.google}</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <a href={gmapDir(p.lat, p.lng, p.name)} target="_blank" rel="noreferrer">길찾기</a>
                      <a href={gmapSearch(p.name + " 삿포로")} target="_blank" rel="noreferrer">구글맵</a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            {/* 날짜별 동선 */}
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
          </MapContainer>
        </div>

        {/* List */}
        <div style={{ height: 560, overflowY: "auto", display: "grid", gap: 8, alignContent: "start", paddingRight: 4 }}>
          {visible.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)}
              className="card" style={{
                textAlign: "left", padding: "11px 13px", cursor: "pointer",
                borderColor: selected?.id === p.id ? KIND_META[kindOf(p)].color : "var(--line)",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ fontSize: 14 }}>{KIND_META[kindOf(p)].emoji} {p.name}</strong>
                <span className="chip chip-muted" style={{ fontSize: 11 }}>{p.area}</span>
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {p.desc || p.menu}
              </div>
            </button>
          ))}
        </div>
      </div>

      <style>{`@media (max-width: 820px){ .map-grid{ grid-template-columns: 1fr !important; } .map-grid > div:last-child{ height:auto !important; max-height:420px; } }`}</style>
    </Section>
  );
}
