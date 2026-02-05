"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  Zap,
  AlertCircle,
  CheckCircle2,
  QrCode,
  FileText,
  Megaphone,
  ChevronRight,
  ShieldCheck,
  Clock,
  Wrench,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosClient from "@/lib/axios-client";
import { formatCurrency } from "../../lib/utils";
import dayjs from "dayjs";
import { Spin } from "antd";
import { notificationsApi, Notification } from "@/lib/api/notifications";

interface Activity {
  id: string | number;
  type: "INVOICE" | "ISSUE";
  title: string;
  subtitle: string;
  date: string; // ISO string
  status: string;
  amount?: number;
  link: string;
}

export default function TenantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Profile & Issues & Notification in parallel
      const [profileRes, issuesRes, notifRes] = await Promise.all([
        axiosClient.get("/auth/profile"),
        axiosClient.get("/issues"),
        notificationsApi.getAll().catch(() => ({ data: [] })),
      ]);

      const updatedUser = profileRes.data;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser)); // Update cache

      // Check if we have any notifications
      if (Array.isArray(notifRes.data) && notifRes.data.length > 0) {
        setNotification(notifRes.data[0]); // Take the newest one
      } else if (!Array.isArray(notifRes.data) && notifRes.data) {
        // Fallback if it somehow returns single object
        setNotification(notifRes.data as any);
      }

      const issues = issuesRes.data || [];
      const tenant = updatedUser.tenant;

      let invoices: any[] = [];
      let activeBill = null;

      // 2. Fetch Invoices if contract exists
      if (tenant && tenant.contracts && tenant.contracts.length > 0) {
        // use the most recent/active contract
        const activeContract =
          tenant.contracts.find((c: any) => c.isActive) || tenant.contracts[0];

        try {
          const contractRes = await axiosClient.get(
            `/contracts/${activeContract.id}`,
          );
          invoices = contractRes.data.invoices || [];

          // Find latest UNPAID bill for the Card
          const sortedInvoices = [...invoices].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          activeBill = sortedInvoices.find(
            (inv: any) => inv.status !== "PAID" && inv.status !== "CANCELLED",
          );
        } catch (e) {
          console.error("Error fetching contract details", e);
        }
      }

      setBill(activeBill);

      // 3. Merge & Process Activities
      const rawActivities: Activity[] = [];

      // Process Invoices
      invoices.forEach((inv: any) => {
        let date = dayjs(inv.createdAt);
        if (inv.month && typeof inv.month === "string") {
          if (inv.month.includes("-")) {
            const [m, y] = inv.month.split("-");
            date = dayjs(`${y}-${m}-01`);
          }
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

      // Process Issues
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

      // Sort by Date Desc
      rawActivities.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      // Take top 3 for cleaner dashboard
      setActivities(rawActivities.slice(0, 3));
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, type: string) => {
    if (type === "INVOICE") {
      if (status === "PAID")
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      if (status === "PARTIAL")
        return "bg-blue-100 text-blue-700 border-blue-200";
      if (status === "OVERDUE") return "bg-red-100 text-red-700 border-red-200";
      return "bg-amber-100 text-amber-700 border-amber-200";
    }
    // Issue
    if (status === "OPEN") return "bg-blue-100 text-blue-700 border-blue-200";
    if (status === "IN_PROGRESS")
      return "bg-purple-100 text-purple-700 border-purple-200";
    if (status === "RESOLVED" || status === "CLOSED")
      return "bg-gray-100 text-gray-700 border-gray-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getStatusLabel = (status: string, type: string) => {
    if (type === "INVOICE") {
      if (status === "PAID") return "ĐÃ TT";
      if (status === "PARTIAL") return "TT 1 PHẦN";
      if (status === "OVERDUE") return "QUÁ HẠN";
      return "CHỜ TT";
    }
    if (status === "OPEN") return "MỚI";
    if (status === "IN_PROGRESS") return "ĐANG XỬ LÝ";
    if (status === "RESOLVED") return "ĐÃ XONG";
    return status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-5 pb-24 space-y-6 font-sans text-slate-800">
      {/* 1. Header with Avatar */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xl shadow-sm">
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : user?.name ? (
              user.name.charAt(0).toUpperCase()
            ) : (
              "T"
            )}
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">
              Xin chào,
            </p>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {user?.name || "Cư dân"}
            </h1>
          </div>
        </div>
        <div
          onClick={() => router.push("/tenant/bulletin")}
          className="bg-white p-2.5 rounded-full border border-slate-100 shadow-sm relative active:scale-95 transition-all cursor-pointer hover:shadow-md group"
        >
          <Bell
            size={20}
            className="text-slate-600 group-hover:text-indigo-600 transition-colors"
          />
          {/* Show red dot if there is a notification */}
          {notification && !notification.isRead && (
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          )}
          {/* Fallback: show dot if any notification exists for now */}
          {notification && (
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          )}
        </div>
      </div>

      {/* 2. Notification Banner */}
      {notification ? (
        <div
          onClick={() => router.push("/tenant/bulletin")}
          className="bg-amber-50 border border-amber-100 rounded-2xl p-4 shadow-sm flex items-start gap-4 relativer cursor-pointer active:scale-[0.99] transition-transform hover:shadow-md"
        >
          <div className="bg-amber-100 rounded-full p-2 shrink-0 text-amber-600">
            <Megaphone size={16} />
          </div>
          <div className="flex-1">
            <p className="text-amber-700 text-xs font-bold uppercase mb-1">
              {notification.title}
            </p>
            <p className="text-slate-700 text-sm font-medium leading-relaxed line-clamp-2">
              {notification.content}
            </p>
          </div>
        </div>
      ) : (
        // Fallback or Empty state if no notification
        <div className="hidden"></div>
      )}

      {/* 3. Bill Status or No Contract State */}
      {!user?.tenant?.contracts || user.tenant.contracts.length === 0 ? (
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
              <ShieldCheck size={32} className="text-indigo-300" />
            </div>
            <h2 className="text-2xl font-bold mb-2 tracking-tight">
              Chưa có phòng
            </h2>
            <p className="text-slate-300 text-sm font-medium mb-6 max-w-[250px] mx-auto leading-relaxed">
              Bạn chưa được thêm vào phòng nào. Vui lòng liên hệ quản lý để kích
              hoạt tài khoản.
            </p>

            <button
              onClick={() => router.push("/tenant/requests/issues")} // Redirect to request/support
              className="bg-white text-slate-900 hover:bg-indigo-50 py-3 px-6 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Megaphone size={16} />
              Liên hệ quản lý
            </button>
          </div>
        </div>
      ) : bill ? (
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-slate-300 text-sm mb-1 font-medium flex items-center gap-2">
                  <FileText size={14} className="text-indigo-400" />
                  Hóa đơn T{dayjs(bill.createdAt).format("MM/YYYY")}
                </p>
                <h2 className="text-4xl font-bold mb-3 tracking-tight">
                  {formatCurrency(bill.totalAmount)}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs text-amber-200 font-medium">
                  <AlertCircle size={12} />
                  {bill.status === "OVERDUE"
                    ? "Đã quá hạn"
                    : bill.status === "PARTIAL"
                      ? `Còn nợ ${formatCurrency(bill.totalAmount - bill.paidAmount)}`
                      : "Chưa thanh toán"}
                </div>
              </div>
            </div>

            <div className="mt-2">
              <button
                onClick={() => router.push("/tenant/billing")}
                className="w-full bg-white text-slate-900 hover:bg-slate-50 py-3.5 px-4 rounded-xl text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <QrCode size={18} />
                {bill.status === "PARTIAL"
                  ? "Thanh toán phần còn lại"
                  : "Thanh toán qua VietQR"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Tuyệt vời!</h2>
            <p className="text-emerald-100 font-medium">
              Bạn đã thanh toán hết các hóa đơn.
            </p>
          </div>
        </div>
      )}

      {/* 4. Utility Grid */}
      <div>
        <h3 className="font-bold text-slate-900 mb-4 text-lg">Tiện ích</h3>
        <div className="grid grid-cols-2 gap-4">
          <MenuCard
            icon={<Zap size={22} className="text-blue-600" />}
            bg="bg-blue-50"
            title="Chốt điện nước"
            desc="Gửi ảnh xác nhận"
            onClick={() => router.push("/tenant/services/readings")}
          />
          <MenuCard
            icon={<AlertCircle size={22} className="text-orange-600" />}
            bg="bg-orange-50"
            title="Báo sự cố"
            desc="Sửa chữa, bảo trì"
            onClick={() => router.push("/tenant/requests/issues")}
          />
          <MenuCard
            icon={<FileText size={22} className="text-purple-600" />}
            bg="bg-purple-50"
            title="Hợp đồng"
            desc="Thông tin thuê"
            onClick={() => router.push("/tenant/contracts")}
          />
          <MenuCard
            icon={<Megaphone size={22} className="text-pink-600" />}
            bg="bg-pink-50"
            title="Bảng tin"
            desc="Thông báo BQL"
            onClick={() => router.push("/tenant/bulletin")}
          />
        </div>
      </div>

      {/* 5. Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-slate-900 text-lg">Gần đây</h3>
          {activities.length > 0 && (
            <Link
              href="/tenant/activity"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5"
            >
              Xem tất cả <ChevronRight size={16} />
            </Link>
          )}
        </div>

        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <Clock size={32} className="mb-2 opacity-50" />
              <p className="text-sm font-medium">Chưa có hoạt động nào</p>
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
    </div>
  );
}

function MenuCard({ icon, bg, title, desc, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] cursor-pointer hover:border-indigo-100 hover:shadow-md transition-all group"
    >
      <div
        className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}
      >
        {icon}
      </div>
      <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
        {title}
      </p>
      <p className="text-xs text-slate-400 mt-1 font-medium">{desc}</p>
    </div>
  );
}
