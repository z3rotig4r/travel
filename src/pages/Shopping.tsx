import { useState } from "react";
import { Section, PageHeader, EmptyNote } from "../components/ui";
import { ImageUploader } from "../components/ImageUploader";
import { ImageThumb } from "../components/ImageThumb";
import { useStore } from "../store";
import { RecordModal, type Field } from "../components/RecordModal";
import { parseYouTubeId, thumbUrl } from "../lib/youtube";
import type { ShoppingItem, BuyLocalItem } from "../types";

const buyFields: Field[] = [
  { key: "item", label: "품목" },
  { key: "where", label: "구매 장소" },
  { key: "desc", label: "설명", type: "textarea" },
];

// 업로드 이미지 우선, 없으면 유튜브 출처면 썸네일 표시
function ItemImage({ it, style }: { it: ShoppingItem; style: React.CSSProperties }) {
  if (it.imageId) return <ImageThumb imageId={it.imageId} style={style} />;
  const yt = it.sourceUrl ? parseYouTubeId(it.sourceUrl) : null;
  if (yt) return <img src={thumbUrl(yt)} alt="" style={{ objectFit: "cover", ...style }} />;
  return (
    <div style={{ ...style, background: "var(--bg-sunken)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🛍️</div>
  );
}

function detectSource(url: string): ShoppingItem["sourceType"] {
  if (/youtu\.?be/.test(url)) return "youtube";
  if (/instagram\.com/.test(url)) return "instagram";
  if (/^https?:\/\//.test(url)) return "web";
  return "other";
}
const SRC_ICON: Record<string, string> = { youtube: "▶︎", instagram: "📸", web: "🔗", other: "•" };

export function Shopping() {
  const items = useStore((s) => s.shopping);
  const add = useStore((s) => s.addShopping);
  const update = useStore((s) => s.updateShopping);
  const remove = useStore((s) => s.removeShopping);
  const toggle = useStore((s) => s.toggleBought);
  const buyLocal = useStore((s) => s.buyLocal);
  const addBuyLocal = useStore((s) => s.addBuyLocal);
  const updateBuyLocal = useStore((s) => s.updateBuyLocal);
  const removeBuyLocal = useStore((s) => s.removeBuyLocal);
  const [buyModal, setBuyModal] = useState<null | { i: number | null }>(null);

  const [open, setOpen] = useState(false);
  const [f, setF] = useState<{ name: string; memo: string; sourceUrl: string; price: string; imageId?: string }>(
    { name: "", memo: "", sourceUrl: "", price: "" });

  function submit() {
    if (!f.name.trim()) { alert("제품/상품명을 입력해 주세요."); return; }
    add({ name: f.name.trim(), memo: f.memo.trim(), sourceUrl: f.sourceUrl.trim() || undefined,
      sourceType: f.sourceUrl ? detectSource(f.sourceUrl) : undefined, price: f.price.trim() || undefined, imageId: f.imageId });
    setF({ name: "", memo: "", sourceUrl: "", price: "" });
    setOpen(false);
  }

  const active = items.filter((i) => !i.bought);
  const done = items.filter((i) => i.bought);

  return (
    <Section>
      <PageHeader eyebrow="쇼핑 리스트" title="사고 싶은 것 모아두기"
        desc="유튜브·인스타 릴스에서 발견한 제품을 캡처해 기록하세요. 스크린샷·출처 링크·메모까지."
        right={<button className="btn btn-primary" onClick={() => setOpen((v) => !v)}>{open ? "닫기" : "＋ 항목 추가"}</button>} />

      {open && (
        <div className="card fade-up" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }} className="shop-form">
            <div>
              <label>제품 / 상품명 *</label>
              <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}
                placeholder="예: 시로이코이비토 랑그드샤" style={{ marginTop: 4 }} />
              <label style={{ marginTop: 10, display: "block" }}>출처 링크 (유튜브/릴스/웹)</label>
              <input value={f.sourceUrl} onChange={(e) => setF({ ...f, sourceUrl: e.target.value })}
                placeholder="https://..." style={{ marginTop: 4 }} />
              <label style={{ marginTop: 10, display: "block" }}>가격 / 구매처 메모</label>
              <input value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })}
                placeholder="예: 약 1,200엔 · 신치토세 공항" style={{ marginTop: 4 }} />
            </div>
            <div>
              <label>메모</label>
              <textarea rows={3} value={f.memo} onChange={(e) => setF({ ...f, memo: e.target.value })}
                placeholder="어떤 상품인지, 왜 사고 싶은지" style={{ marginTop: 4, resize: "vertical" }} />
              <label style={{ marginTop: 10, display: "block" }}>캡처 이미지</label>
              <div style={{ marginTop: 4 }}>
                {f.imageId
                  ? <div><ImageThumb imageId={f.imageId} style={{ width: "100%", maxHeight: 160, borderRadius: 10 }} />
                      <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={() => setF({ ...f, imageId: undefined })}>이미지 제거</button></div>
                  : <ImageUploader compact onUploaded={(id) => setF({ ...f, imageId: id })} />}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary" onClick={submit}>저장</button>
          </div>
        </div>
      )}

      {/* 내 쇼핑 리스트 */}
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>내 위시리스트 <span className="chip chip-muted">{items.length}</span></h2>
      {items.length === 0
        ? <EmptyNote>아직 담은 항목이 없어요. <b>＋ 항목 추가</b>로 첫 위시를 기록해 보세요.</EmptyNote>
        : <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {[...active, ...done].map((it) => (
              <div key={it.id} className="card" style={{ padding: 12, opacity: it.bought ? 0.6 : 1 }}>
                <ItemImage it={it} style={{ width: "100%", aspectRatio: "4/3", borderRadius: 10, marginBottom: 10 }} />
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <input type="checkbox" checked={it.bought} onChange={() => toggle(it.id)}
                    style={{ width: 18, height: 18, marginTop: 3, flex: "0 0 auto" }} title="구매 완료" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, textDecoration: it.bought ? "line-through" : "none" }}>{it.name}</div>
                    {it.price && <div className="chip chip-muted" style={{ fontSize: 11, marginTop: 4 }}>💴 {it.price}</div>}
                    {it.memo && <div className="soft" style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{it.memo}</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      {it.sourceUrl && <a className="btn btn-ghost btn-sm" href={it.sourceUrl} target="_blank" rel="noreferrer">
                        {SRC_ICON[it.sourceType || "other"]} 출처 ↗</a>}
                      <button className="btn btn-ghost btn-sm btn-danger" style={{ marginLeft: "auto" }} onClick={() => remove(it.id)}>삭제</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>}

      {/* 추천 물품 (편집 가능) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "34px 0 6px" }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>현지에서 사면 좋은 것</h2>
        <button className="btn btn-sm btn-primary" onClick={() => setBuyModal({ i: null })}>＋ 추천물품 추가</button>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 14 }}>카드를 눌러 위시리스트에 담거나, 직접 추가·편집·삭제할 수 있어요.</p>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {buyLocal.map((b, i) => (
          <div key={i} className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{b.item}</div>
            <div className="soft" style={{ fontSize: 13, marginTop: 4 }}>{b.desc}</div>
            {b.where && <div className="chip chip-muted" style={{ fontSize: 11, marginTop: 8 }}>🏬 {b.where}</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <button className="btn btn-sm" onClick={() => add({ name: b.item, memo: b.desc, price: b.where })}>＋ 위시</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setBuyModal({ i })}>✎</button>
              <button className="btn btn-ghost btn-sm btn-danger" style={{ marginLeft: "auto" }} onClick={() => removeBuyLocal(i)}>삭제</button>
            </div>
          </div>
        ))}
      </div>

      {buyModal && (
        <RecordModal title={buyModal.i === null ? "추천물품 추가" : "추천물품 수정"} fields={buyFields}
          initial={buyModal.i === null ? { item: "", where: "", desc: "" } : buyLocal[buyModal.i]}
          onClose={() => setBuyModal(null)}
          onSave={(rec) => {
            const row = rec as BuyLocalItem;
            if (buyModal.i === null) addBuyLocal(row); else updateBuyLocal(buyModal.i, row);
            setBuyModal(null);
          }} />
      )}
    </Section>
  );
}
