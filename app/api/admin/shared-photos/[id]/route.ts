import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { supabase } from '@/lib/supabase-store';
import {
  getMemorialById,
  setSharedPhotoStatus,
  deleteSharedPhoto,
  
} from "@/lib/repo";
import { deleteImage, pathFromPublicUrl } from "@/lib/storage";

// PATCH /api/admin/shared-photos/:id
//   body: { action: "approve" | "reject" | "delete" }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // verify this shared photo belongs to the tenant's memorial
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const { data: photo, error: photoError } = await supabase
    .from('shared_photos')
    .select('id, memorial_id, url')
    .eq('id', id)
    .single();

  if (photoError) {
    if (photoError.code === 'PGRST116') {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error('shared photo lookup error:', photoError);
    return NextResponse.json({ error: "Could not load photo" }, { status: 500 });
  }

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const memorial = await getMemorialById(photo.memorial_id);
  if (!memorial || memorial.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    switch (body.action) {
      case "approve":
        await setSharedPhotoStatus(photo.id, "approved");
        break;
      case "reject":
        await setSharedPhotoStatus(photo.id, "rejected");
        break;
      case "delete": {
        // best-effort: remove the stored object, then drop the row
        const objectPath = pathFromPublicUrl(photo.url, "shared-photos");
        if (objectPath) await deleteImage(objectPath, "shared-photos");
        await deleteSharedPhoto(photo.id);
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error('shared photo moderation action error:', error);
    return NextResponse.json({ error: "Could not update shared photo" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
