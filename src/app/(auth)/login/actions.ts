"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginWithPassword(email: string, password: string, redirectTo: string) {
  try {
    await signIn("password", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    // NextAuth v5 throws NEXT_REDIRECT on success — let it propagate
    if (error instanceof AuthError) {
      return { error: error.message || "Invalid email or password" };
    }
    throw error; // re-throw redirects and unexpected errors
  }
}

export async function loginWithOTP(userId: string, redirectTo: string) {
  try {
    await signIn("otp", {
      userId,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.message || "OTP verification failed" };
    }
    throw error;
  }
}
