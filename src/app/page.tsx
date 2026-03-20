import { redirect } from "next/navigation";

export default function RootPage() {
  // In dev bypass mode, default to portal overview.
  // Proper role-based redirect happens in middleware.
  redirect("/portal/overview");
}
