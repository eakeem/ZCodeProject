import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { getMemorialById, updateMemorial } from "@/lib/repo";

// PATCH /api/admin/memorial/:id — update memorial fields (owner only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const tenant = await getCurrentTenant();
  if (!tenant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const memorial = await getMemorialById(params.id);
  if (!memorial || memorial.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // allowlist of updatable fields
  const patch: Record<string, unknown> = {};
  for (const key of [
    "deceasedName",
    "birthDate",
    "passingDate",
    "tagline",
    "heroImage",
    "portraitImage",
    "bio",
    "customSections",
    "serviceInfo",
    "published",
  ]) {
    if (key in body) patch[key] = body[key];
  }

  const updated = await updateMemorial(memorial.id, patch as never);
  return NextResponse.json(updated);
}
