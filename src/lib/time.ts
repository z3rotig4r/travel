// JST(Asia/Tokyo) 기준 시간 유틸 + 여행 일차 매핑 + 일정 시간범위 파싱
const JST = "Asia/Tokyo";

export interface JstParts {
  y: number; mo: number; d: number; hh: number; mm: number; ss: number;
  minutesOfDay: number; dateKey: string; // YYYY-MM-DD
}

export function jstParts(date: Date = new Date()): JstParts {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: JST, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(date)) if (part.type !== "literal") p[part.type] = part.value;
  const y = +p.year, mo = +p.month, d = +p.day;
  let hh = +p.hour; if (hh === 24) hh = 0;
  const mm = +p.minute, ss = +p.second;
  return { y, mo, d, hh, mm, ss, minutesOfDay: hh * 60 + mm,
    dateKey: `${p.year}-${p.month}-${p.day}` };
}

export function jstClock(date: Date = new Date()): string {
  const { hh, mm, ss } = jstParts(date);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(hh)}:${p(mm)}:${p(ss)}`;
}

// startDate("YYYY-MM-DD") 기준 오늘이 몇 일차인지. UTC 기준 날짜 차이로 계산.
export interface TripStatus {
  status: "before" | "during" | "after";
  dayIndex: number | null; // 0-based (during일 때만)
  dDay: number;            // before면 시작까지 남은 일수(+), during/after면 경과
}
export function tripStatus(startDate: string, days: number, now: Date = new Date()): TripStatus {
  const t = jstParts(now);
  const todayUTC = Date.UTC(t.y, t.mo - 1, t.d);
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const startUTC = Date.UTC(sy, sm - 1, sd);
  const diff = Math.round((todayUTC - startUTC) / 86400000);
  if (diff < 0) return { status: "before", dayIndex: null, dDay: -diff };
  if (diff >= days) return { status: "after", dayIndex: null, dDay: diff };
  return { status: "during", dayIndex: diff, dDay: diff };
}

// 시간 문자열에서 시작/종료 분(minutes of day) 추출.
// 예: "~13:00" → {start:null,end:780}; "13:00~15:25" → {start:780,end:925}; "21:00~" → {start:1260,end:null}
export interface TimeRange { start: number | null; end: number | null }
export function parseRange(time: string): TimeRange {
  const times = [...time.matchAll(/(\d{1,2}):(\d{2})/g)].map((m) => +m[1] * 60 + +m[2]);
  if (times.length >= 2) return { start: times[0], end: times[1] };
  if (times.length === 1) {
    const one = times[0];
    // "~HH:MM" 는 종료만, "HH:MM~" 또는 "HH:MM" 는 시작만
    return /^\s*~/.test(time) ? { start: null, end: one } : { start: one, end: null };
  }
  return { start: null, end: null };
}

export const fmtMin = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// startDate + dayIndex(0-based) → "YYYY-MM-DD"
export function dateKeyForDay(startDate: string, index: number): string {
  const [y, m, d] = startDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + index));
  return dt.toISOString().slice(0, 10);
}
