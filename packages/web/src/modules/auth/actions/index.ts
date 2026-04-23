"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(email: string, password: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect" };
    }
    throw err;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
