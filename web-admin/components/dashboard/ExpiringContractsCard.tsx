"use client";

import { Clock, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

interface Contract {
  id: number;
  roomName: string;
  tenantName: string;
  endDate: string;
}

interface ExpiringContractsCardProps {
  contracts: Contract[];
}

export default function ExpiringContractsCard({
  contracts,
}: ExpiringContractsCardProps) {
  // Top 3 expiring soonest
  const expiringSoon = contracts
    .filter((c) => c.endDate)
    .sort(
      (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
    )
    .slice(0, 3);

  if (expiringSoon.length === 0) {
    return (
      <div className="claude-card p-6 min-h-[160px] flex flex-col justify-center items-center text-center h-full">
        <div className="p-3 bg-[#F0FDF4] rounded-full mb-3">
          <Clock size={24} className="text-[#15803d]" />
        </div>
        <p className="text-gray-500 font-medium">
          Không có hợp đồng nào sắp hết hạn
        </p>
        <p className="text-xs text-gray-400 mt-1">Trong 30 ngày tới</p>
      </div>
    );
  }

  return (
    <div className="claude-card p-6 relative overflow-hidden h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-[#FEF2F2] rounded-xl">
          <AlertTriangle size={24} className="text-[#DC2626]" />
        </div>
        <span className="claude-badge claude-badge-red">
          {contracts.length} Sắp hết hạn
        </span>
      </div>
      <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-3">
        Cần gia hạn (30 ngày)
      </p>

      <div className="space-y-3">
        {expiringSoon.map((contract) => {
          const daysLeft = differenceInDays(
            new Date(contract.endDate),
            new Date()
          );
          return (
            <div
              key={contract.id}
              className="flex justify-between items-center text-sm border-b border-dashed border-gray-100 last:border-0 pb-2 last:pb-0"
            >
              <div>
                <p className="font-semibold text-[#2D2D2C]">
                  {contract.roomName} - {contract.tenantName}
                </p>
                <p className="text-xs text-gray-400">
                  Hết hạn: {format(new Date(contract.endDate), "dd/MM/yyyy")}
                </p>
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${
                  daysLeft < 7
                    ? "bg-red-100 text-red-600"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                Còn {daysLeft} ngày
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
