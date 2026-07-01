import { NextResponse } from "next/server";
import { signUp } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { email?: string; name?: string; password?: string };
  
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await signUp({
      email: body.email || "",
      name: body.name || "",
      password: body.password || "",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ ok: true });
    
  } catch (e: any) {
    console.error("Signup route error:", e);
    return NextResponse.json(
      { error: "Server error: " + (e.message || "Unknown") }, 
      { status: 500 }
    );
  }
}