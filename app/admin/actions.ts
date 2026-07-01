"use server";

import { cookies } from 'next/headers';
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = 'memorial_session';

export async function logoutAndRedirect() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
  });
  redirect("/login");
}
