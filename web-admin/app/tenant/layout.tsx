"use client";

import React from "react";
import { Home, Receipt, Wrench, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/tenant",
      icon: Home,
      isActive: (path: string) =>
        path === "/tenant" ||
        path.startsWith("/tenant/contracts") ||
        path.startsWith("/tenant/room"),
    },
    {
      label: "Hóa đơn",
      href: "/tenant/billing",
      icon: Receipt,
      isActive: (path: string) => path.startsWith("/tenant/billing"),
    },
    {
      label: "Tiện ích",
      href: "/tenant/services",
      icon: Wrench,
      isActive: (path: string) => path.startsWith("/tenant/services"),
    },
    {
      label: "Cá nhân",
      href: "/tenant/profile",
      icon: User,
      isActive: (path: string) => path.startsWith("/tenant/profile"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col justify-between max-w-md mx-auto shadow-2xl overflow-hidden border-x border-[#E5E5E0]">
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {children}
      </main>

      {/* Modern Professional Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 flex justify-around items-center py-3 pb-6 shadow-lg z-50 max-w-md mx-auto transition-all">
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1.5 px-4 transition-all duration-300 group ${
                active
                  ? "text-indigo-600 scale-105"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all duration-300 ${active ? "bg-indigo-50" : "bg-transparent group-hover:bg-slate-50"}`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 2}
                  className={`transition-all duration-300 ${active ? "fill-indigo-100" : "fill-transparent"}`}
                />
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white animate-bounce-subtle" />
                )}
              </div>
              <span
                className={`text-[10px] font-bold font-sans tracking-tight transition-colors ${active ? "text-slate-900" : "text-slate-400"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
