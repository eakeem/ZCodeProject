import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentTenant } from "@/lib/auth";
import { deleteImage, pathFromPublicUrl } from "@/lib/storage";

// PATCH /api/admin/shared-photos/:id
//   body: { action: "approve" | "reject" | "delete" }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenant = await getCurrentTenant();
    if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: { action?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

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
      return NextResponse.json({
        error: "Could not load photo",
        details: photoError.message,
        code: photoError.code,
      }, { status: 500 });
    }

    const { data: memorial, error: memorialError } = await supabase
      .from('memorials')
      .select('id, tenant_id')
      .eq('id', photo.memorial_id)
      .single();

    if (memorialError || !memorial || memorial.tenant_id !== tenant.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    switch (body.action) {
      case "approve": {
        const { error } = await supabase
          .from('shared_photos')
          .update({ status: 'approved' })
          .eq('id', photo.id);
        if (error) {
          return NextResponse.json({
            error: "Could not update shared photo",
            details: error.message,
            code: error.code,
          }, { status: 500 });
        }
        break;
      }
      case "reject": {
        const { error } = await supabase
          .from('shared_photos')
          .update({ status: 'rejected' })
          .eq('id', photo.id);
        if (error) {
          return NextResponse.json({
            error: "Could not update shared photo",
            details: error.message,
            code: error.code,
          }, { status: 500 });
        }
        break;
      }
      case "delete": {
        const objectPath = pathFromPublicUrl(photo.url, "shared-photos");
        if (objectPath) await deleteImage(objectPath, "shared-photos");
        const { error } = await supabase
          .from('shared_photos')
          .delete()
          .eq('id', photo.id);
        if (error) {
          return NextResponse.json({
            error: "Could not update shared photo",
            details: error.message,
            code: error.code,
          }, { status: 500 });
        }
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('shared photo moderation route error:', error);
    const message = error instanceof Error ? error.message : "Could not update shared photo";
    return NextResponse.json({ error: "Could not update shared photo", details: message }, { status: 500 });
  }
}
