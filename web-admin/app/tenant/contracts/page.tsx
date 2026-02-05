"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spin } from "antd";
import {
  FileText,
  Calendar,
  Home,
  CheckCircle,
  AlertCircle,
  MapPin,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import axiosClient from "@/lib/axios-client";
import { formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import Link from "next/link";
import TenantEmptyState from "@/components/tenant/TenantEmptyState";

interface Contract {
  id: number;
  startDate: string;
  endDate: string | null;
  price: number;
  deposit: number;
  paymentDay: number;
  isActive: boolean;
  numTenants: number;
  roomId: number;
  tenantId: number;
  room: {
    id: number;
    name: string;
    building: {
      id: number;
      name: string;
      address: string;
    };
  };
  invoices: any[]; // Assuming basic invoice structure
}

export default function TenantContractsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContract();
  }, []);

  const fetchContract = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get Profile to find Tenant ID and Active Contract ID
      const profileRes = await axiosClient.get("/auth/profile");
      const tenant = profileRes.data.tenant;

      if (!tenant) {
        setError("Không tìm thấy thông tin khách thuê.");
        setLoading(false);
        return;
      }

      // Find active contract from profile, or fallback to the most recent one (history)
      const contracts = tenant.contracts || [];
      const activeContract = contracts.find((c: any) => c.isActive);
      // Prioritize active, otherwise take the first one (most recent due to backend sort)
      const contractId = activeContract ? activeContract.id : contracts[0]?.id;

      if (!contractId) {
        setContract(null); // No contracts at all
        setLoading(false);
        return;
      }

      // 2. Fetch Detailed Contract Info
      const contractRes = await axiosClient.get(`/contracts/${contractId}`);
      setContract(contractRes.data);
    } catch (err: any) {
      console.error("Error fetching contract:", err);
      // Show specific error message from backend if available
      const msg =
        err.response?.data?.message || "Không thể tải thông tin hợp đồng.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-[#F9F9F7]">
        <div className="bg-white/80 backdrop-blur-md px-5 py-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center active:scale-95 transition-all text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Hợp đồng thuê
          </h1>
        </div>
        <TenantEmptyState
          icon={FileText}
          title="Chưa có hợp đồng"
          description="Bạn chưa có hợp đồng thuê nào đang hoạt động. Vui lòng liên hệ quản lý để biết thêm chi tiết."
          actionLabel="Quay lại Trang chủ"
          actionLink="/tenant"
        />
      </div>
    );
  }

  const isExpiringSoon =
    contract.endDate &&
    dayjs(contract.endDate).diff(dayjs(), "day") <= 30 &&
    contract.isActive;

  return (
    <div className="min-h-screen bg-[#F9F9F7] pb-24 font-sans text-slate-900">
      {/* 1. Header Navigation */}
      <div className="bg-white/80 backdrop-blur-md px-5 py-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center active:scale-95 transition-all text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Hợp đồng thuê
          </h1>
        </div>

        {contract.isActive ? (
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 flex items-center gap-1.5 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Hiệu lực
          </span>
        ) : (
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full border border-slate-200">
            Đã kết thúc
          </span>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* 2. Main Contract Card (Banner) */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-500"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

          <div className="relative z-10">
            {/* Room Info */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Home size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {contract.room.building.name}
                </span>
              </div>
              <h3 className="text-4xl font-bold mb-3 tracking-tight text-white">
                Phòng {contract.room.name}
              </h3>
              <div className="flex items-start gap-2 text-indigo-100 text-sm bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                <span className="leading-snug">
                  {contract.room.building.address}
                </span>
              </div>
            </div>

            {/* Expiring Warning */}
            {isExpiringSoon && (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 text-amber-200 mb-2 font-medium animate-pulse">
                <AlertCircle size={18} />
                <span className="text-sm">
                  Hợp đồng sắp hết hạn (dưới 30 ngày)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              Giá thuê
            </div>
            <div className="text-lg font-bold text-slate-900">
              {formatCurrency(contract.price)}
              <span className="text-xs font-normal text-slate-400 ml-1">
                /tháng
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Thu ngày {contract.paymentDay}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              Tiền cọc
            </div>
            <div className="text-lg font-bold text-slate-900">
              {formatCurrency(contract.deposit)}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle size={10} /> Đã thanh toán
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm col-span-2 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                Thời hạn hợp đồng
              </div>
              <div className="text-base font-semibold text-slate-900 flex items-center gap-2">
                {dayjs(contract.startDate).format("DD/MM/YYYY")}
                <span className="text-slate-300">→</span>
                {contract.endDate
                  ? dayjs(contract.endDate).format("DD/MM/YYYY")
                  : "Vô thời hạn"}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Calendar size={20} />
            </div>
          </div>
        </div>

        {/* 4. Recent Invoices */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-bold text-lg text-slate-900">
              Hóa đơn gần đây
            </h3>
            <Link
              href="/tenant/billing"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-all flex items-center gap-0.5"
            >
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-3">
            {contract.invoices && contract.invoices.length > 0 ? (
              contract.invoices
                .slice(0, 3)
                .map((invoice: any, index: number) => {
                  const isPaid = invoice.status === "PAID";
                  const isOverdue = invoice.status === "OVERDUE";

                  // Parse date logic safely handling MM-YYYY format
                  let date = dayjs(invoice.createdAt);
                  if (invoice.month && typeof invoice.month === "string") {
                    if (invoice.month.includes("-")) {
                      const [m, y] = invoice.month.split("-");
                      date = dayjs(`${y}-${m}-01`);
                    } else {
                      date = dayjs(invoice.month);
                    }
                  }

                  return (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all cursor-default"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${isPaid ? "bg-emerald-50 text-emerald-600" : isOverdue ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"}`}
                        >
                          <FileText size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm mb-0.5">
                            Tháng{" "}
                            {date.isValid() ? date.format("MM/YYYY") : "N/A"}
                          </div>
                          <div className="text-base font-bold text-slate-900">
                            {formatCurrency(invoice.totalAmount)}
                          </div>
                        </div>
                      </div>

                      {isPaid ? (
                        <div className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm whitespace-nowrap">
                          ĐÃ THANH TOÁN
                        </div>
                      ) : isOverdue ? (
                        <div className="text-[10px] font-extrabold text-red-700 bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 shadow-sm whitespace-nowrap">
                          QUÁ HẠN
                        </div>
                      ) : (
                        <div className="text-[10px] font-extrabold text-orange-700 bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-200 shadow-sm whitespace-nowrap">
                          CHỜ THANH TOÁN
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 bg-white rounded-2xl border border-slate-100 border-dashed">
                <p className="text-slate-400 text-sm">Chưa có hóa đơn nào</p>
              </div>
            )}
          </div>
        </div>

        {/* 5. Support Section */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Cần hỗ trợ?</h4>
            <p className="text-xs text-slate-500 max-w-[200px]">
              Liên hệ Ban quản lý nếu có thắc mắc về hợp đồng hoặc sự cố.
            </p>
          </div>
          <Link href="/tenant/requests/issues">
            <Button
              size="middle"
              className="bg-white border-slate-200 text-slate-700 shadow-sm font-bold h-10 rounded-xl hover:text-indigo-600 hover:border-indigo-200 hover:shadow active:scale-95 transition-all"
            >
              Liên hệ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
