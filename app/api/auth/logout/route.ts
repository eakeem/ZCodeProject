import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

function serializeCookie(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export async function POST(request: Request) {
  await signOut();
  
  const response = NextResponse.redirect(new URL('/', request.url))
  response.headers.set('Set-Cookie', serializeCookie('memorial_session', '', 0))
  return response
}

export async function GET(request: Request) {
  return POST(request);
}
