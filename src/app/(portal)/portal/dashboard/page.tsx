import { redirect } from "next/navigation";

export default function PortalDashboardRedirectPage() {
  redirect("/portal/overview");
}
