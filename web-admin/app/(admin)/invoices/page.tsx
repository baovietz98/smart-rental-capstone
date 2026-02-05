"use client";
import { useState, useEffect } from "react";
import { Table, Select, message, DatePicker, Empty } from "antd";
import {
  Eye,
  Plus,
  Filter,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react";
import { invoicesApi } from "@/lib/api/invoices";
import { Invoice, InvoiceStatus } from "@/types/invoice";
import InvoiceDetailModal from "@/components/invoices/InvoiceDetailModal";
import dayjs from "dayjs";
import CreateInvoiceModal from "@/components/invoices/CreateInvoiceModal";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: dayjs().format("MM-YYYY"),
    status: undefined as InvoiceStatus | undefined,
  });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoicesApi.getAll(filters);
      setInvoices(data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Handle format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const columns = [
    {
      title: "MÃ HÓA ĐƠN",
      dataIndex: "id",
      key: "id",
      width: 120,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (text: number) => (
        <span className="font-mono font-bold text-gray-500">#{text}</span>
      ),
    },
    {
      title: "PHÒNG / TÒA NHÀ",
      key: "room",
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (_: unknown, record: Invoice) => (
        <div>
          <div className="font-bold text-gray-900 text-base">
            {record.contract?.room.name}
          </div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">
            {record.contract?.room.building.name}
          </div>
        </div>
      ),
    },
    {
      title: "KỲ THU",
      dataIndex: "month",
      key: "month",
      width: 150,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (_: unknown, record: Invoice) => (
        <div className="font-mono font-medium text-gray-600">
          {record.month}
        </div>
      ),
    },
    {
      title: "TỔNG TIỀN",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right" as const,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (val: number) => (
        <span className="font-mono font-bold text-lg text-gray-900">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: "CÒN NỢ",
      dataIndex: "debtAmount",
      key: "debtAmount",
      align: "right" as const,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (val: number) => (
        <span
          className={`font-mono font-bold ${
            val > 0 ? "text-[#C5221F]" : "text-gray-400"
          }`}
        >
          {val > 0 ? formatCurrency(val) : "-"}
        </span>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (status: InvoiceStatus) => {
        let colorClass = "";
        let icon = null;

        switch (status) {
          case InvoiceStatus.PAID:
            colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
            icon = <CheckCircle size={14} />;
            break;
          case InvoiceStatus.PARTIAL:
            colorClass = "bg-blue-50 text-blue-700 border-blue-100";
            icon = <Clock size={14} />;
            break;
          case InvoiceStatus.OVERDUE:
            colorClass = "bg-red-50 text-red-700 border-red-100";
            icon = <AlertCircle size={14} />;
            break;
          default: // PUBLISHED / PENDING
            colorClass = "bg-yellow-50 text-yellow-700 border-yellow-100";
            icon = <AlertCircle size={14} />;
        }

        return (
          <div
            className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-md border ${colorClass} font-semibold text-xs uppercase w-fit mx-auto`}
          >
            {icon}
            {status === InvoiceStatus.PAID ? "Đã Thanh Toán" : status}
          </div>
        );
      },
    },
    {
      title: "THAO TÁC",
      key: "action",
      align: "center" as const,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3",
      render: (_: unknown, record: Invoice) => (
        <button
          onClick={() => {
            setSelectedInvoice(record);
            setIsDetailOpen(true);
          }}
          className="group flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-all text-gray-500"
          title="Xem chi tiết"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl claude-header mb-2">
            Quản lý Hóa đơn
          </h1>
          <p className="text-gray-500 font-sans text-sm md:text-base lg:text-lg">
            Theo dõi, tạo mới và quản lý thanh toán hàng tháng.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <button className="claude-btn-secondary flex items-center justify-center gap-2 text-sm md:text-base w-full sm:w-auto">
            <Download size={16} className="md:w-[18px] md:h-[18px]" />
            <span>Xuất báo cáo</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="claude-btn-primary flex items-center justify-center gap-2 group w-full sm:w-auto"
          >
            <Plus
              size={18}
              className="md:w-[20px] md:h-[20px] group-hover:rotate-90 transition-transform"
            />
            <span>Tạo hóa đơn</span>
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 md:mb-8 flex flex-wrap items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2 text-gray-500 md:mr-2 md:px-2">
          <Filter size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="font-bold text-xs md:text-sm uppercase tracking-wide">
            Bộ lọc
          </span>
        </div>

        <DatePicker
          picker="month"
          format="MM-YYYY"
          allowClear={false}
          value={dayjs(filters.month, "MM-YYYY")}
          onChange={(date) =>
            setFilters((prev) => ({
              ...prev,
              month: date ? date.format("MM-YYYY") : dayjs().format("MM-YYYY"),
            }))
          }
          className="h-9 md:h-10 w-32 md:w-40 border-gray-200 hover:border-[#D97757] focus:border-[#D97757] rounded-xl font-medium text-sm"
        />

        <Select
          placeholder="Tất cả trạng thái"
          allowClear
          value={filters.status}
          className="w-40 md:w-48 h-9 md:h-10 text-sm md:text-base"
          onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
          options={Object.values(InvoiceStatus).map((status) => ({
            label: status === InvoiceStatus.PAID ? "Đã Thanh Toán" : status,
            value: status,
          }))}
        />
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="id"
          loading={{
            indicator: (
              <Loader2 size={24} className="animate-spin text-[#D97757]" />
            ),
            spinning: loading,
          }}
          pagination={{ pageSize: 10 }}
          rowClassName="hover:bg-gray-50 transition-colors"
          className="claude-table"
          locale={{
            emptyText: (
              <Empty
                description={
                  <span className="text-gray-500">Chưa có hóa đơn nào</span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-[#D97757]" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <Empty
              description={
                <span className="text-gray-500">Chưa có hóa đơn nào</span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          invoices.map((invoice) => {
            let statusColor = "";
            let statusIcon = null;
            let statusText = "";

            switch (invoice.status) {
              case InvoiceStatus.PAID:
                statusColor =
                  "bg-emerald-50 text-emerald-700 border-emerald-200";
                statusIcon = <CheckCircle size={14} />;
                statusText = "Đã Thanh Toán";
                break;
              case InvoiceStatus.PARTIAL:
                statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                statusIcon = <Clock size={14} />;
                statusText = "Partial";
                break;
              case InvoiceStatus.OVERDUE:
                statusColor = "bg-red-50 text-red-700 border-red-200";
                statusIcon = <AlertCircle size={14} />;
                statusText = "Overdue";
                break;
              default:
                statusColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
                statusIcon = <AlertCircle size={14} />;
                statusText = invoice.status;
            }

            return (
              <div
                key={invoice.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 active:bg-gray-50 transition-colors"
                onClick={() => {
                  setSelectedInvoice(invoice);
                  setIsDetailOpen(true);
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-mono font-bold text-gray-500 text-sm">
                      #{invoice.id}
                    </div>
                    <div className="font-bold text-lg text-gray-900 mt-0.5">
                      {invoice.contract?.room.name}
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {invoice.contract?.room.building.name}
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${statusColor} font-semibold text-[11px] uppercase`}
                  >
                    {statusIcon}
                    {statusText}
                  </div>
                </div>

                {/* Amount Info */}
                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Kỳ thu:</span>
                    <span className="font-mono font-medium text-sm">
                      {invoice.month}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">
                      Tổng tiền:
                    </span>
                    <span className="font-mono font-bold text-lg text-gray-900">
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                  {invoice.debtAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Còn nợ:</span>
                      <span className="font-mono font-bold text-[#C5221F]">
                        {formatCurrency(invoice.debtAmount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action hint */}
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-center gap-2 text-gray-500 text-sm">
                  <Eye size={14} />
                  <span>Nhấn để xem chi tiết</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <InvoiceDetailModal
        isOpen={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        invoice={selectedInvoice}
        onUpdate={() => {
          fetchInvoices();
          if (selectedInvoice) {
            invoicesApi.getOne(selectedInvoice.id).then(setSelectedInvoice);
          }
        }}
      />

      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchInvoices();
        }}
      />
    </div>
  );
}
