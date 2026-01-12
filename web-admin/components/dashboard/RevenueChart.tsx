"use client";

import { MoreHorizontal, TrendingUp, DollarSign } from "lucide-react";

interface RevenueChartProps {
  data: { label: string; value: number; collected?: number; debt?: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  // Determine if we have any data to show
  const hasData = data.some((d) => d.value > 0);
  const maxValue = hasData ? Math.max(...data.map((d) => d.value)) : 1000000; // Default scale if empty

  const formatShortCurrency = (val: number) => {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="claude-card p-6 h-full flex flex-col relative overflow-hidden group hover:border-[#D97757]/30 transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 z-10">
        <div>
          <h3 className="text-xl claude-header mb-2 flex items-center gap-2">
            Biến động doanh thu
            {!hasData && (
              <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-sans uppercase tracking-wider">
                No Data
              </span>
            )}
          </h3>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>{" "}
              Thực thu
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9CA3AF]"></span>{" "}
              Còn nợ
            </span>
          </div>
        </div>
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Empty State */}
      {!hasData && (
        <div className="absolute inset-0 top-20 flex flex-col items-center justify-center text-gray-300 z-0">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <TrendingUp size={32} className="opacity-20 text-gray-400" />
          </div>
          <p className="text-sm font-medium">Chưa có dữ liệu doanh thu</p>
        </div>
      )}

      {/* Chart Area */}
      <div
        className={`flex-1 flex gap-2 min-h-[220px] items-end pt-4 pb-2 relative ${
          !hasData ? "opacity-30 blur-[1px]" : ""
        }`}
      >
        {/* Grid Lines (Absolute) */}
        <div className="absolute inset-x-0 bottom-[34px] top-4 flex flex-col justify-between pointer-events-none">
          {[1, 0.75, 0.5, 0.25, 0].map((tick, i) => (
            <div
              key={i}
              className="w-full h-[1px] bg-gray-50 border-t border-dashed border-gray-100 relative"
            >
              {/* Y-Axis Label */}
              <span className="absolute -left-8 -top-2 text-[10px] sm:text-xs text-gray-400 font-mono w-6 text-right">
                {i === 4 ? "0" : formatShortCurrency(maxValue * tick)}
              </span>
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div className="flex-1 h-full flex items-end justify-between gap-2 sm:gap-4 pl-8 pb-4 relative z-10 ml-2">
          {data.map((item, idx) => {
            // Safety for zero values
            const safeValue = Math.max(item.value, 0);
            const heightPct = maxValue > 0 ? (safeValue / maxValue) * 100 : 0;

            const debt = item.debt || 0;
            const collected = item.collected || item.value - debt; // Fallback if collected missing

            const debtHeightPct = safeValue > 0 ? (debt / safeValue) * 100 : 0;
            const collectedHeightPct =
              safeValue > 0 ? (collected / safeValue) * 100 : 0;

            const isCurrent = idx === data.length - 1;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col justify-end group/bar relative cursor-pointer h-full"
              >
                {/* Hover Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900/95 backdrop-blur-sm text-white text-xs p-3 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all duration-200 whitespace-nowrap z-20 shadow-xl border border-white/10 translate-y-2 group-hover/bar:translate-y-0 pointer-events-none">
                  <p className="font-bold border-b border-white/10 pb-1 mb-1.5 flex justify-between gap-4">
                    <span>{item.label}</span>
                    <span>{formatCurrency(item.value)}</span>
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between gap-3 text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Thực thu:
                      </span>
                      <span className="font-mono">
                        {formatCurrency(collected)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        Còn nợ:
                      </span>
                      <span className="font-mono">{formatCurrency(debt)}</span>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45 border-r border-b border-white/10"></div>
                </div>

                {/* Bar Stack */}
                <div
                  className="w-full max-w-[40px] mx-auto rounded-t-lg transition-all duration-500 flex flex-col justify-end overflow-hidden relative shadow-sm group-hover/bar:shadow-md group-hover/bar:-translate-y-1"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                >
                  {/* Debt Segment */}
                  {debt > 0 && (
                    <div
                      className="w-full bg-[#9CA3AF] transition-colors relative"
                      style={{ height: `${debtHeightPct}%` }}
                    >
                      <div className="absolute inset-0 bg-white/0 group-hover/bar:bg-white/10 transition-colors"></div>
                    </div>
                  )}

                  {/* Collected Segment */}
                  {collected > 0 && (
                    <div
                      className={`w-full transition-colors relative ${
                        isCurrent ? "bg-[#D97757]" : "bg-[#059669]"
                      }`}
                      style={{ height: `${collectedHeightPct}%` }}
                    >
                      <div className="absolute inset-0 bg-white/0 group-hover/bar:bg-white/10 transition-colors"></div>
                    </div>
                  )}
                </div>

                {/* X-Axis Label */}
                <div
                  className={`mt-3 text-center text-[10px] sm:text-xs font-semibold font-mono uppercase tracking-wide transition-colors ${
                    isCurrent
                      ? "text-[#D97757]"
                      : "text-gray-400 group-hover/bar:text-gray-600"
                  }`}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
