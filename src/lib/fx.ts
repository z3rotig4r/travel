import { useEffect, useState } from "react";

// JPY→KRW 실시간 환율 (무키·CORS 지원 API, 폴백 포함, 로컬 캐시 6시간)
const CACHE_KEY = "fx-jpy-krw";
const TTL = 6 * 60 * 60 * 1000;
const FALLBACK = 9.2; // 100엔 ≈ 920원

export interface FxState {
  rate: number;          // 1 JPY = rate KRW
  updatedAt: number;     // epoch ms
  live: boolean;         // 실시간 조회 성공 여부
  loading: boolean;
}

async function fetchRate(): Promise<{ rate: number; updatedAt: number } | null> {
  // 1차: open.er-api.com
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/JPY");
    const j = await r.json();
    if (j?.rates?.KRW) return { rate: j.rates.KRW, updatedAt: Date.now() };
  } catch { /* noop */ }
  // 2차: frankfurter.app
  try {
    const r = await fetch("https://api.frankfurter.app/latest?from=JPY&to=KRW");
    const j = await r.json();
    if (j?.rates?.KRW) return { rate: j.rates.KRW, updatedAt: Date.now() };
  } catch { /* noop */ }
  return null;
}

export function useExchangeRate(): FxState {
  const [state, setState] = useState<FxState>(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (c?.rate) return { rate: c.rate, updatedAt: c.updatedAt, live: true, loading: Date.now() - c.updatedAt > TTL };
    } catch { /* noop */ }
    return { rate: FALLBACK, updatedAt: 0, live: false, loading: true };
  });

  useEffect(() => {
    let active = true;
    const cached = state.updatedAt && Date.now() - state.updatedAt < TTL;
    if (cached) { setState((s) => ({ ...s, loading: false })); return; }
    fetchRate().then((res) => {
      if (!active) return;
      if (res) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(res));
        setState({ rate: res.rate, updatedAt: res.updatedAt, live: true, loading: false });
      } else {
        setState((s) => ({ ...s, live: false, loading: false }));
      }
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

export const fmtRate100 = (rate: number) => Math.round(rate * 100).toLocaleString("ko-KR");
