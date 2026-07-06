"use server";

import { cookies } from 'next/headers';
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";

const SESSION_COOKIE_NAME = 'memorial_session';

export async function logoutAndRedirect() {
  try {
    await signOut();
    
    const cookieStore = await cookies();
    // Use .delete() instead of set with maxAge 0. More reliable
    cookieStore.delete(SESSION_COOKIE_NAME);
    
  } catch (error) {
    console.error("Logout error:", error);
  }
  
  redirect("/"); // Redirect happens OUTSIDE the try
}