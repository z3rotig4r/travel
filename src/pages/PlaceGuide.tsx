import { useMemo, useRef, useState } from "react";
import { Section, PageHeader, EmptyNote } from "../components/ui";
import { YouTubePlayer, type PlayerHandle } from "../components/YouTubePlayer";
import { ImageUploader } from "../components/ImageUploader";
import { ImageThumb } from "../components/ImageThumb";
import { useStore } from "../store";
import { parseYouTubeId, parseStartSeconds, fmtTime, thumbUrl, watchAt } from "../lib/youtube";
import { screenCapture } from "../lib/screencap";
import { putImage } from "../lib/db";
import type { Bookmark } from "../types";

const UNGROUPED = "미분류";

export function PlaceGuide() {
  const bookmarks = useStore((s) => s.bookmarks);
  const addBookmark = useStore((s) => s.addBookmark);
  const updateBookmark = useStore((s) => s.updateBookmark);
  const removeBookmark = useStore((s) => s.removeBookmark);
  const videos = useStore((s) => s.videos);
  const addVideo = useStore((s) => s.addVideo);
  const removeVideo = useStore((s) => s.removeVideo);

  const [videoId, setVideoId] = useState<string>(videos[0]?.videoId ?? "");
  const [videoTitle, setVideoTitle] = useState<string>(videos[0]?.title ?? "");
  const [urlInput, setUrlInput] = useState("");
  const [start, setStart] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const playerRef = useRef<PlayerHandle>(null);

  const [draft, setDraft] = useState<null | { seconds: number; label: string; memo: string; group: string; imageId?: string }>(null);
  const [filter, setFilter] = useState<string>("전체");

  const groups = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => set.add(b.group?.trim() || UNGROUPED));
    return Array.from(set);
  }, [bookmarks]);

  function loadUrl() {
    const id = parseYouTubeId(urlInput);
    if (!id) { alert("유튜브 링크에서 영상 ID를 찾지 못했어요. 전체 URL을 붙여넣어 주세요."); return; }
    setVideoId(id); setVideoTitle(urlInput.trim()); setStart(parseStartSeconds(urlInput)); setUrlInput("");
  }

  function newDraft(imageId?: string) {
    const t = playerRef.current?.getTime() ?? 0;
    playerRef.current?.pause();
    setDraft({ seconds: Math.floor(t), label: "", memo: "", group: filter !== "전체" ? filter : "", imageId });
  }

  async function captureMoment() {
    const t = Math.floor(playerRef.current?.getTime() ?? 0);
    playerRef.current?.pause();
    if (!screenCapture.isSupported()) { alert("이 브라우저는 화면 캡처를 지원하지 않아요. 대신 스크린샷을 직접 업로드해 주세요."); newDraft(); return; }
    setCapturing(true);
    try {
      const blob = await screenCapture.capture();
      const id = await putImage(blob);
      setDraft({ seconds: t, label: "", memo: "", group: filter !== "전체" ? filter : "", imageId: id });
    } catch (e) {
      alert("화면 캡처가 취소되었거나 실패했어요. 스크린샷을 직접 업로드할 수 있어요.");
      newDraft();
    } finally { setCapturing(false); }
  }

  async function recaptureIntoDraft() {
    if (!draft) return;
    setCapturing(true);
    try { const blob = await screenCapture.capture(); const id = await putImage(blob); setDraft({ ...draft, imageId: id }); }
    catch { alert("화면 캡처 실패"); }
    finally { setCapturing(false); }
  }

  function saveDraft() {
    if (!draft) return;
    addBookmark({
      videoId, videoTitle: videoTitle || videoId, group: draft.group.trim() || undefined,
      seconds: draft.seconds, label: draft.label || fmtTime(draft.seconds), memo: draft.memo, imageId: draft.imageId,
    });
    setDraft(null);
  }

  const shown = useMemo(() => {
    const list = filter === "전체" ? bookmarks : bookmarks.filter((b) => (b.group?.trim() || UNGROUPED) === filter);
    // group → bookmarks
    const byGroup = new Map<string, Bookmark[]>();
    list.forEach((b) => {
      const g = b.group?.trim() || UNGROUPED;
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g)!.push(b);
    });
    for (const arr of byGroup.values()) arr.sort((a, b) => a.seconds - b.seconds);
    return Array.from(byGroup.entries());
  }, [bookmarks, filter]);

  return (
    <Section>
      <PageHeader eyebrow="영상 가이드" title="유튜브로 만드는 나만의 가이드북"
        desc={<>영상을 보다가 <b>‘화면 캡처’</b>로 실제 장면을 저장하고, 그룹으로 분류해 가이드 문서를 만드세요.</>} />

      {/* URL 입력 + 시드 영상 */}
      <div className="card" style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="유튜브 링크 붙여넣기 (예: https://youtu.be/... )"
            value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadUrl()} style={{ flex: 1, minWidth: 220 }} />
          <button className="btn btn-primary" onClick={loadUrl}>영상 불러오기</button>
          {videoId && !videos.some((v) => v.videoId === videoId) && (
            <button className="btn" onClick={() => addVideo({ title: videoTitle || videoId, videoId })}>⭐ 추천에 추가</button>
          )}
        </div>
        {videos.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 12 }}>추천 영상:</span>
            {videos.map((v) => (
              <span key={v.id} style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--line-strong)", borderRadius: 999, overflow: "hidden" }}>
                <button className="btn btn-sm" style={{ border: "none", borderRadius: 0 }}
                  onClick={() => { setVideoId(v.videoId); setVideoTitle(v.title); setStart(0); }}>▶︎ {v.title}</button>
                <button className="btn btn-ghost btn-sm btn-danger" style={{ borderRadius: 0, padding: "5px 8px" }}
                  title="추천에서 제거" onClick={() => removeVideo(v.id)}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)" }} className="guide-grid">
        {/* Player */}
        <div>
          {videoId ? (
            <>
              <YouTubePlayer ref={playerRef} videoId={videoId} start={start} />
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={captureMoment} disabled={capturing}>
                  📸 {capturing ? "캡처 중…" : "화면 캡처로 저장"}
                </button>
                <button className="btn" onClick={() => newDraft()}>📌 시각만 저장</button>
                <a className="btn" href={watchAt(videoId, 0)} target="_blank" rel="noreferrer">유튜브에서 열기 ↗</a>
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                💡 ‘화면 캡처’를 누르면 공유할 탭을 한 번 선택해요. <b>이 탭</b>을 선택하면 재생 중인 장면이 그대로 저장됩니다.
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{videoTitle}</div>
            </>
          ) : <EmptyNote>영상을 불러오면 여기에서 재생됩니다.</EmptyNote>}

          {/* 저장 폼 */}
          {draft && (
            <div className="card fade-up" style={{ padding: 16, marginTop: 14, borderColor: "var(--accent)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <strong style={{ fontFamily: "var(--font-serif)" }}>순간 저장 · {fmtTime(draft.seconds)}</strong>
                <button className="btn btn-ghost btn-sm" onClick={() => setDraft(null)}>✕</button>
              </div>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label>제목</label>
                  <input value={draft.label} placeholder="예: 오타루 운하 포토스팟"
                    onChange={(e) => setDraft({ ...draft, label: e.target.value })} style={{ marginTop: 4 }} />
                </div>
                <div>
                  <label>그룹 / 카테고리</label>
                  <input list="bm-groups" value={draft.group} placeholder="예: 오타루 · 맛집 · 쇼핑"
                    onChange={(e) => setDraft({ ...draft, group: e.target.value })} style={{ marginTop: 4 }} />
                  <datalist id="bm-groups">{groups.filter((g) => g !== UNGROUPED).map((g) => <option key={g} value={g} />)}</datalist>
                </div>
              </div>
              <label style={{ display: "block", marginTop: 10 }}>메모</label>
              <textarea rows={3} value={draft.memo} placeholder="가이드 메모 (동선·팁·주의사항 등)"
                onChange={(e) => setDraft({ ...draft, memo: e.target.value })} style={{ margin: "4px 0 10px", resize: "vertical" }} />
              <label>이미지</label>
              <div style={{ marginTop: 4 }}>
                {draft.imageId
                  ? <div>
                      <ImageThumb imageId={draft.imageId} style={{ width: "100%", maxHeight: 220, borderRadius: 10 }} />
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button className="btn btn-sm" onClick={recaptureIntoDraft} disabled={capturing}>📸 다시 캡처</button>
                        <button className="btn btn-sm" onClick={() => setDraft({ ...draft, imageId: undefined })}>제거</button>
                      </div>
                    </div>
                  : <div style={{ display: "grid", gap: 8 }}>
                      <button className="btn" onClick={recaptureIntoDraft} disabled={capturing}>📸 화면 캡처</button>
                      <ImageUploader compact onUploaded={(id) => setDraft({ ...draft, imageId: id })} />
                    </div>}
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-primary" onClick={saveDraft}>저장</button>
              </div>
            </div>
          )}
        </div>

        {/* Bookmark list — 그룹별 */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ fontSize: 16, margin: 0 }}>저장한 순간 <span className="chip chip-muted">{bookmarks.length}</span></h3>
          </div>
          {/* group filter */}
          {groups.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {["전체", ...groups].map((g) => (
                <button key={g} onClick={() => setFilter(g)}
                  className={"chip" + (filter === g ? "" : " chip-muted")}
                  style={{ cursor: "pointer", border: "none" }}>{g}</button>
              ))}
            </div>
          )}
          {bookmarks.length === 0
            ? <EmptyNote>아직 저장한 순간이 없어요. 영상을 보다가 <b>‘화면 캡처로 저장’</b>을 눌러보세요.</EmptyNote>
            : <div style={{ display: "grid", gap: 16 }}>
                {shown.map(([group, list]) => (
                  <div key={group}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 8 }}>
                      {group} <span className="muted" style={{ fontWeight: 500 }}>· {list.length}</span>
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                      {list.map((b) => (
                        <BookmarkCard key={b.id} b={b}
                          isCurrent={b.videoId === videoId}
                          onSeek={() => {
                            if (b.videoId === videoId) playerRef.current?.seekTo(b.seconds);
                            else { setVideoId(b.videoId); setVideoTitle(b.videoTitle); setStart(b.seconds); }
                          }}
                          groups={groups}
                          onSave={(patch) => updateBookmark(b.id, patch)}
                          onDelete={() => removeBookmark(b.id)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>}
        </div>
      </div>

      <style>{`@media (max-width: 860px){ .guide-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </Section>
  );
}

function BookmarkCard({ b, onSeek, onSave, onDelete, isCurrent, groups }: {
  b: Bookmark; onSeek: () => void; onSave: (p: Partial<Bookmark>) => void; onDelete: () => void; isCurrent: boolean; groups: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(b.label);
  const [memo, setMemo] = useState(b.memo);
  const [group, setGroup] = useState(b.group || "");

  return (
    <div className="card" style={{ padding: 12, display: "flex", gap: 12 }}>
      <div style={{ flex: "0 0 auto", width: 96, cursor: "pointer" }} onClick={onSeek} title="이 시각으로 이동">
        {b.imageId
          ? <ImageThumb imageId={b.imageId} style={{ width: "100%", aspectRatio: "16/9", borderRadius: 8 }} />
          : <img src={thumbUrl(b.videoId)} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 8 }} />}
        <div className="chip" style={{ marginTop: 6, fontSize: 11 }}>⏱ {fmtTime(b.seconds)}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <>
            <input value={label} onChange={(e) => setLabel(e.target.value)} style={{ marginBottom: 6 }} placeholder="제목" />
            <input list="bm-groups" value={group} onChange={(e) => setGroup(e.target.value)} style={{ marginBottom: 6 }} placeholder="그룹" />
            <textarea rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} style={{ resize: "vertical" }} placeholder="메모" />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => { onSave({ label, memo, group: group.trim() || undefined }); setEditing(false); }}>저장</button>
              <button className="btn btn-sm" onClick={() => { setLabel(b.label); setMemo(b.memo); setGroup(b.group || ""); setEditing(false); }}>취소</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>{b.label}</div>
            {b.memo && <div className="soft" style={{ fontSize: 13, marginTop: 3, whiteSpace: "pre-wrap" }}>{b.memo}</div>}
            {!isCurrent && <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>🎬 {b.videoTitle}</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <button className="btn btn-ghost btn-sm" onClick={onSeek}>▶︎ 이동</button>
              <a className="btn btn-ghost btn-sm" href={watchAt(b.videoId, b.seconds)} target="_blank" rel="noreferrer">유튜브 ↗</a>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>편집</button>
              <button className="btn btn-ghost btn-sm btn-danger" style={{ marginLeft: "auto" }} onClick={onDelete}>삭제</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
