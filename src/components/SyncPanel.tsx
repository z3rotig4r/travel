import { useState } from "react";
import { useStore } from "../store";
import { isConfigured } from "../lib/supabase";
import { startSync, leaveRoom, createRoomCode } from "../lib/sync";

const STATUS: Record<string, { label: string; color: string }> = {
  off: { label: "꺼짐", color: "var(--ink-faint)" },
  syncing: { label: "동기화 중…", color: "var(--gold)" },
  online: { label: "실시간 연결됨", color: "var(--accent-2)" },
  offline: { label: "오프라인(연결 시 반영)", color: "var(--ink-faint)" },
  error: { label: "오류", color: "var(--danger)" },
};

export function SyncPanel() {
  const { roomId, syncName, syncStatus, lastSyncedAt, lastSyncedBy, setSyncName } = useStore();
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isConfigured) {
    return (
      <div className="card" style={{ padding: 20, maxWidth: 620 }}>
        <h3 style={{ marginTop: 0 }}>실시간 공유 (설정 필요)</h3>
        <p className="soft" style={{ fontSize: 14 }}>
          이 기능은 Supabase 연결이 필요합니다. 배포 환경에 <code>VITE_SUPABASE_URL</code>·<code>VITE_SUPABASE_ANON_KEY</code>가
          설정되면 자동으로 활성화됩니다.
        </p>
      </div>
    );
  }

  const s = STATUS[syncStatus] || STATUS.off;
  const link = roomId ? `${location.origin}/?room=${roomId}` : "";

  async function copyLink() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  }

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 620 }}>
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>실시간 공유</h3>
        <p className="soft" style={{ fontSize: 14, marginTop: 0 }}>
          공유방을 만들어 링크를 가족에게 보내면, 일정·지출·쇼핑 편집이 <b>실시간</b>으로 서로 반영됩니다.
          (스크린샷 이미지는 제외)
        </p>

        <label>내 표시 이름</label>
        <input value={syncName} onChange={(e) => setSyncName(e.target.value)} placeholder="예: 아들 / 엄마 / 아빠"
          style={{ margin: "4px 0 4px", maxWidth: 260 }} />

        {roomId ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 14 }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: s.color }} /> {s.label}
              </span>
              {lastSyncedAt > 0 && (
                <span className="muted" style={{ fontSize: 12 }}>
                  마지막 동기화 {new Date(lastSyncedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  {lastSyncedBy ? ` · ${lastSyncedBy}` : ""}
                </span>
              )}
            </div>
            <label>공유방 코드</label>
            <input readOnly value={roomId} onFocus={(e) => e.currentTarget.select()} style={{ margin: "4px 0 10px", fontSize: 13 }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={copyLink}>{copied ? "복사됨 ✓" : "🔗 공유 링크 복사"}</button>
              <button className="btn btn-danger" onClick={() => leaveRoom()}>방 나가기</button>
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
              이 링크를 받은 사람이 열면 자동으로 같은 방에 참여합니다. 참여 시 현재 방의 내용으로 동기화돼요.
            </p>
          </div>
        ) : (
          <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
            <div>
              <button className="btn btn-primary" onClick={() => startSync(createRoomCode())}>➕ 새 공유방 만들기</button>
              <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>내 현재 데이터로 방을 만듭니다.</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label>코드로 참여</label>
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.trim())} placeholder="공유방 코드 붙여넣기" style={{ marginTop: 4 }} />
              </div>
              <button className="btn" disabled={!joinCode} onClick={() => startSync(joinCode)}>참여</button>
            </div>
            <p className="muted" style={{ fontSize: 12 }}>
              ⚠️ 방에 참여하면 이 기기의 일정·지출·쇼핑 등이 <b>방의 내용으로 대체</b>됩니다. 필요하면 먼저 백업(내보내기)하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
