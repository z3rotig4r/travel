import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경변수(.env / Netlify)가 있어야 실시간 공유 활성화. 없으면 앱은 순수 로컬로 동작.
export const isConfigured = !!(url && anon);

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url!, anon!, { realtime: { params: { eventsPerSecond: 5 } } })
  : null;

export const ROOM_TABLE = "rooms";
