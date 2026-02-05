"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  FileText,
  Wallet,
  LogOut,
  Receipt,
  Zap,
  Droplets,
  AlertTriangle,
  Bell,
} from "lucide-react";

const menuItems = [
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Tòa nhà", href: "/buildings", icon: Building2 },
  { name: "Phòng", href: "/rooms", icon: DoorOpen },
  { name: "Khách thuê", href: "/tenants", icon: Users },
  { name: "Hợp đồng", href: "/contracts", icon: FileText },
  { name: "Dịch vụ", href: "/services", icon: Zap },
  { name: "Chốt số", href: "/readings", icon: Droplets },
  { name: "Sự cố", href: "/issues", icon: AlertTriangle },
  { name: "Hóa đơn", href: "/invoices", icon: Receipt },
  { name: "Tài chính", href: "/finance", icon: Wallet },
  { name: "Bảng tin", href: "/notifications", icon: Bell },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
      w-64 bg-[#F2F2F0] border-r border-[#E5E5E5] h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300
      md:translate-x-0 font-sans
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
    `}
    >
      {/* Logo */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-[#D97757] rounded-lg flex items-center justify-center">
            <span className="text-white font-serif font-bold text-lg">C</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#333333]">
            CAMEL<span className="text-[#888888] font-normal">STAY</span>
          </h1>
        </div>
        <div className="h-px bg-[#E5E5E5] w-full" />
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          let isActive = false;
          if (item.href === "/") {
            isActive = pathname === "/";
          } else if (item.href === "/rooms") {
            isActive = pathname?.includes("/rooms") ?? false;
          } else if (item.href === "/buildings") {
            isActive =
              (pathname?.startsWith("/buildings") ?? false) &&
              !(pathname?.includes("/rooms") ?? false);
          } else {
            isActive = pathname?.startsWith(item.href) ?? false;
          }
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] transition-all duration-200 group relative
                ${
                  isActive
                    ? "bg-[#E3E3E1] text-[#1a1a1a] font-bold shadow-sm"
                    : "text-[#555555] font-medium hover:bg-[#EBEBE9] hover:text-[#333333]"
                }
              `}
            >
              <Icon
                size={20}
                className={`transition-colors duration-200 ${
                  isActive
                    ? "text-[#D97757]"
                    : "text-[#888888] group-hover:text-[#555555]"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-[#E5E5E5] bg-[#F2F2F0]">
        <button
          onClick={async () => {
            try {
              // 1. Call API to invalidate token (optional)
              // await axiosClient.post('/auth/logout');
            } catch (error) {
              console.error("Logout error", error);
            } finally {
              // 2. Clear Local Storage
              localStorage.removeItem("token");
              localStorage.removeItem("user");

              // 3. Clear Cookie
              document.cookie =
                "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";

              // 4. Redirect
              window.location.href = "/login";
            }
          }}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-[#666666] hover:text-[#D97757] hover:bg-white rounded-lg transition-all"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
