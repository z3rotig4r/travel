import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface TravelDB extends DBSchema {
  images: { key: string; value: { id: string; blob: Blob } };
}

let dbp: Promise<IDBPDatabase<TravelDB>> | null = null;
function db() {
  if (!dbp) {
    dbp = openDB<TravelDB>("sapporo-travel", 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains("images")) d.createObjectStore("images", { keyPath: "id" });
      },
    });
  }
  return dbp;
}

export async function putImage(blob: Blob): Promise<string> {
  const id = "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  await (await db()).put("images", { id, blob });
  return id;
}

export async function getImageURL(id?: string): Promise<string | null> {
  if (!id) return null;
  const rec = await (await db()).get("images", id);
  return rec ? URL.createObjectURL(rec.blob) : null;
}

export async function getImageBlob(id?: string): Promise<Blob | null> {
  if (!id) return null;
  const rec = await (await db()).get("images", id);
  return rec ? rec.blob : null;
}

export async function deleteImage(id?: string) {
  if (!id) return;
  await (await db()).delete("images", id);
}
