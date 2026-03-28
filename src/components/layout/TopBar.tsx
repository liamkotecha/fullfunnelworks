"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { GlobalSearch } from "@/components/admin/GlobalSearch";
import { PortalSearch } from "@/components/portal/PortalSearch";
import { NotificationsButton } from "@/components/admin/NotificationsButton";

import { signOut } from "next-auth/react";
import { useToast } from "@/components/notifications/ToastContext";
import { usePathname, useRouter } from "next/navigation";

interface TopBarProps {
  userName?: string;
  userEmail?: string;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
  role?: "admin" | "consultant" | "portal";
  topOffset?: number;
}

export function TopBar({ userName, userEmail, onMenuToggle, menuOpen, role, topOffset }: TopBarProps) {
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const appsRef = useRef<HTMLDivElement>(null);
  const { success } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname.startsWith("/admin");
  const homeHref = isAdmin ? "/admin/dashboard" : "/portal/overview";

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (appsRef.current && !appsRef.current.contains(e.target as Node)) setAppsOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
    success("Signed out", "You have been securely signed out.");
  };

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <nav className="bg-[#141414] border-b border-white/10 px-4 py-2.5 fixed left-0 md:left-64 right-0 z-50 h-16" style={{ top: topOffset ?? 0 }}>
      <div className="flex items-center h-full">
        {/* Left: hamburger + mobile logo */}
        <div className="flex items-center flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuToggle}
            className="p-2 mr-2 text-white rounded-lg cursor-pointer md:hidden hover:bg-white/10 focus:bg-white/10 focus:ring-2 focus:ring-white/20"
          >
            {menuOpen ? (
              <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span className="sr-only">Toggle sidebar</span>
          </button>

          {/* Logo (mobile only — desktop logo is in sidebar) */}
          <Link href={homeHref} className="flex items-center justify-between mr-4 md:hidden">
            <Image
              src="/logo_blue_650.webp"
              alt="Full Funnel"
              width={120}
              height={36}
              className="mr-3 h-8 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Centre: search */}
        <div className="flex-1 flex justify-center">
          {isAdmin ? <GlobalSearch /> : <PortalSearch />}
        </div>

        {/* Right: mobile search + notifications + apps + dev toggle + user */}
        <div className="flex items-center flex-shrink-0">
          {/* DEV: Admin ↔ Portal toggle */}
          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              onClick={() => router.push(isAdmin ? "/portal/overview" : "/admin/dashboard")}
              className="hidden md:flex items-center gap-1.5 mr-3 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: "rgb(108, 194, 255)", color: "#141414" }}
              title="Dev only — switch between admin and portal views"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              {isAdmin ? "Portal" : "Admin"}
            </button>
          )}
          {/* Mobile search toggle */}
          <button
            type="button"
            className="p-2 mr-1 text-white rounded-lg md:hidden hover:bg-white/10 focus:ring-4 focus:ring-white/20"
          >
            <span className="sr-only">Toggle search</span>
            <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
            </svg>
          </button>

          {/* Add client (admin only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => router.push("/admin/clients?new=1")}
              className="relative p-2 mr-1 text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Add new client"
            >
              <span className="sr-only">Add new client</span>
              <Plus className="w-5 h-5" />
            </button>
          )}

          {/* Notifications — hidden for portal clients */}
          {role !== "portal" && (
            <div className="relative" ref={notifRef}>
              <NotificationsButton role={role ?? (isAdmin ? "admin" : "consultant")} open={notifOpen} onToggle={() => setNotifOpen((v) => !v)} onClose={() => setNotifOpen(false)} />
            </div>
          )}

          {/* Apps */}
          <div className="relative" ref={appsRef}>
            <button
              type="button"
              onClick={() => setAppsOpen((v) => !v)}
              className="p-2 text-white rounded-lg hover:bg-white/10 focus:ring-4 focus:ring-white/20"
            >
              <span className="sr-only">View apps</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>

            {appsOpen && (
              <div className="overflow-hidden z-50 absolute right-0 top-10 my-1 max-w-sm w-72 text-base list-none bg-white rounded-lg divide-y divide-gray-100 shadow-sm">
                <div className="block py-2 px-4 text-base font-medium text-center text-gray-700 bg-gray-50">
                  Apps
                </div>
                <div className="grid grid-cols-3 gap-4 p-4">
                  <Link href={isAdmin ? "/admin/clients" : "/portal/overview"} onClick={() => setAppsOpen(false)} className="block p-4 text-center rounded-lg hover:bg-gray-100 group">
                    <svg aria-hidden="true" className="mx-auto mb-1 w-7 h-7 text-gray-400 group-hover:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <div className="text-sm text-gray-900">Clients</div>
                  </Link>
                  <Link href={isAdmin ? "/admin/projects" : "/portal/overview"} onClick={() => setAppsOpen(false)} className="block p-4 text-center rounded-lg hover:bg-gray-100 group">
                    <svg aria-hidden="true" className="mx-auto mb-1 w-7 h-7 text-gray-400 group-hover:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-gray-900">Projects</div>
                  </Link>
                  <Link href="/portal/intake" onClick={() => setAppsOpen(false)} className="block p-4 text-center rounded-lg hover:bg-gray-100 group">
                    <svg aria-hidden="true" className="mx-auto mb-1 w-7 h-7 text-gray-400 group-hover:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-gray-900">Intake</div>
                  </Link>
                  <Link href="/portal/gtm" onClick={() => setAppsOpen(false)} className="block p-4 text-center rounded-lg hover:bg-gray-100 group">
                    <svg aria-hidden="true" className="mx-auto mb-1 w-7 h-7 text-gray-400 group-hover:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                    </svg>
                    <div className="text-sm text-gray-900">GTM</div>
                  </Link>
                  <Link href={isAdmin ? "/admin/settings" : "/portal/overview"} onClick={() => setAppsOpen(false)} className="block p-4 text-center rounded-lg hover:bg-gray-100 group">
                    <svg aria-hidden="true" className="mx-auto mb-1 w-7 h-7 text-gray-400 group-hover:text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-gray-900">Settings</div>
                  </Link>
                  <button onClick={handleSignOut} className="block p-4 text-center rounded-lg hover:bg-gray-100 group w-full">
                    <svg aria-hidden="true" className="mx-auto mb-1 w-7 h-7 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <div className="text-sm text-gray-900">Logout</div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="relative ml-3" ref={userRef}>
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              className="flex text-sm rounded-full md:mr-0 focus:ring-4 focus:ring-white/20"
            >
              <span className="sr-only">Open user menu</span>
              <div className="flex items-center justify-center w-8 h-8 rounded-full font-sans font-bold text-xs" style={{ backgroundColor: 'rgb(108, 194, 255)', color: '#141414' }}>
                {initials}
              </div>
            </button>

            {userOpen && (
              <div className="absolute right-0 top-10 z-50 w-56 text-base list-none bg-white rounded-lg divide-y divide-gray-100 shadow-sm">
                <div className="py-3 px-4">
                  <span className="block text-sm font-semibold text-gray-900">{userName ?? "User"}</span>
                  <span className="block text-sm text-gray-900 truncate">{userEmail ?? ""}</span>
                </div>
                <ul className="py-1 text-gray-700">
                  <li>
                    <Link
                      href={homeHref}
                      onClick={() => setUserOpen(false)}
                      className="block py-2 px-4 text-sm hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={isAdmin ? "/admin/settings" : "/portal/overview"}
                      onClick={() => setUserOpen(false)}
                      className="block py-2 px-4 text-sm hover:bg-gray-100"
                    >
                      Account settings
                    </Link>
                  </li>
                </ul>
                <ul className="py-1 text-gray-700">
                  <li>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left block py-2 px-4 text-sm hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
