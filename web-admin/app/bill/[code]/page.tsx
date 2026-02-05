"use client";

import { useEffect, useState } from "react";
import { publicAxiosClient } from "@/lib/axios-client";
import { useParams } from "next/navigation";
import {
  Home,
  Zap,
  Droplets,
  Wifi,
  Trash2,
  Car,
  AlertCircle,
} from "lucide-react";

interface InvoiceLineItem {
  type: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  note?: string;
}

interface Invoice {
  id: number;
  month: string;
  totalAmount: number;
  status: string;
  contract: {
    room: {
      name: string;
      building: {
        name: string;
        address: string;
      };
    };
    tenant: {
      fullName: string;
      phone: string;
    };
  };
  lineItems: InvoiceLineItem[];
  createdAt: string;
}

export default function PublicBillPage() {
  const { code } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (code) {
      publicAxiosClient
        .get(`/invoices/public/${code}`)
        .then((res) => {
          console.log("Invoice data:", res.data);
          console.log("LineItems:", res.data.lineItems);
          console.log("LineItems type:", typeof res.data.lineItems);
          console.log("LineItems is array:", Array.isArray(res.data.lineItems));
          setInvoice(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("Không tìm thấy hóa đơn hoặc đường dẫn không hợp lệ.");
          setLoading(false);
        });
    }
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center">
        <div className="text-2xl font-bold animate-pulse">
          Đang tải hóa đơn...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center p-4">
        <div className="gumroad-card bg-red-100 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold mb-2">Lỗi</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-400";
      case "PARTIAL":
        return "bg-yellow-400";
      case "OVERDUE":
        return "bg-red-400";
      case "CANCELLED":
        return "bg-gray-400";
      default:
        return "bg-white";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PAID":
        return "ĐÃ THANH TOÁN";
      case "PARTIAL":
        return "THANH TOÁN 1 PHẦN";
      case "OVERDUE":
        return "QUÁ HẠN";
      case "CANCELLED":
        return "ĐÃ HỦY";
      case "PUBLISHED":
        return "CHƯA THANH TOÁN";
      case "DRAFT":
        return "NHÁP";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] p-3 md:p-8 flex justify-center">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-4 md:mb-6 text-center">
          <h1 className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-tight md:tracking-tighter">
            Hóa Đơn Tiền Nhà
          </h1>
          <div className="inline-block bg-black text-white px-3 md:px-4 py-1 text-sm md:text-base font-bold transform -rotate-2">
            Tháng {invoice.month}
          </div>
        </div>

        {/* Main Card */}
        <div className="gumroad-card bg-white mb-4 md:mb-6">
          {/* Status Badge */}
          <div
            className={`absolute -top-3 -right-3 border-2 border-black px-2 md:px-3 py-1 font-bold text-xs md:text-sm transform rotate-3 ${getStatusColor(invoice.status)}`}
          >
            {getStatusText(invoice.status)}
          </div>

          {/* Room Info */}
          <div className="border-b-2 border-black pb-3 md:pb-4 mb-3 md:mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="font-bold text-base md:text-lg">
                {invoice.contract.room.name}
              </span>
            </div>
            <div className="text-xs md:text-sm text-gray-600 pl-6 md:pl-7 break-words">
              {invoice.contract.room.building.name} -{" "}
              {invoice.contract.room.building.address}
            </div>
          </div>

          {/* Tenant Info */}
          <div className="border-b-2 border-black pb-3 md:pb-4 mb-3 md:mb-4">
            <div className="flex justify-between items-center gap-2">
              <span className="font-bold text-sm md:text-base">
                Khách thuê:
              </span>
              <span className="text-sm md:text-base truncate">
                {invoice.contract.tenant.fullName}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs md:text-sm text-gray-600 mt-1">
              <span>SĐT:</span>
              <span className="font-mono">{invoice.contract.tenant.phone}</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2 md:space-y-3">
            {invoice.lineItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-start gap-2 text-xs md:text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold flex items-center gap-1.5 md:gap-2">
                    {item.type === "ROOM" && (
                      <Home className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    )}
                    {item.type === "SERVICE" &&
                      item.name.toLowerCase().includes("điện") && (
                        <Zap className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      )}
                    {item.type === "SERVICE" &&
                      item.name.toLowerCase().includes("nước") && (
                        <Droplets className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      )}
                    {item.type === "SERVICE" &&
                      item.name.toLowerCase().includes("wifi") && (
                        <Wifi className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      )}
                    {item.type === "SERVICE" &&
                      item.name.toLowerCase().includes("rác") && (
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      )}
                    {item.type === "SERVICE" &&
                      item.name.toLowerCase().includes("xe") && (
                        <Car className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      )}
                    <span className="break-words">{item.name}</span>
                  </div>
                  {item.note && (
                    <div className="text-[10px] md:text-xs text-gray-500 pl-4 md:pl-6 break-words">
                      {item.note}
                    </div>
                  )}
                  <div className="pl-4 md:pl-6 text-[10px] md:text-xs text-gray-500">
                    {item.quantity} {item.unit} x{" "}
                    {formatCurrency(item.unitPrice)}
                  </div>
                </div>
                <div className="font-bold text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t-2 border-black mt-3 md:mt-4 pt-3 md:pt-4">
            <div className="flex justify-between items-center text-lg md:text-xl font-black">
              <span>TỔNG CỘNG</span>
              <span className="whitespace-nowrap">
                {formatCurrency(invoice.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer / Contact */}
        <div className="text-center text-xs md:text-sm text-gray-500 px-4">
          <p>Cảm ơn bạn đã sử dụng dịch vụ!</p>
          <p className="mt-1">Mọi thắc mắc vui lòng liên hệ chủ nhà.</p>
        </div>
      </div>
    </div>
  );
}
