// 다양한 유튜브 URL/ID 형식에서 videoId 추출
export function parseYouTubeId(input: string): string | null {
  if (!input) return null;
  const s = input.trim();
  // 이미 11자 id
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const patterns = [
    /(?:youtube\.com\/watch\?[^ ]*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return m[1];
  }
  return null;
}

// URL에 담긴 시작 시간(t=90s / t=1m30s / &start=90) 추출 → 초
export function parseStartSeconds(input: string): number {
  const m = input.match(/[?&](?:t|start)=([0-9hms]+)/i);
  if (!m) return 0;
  const v = m[1];
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  let sec = 0;
  const h = v.match(/(\d+)h/); const mi = v.match(/(\d+)m/); const se = v.match(/(\d+)s/);
  if (h) sec += +h[1] * 3600;
  if (mi) sec += +mi[1] * 60;
  if (se) sec += +se[1];
  return sec;
}

export function fmtTime(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export function thumbUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function watchAt(videoId: string, seconds: number): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}s`;
}
