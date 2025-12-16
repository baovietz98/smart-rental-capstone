"use client";
import { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Select,
  message,
  DatePicker,
  Popconfirm,
  Empty,
  Spin,
} from "antd";
import {
  Eye,
  Plus,
  Filter,
  Loader2,
  Download,
  Receipt,
  ArrowUpRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
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
          {dayjs(record.startDate).format("MM/YYYY")}
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
    <div className="min-h-screen bg-[var(--bg-page)] text-gray-900 font-sans p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Quản lý Hóa đơn
            </h1>
            <p className="text-gray-500 mt-1">
              Theo dõi, tạo mới và quản lý thanh toán hàng tháng.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="claude-btn-secondary flex items-center gap-2 text-sm">
              <Download size={16} />
              <span>Xuất báo cáo</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="claude-btn-primary flex items-center gap-2 group bg-black text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              <Plus
                size={20}
                className="group-hover:rotate-90 transition-transform"
              />
              <span>Tạo hóa đơn</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 mr-2">
            <Filter size={16} />
            <span className="text-sm font-medium uppercase tracking-wide">
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
                month: date
                  ? date.format("MM-YYYY")
                  : dayjs().format("MM-YYYY"),
              }))
            }
            className="w-40 border-gray-200 hover:border-gray-300 focus:border-black rounded-md"
          />

          <Select
            placeholder="Tất cả trạng thái"
            allowClear
            value={filters.status}
            className="w-48"
            variant="borderless"
            style={{ border: "1px solid #e5e7eb", borderRadius: "6px" }}
            onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
          >
            {Object.values(InvoiceStatus).map((status) => (
              <Select.Option key={status} value={status}>
                {status}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Data Table Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <Table
            columns={columns}
            dataSource={invoices}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            rowClassName="hover:bg-gray-50 transition-colors"
            locale={{
              emptyText: (
                <Empty
                  description="Không có hóa đơn nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
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
    </div>
  );
}
