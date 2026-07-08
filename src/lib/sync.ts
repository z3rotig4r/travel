import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isConfigured, ROOM_TABLE } from "./supabase";
import { useStore } from "../store";

// 동기화 대상 슬라이스 (이미지 blob·theme·sync 메타는 제외)
const SYNC_KEYS = [
  "trip", "itinerary", "packing", "budgetFixed", "budgetCats", "tours",
  "insurers", "places", "shopping", "bookmarks", "expenses", "checked",
] as const;

function pickSynced(s: any): Record<string, any> {
  const o: Record<string, any> = {};
  for (const k of SYNC_KEYS) o[k] = s[k];
  return o;
}

// 세션별 client id — 자기 write 에코 무시용
function getClientId(): string {
  let id = sessionStorage.getItem("sync-client-id");
  if (!id) { id = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("sync-client-id", id); }
  return id;
}
const clientId = getClientId();

let channel: RealtimeChannel | null = null;
let unsub: (() => void) | null = null;
let applyingRemote = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastSnap = "";
let currentRoom: string | null = null;

export function createRoomCode(): string {
  return (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/-/g, "").slice(0, 20);
}

export async function startSync(roomId: string) {
  if (!isConfigured || !supabase) return;
  stopSync();
  currentRoom = roomId;
  const st = useStore.getState();
  st.setRoom(roomId);
  st.setSyncStatus("syncing");

  // 1) 방 데이터 fetch → 있으면 당겨오기, 없으면 로컬로 최초 생성
  const { data, error } = await supabase.from(ROOM_TABLE).select("data,client_id").eq("id", roomId).maybeSingle();
  if (error) { console.error("[sync] fetch", error); useStore.getState().setSyncStatus("error"); return; }
  if (data?.data && Object.keys(data.data).length) {
    applyRemote(data.data);
  } else {
    await pushNow();
  }

  // 2) Realtime 구독
  channel = supabase
    .channel("room-" + roomId)
    .on("postgres_changes", { event: "*", schema: "public", table: ROOM_TABLE, filter: "id=eq." + roomId },
      (payload: any) => {
        const row = payload.new;
        if (!row || !row.data || row.client_id === clientId) return; // 삭제/에코/빈 payload 무시
        applyRemote(row.data, row.data?.__by);
      })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") useStore.getState().setSyncStatus(navigator.onLine ? "online" : "offline", Date.now());
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") useStore.getState().setSyncStatus("error");
    });

  // 3) 로컬 변경 감지 → 디바운스 push
  lastSnap = JSON.stringify(pickSynced(useStore.getState()));
  unsub = useStore.subscribe((state) => {
    if (applyingRemote) return;
    const snap = JSON.stringify(pickSynced(state));
    if (snap === lastSnap) return;
    lastSnap = snap;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { void pushNow(); }, 800);
  });

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
}

function applyRemote(data: any, by?: string) {
  applyingRemote = true;
  useStore.getState().importState(data);
  applyingRemote = false;
  lastSnap = JSON.stringify(pickSynced(useStore.getState()));
  useStore.getState().setSyncStatus(navigator.onLine ? "online" : "offline", Date.now(), by || undefined);
}

async function pushNow() {
  if (!supabase || !currentRoom) return;
  if (!navigator.onLine) { useStore.getState().setSyncStatus("offline"); return; }
  const st = useStore.getState();
  const data = pickSynced(st);
  (data as any).__by = st.syncName || "";
  lastSnap = JSON.stringify(pickSynced(st));
  const { error } = await supabase.from(ROOM_TABLE).upsert({
    id: currentRoom, data, client_id: clientId, updated_at: new Date().toISOString(),
  });
  if (error) { console.error("[sync] push", error); useStore.getState().setSyncStatus("error"); }
  else useStore.getState().setSyncStatus("online", Date.now(), st.syncName || undefined);
}

function onOnline() { useStore.getState().setSyncStatus("online"); if (currentRoom) void pushNow(); }
function onOffline() { useStore.getState().setSyncStatus("offline"); }

export function stopSync() {
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
  if (unsub) { unsub(); unsub = null; }
  if (channel && supabase) { supabase.removeChannel(channel); channel = null; }
  window.removeEventListener("online", onOnline);
  window.removeEventListener("offline", onOffline);
  currentRoom = null;
}

export function leaveRoom() {
  stopSync();
  const st = useStore.getState();
  st.setRoom(null);
  st.setSyncStatus("off");
}
