"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, FileText, Wrench } from "lucide-react";
import { Spin, Empty } from "antd";
import axiosClient from "@/lib/axios-client";
import { formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";

interface Activity {
  id: string | number;
  type: "INVOICE" | "ISSUE";
  title: string;
  subtitle: string;
  date: string;
  status: string;
  amount?: number;
  link: string;
}

export default function TenantActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [profileRes, issuesRes] = await Promise.all([
        axiosClient.get("/auth/profile"),
        axiosClient.get("/issues"),
      ]);

      const tenant = profileRes.data.tenant;
      const issues = issuesRes.data || [];

      let invoices: any[] = [];

      if (tenant && tenant.contracts) {
        // Fetch invoices from all contracts? Or just active?
        // For history, maybe all. But simpler to just get from current active logic for now.
        // Or loop through all contracts.
        const activeContract = tenant.contracts.find((c: any) => c.isActive);
        if (activeContract) {
          try {
            const contractRes = await axiosClient.get(
              `/contracts/${activeContract.id}`,
            );
            invoices = contractRes.data.invoices || [];
          } catch (e) {
            console.error(e);
          }
        }
      }

      const rawActivities: Activity[] = [];

      invoices.forEach((inv: any) => {
        let date = dayjs(inv.createdAt);
        if (inv.month && inv.month.includes("-")) {
          const [m, y] = inv.month.split("-");
          date = dayjs(`${y}-${m}-01`);
        }

        rawActivities.push({
          id: `inv-${inv.id}`,
          type: "INVOICE",
          title: `Hóa đơn T${date.format("MM/YYYY")}`,
          subtitle:
            inv.status === "PAID"
              ? `Đã thanh toán: ${formatCurrency(inv.totalAmount)}`
              : `Cần thanh toán: ${formatCurrency(inv.totalAmount)}`,
          date: inv.createdAt,
          status: inv.status,
          amount: inv.totalAmount,
          link: "/tenant/billing",
        });
      });

      issues.forEach((iss: any) => {
        rawActivities.push({
          id: `iss-${iss.id}`,
          type: "ISSUE",
          title: iss.title,
          subtitle: dayjs(iss.createdAt).format("DD/MM/YYYY"),
          date: iss.createdAt,
          status: iss.status,
          link: `/tenant/requests/issues`,
        });
      });

      rawActivities.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setActivities(rawActivities);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, type: string) => {
    if (type === "INVOICE") {
      if (status === "PAID")
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      if (status === "OVERDUE") return "bg-red-100 text-red-700 border-red-200";
      return "bg-amber-100 text-amber-700 border-amber-200";
    }
    if (status === "OPEN") return "bg-blue-100 text-blue-700 border-blue-200";
    if (status === "IN_PROGRESS")
      return "bg-teal-100 text-teal-700 border-teal-200";
    if (status === "RESOLVED" || status === "CLOSED")
      return "bg-gray-100 text-gray-700 border-gray-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getStatusLabel = (status: string, type: string) => {
    if (type === "INVOICE") {
      if (status === "PAID") return "ĐÃ TT";
      if (status === "OVERDUE") return "QUÁ HẠN";
      return "CHỜ TT";
    }
    if (status === "OPEN") return "MỚI";
    if (status === "IN_PROGRESS") return "ĐANG XỬ LÝ";
    if (status === "RESOLVED") return "ĐÃ XONG";
    return status;
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F9F9F7] pb-10 font-sans text-slate-900">
      <div className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-100 sticky top-0 z-20 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-all"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Clock size={20} className="text-indigo-600" />
          Lịch sử Hoạt động
        </h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {activities.length === 0 ? (
          <div className="mt-20">
            <Empty description="Chưa có hoạt động nào" />
          </div>
        ) : (
          activities.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(item.link)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:border-indigo-100 hover:shadow-md cursor-pointer group"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${item.type === "INVOICE" ? "bg-indigo-50 text-indigo-600" : "bg-orange-50 text-orange-600"}`}
              >
                {item.type === "INVOICE" ? (
                  <FileText size={20} />
                ) : (
                  <Wrench size={20} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-slate-900 font-bold text-sm mb-0.5">
                  {item.title}
                </p>
                <p className="text-slate-500 text-xs font-medium">
                  {item.subtitle}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {dayjs(item.date).format("HH:mm DD/MM/YYYY")}
                </p>
              </div>
              <div
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getStatusColor(item.status, item.type)}`}
              >
                {getStatusLabel(item.status, item.type)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
