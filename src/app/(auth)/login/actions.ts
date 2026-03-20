"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function loginWithPassword(email: string, password: string, redirectTo: string) {
  try {
    await signIn("password", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    return { error: "Something went wrong" };
  }
}

export async function loginWithOTP(userId: string, redirectTo: string) {
  try {
    await signIn("otp", {
      userId,
      redirectTo,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { error: "OTP verification failed" };
    }
    return { error: "Something went wrong" };
  }
}
