"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  Filter,
  Download,
  Calendar,
} from "lucide-react";
import { Spin, Modal, Button, Tag, Empty, Switch } from "antd";
import axiosClient from "@/lib/axios-client";
import { formatCurrency } from "../../../lib/utils";
import dayjs from "dayjs";

export default function TenantBillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contract, setContract] = useState<any>(null);
  const [filter, setFilter] = useState("ALL"); // ALL, UNPAID, PAID
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Polling for invoice status when modal is open and not PAID
  useEffect(() => {
    let interval: any;
    if (selectedInvoice && selectedInvoice.status !== "PAID") {
      interval = setInterval(async () => {
        try {
          // Fetch just this invoice to check status
          // Since we don't have a direct public endpoint for single invoice without auth easily usable here without passing headers (which axiosClient does), we can reuse fetchInvoices or a lighter endpoint if available.
          // For simplicity, we re-fetch the specific contract detail or invoice
          const res = await axiosClient.get(
            `/transactions/${selectedInvoice.id}`,
          ); // Wait, this is transaction endpoint. Need Invoice.
          // Let's use the invoices endpoint which is nested or just re-fetch all for now (safest)
          // Optimization: direct invoice check
          // Actually, let's just re-call fetchInvoices silently
          const profileRes = await axiosClient.get("/auth/profile");
          const tenant = profileRes.data.tenant;
          if (tenant && tenant.contracts) {
            const activeContract =
              tenant.contracts.find((c: any) => c.isActive) ||
              tenant.contracts[0];
            if (activeContract) {
              const contractRes = await axiosClient.get(
                `/contracts/${activeContract.id}`,
              );
              const updatedInvoices = contractRes.data.invoices || [];
              const updated = updatedInvoices.find(
                (i: any) => i.id === selectedInvoice.id,
              );

              if (updated && updated.status === "PAID") {
                setSelectedInvoice(updated); // Update logic to show success
                setInvoices(updatedInvoices);
                // Optional: Play sound or vibrate
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }, 3000); // Check every 3s
    }
    return () => clearInterval(interval);
  }, [selectedInvoice]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // 1. Get Profile -> Tenant -> Active Contract -> Invoices
      // ideally we should have an endpoint like /invoices or /tenant/invoices, but reusing logic
      const profileRes = await axiosClient.get("/auth/profile");
      const tenant = profileRes.data.tenant;

      if (tenant && tenant.contracts) {
        const activeContract =
          tenant.contracts.find((c: any) => c.isActive) || tenant.contracts[0];
        if (activeContract) {
          setContract(activeContract);
          // Fetch full contract details to get invoices if they aren't fully populated in profile
          // or if profile contains them, use them.
          // Usually profile returns minimal. Let's fetch active contract details.
          const contractRes = await axiosClient.get(
            `/contracts/${activeContract.id}`,
          );
          setInvoices(contractRes.data.invoices || []);
        }
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices
    .filter((inv) => {
      if (filter === "ALL") return true;
      if (filter === "UNPAID")
        return (
          inv.status === "PENDING" ||
          inv.status === "PUBLISHED" ||
          inv.status === "SENT" ||
          inv.status === "OVERDUE" ||
          inv.status === "PARTIAL"
        );
      if (filter === "PAID") return inv.status === "PAID";
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "PARTIAL":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "PENDING":
      case "PUBLISHED":
      case "SENT":
        return "bg-orange-50 text-orange-600 border-orange-100";
      case "OVERDUE":
        return "bg-red-50 text-red-600 border-red-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PAID":
        return "Đã thanh toán";
      case "PARTIAL":
        return "Thanh toán 1 phần";
      case "PENDING":
      case "PUBLISHED":
      case "SENT":
        return "Chờ thanh toán";
      case "OVERDUE":
        return "Quá hạn";
      default:
        return status;
    }
  };

  // Safe Date Parsing
  const getInvoiceDate = (inv: any) => {
    let date = dayjs(inv.createdAt);
    if (inv.month && typeof inv.month === "string") {
      if (inv.month.includes("-")) {
        const [m, y] = inv.month.split("-");
        date = dayjs(`${y}-${m}-01`);
      } else {
        date = dayjs(inv.month);
      }
    }
    return date;
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] pb-24 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md px-5 py-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm transition-all mb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Hóa đơn
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Quản lý thanh toán hàng tháng
        </p>
      </div>

      {/* Filters */}
      <div className="px-5 mb-4">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {["ALL", "UNPAID", "PAID"].map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${filter === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              {key === "ALL"
                ? "Tất cả"
                : key === "UNPAID"
                  ? "Chưa trả"
                  : "Đã trả"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
              <FileText size={32} />
            </div>
            <p className="text-slate-500 font-medium">Không có hóa đơn nào</p>
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const date = getInvoiceDate(inv);
            const isPaid = inv.status === "PAID";
            return (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all hover:shadow-md hover:border-indigo-100 cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPaid ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
                    >
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        Tháng {date.format("MM/YYYY")}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {dayjs(inv.createdAt).format("DD/MM/YYYY")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getStatusColor(inv.status)}`}
                  >
                    {getStatusLabel(inv.status)}
                  </span>
                </div>

                <div className="flex justify-between items-end border-t border-slate-50 pt-3 mt-2">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                      Tổng tiền
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(inv.totalAmount)}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selectedInvoice}
        onCancel={() => setSelectedInvoice(null)}
        footer={null}
        centered
        title={null}
        closeIcon={null}
        width={480}
        styles={{
          content: { borderRadius: 24, padding: 0, overflow: "hidden" },
          mask: {
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0,0,0,0.4)",
          },
        }}
      >
        {selectedInvoice && (
          <div className="bg-white flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div
              className={`p-6 border-b border-slate-100 flex flex-col items-center justify-center relative transition-colors duration-500 ${selectedInvoice.status === "PAID" ? "bg-emerald-50/50" : "bg-slate-50/50"}`}
            >
              <button
                onClick={() => setSelectedInvoice(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>

              {selectedInvoice.status === "PAID" ? (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-3 shadow-sm text-emerald-600">
                    <CheckCircle size={40} className="animate-bounce" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Thanh toán thành công!
                  </h2>
                  <p className="text-emerald-600 font-medium text-sm">
                    Hóa đơn đã được gạch nợ
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-sm ${
                      selectedInvoice.status === "PAID"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    <FileText size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Hóa đơn T{getInvoiceDate(selectedInvoice).format("MM/YYYY")}
                  </h2>
                  <div
                    className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                      selectedInvoice.status,
                    )}`}
                  >
                    {getStatusLabel(selectedInvoice.status)}
                  </div>
                </>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Payment Section (Real VietQR) */}
              {selectedInvoice.status !== "PAID" && (
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex flex-col gap-4">
                  {/* Demo Mode Toggle */}
                  <div className="flex items-center justify-between border-b border-indigo-200 pb-3 mb-1">
                    <span className="text-sm font-bold text-indigo-900">
                      Thanh toán QR
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-600">
                        Chế độ Demo (1.000đ)
                      </span>
                      <Switch
                        size="small"
                        checked={isDemoMode}
                        onChange={setIsDemoMode}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                    <div className="bg-white p-2 rounded-lg shadow-sm shrink-0">
                      {/* VietQR Dynamic */}
                      <img
                        src={`https://img.vietqr.io/image/MB-9300131000273-compact2.png?amount=${
                          isDemoMode ? 1000 : selectedInvoice.debtAmount
                        }&addInfo=${encodeURIComponent(
                          `HD${selectedInvoice.id} ${isDemoMode ? "DEMO" : ""}`,
                        )}&accountName=CAMELSTAY`}
                        alt="VietQR"
                        className="w-32 h-auto"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-indigo-600 font-bold uppercase mb-1">
                        Quét mã để thanh toán
                      </p>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        MB BANK
                      </p>
                      <p className="text-lg font-mono font-black text-slate-800 tracking-wider">
                        9300 131 000 273
                      </p>
                      <p className="text-xs text-slate-500">
                        Chủ TK: <b>CAMELSTAY OWNER</b>
                      </p>
                      <p className="text-[10px] text-indigo-400 mt-1 italic">
                        *Nội dung: <b>HD{selectedInvoice.id}</b> (Vui lòng giữ
                        nguyên)
                        {isDemoMode && (
                          <span className="block font-bold text-orange-500">
                            (ĐANG DÙNG CHẾ ĐỘ DEMO - 1.000đ)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Filter size={14} /> Chi tiết dịch vụ
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const items =
                      selectedInvoice.lineItems &&
                      selectedInvoice.lineItems.length > 0
                        ? selectedInvoice.lineItems
                        : [
                            {
                              name: "Tiền phòng",
                              amount: selectedInvoice.roomCharge,
                              quantity: 1,
                              unit: "tháng",
                              unitPrice: selectedInvoice.roomCharge,
                            },
                            ...(selectedInvoice.serviceCharge > 0
                              ? [
                                  {
                                    name: "Dịch vụ & Phí khác",
                                    amount: selectedInvoice.serviceCharge,
                                    quantity: 1,
                                    unit: "gói",
                                    unitPrice: selectedInvoice.serviceCharge,
                                    note: "Điện, nước, dịch vụ...",
                                  },
                                ]
                              : []),
                          ];

                    if (items.length === 0) {
                      return (
                        <div className="text-center text-slate-400 text-sm py-4">
                          Chi tiết không khả dụng
                        </div>
                      );
                    }

                    return items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {item.name}
                          </p>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {/* Quantity & Unit Price */}
                            {item.quantity > 0 && (
                              <span>
                                {item.quantity} {item.unit || "đv"} x{" "}
                                {formatCurrency(item.unitPrice)}
                              </span>
                            )}

                            {/* Note (Old/New Index) */}
                            {item.note && (
                              <div className="block mt-0.5 text-slate-400 italic">
                                {item.note}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tiền phòng</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(selectedInvoice.roomCharge)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Dịch vụ</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(selectedInvoice.serviceCharge)}
                  </span>
                </div>
                {selectedInvoice.previousDebt > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Nợ cũ</span>
                    <span className="font-medium">
                      {formatCurrency(selectedInvoice.previousDebt)}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center">
                  <span className="text-slate-900 font-bold text-lg">
                    Tổng cộng
                  </span>
                  <span className="text-indigo-600 font-bold text-xl">
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-slate-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
              <Button
                size="large"
                block
                className="h-12 rounded-xl font-bold bg-slate-900 text-white border-none shadow-lg hover:bg-slate-800 active:scale-[0.98]"
                onClick={() => setSelectedInvoice(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
