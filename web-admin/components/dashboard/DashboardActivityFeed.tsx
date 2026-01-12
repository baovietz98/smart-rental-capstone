"use client";

import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import { Banknote, Wrench, FileText, CheckCircle2 } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "PAYMENT" | "ISSUE" | "CONTRACT" | "OTHER";
  title: string;
  date: string;
  roomName: string;
  amount?: number;
  status?: string;
}

interface DashboardActivityFeedProps {
  activities: ActivityItem[];
  onViewAll: () => void;
}

export default function DashboardActivityFeed({
  activities,
  onViewAll,
}: DashboardActivityFeedProps) {
  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.date);
    let key = format(date, "dd/MM/yyyy", { locale: vi });
    if (isToday(date)) key = "Hôm nay";
    else if (isYesterday(date)) key = "Hôm qua";

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "PAYMENT":
        return <Banknote size={16} className="text-white" />;
      case "ISSUE":
        return <Wrench size={16} className="text-white" />;
      case "CONTRACT":
        return <FileText size={16} className="text-white" />;
      default:
        return <CheckCircle2 size={16} className="text-white" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "PAYMENT":
        return "bg-emerald-500 shadow-emerald-200";
      case "ISSUE":
        return "bg-red-500 shadow-red-200";
      case "CONTRACT":
        return "bg-blue-500 shadow-blue-200";
      default:
        return "bg-gray-400 shadow-gray-200";
    }
  };

  return (
    <div className="claude-card p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl claude-header">Nhật ký hoạt động</h3>
        <button
          onClick={onViewAll}
          className="text-[#D97757] text-sm font-semibold hover:underline"
        >
          Xem tất cả
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[200px] max-h-[320px]">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
              <CheckCircle2 size={24} className="text-emerald-500" />
            </div>
            <p className="text-gray-900 font-medium text-sm">
              Chưa có hoạt động mới
            </p>
            <p className="text-[10px] text-gray-400">
              Hệ thống đang theo dõi...
            </p>
          </div>
        ) : (
          <div className="space-y-5 pb-2">
            {Object.entries(groupedActivities).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 py-1.5 mb-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {dateLabel}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((act) => (
                    <div
                      key={act.id}
                      className="flex gap-3 items-start group relative pl-2"
                    >
                      {/* Vertical Line Connector */}
                      <div className="absolute left-[1.125rem] top-8 bottom-[-12px] w-px bg-gray-100 group-last:hidden"></div>

                      <div
                        className={`w-7 h-7 mt-0.5 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 z-10 ring-2 ring-white ${
                          getActivityColor(act.type).split(" ")[0]
                        }`}
                      >
                        {getActivityIcon(act.type)}
                      </div>

                      <div className="flex-1 min-w-0 bg-gray-50/50 p-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className="text-xs font-bold text-[#2D2D2C] leading-snug truncate pr-2">
                            {act.roomName}
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
                            {format(new Date(act.date), "HH:mm")}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 group-hover:text-[#D97757] transition-colors">
                          {act.title
                            .replace(act.roomName, "")
                            .replace("Phòng", "")
                            .trim() || act.title}
                        </p>

                        {act.amount && (
                          <div className="mt-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                              +
                              {new Intl.NumberFormat("vi-VN").format(
                                act.amount
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
