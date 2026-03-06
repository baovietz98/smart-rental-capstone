"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  HelpCircle,
  FileText,
  Zap,
  ShieldCheck,
} from "lucide-react";

export default function TenantGuidePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F9F9F7] pb-10 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-100 sticky top-0 z-20 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <HelpCircle size={20} className="text-indigo-600" />
          Hướng dẫn sử dụng
        </h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-4">
          <GuideCard
            icon={<FileText size={24} />}
            title="Thanh toán hóa đơn"
            desc="Hướng dẫn xem chi tiết và quét mã VietQR để thanh toán hóa đơn hàng tháng một cách nhanh chóng. Lưu ý giữ nguyên nội dung chuyển khoản để hệ thống tự động gạch nợ."
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <GuideCard
            icon={<Zap size={24} />}
            title="Chốt điện nước"
            desc="Cung cấp hướng dẫn cách xem chỉ số điện nước hàng tháng cho phòng của bạn một cách rõ ràng và minh bạch từng số cũ/mới."
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <GuideCard
            icon={<ShieldCheck size={24} />}
            title="Nội quy tòa nhà"
            desc="Những quy định cần thiết trong quá trình sinh hoạt tại tòa nhà để đảm bảo an ninh, trật tự và không gian sống văn minh chung."
            color="text-amber-600"
            bg="bg-amber-50"
          />
        </div>

        <div className="mt-8 text-center bg-white p-6 rounded-2xl border border-slate-100 border-dashed">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <HelpCircle size={24} className="text-indigo-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">
            Bạn cần thêm thông tin?
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-4 leading-relaxed px-4">
            Đội ngũ Ban Quản Lý luôn sẵn sàng giải đáp thắc mắc và hỗ trợ bạn
            trong suốt quá trình lưu trú.
          </p>
          <button
            onClick={() => router.push("/tenant/contacts")}
            className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-indigo-600 active:scale-95 transition-all text-sm"
          >
            Liên hệ BQL ngay
          </button>
        </div>
      </div>
    </div>
  );
}

function GuideCard({ icon, title, desc, color, bg }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group">
      <div className="flex gap-4 items-start">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-indigo-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}
