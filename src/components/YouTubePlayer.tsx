import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface PlayerHandle {
  getTime: () => number;
  seekTo: (s: number) => void;
  pause: () => void;
}

let apiLoading: Promise<void> | null = null;
function loadAPI(): Promise<void> {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiLoading) return apiLoading;
  apiLoading = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiLoading;
}

export const YouTubePlayer = forwardRef<PlayerHandle, { videoId: string; start?: number }>(
  ({ videoId, start = 0 }, ref) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      getTime: () => (playerRef.current?.getCurrentTime?.() ?? 0),
      seekTo: (s: number) => playerRef.current?.seekTo?.(s, true),
      pause: () => playerRef.current?.pauseVideo?.(),
    }), []);

    useEffect(() => {
      let cancelled = false;
      loadAPI().then(() => {
        if (cancelled || !hostRef.current) return;
        // 기존 플레이어 제거
        if (playerRef.current?.destroy) { playerRef.current.destroy(); playerRef.current = null; }
        const el = document.createElement("div");
        hostRef.current.innerHTML = "";
        hostRef.current.appendChild(el);
        playerRef.current = new window.YT.Player(el, {
          videoId,
          playerVars: { start: Math.floor(start), rel: 0, modestbranding: 1, playsinline: 1 },
        });
      });
      return () => {
        cancelled = true;
        if (playerRef.current?.destroy) { try { playerRef.current.destroy(); } catch {} playerRef.current = null; }
      };
    }, [videoId, start]);

    return (
      <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9",
        background: "#000", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
        <div ref={hostRef} style={{ position: "absolute", inset: 0 }}
          // 자식 iframe이 컨테이너를 꽉 채우도록
          className="yt-host" />
        <style>{`.yt-host iframe { width:100%; height:100%; }`}</style>
      </div>
    );
  }
);
YouTubePlayer.displayName = "YouTubePlayer";
