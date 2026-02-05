"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  ArrowUpRight,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  message,
  Modal,
  Form,
  Input,
  DatePicker,
  Button,
  InputNumber,
} from "antd";
import axiosClient from "@/lib/axios-client";
import dayjs from "dayjs";

interface Transaction {
  id: number;
  code: string;
  amount: number;
  type: "DEPOSIT" | "INVOICE_PAYMENT" | "EXPENSE" | "OTHER";
  date: string;
  note: string;
  contract?: {
    room?: {
      name: string;
    };
    tenant?: {
      name: string;
    };
  };
}

interface Stats {
  income: number;
  expense: number;
  net: number;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ income: 0, expense: 0, net: 0 });
  const [loading, setLoading] = useState(true);

  // State for expense modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, statsRes] = await Promise.all([
        axiosClient.get("/transactions", { params: { take: 20 } }), // Get latest 20
        axiosClient.get("/transactions/stats"),
      ]);

      setTransactions(txRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch finance data:", error);
      message.error("Không thể tải dữ liệu tài chính");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (values: any) => {
    try {
      setSubmitLoading(true);
      await axiosClient.post("/transactions", {
        amount: Number(values.amount),
        type: "EXPENSE",
        date: values.date.toISOString(),
        note: values.note,
        contractId: null, // General expense
      });
      message.success("Đã tạo phiếu chi thành công");
      setIsExpenseModalOpen(false);
      form.resetFields();
      fetchData(); // Reload data
    } catch (error) {
      console.error("Create expense error:", error);
      message.error("Có lỗi xảy ra khi tạo phiếu chi");
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  return (
    <div className="claude-page p-6 md:p-12 transition-all">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl claude-header mb-3">
              Tổng quan tài chính
            </h1>
            <p className="text-gray-500 font-sans text-lg">
              Theo dõi doanh thu, chi phí và lợi nhuận ròng.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="claude-btn-primary flex items-center gap-2 bg-[#C5221F] hover:bg-[#A31D1A] text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>Tạo phiếu chi</span>
            </button>
            <button className="claude-btn-secondary flex items-center gap-2">
              <Calendar size={18} />
              <span>Tháng này</span>
            </button>
            <button className="claude-btn-secondary flex items-center gap-2">
              <Download size={18} />
              <span className="hidden md:inline">Xuất báo cáo</span>
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Income Card */}
          <div className="claude-card p-8 flex flex-col justify-between h-48 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={80} color="#137333" />
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1 uppercase tracking-wide text-sm">
                Tổng thu nhập
              </p>
              <h2 className="text-3xl font-bold claude-header text-[#137333]">
                {formatCurrency(stats.income)}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#137333] font-medium bg-[#E6F4EA] w-fit px-3 py-1 rounded-full">
              <ArrowUpRight size={16} />
              <span>+12.5% so với tháng trước</span>
            </div>
          </div>

          {/* Expense Card */}
          <div className="claude-card p-8 flex flex-col justify-between h-48 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingDown size={80} color="#C5221F" />
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1 uppercase tracking-wide text-sm">
                Tổng chi phí
              </p>
              <h2 className="text-3xl font-bold claude-header text-[#C5221F]">
                {formatCurrency(stats.expense)}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#C5221F] font-medium bg-[#FCE8E6] w-fit px-3 py-1 rounded-full">
              <ArrowUpRight size={16} />
              <span>+2.1% tăng</span>
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="claude-card p-8 flex flex-col justify-between h-48 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={80} color="#B06000" />
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1 uppercase tracking-wide text-sm">
                Lợi nhuận ròng
              </p>
              <h2 className="text-3xl font-bold claude-header text-[#2D2D2C]">
                {formatCurrency(stats.net)}
              </h2>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-[#D97757] h-full rounded-full"
                style={{ width: "70%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl claude-header">Giao dịch gần đây</h2>
            <button className="text-[#D97757] font-medium hover:text-[#C06040] transition-colors">
              Xem tất cả
            </button>
          </div>

          <div className="bg-white/50 border border-[#E5E5E0] rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E0] bg-[#F4F4F0]/50 text-gray-500 text-sm font-medium">
                  <th className="p-4 pl-6 font-normal">Giao dịch</th>
                  <th className="p-4 font-normal">Ngày</th>
                  <th className="p-4 font-normal">Số tiền</th>
                  <th className="p-4 font-normal">Loại</th>
                  <th className="p-4 pr-6 font-normal">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E0]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      Chưa có giao dịch nào.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-white/80 transition-colors group"
                    >
                      <td className="p-4 pl-6">
                        <div className="font-semibold text-[#2D2D2C]">
                          {tx.note || tx.code}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          {tx.code}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">
                        {dayjs(tx.date).format("DD/MM/YYYY")}
                      </td>
                      <td
                        className={`p-4 font-medium font-mono ${
                          tx.type === "EXPENSE" || tx.type === "OTHER"
                            ? "text-[#C5221F]"
                            : "text-[#137333]"
                        }`}
                      >
                        {tx.type === "EXPENSE" || tx.type === "OTHER"
                          ? "-"
                          : "+"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {tx.type === "INVOICE_PAYMENT"
                            ? "Thanh toán hóa đơn"
                            : tx.type === "DEPOSIT"
                              ? "Tiền cọc"
                              : tx.type === "EXPENSE"
                                ? "Chi phí"
                                : "Khác"}
                        </span>
                      </td>
                      <td className="p-4 pr-6">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#137333]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#137333]"></div>
                          Hoàn thành
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Expense Modal - Premium Redesign */}
      <Modal
        title={null}
        open={isExpenseModalOpen}
        onCancel={() => setIsExpenseModalOpen(false)}
        footer={null}
        width={600}
        closeIcon={
          <div className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <span className="text-gray-400 font-light text-xl">×</span>
          </div>
        }
        styles={{
          content: {
            borderRadius: 24,
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
          },
        }}
      >
        <div className="bg-[#FAF9F6] px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#D97757]">
              <TrendingDown size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#2D2D2C] font-serif m-0">
                Tạo phiếu chi mới
              </h3>
              <p className="text-gray-500 text-sm m-0">
                Ghi nhận các khoản chi phí vận hành
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateExpense}
            initialValues={{ date: dayjs() }}
            requiredMark={false}
          >
            <Form.Item
              name="amount"
              label={
                <span className="text-sm font-semibold text-gray-700">
                  Số tiền chi
                </span>
              }
              rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
              className="mb-6"
            >
              <InputNumber
                className="w-full text-lg font-medium rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-all hover:border-[#D97757] focus:border-[#D97757]"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫"
                }
                parser={(displayValue) =>
                  displayValue!.replace(/\s?₫|(\.*)/g, "")
                }
                placeholder="Nhập số tiền..."
                style={{ width: "100%", padding: "4px 12px" }}
                controls={false}
              />
            </Form.Item>

            <Form.Item
              name="date"
              label={
                <span className="text-sm font-semibold text-gray-700">
                  Ngày ghi nhận
                </span>
              }
              rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
              className="mb-6"
            >
              <DatePicker
                className="w-full h-12 rounded-xl border-gray-200 bg-gray-50 hover:border-[#D97757] focus:border-[#D97757]"
                format="DD/MM/YYYY"
              />
            </Form.Item>

            <Form.Item
              name="note"
              label={
                <span className="text-sm font-semibold text-gray-700">
                  Lý do chi
                </span>
              }
              rules={[{ required: true, message: "Vui lòng nhập lý do chi" }]}
              className="mb-8"
            >
              <Input.TextArea
                placeholder="Ví dụ: Sửa bóng đèn, Mua văn phòng phẩm..."
                rows={4}
                className="hover:border-[#D97757] focus:border-[#D97757] px-4 py-3 rounded-xl border-gray-200 bg-gray-50 transition-all resize-none"
              />
            </Form.Item>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="bg-white border-0 text-gray-500 font-medium hover:bg-gray-50 hover:text-gray-900 rounded-xl h-11 px-6 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="claude-btn-primary flex items-center gap-2 px-8 h-11 rounded-xl shadow-lg shadow-orange-100 hover:shadow-orange-200"
              >
                Tạo phiếu chi <ArrowRight size={18} />
              </button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
