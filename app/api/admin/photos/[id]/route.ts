import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { deletePhoto } from "@/lib/photos";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const photo = deletePhoto(id);
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Best-effort removal of the file from disk.
  try {
    const rel = photo.path.replace(/^\/+/, "");
    await unlink(path.join(process.cwd(), "public", rel));
  } catch {
    /* file may already be gone */
  }
  return NextResponse.json({ ok: true });
}
