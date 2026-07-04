import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

function serializeCookie(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export async function POST() {
  await signOut();
  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        'Set-Cookie': serializeCookie('memorial_session', '', 0),
      },
    },
  );
}

export async function GET() {
  return POST();
}
