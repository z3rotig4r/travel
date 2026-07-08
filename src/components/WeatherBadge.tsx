import { wmo, type DayWeather } from "../lib/weather";

export function WeatherBadge({ w, size = "sm" }: { w?: DayWeather; size?: "sm" | "lg" }) {
  if (!w) return null;
  const { icon, label } = wmo(w.code);
  if (size === "lg") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 40, lineHeight: 1 }}>{icon}</span>
        <div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 20 }}>
            {w.max}° <span className="muted" style={{ fontSize: 15 }}>/ {w.min}°</span>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>{label} · 강수 {w.pop}%</div>
        </div>
      </div>
    );
  }
  return (
    <span className="chip chip-muted" style={{ fontSize: 11.5, gap: 4 }} title={`${label} · 강수 ${w.pop}%`}>
      {icon} {w.max}°/{w.min}° · ☔{w.pop}%
    </span>
  );
}
