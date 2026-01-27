"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  AlertCircle,
  FileText,
  Megaphone,
  Receipt,
  Settings,
  ChevronRight,
  Shield,
  Phone,
  HelpCircle,
} from "lucide-react";

export default function TenantServicesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F9F9F7] pb-24 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md px-5 py-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Tiện ích
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Tất cả dịch vụ bạn cần ở một nơi
        </p>
      </div>

      <div className="p-5 space-y-6">
        {/* Core Services */}
        <div>
          <h3 className="text-slate-900 font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
            Dịch vụ chính
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <ServiceCard
              title="Chốt điện nước"
              desc="Ghi chỉ số định kỳ"
              icon={<Zap size={24} />}
              bg="bg-blue-50"
              iconColor="text-blue-600"
              onClick={() => router.push("/tenant/services/readings")}
            />
            <ServiceCard
              title="Báo sự cố"
              desc="Sửa chữa, bảo trì"
              icon={<AlertCircle size={24} />}
              bg="bg-orange-50"
              iconColor="text-orange-600"
              onClick={() => router.push("/tenant/requests/issues")}
            />
            <ServiceCard
              title="Hóa đơn"
              desc="Thanh toán & Lịch sử"
              icon={<Receipt size={24} />}
              bg="bg-emerald-50"
              iconColor="text-emerald-600"
              onClick={() => router.push("/tenant/billing")}
            />
            <ServiceCard
              title="Hợp đồng"
              desc="Thông tin thuê phòng"
              icon={<FileText size={24} />}
              bg="bg-purple-50"
              iconColor="text-purple-600"
              onClick={() => router.push("/tenant/contracts")}
            />
          </div>
        </div>

        {/* Support & Info */}
        <div>
          <h3 className="text-slate-900 font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-slate-300 rounded-full"></span>
            Thông tin & Hỗ trợ
          </h3>
          <div className="space-y-3">
            <ListItem
              icon={<Megaphone size={20} />}
              title="Bảng tin & Thông báo"
              bg="bg-pink-50"
              color="text-pink-600"
              path="/tenant/news"
            />
            <ListItem
              icon={<Phone size={20} />}
              title="Danh bạ BQL"
              bg="bg-indigo-50"
              color="text-indigo-600"
              path="#" // Placeholder
            />
            <ListItem
              icon={<HelpCircle size={20} />}
              title="Hướng dẫn sử dụng"
              bg="bg-teal-50"
              color="text-teal-600"
              path="#"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ title, desc, icon, bg, iconColor, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] cursor-pointer hover:border-indigo-100 hover:shadow-md transition-all group h-full flex flex-col items-start"
    >
      <div
        className={`w-12 h-12 ${bg} ${iconColor} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}
      >
        {icon}
      </div>
      <p className="font-bold text-slate-900 text-base group-hover:text-indigo-700 transition-colors">
        {title}
      </p>
      <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function ListItem({ icon, title, bg, color, path }: any) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm active:bg-slate-50 cursor-pointer hover:border-indigo-100 hover:shadow transition-all group flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 ${bg} ${color} rounded-lg flex items-center justify-center`}
        >
          {icon}
        </div>
        <span className="font-bold text-slate-700 text-sm group-hover:text-slate-900 transition-colors">
          {title}
        </span>
      </div>
      <ChevronRight
        size={18}
        className="text-slate-300 group-hover:text-indigo-400"
      />
    </div>
  );
}
