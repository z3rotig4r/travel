import { useEffect, useState } from "react";
import { getImageURL } from "../lib/db";

export function ImageThumb({ imageId, alt = "", style, onClick }: {
  imageId?: string; alt?: string; style?: React.CSSProperties; onClick?: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true; let created: string | null = null;
    getImageURL(imageId).then((u) => { if (active) { setUrl(u); created = u; } });
    return () => { active = false; if (created) URL.revokeObjectURL(created); };
  }, [imageId]);
  if (!imageId) return null;
  if (!url) return <div style={{ ...style, background: "var(--bg-sunken)" }} />;
  return <img src={url} alt={alt} onClick={onClick}
    style={{ objectFit: "cover", cursor: onClick ? "zoom-in" : "default", ...style }} />;
}
