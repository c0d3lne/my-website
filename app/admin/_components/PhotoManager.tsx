"use client";
import { useState, useEffect, useCallback, useRef } from "react";

type Photo = { id: string; kind: "before" | "after"; path: string };

export default function PhotoManager({ bookingId }: { bookingId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const [error, setError] = useState("");
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/photos?bookingId=${bookingId}`);
    if (res.ok) setPhotos(await res.json());
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  async function upload(kind: "before" | "after", file: File) {
    setUploading(kind);
    setError("");
    const fd = new FormData();
    fd.append("bookingId", bookingId);
    fd.append("kind", kind);
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/photos", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Upload failed");
      } else {
        await load();
      }
    } catch {
      setError("Network error");
    } finally {
      setUploading(null);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/photos/${id}`, { method: "DELETE" });
    load();
  }

  const column = (kind: "before" | "after", ref: React.RefObject<HTMLInputElement | null>) => {
    const items = photos.filter((p) => p.kind === kind);
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="a-label !mb-0">{kind} photos</span>
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploading !== null}
            className="a-btn-ghost !py-1 !px-2.5 !text-xs"
          >
            {uploading === kind ? "Uploading…" : "+ Add"}
          </button>
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(kind, f);
            e.target.value = "";
          }}
        />
        <div className="grid grid-cols-3 gap-2">
          {items.length === 0 && (
            <p className="col-span-3 text-white/25 text-xs py-3">No {kind} photos yet.</p>
          )}
          {items.map((p) => (
            <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.path} alt={`${kind} photo`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                aria-label="Delete photo"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2">
        {column("before", beforeRef)}
        {column("after", afterRef)}
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
