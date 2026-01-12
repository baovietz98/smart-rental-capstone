"use client";

import { FileText, ArrowRight } from "lucide-react";

interface Invoice {
  id: number;
  roomName: string;
  amount: number;
  paidAmount: number;
  month: string;
  tenantName?: string;
}

interface UnpaidInvoicesListProps {
  invoices: Invoice[];
  onViewAll: () => void;
}

export default function UnpaidInvoicesList({
  invoices,
  onViewAll,
}: UnpaidInvoicesListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const sortedInvoices = [...invoices].slice(0, 5); // Take top 5

  return (
    <div className="claude-card p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl claude-header">Hóa đơn chưa thu</h3>
        <button
          onClick={onViewAll}
          className="text-[#D97757] text-sm font-semibold hover:underline flex items-center gap-1"
        >
          Xem tất cả <ArrowRight size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {sortedInvoices.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 italic text-sm min-h-[150px]">
            <div className="bg-green-50 p-4 rounded-full mb-3">
              <FileText size={24} className="text-green-600" />
            </div>
            Tuyệt vời! Đã thu hết tiền nhà.
          </div>
        ) : (
          sortedInvoices.map((inv) => {
            const debt = inv.amount - inv.paidAmount;
            return (
              <div
                key={inv.id}
                className="flex justify-between items-center p-3 bg-[#F9F9F7] rounded-lg border border-transparent hover:border-[#E5E5E0] transition-all"
              >
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#E5E5E0] flex items-center justify-center font-bold text-gray-600 text-xs shrink-0">
                    {inv.roomName}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2D2D2C]">
                      {inv.tenantName || "Khách thuê"}
                    </p>
                    <p className="text-xs text-gray-400">Tháng {inv.month}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#D93025] font-bold text-sm">
                    {formatCurrency(debt)}
                  </p>
                  <button className="text-[10px] font-semibold text-[#0284C7] hover:underline bg-blue-50 px-2 py-1 rounded mt-1">
                    Nhắc nợ
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
