import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

function serializeCookie(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const result = await signIn(body.email || "", body.password || "");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        'Set-Cookie': serializeCookie('memorial_session', result.token!, 60 * 60 * 24 * 7),
      },
    },
  );
}
