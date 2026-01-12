"use client";

import { AlertCircle } from "lucide-react";

interface IssueStatsCardProps {
  issueStats: {
    total: number;
    urgent: number;
    normal: number;
  };
}

export default function IssueStatsCard({ issueStats }: IssueStatsCardProps) {
  const hasUrgent = issueStats.urgent > 0;

  return (
    <div className="claude-card p-6 h-full hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-xl transition-colors duration-300 ${
            hasUrgent
              ? "bg-red-100 text-[#DC2626] group-hover:bg-[#DC2626] group-hover:text-white"
              : "bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white"
          }`}
        >
          <AlertCircle size={24} />
        </div>
        <span
          className={`claude-badge ${
            hasUrgent ? "claude-badge-red animate-pulse" : "claude-badge-orange"
          }`}
        >
          {hasUrgent ? "Cần xử lý gấp" : "Cần xử lý"}
        </span>
      </div>
      <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">
        Sự cố / Báo hỏng
      </p>

      {/* Total Number */}
      <h3 className="text-3xl claude-header mb-1">
        {issueStats.total}{" "}
        <span className="text-lg font-normal text-gray-400">tin</span>
      </h3>

      {/* Breakdown */}
      <div className="flex items-center gap-3 text-sm mt-3">
        <span className="flex items-center gap-1.5 font-bold text-[#DC2626]">
          <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
          {issueStats.urgent} Khẩn cấp
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1.5 font-medium text-gray-500">
          <span className="w-2 h-2 rounded-full bg-gray-300"></span>
          {issueStats.normal} Bình thường
        </span>
      </div>

      <p className="text-[10px] text-gray-400 mt-2 italic flex items-center gap-1">
        *Tự động phân loại theo tiêu đề
      </p>

      {issueStats.total === 0 && (
        <p className="text-xs text-[#137333] mt-2 font-medium">
          Hệ thống vận hành ổn định
        </p>
      )}
    </div>
  );
}
