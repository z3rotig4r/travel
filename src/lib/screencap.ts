// 화면 캡처 API(getDisplayMedia)로 재생 중인 영상 프레임을 실제 캡처한다.
// 스트림을 세션 동안 유지해 반복 캡처가 부드럽게 되도록 한다.
class ScreenCapture {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;

  isSupported() {
    return !!(navigator.mediaDevices && (navigator.mediaDevices as any).getDisplayMedia);
  }
  isActive() {
    return !!this.stream && this.stream.getVideoTracks().some((t) => t.readyState === "live");
  }

  private async ensure(): Promise<void> {
    if (this.isActive() && this.video) return;
    const stream: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({
      video: { frameRate: 30 },
      audio: false,
      preferCurrentTab: true, // Chromium 힌트: 현재 탭을 우선 제안
    });
    this.stream = stream;
    const v = document.createElement("video");
    v.srcObject = stream;
    v.muted = true;
    await v.play().catch(() => {});
    this.video = v;
    // 사용자가 공유를 중지하면 초기화
    stream.getVideoTracks()[0]?.addEventListener("ended", () => this.stop());
  }

  async capture(): Promise<Blob> {
    await this.ensure();
    const v = this.video!;
    // 프레임이 준비될 때까지 잠깐 대기
    if (!v.videoWidth) await new Promise((r) => setTimeout(r, 250));
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")!.drawImage(v, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("capture failed"))), "image/jpeg", 0.85)
    );
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video = null;
  }
}

export const screenCapture = new ScreenCapture();
