import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Section, PageHeader } from "../components/ui";
import { attractions, restaurants, trip } from "../data";
import { gmapDir, gmapSearch } from "../lib/maps";
import type { Place } from "../types";

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

const HOTEL_ICON = L.divIcon({
  className: "",
  html: `<div style="transform:translate(-50%,-50%);font-size:22px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))">🏨</div>`,
  iconSize: [0, 0], iconAnchor: [0, 0],
});

export function MapPage() {
  const [params] = useSearchParams();
  const focusName = params.get("place");
  const [filters, setFilters] = useState<Record<Kind, boolean>>({ attraction: true, food: true, tour: true });
  const [selected, setSelected] = useState<Place | null>(null);
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  const all = useMemo(() => [...attractions, ...restaurants], []);
  const visible = useMemo(() => all.filter((p) => filters[kindOf(p)]), [all, filters]);

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
      </div>

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
            <Flyer target={selected} />
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
