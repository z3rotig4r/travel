// 이미지 파일 → 리사이즈된 JPEG Blob (최대 변 1280px, 용량 절약)
export async function resizeToBlob(file: File, maxEdge = 1280, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // 실패 시 원본
  let { width, height } = bitmap;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || file), "image/jpeg", quality)
  );
}
