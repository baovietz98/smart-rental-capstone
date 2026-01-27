"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  User,
  Phone,
  Mail,
  Shield,
  FileText,
  ChevronRight,
  Settings,
} from "lucide-react";
import { Button, Avatar, Spin } from "antd";

export default function TenantProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. Get user info
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    // 1. Clear Storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    // 2. Clear Cookie
    document.cookie = "token=; path=/; max-age=0";

    // 3. Redirect
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9F9F7]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] p-5 pb-24 font-sans text-slate-900">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">
        Cá nhân
      </h1>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center mb-6 relative overflow-hidden">
        {/* Decorative bg */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-slate-100 to-slate-50"></div>

        <div className="relative z-10 -mt-4 mb-4">
          <div className="w-24 h-24 rounded-full p-1 bg-white ring-4 ring-indigo-50 shadow-sm flex items-center justify-center mx-auto">
            <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center object-cover overflow-hidden">
              {/* Fallback Avatar */}
              <span className="text-3xl font-bold text-slate-400">
                {user.name?.charAt(0).toUpperCase() || "T"}
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 text-center mb-1 relative z-10">
          {user.name}
        </h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-full relative z-10 border border-slate-200">
          {user.role === "TENANT" ? "Khách thuê" : user.role}
        </p>
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-50 flex items-center gap-4 hover:bg-slate-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Mail size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              Email
            </p>
            <p className="text-slate-900 font-medium text-sm break-all">
              {user.email}
            </p>
          </div>
        </div>
        <div className="p-4 border-b border-slate-50 flex items-center gap-4 hover:bg-slate-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Phone size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              Số điện thoại
            </p>
            <p className="text-slate-900 font-medium text-sm">
              {user.phoneNumber || "Chưa cập nhật"}
            </p>
          </div>
        </div>
        <div className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              ID Tài khoản
            </p>
            <p className="text-slate-900 font-medium text-sm font-mono">
              #{user.id}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Links */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <Link href="/tenant/contracts" className="block group">
          <div className="p-4 flex items-center justify-between group-hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                <FileText size={20} />
              </div>
              <span className="text-slate-900 font-bold text-sm">
                Hợp đồng của tôi
              </span>
            </div>
            <ChevronRight
              size={20}
              className="text-slate-300 group-hover:text-slate-400 transition-colors"
            />
          </div>
        </Link>
      </div>

      {/* Actions */}
      <button
        onClick={handleLogout}
        className="w-full h-14 bg-white text-rose-600 font-bold rounded-2xl border border-rose-100 shadow-sm hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <LogOut size={20} />
        Đăng xuất
      </button>

      <p className="text-center text-slate-400 text-xs mt-8 font-medium">
        Phiên bản 1.0.0
      </p>
    </div>
  );
}
