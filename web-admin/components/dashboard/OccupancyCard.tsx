"use client";

import { Home, User } from "lucide-react";

interface OccupancyCardProps {
  total: number;
  rented: number;
  available: number;
  maintenance: number;
}

export default function OccupancyCard({
  total,
  rented,
  available,
  maintenance,
}: OccupancyCardProps) {
  // Calculate percentages for the donut chart
  const rentedPct = total > 0 ? (rented / total) * 100 : 0;
  const availablePct = total > 0 ? (available / total) * 100 : 0;
  const maintenancePct = total > 0 ? (maintenance / total) * 100 : 0;

  // CSS Conic Gradient for Pie/Donut Chart
  const gradient = `conic-gradient(
    #D97757 0% ${rentedPct}%, 
    #34A853 ${rentedPct}% ${rentedPct + availablePct}%, 
    #FBBC04 ${rentedPct + availablePct}% 100%
  )`;

  return (
    <div className="claude-card p-6 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-[#E0F2FE] rounded-xl text-[#0284C7]">
          <Home size={24} />
        </div>
        <span className="claude-badge bg-blue-50 text-blue-700">
          {rented}/{total} Phòng
        </span>
      </div>

      <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-4">
        Tỷ lệ lấp đầy
      </p>

      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-20 h-20 shrink-0">
          <div
            className="w-full h-full rounded-full"
            style={{ background: gradient }}
          ></div>
          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-[#2D2D2C]">
              {rentedPct.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#D97757]"></div>
              <span className="text-gray-600">Đang ở</span>
            </div>
            <span className="font-semibold">{rented}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#34A853]"></div>
              <span className="text-gray-600">Phòng trống</span>
            </div>
            <span className="font-semibold">{available}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FBBC04]"></div>
              <span className="text-gray-600">Bảo trì</span>
            </div>
            <span className="font-semibold">{maintenance}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
