import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import {
  getMemorialById,
  setTributeStatus,
  deleteTribute,
  getDb,
} from "@/lib/repo";

// PATCH /api/admin/tributes/:id  body: { action: "approve"|"reject"|"delete" }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // verify this tribute belongs to the tenant's memorial
  const db = await getDb();
  const tribute = db.tributes.find((t) => t.id === params.id);
  if (!tribute) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const memorial = await getMemorialById(tribute.memorialId);
  if (!memorial || memorial.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  switch (body.action) {
    case "approve":
      await setTributeStatus(tribute.id, "approved");
      break;
    case "reject":
      await setTributeStatus(tribute.id, "rejected");
      break;
    case "delete":
      await deleteTribute(tribute.id);
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
