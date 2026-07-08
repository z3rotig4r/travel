import LZString from "lz-string";

// 공유 대상 필드 (이미지 blob 제외 — IndexedDB라 링크로 전송 불가)
const KEYS = ["itinerary", "packing", "budgetFixed", "budgetCats", "tours", "insurers", "shopping", "bookmarks", "expenses", "checked"] as const;

export function encodeShare(state: Record<string, any>): string {
  const picked: Record<string, any> = {};
  for (const k of KEYS) picked[k] = state[k];
  return LZString.compressToEncodedURIComponent(JSON.stringify(picked));
}

export function decodeShare(s: string): Record<string, any> | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(s);
    return json ? JSON.parse(json) : null;
  } catch { return null; }
}

export function buildShareUrl(state: Record<string, any>): string {
  return `${location.origin}/#s=${encodeShare(state)}`;
}

// 현재 URL 해시에서 공유 데이터 추출 후 해시 제거
export function readShareFromHash(): Record<string, any> | null {
  const m = window.location.hash.match(/^#s=(.+)/);
  if (!m) return null;
  const data = decodeShare(m[1]);
  return data;
}
