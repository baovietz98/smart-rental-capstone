"use client";

import { CheckCircle2, Send, Zap } from "lucide-react";

interface CycleStatusCardProps {
  totalRooms: number;
  readingsCompleted: number;
  invoicesSent: number;
  onReadingsClick?: () => void;
  onInvoicesClick?: () => void;
}

export default function CycleStatusCard({
  totalRooms,
  readingsCompleted,
  invoicesSent,
  onReadingsClick,
  onInvoicesClick,
}: CycleStatusCardProps) {
  const readingsProgress =
    totalRooms > 0 ? (readingsCompleted / totalRooms) * 100 : 0;
  const invoicesProgress =
    totalRooms > 0 ? (invoicesSent / totalRooms) * 100 : 0;

  return (
    <div className="claude-card p-6">
      <h3 className="text-xl claude-header mb-6">Trạng thái tháng này</h3>

      <div className="space-y-6">
        {/* Meter Readings Progress */}
        <div
          onClick={onReadingsClick}
          className={`group ${onReadingsClick ? "cursor-pointer" : ""}`}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-[#2D2D2C] font-medium group-hover:text-[#D97757] transition-colors">
              <Zap size={18} className="text-[#FBBC04]" />
              <span>Chốt điện nước</span>
            </div>
            <span className="text-sm text-gray-500 font-semibold group-hover:text-[#D97757] transition-colors">
              {readingsCompleted}/{totalRooms}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-[#FBBC04] h-2 rounded-full transition-all duration-500"
              style={{ width: `${readingsProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {readingsCompleted === totalRooms
              ? "Đã hoàn tất"
              : `${totalRooms - readingsCompleted} phòng chưa chốt`}
          </p>
        </div>

        {/* Invoices Sent Progress */}
        <div
          onClick={onInvoicesClick}
          className={`group ${onInvoicesClick ? "cursor-pointer" : ""}`}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-[#2D2D2C] font-medium group-hover:text-[#D97757] transition-colors">
              <Send size={18} className="text-[#0284C7]" />
              <span>Gửi hóa đơn</span>
            </div>
            <span className="text-sm text-gray-500 font-semibold group-hover:text-[#D97757] transition-colors">
              {invoicesSent}/{totalRooms}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-[#0284C7] h-2 rounded-full transition-all duration-500"
              style={{ width: `${invoicesProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {invoicesSent === totalRooms
              ? "Đã gửi hết"
              : `${totalRooms - invoicesSent} hóa đơn chưa gửi`}
          </p>
        </div>
      </div>
    </div>
  );
}
