// OSM Nominatim 지오코딩 (무료·키 불필요). 이름/주소 → 좌표 후보.
export interface GeoResult { label: string; lat: number; lng: number }

export async function geocode(q: string): Promise<GeoResult[]> {
  const query = q.trim();
  if (!query) return [];
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=ko&countrycodes=jp&q=" +
      encodeURIComponent(query);
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return [];
    const j = (await r.json()) as any[];
    return j.map((x) => ({ label: x.display_name as string, lat: +x.lat, lng: +x.lon }));
  } catch {
    return [];
  }
}
