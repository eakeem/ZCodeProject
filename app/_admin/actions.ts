"use server";

import { revalidatePath } from "next/cache";
import https from "https";
import { createAdminClient } from "@/lib/admin/supabase";
import { randomPassword, slugify } from "@/lib/admin/utils";

export type CreateMemorialResult = {
  ok: boolean;
  error?: string;
  email?: string;
  tempPassword?: string;
};

function httpsRequest(
  hostname: string,
  path: string,
  method: string,
  headers: Record<string, string>,
  body?: object,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, port: 443, path, method, headers, timeout: 30000 },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode || 0, body: data }));
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

export async function createMemorialAction(
  _: CreateMemorialResult,
  formData: FormData,
): Promise<CreateMemorialResult> {
  const customerName = String(formData.get("customerName") || "").trim();
  const customerEmail = String(formData.get("customerEmail") || "").trim().toLowerCase();
  const memorialName = String(formData.get("memorialName") || "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") || "").trim() || null;
  const dateOfDeath = String(formData.get("dateOfDeath") || "").trim() || null;
  const tagline = String(formData.get("tagline") || "").trim() || null;
  const bio = String(formData.get("bio") || "").trim() || null;

  if (!customerName || !customerEmail || !memorialName) {
    return { ok: false, error: "Customer and memorial fields are required." };
  }

  const admin = createAdminClient();
  const tempPassword = randomPassword();

  // The Supabase Auth admin SDK's fetch implementation intermittently times
  // out in this environment, while Node's native https module is reliable.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const hostname = new URL(supabaseUrl).hostname;
  const authHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  let userId: string;
  try {
    console.log("[createMemorialAction] creating auth user via https for", customerEmail);
    const { status, body } = await httpsRequest(
      hostname,
      "/auth/v1/admin/users",
      "POST",
      authHeaders,
      {
        email: customerEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name: customerName },
      },
    );
    console.log("[createMemorialAction] auth user status:", status, "body:", body.slice(0, 200));

    const data = JSON.parse(body) as { id?: string; message?: string };
    if (status < 200 || status >= 300 || !data.id) {
      return { ok: false, error: data.message || "Could not create customer user." };
    }
    userId = data.id;
  } catch (e: any) {
    console.error("[createMemorialAction] auth user creation failed:", e);
    return { ok: false, error: e?.message || "Could not create customer user." };
  }

  // A database trigger creates the tenants row when the auth user is created.
  // Update it to ensure the name/email are correct and auth_id is linked.
  console.log("[createMemorialAction] updating tenant", userId);
  const { error: tenantError } = await admin
    .from("tenants")
    .update({ email: customerEmail, name: customerName, auth_id: userId })
    .eq("id", userId);

  if (tenantError) {
    console.error("[createMemorialAction] tenant update failed:", tenantError);
    await httpsRequest(hostname, `/auth/v1/admin/users/${userId}`, "DELETE", authHeaders);
    return { ok: false, error: tenantError.message };
  }

  const generatedSlug = `${slugify(memorialName)}-${Date.now().toString().slice(-6)}`;
  console.log("[createMemorialAction] inserting memorial with slug", generatedSlug);
  const { error: memorialError } = await admin.from("memorials").insert({
    tenant_id: userId,
    deceased_name: memorialName,
    slug: generatedSlug,
    birth_date: dateOfBirth,
    passing_date: dateOfDeath,
    tagline,
    bio,
    published: false,
    hero_image: null,
  });

  if (memorialError) {
    console.error("[createMemorialAction] memorial insert failed:", memorialError);
    await httpsRequest(hostname, `/auth/v1/admin/users/${userId}`, "DELETE", authHeaders);
    return { ok: false, error: memorialError.message };
  }

  revalidatePath("/_admin");
  revalidatePath("/admin");

  return {
    ok: true,
    email: customerEmail,
    tempPassword,
  };
}

export async function updateMemorialAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    return { ok: false, error: "Missing memorial id." };
  }

  const payload = {
    deceased_name: String(formData.get("name") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    birth_date: String(formData.get("date_of_birth") || "").trim() || null,
    passing_date: String(formData.get("date_of_death") || "").trim() || null,
    tagline: String(formData.get("tagline") || "").trim() || null,
    bio: String(formData.get("bio") || "").trim() || null,
    published: String(formData.get("is_published") || "") === "on",
  };

  if (!payload.deceased_name || !payload.slug) {
    return { ok: false, error: "Name and slug are required." };
  }

  const admin = createAdminClient();

  const { error } = await admin.from("memorials").update(payload).eq("id", id);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/_admin");
  revalidatePath(`/_admin/memorial/${id}/edit`);
  revalidatePath("/admin");
  revalidatePath(`/admin/memorial/${id}/edit`);

  return { ok: true };
}

export async function uploadHeroImageAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const file = formData.get("hero_image") as File | null;

  if (!id || !file || file.size <= 0) {
    return { ok: false, error: "Please choose a file first." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("memorials")
    .upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data } = admin.storage.from("memorials").getPublicUrl(path);

  const { error: updateError } = await admin
    .from("memorials")
    .update({ hero_image: data.publicUrl })
    .eq("id", id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath("/_admin");
  revalidatePath(`/_admin/memorial/${id}/edit`);
  revalidatePath("/admin");
  revalidatePath(`/admin/memorial/${id}/edit`);

  return { ok: true, heroImageUrl: data.publicUrl };
}
