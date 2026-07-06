"use server";

import { cookies } from 'next/headers';
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";

const SESSION_COOKIE_NAME = 'memorial_session';

export async function logoutAndRedirect() {
  await signOut(); // Important: actually logout from Lucia/whatever auth you use
  
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,  // Add this for security
    sameSite: 'lax'  // Add this for security
  });
  
  redirect("/"); // Redirect to homepage instead of login
}