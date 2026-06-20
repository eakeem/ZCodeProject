import { NextResponse } from "next/server";
import { getMemorialById, getMemorialBySlug, createTribute } from "@/lib/repo";
import type { TributeType } from "@/lib/types";

// POST /api/tributes — submit a message or candle for moderation.
// Body: { memorialId | slug, type, authorName, message }
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type as TributeType;
  if (type !== "message" && type !== "candle") {
    return NextResponse.json({ error: "Invalid tribute type" }, { status: 400 });
  }

  const authorName = String(body.authorName || "").trim();
  const message = String(body.message || "").trim();
  if (!authorName || !message) {
    return NextResponse.json(
      { error: "Name and message are required." },
      { status: 400 },
    );
  }
  if (authorName.length > 80 || message.length > 1000) {
    return NextResponse.json(
      { error: "Your tribute is too long." },
      { status: 400 },
    );
  }

  // resolve memorial by id or slug
  const idOrSlug = String(body.memorialId || body.slug || "");
  const memorial =
    (await getMemorialById(idOrSlug)) ?? (await getMemorialBySlug(idOrSlug));
  if (!memorial || !memorial.published) {
    return NextResponse.json({ error: "Memorial not found." }, { status: 404 });
  }

  const tribute = await createTribute({
    memorialId: memorial.id,
    type,
    authorName,
    message,
  });

  return NextResponse.json(
    { ...tribute, status: "pending" },
    { status: 201 },
  );
}
