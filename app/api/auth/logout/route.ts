import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

export async function POST(request: Request) {
  await signOut();
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.delete("memorial_session");
  return response;
}

export async function GET(request: Request) {
  return POST(request);
}
