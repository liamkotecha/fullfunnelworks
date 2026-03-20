import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import type { Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";

/** Convert a lean User document to the shape NextAuth expects. */
function toAuthUser(doc: Record<string, unknown>): {
  id: string;
  email: string;
  name: string;
  role: string;
} {
  return {
    id: String(doc._id),
    email: doc.email as string,
    name: doc.name as string,
    role: doc.role as string,
  };
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "password",
      name: "Password",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: (credentials.email as string).toLowerCase() }).lean();
        if (!user || !(user as Record<string, unknown>).password) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          (user as Record<string, unknown>).password as string
        );
        if (!valid) return null;
        return toAuthUser(user as Record<string, unknown>);
      },
    }),
    // OTP and Passkey providers share the same lookup-by-ID logic
    ...(["otp", "passkey"] as const).map((id) =>
      CredentialsProvider({
        id,
        name: id === "otp" ? "Email OTP" : "Passkey",
        credentials: {
          userId: { type: "text" },
        },
        async authorize(credentials) {
          if (!credentials?.userId) return null;
          await connectDB();
          const user = await User.findById(credentials.userId as string).lean();
          if (!user) return null;
          return toAuthUser(user as Record<string, unknown>);
        },
      })
    ),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: NextAuthUser }) {
      if (user) {
        token.id = user.id;
        token.role = (user as NextAuthUser & { role: string }).role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        (session.user as Session["user"] & { id: string; role: string }).id = token.id as string;
        (session.user as Session["user"] & { id: string; role: string }).role = token.role as string;
      }
      return session;
    },
  },
});
