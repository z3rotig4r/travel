import { useState } from "react";

export interface Field {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea";
  placeholder?: string;
  full?: boolean; // 그리드 전체 폭
}

export function RecordModal({ title, fields, initial, onSave, onClose }: {
  title: string;
  fields: Field[];
  initial: Record<string, any>;
  onSave: (rec: Record<string, any>) => void;
  onClose: () => void;
}) {
  const [rec, setRec] = useState<Record<string, any>>({ ...initial });
  const set = (k: string, v: any) => setRec((r) => ({ ...r, [k]: v }));

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ padding: 22, width: 520, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          {fields.map((f) => (
            <div key={f.key} style={{ gridColumn: f.full || f.type === "textarea" ? "1 / -1" : "auto" }}>
              <label>{f.label}</label>
              {f.type === "textarea"
                ? <textarea rows={2} value={rec[f.key] ?? ""} placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)} style={{ marginTop: 4, resize: "vertical" }} />
                : <input type={f.type === "number" ? "number" : "text"} value={rec[f.key] ?? ""} placeholder={f.placeholder}
                    onChange={(e) => set(f.key, f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
                    style={{ marginTop: 4 }} />}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => onSave(rec)}>저장</button>
          <button className="btn" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}
