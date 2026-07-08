import { useEffect, useState } from "react";

// Open-Meteo(무키·CORS) 삿포로 일별 예보. 6시간 캐시, 오프라인 시 마지막값.
const CACHE_KEY = "weather-sapporo";
const TTL = 6 * 60 * 60 * 1000;

export interface DayWeather { code: number; max: number; min: number; pop: number }
export type WeatherMap = Record<string, DayWeather>; // dateKey → weather

export interface WeatherState { byDate: WeatherMap; updatedAt: number; live: boolean; loading: boolean }

// WMO weather code → 이모지 + 라벨
export function wmo(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "맑음" };
  if (code <= 2) return { icon: "🌤️", label: "대체로 맑음" };
  if (code === 3) return { icon: "☁️", label: "흐림" };
  if (code <= 48) return { icon: "🌫️", label: "안개" };
  if (code <= 57) return { icon: "🌦️", label: "이슬비" };
  if (code <= 67) return { icon: "🌧️", label: "비" };
  if (code <= 77) return { icon: "🌨️", label: "눈" };
  if (code <= 82) return { icon: "🌧️", label: "소나기" };
  if (code <= 86) return { icon: "🌨️", label: "눈소나기" };
  if (code <= 99) return { icon: "⛈️", label: "뇌우" };
  return { icon: "🌡️", label: "-" };
}

async function fetchWeather(): Promise<WeatherMap | null> {
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=43.06&longitude=141.35" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=Asia%2FTokyo&forecast_days=16";
    const r = await fetch(url);
    const j = await r.json();
    const d = j?.daily;
    if (!d?.time) return null;
    const map: WeatherMap = {};
    d.time.forEach((date: string, i: number) => {
      map[date] = {
        code: d.weather_code[i],
        max: Math.round(d.temperature_2m_max[i]),
        min: Math.round(d.temperature_2m_min[i]),
        pop: d.precipitation_probability_max[i] ?? 0,
      };
    });
    return map;
  } catch { return null; }
}

export function useWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (c?.byDate) return { byDate: c.byDate, updatedAt: c.updatedAt, live: true, loading: Date.now() - c.updatedAt > TTL };
    } catch { /* noop */ }
    return { byDate: {}, updatedAt: 0, live: false, loading: true };
  });

  useEffect(() => {
    let active = true;
    if (state.updatedAt && Date.now() - state.updatedAt < TTL) { setState((s) => ({ ...s, loading: false })); return; }
    fetchWeather().then((map) => {
      if (!active) return;
      if (map) {
        const rec = { byDate: map, updatedAt: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(rec));
        setState({ ...rec, live: true, loading: false });
      } else setState((s) => ({ ...s, live: false, loading: false }));
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
