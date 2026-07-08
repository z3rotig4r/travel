// 구글맵 딥링크 유틸 (API 키 불필요)
export function gmapSearch(q: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
export function gmapPlace(lat: number, lng: number, label?: string): string {
  const q = label ? `${label}` : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}@${lat},${lng}`;
}
// 길찾기: 목적지 좌표(+이름) — 출발지는 사용자 현재 위치
export function gmapDir(lat: number, lng: number, label?: string): string {
  const dest = `${lat},${lng}`;
  const base = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
  return label ? `${base}&destination_place_id=&travelmode=transit` : base + `&travelmode=transit`;
}
export function gmapStreetView(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}
