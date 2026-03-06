"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react";

export default function TenantContactsPage() {
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
          <Phone size={20} className="text-indigo-600" />
          Danh bạ BQL
        </h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-indigo-500 rounded-full"></span>
            Hotline Hỗ Trợ
          </h2>
          <div className="space-y-3">
            <ContactItem
              icon={<Phone size={18} />}
              title="Tổng đài CSKH"
              value="1900 1234"
              color="text-indigo-600"
              bg="bg-indigo-50"
              linkPrefix="tel:"
            />
            <ContactItem
              icon={<Phone size={18} />}
              title="Kỹ thuật (24/7)"
              value="0909 888 999"
              color="text-orange-600"
              bg="bg-orange-50"
              linkPrefix="tel:"
            />
            <ContactItem
              icon={<Mail size={18} />}
              title="Email CSKH"
              value="support@camelstay.com"
              color="text-teal-600"
              bg="bg-teal-50"
              linkPrefix="mailto:"
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mt-4">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-slate-300 rounded-full"></span>
            Văn Phòng Ban Quản Lý
          </h2>
          <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
              <MapPin size={22} className="text-slate-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-base">
                Tòa nhà CamelStay
              </p>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Tầng 1, Số 123 Đường Nguyễn Văn Linh, Phường Tân Phú, Quận 7,
                TP.HCM
              </p>
              <div className="mt-3 inline-block bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                ⏰ Giờ làm việc: 08:00 - 17:30 (T2 - T7)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactItem({ icon, title, value, color, bg, linkPrefix }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 hover:border-indigo-50 transition-all group">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${bg} ${color}`}
        >
          {icon}
        </div>
        <span className="font-medium text-slate-700">{title}</span>
      </div>
      <a
        href={`${linkPrefix}${value.replace(/\s/g, "")}`}
        className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors"
      >
        {value}
      </a>
    </div>
  );
}
