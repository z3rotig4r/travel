import { useRef, useState } from "react";
import { resizeToBlob } from "../lib/img";
import { putImage } from "../lib/db";

// 파일/드래그/붙여넣기로 이미지를 받아 IndexedDB에 저장하고 imageId 반환
export function ImageUploader({ onUploaded, compact }: {
  onUploaded: (imageId: string) => void; compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handle(file?: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const blob = await resizeToBlob(file);
      const id = await putImage(blob);
      onUploaded(id);
    } finally { setBusy(false); }
  }

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files?.[0]); }}
      onPaste={(e) => { const f = e.clipboardData.files?.[0]; if (f) handle(f); }}
      tabIndex={0}
      style={{
        border: `1.5px dashed ${over ? "var(--accent)" : "var(--line-strong)"}`,
        background: over ? "var(--accent-soft)" : "var(--bg)",
        borderRadius: "var(--radius-sm)", padding: compact ? "10px 12px" : "18px 14px",
        textAlign: "center", cursor: "pointer", color: "var(--ink-faint)", fontSize: 13,
        transition: "all .15s",
      }}
    >
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => handle(e.target.files?.[0])} />
      {busy ? "저장 중…" : (
        <>📷 {compact ? "스크린샷 추가" : "캡처 이미지를 드래그하거나 클릭해 업로드"}
          {!compact && <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>붙여넣기(Ctrl+V)도 지원</div>}
        </>
      )}
    </div>
  );
}
