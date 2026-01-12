"use client";

import { Wallet } from "lucide-react";

interface CashFlowCardProps {
  collected: number;
  debt: number;
  total: number;
  growthRate: number;
}

export default function CashFlowCard({
  collected,
  debt,
  total,
  growthRate,
}: CashFlowCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const progress = total > 0 ? (collected / total) * 100 : 0;
  const isPositiveGrowth = growthRate >= 0;

  return (
    <div className="claude-card p-6 hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-[#E6F4EA] rounded-xl group-hover:bg-[#34A853] group-hover:text-white transition-colors duration-300">
          <Wallet size={24} className="text-[#137333] group-hover:text-white" />
        </div>
        <div className="flex flex-col items-end">
          <span className="claude-badge claude-badge-green flex items-center gap-1 mb-1">
            {progress.toFixed(0)}% Thu
          </span>
          {/* Growth Rate */}
          <span
            className={`text-xs font-bold flex items-center gap-1 ${
              isPositiveGrowth ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {isPositiveGrowth ? "▲" : "▼"} {Math.abs(growthRate).toFixed(1)}%
            <span className="font-normal text-gray-400">vs tháng trước</span>
          </span>
        </div>
      </div>

      <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">
        Dòng tiền tháng này
      </p>

      {/* Main Number: Total Expected */}
      <h3 className="text-3xl claude-header mb-4">
        {formatCurrency(total).replace("₫", "")}{" "}
        <span className="text-sm font-normal text-gray-500">vnđ</span>
      </h3>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className="bg-[#34A853] h-2 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Details - Enhanced Visibility */}
      <div className="grid grid-cols-2 gap-4 text-sm mt-auto">
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Thực thu</p>
          <p className="font-bold text-lg text-[#137333] flex items-center">
            {formatCurrency(collected)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs mb-0.5">Công nợ</p>
          <p className="font-bold text-lg text-[#D93025] flex items-center justify-end">
            {formatCurrency(debt)}
          </p>
        </div>
      </div>
    </div>
  );
}
