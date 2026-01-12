"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Filter,
} from "lucide-react";
import {
  message,
  Modal,
  Form,
  Input,
  Select,
  Dropdown,
  Popconfirm,
} from "antd";
import axiosClient from "@/lib/axios-client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

enum IssueStatus {
  OPEN = "OPEN",
  PROCESSING = "PROCESSING",
  DONE = "DONE",
}

interface Issue {
  id: number;
  title: string;
  description: string;
  status: IssueStatus;
  roomId: number;
  createdAt: string;
  room?: {
    name: string;
    building?: {
      name: string;
    };
  };
}

interface Room {
  id: number;
  name: string;
  building?: {
    name: string;
  };
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchIssues();
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterStatus !== "ALL") params.status = filterStatus;

      const res = await axiosClient.get("/issues", { params });
      setIssues(res.data);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      message.error("Không thể tải danh sách sự cố");
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await axiosClient.get("/rooms");
      setRooms(res.data);
    } catch (error) {
      console.error("Failed to fetch rooms", error);
    }
  };

  const handleCreateIssue = async (values: Partial<Issue>) => {
    try {
      setSubmitting(true);
      await axiosClient.post("/issues", values);
      message.success("Đã báo cáo sự cố thành công!");
      setIsModalOpen(false);
      form.resetFields();
      fetchIssues();
    } catch (error) {
      console.error("Create issue error", error);
      message.error("Lỗi khi tạo sự cố");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: IssueStatus) => {
    try {
      await axiosClient.patch(`/issues/${id}`, { status });
      message.success("Đã cập nhật trạng thái!");
      fetchIssues();
    } catch (error) {
      console.error(error);
      message.error("Lỗi cập nhật trạng thái");
    }
  };

  const handleDeleteIssue = async (id: number) => {
    try {
      await axiosClient.delete(`/issues/${id}`);
      message.success("Đã xóa sự cố!");
      fetchIssues();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi xóa sự cố");
    }
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.OPEN:
        return (
          <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide border border-red-100">
            <AlertCircle size={14} className="fill-red-700 text-white" /> Mới
          </span>
        );
      case IssueStatus.PROCESSING:
        return (
          <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide border border-orange-100">
            <Loader2 size={14} className="animate-spin" /> Đang xử lý
          </span>
        );
      case IssueStatus.DONE:
        return (
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide border border-green-100">
            <CheckCircle2 size={14} className="fill-green-700 text-white" /> Đã
            xong
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const filteredIssues = issues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.room?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="claude-page p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl claude-header mb-2">
              Quản lý sự cố
            </h1>
            <p className="text-gray-500 font-sans text-lg">
              Theo dõi và xử lý các vấn đề phát sinh.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="claude-btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Báo cáo sự cố</span>
          </button>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex items-center gap-2 text-gray-400 mr-2 px-2 hidden md:flex">
              <Filter size={18} />
            </div>
            {[
              { key: "ALL", label: "Tất cả" },
              { key: "OPEN", label: "Mới" },
              { key: "PROCESSING", label: "Đang xử lý" },
              { key: "DONE", label: "Đã xong" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setFilterStatus(s.key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  filterStatus === s.key
                    ? "bg-[#D97757] text-white shadow-md shadow-orange-200"
                    : "text-gray-500 hover:text-black hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm sự cố..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 h-10 w-full rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all font-medium"
            />
          </div>
        </div>

        {/* ISSUE LIST */}
        <div className="grid gap-4">
          {loading ? (
            <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-[#D97757]" size={40} />
              <span className="font-medium">Đang tải dữ liệu...</span>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Không có sự cố nào
              </h3>
              <p className="text-gray-500">Hệ thống đang hoạt động ổn định.</p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex flex-col md:flex-row gap-6 justify-between items-start"
              >
                <div className="flex-1 w-full">
                  <div className="flex items-start justify-between md:justify-start gap-4 mb-3">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#D97757] transition-colors leading-tight">
                      {issue.title}
                    </h3>
                    <div className="shrink-0">
                      {getStatusBadge(issue.status)}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 text-gray-600 text-sm leading-relaxed max-w-3xl">
                    {issue.description || "Không có mô tả chi tiết."}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md">
                      <MapPin size={14} className="text-[#D97757]" />
                      <span>
                        {issue.room?.building?.name || "N/A"} •{" "}
                        {issue.room?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md">
                      <Clock size={14} />
                      <span>{dayjs(issue.createdAt).fromNow()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 mt-2 md:mt-0">
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "OPEN",
                          label: "Đánh dấu: Mới",
                          icon: (
                            <AlertCircle size={16} className="text-red-500" />
                          ),
                          onClick: () =>
                            handleUpdateStatus(issue.id, IssueStatus.OPEN),
                        },
                        {
                          key: "PROCESSING",
                          label: "Đánh dấu: Đang xử lý",
                          icon: (
                            <Loader2 size={16} className="text-orange-500" />
                          ),
                          onClick: () =>
                            handleUpdateStatus(
                              issue.id,
                              IssueStatus.PROCESSING
                            ),
                        },
                        {
                          key: "DONE",
                          label: "Đánh dấu: Đã xong",
                          icon: (
                            <CheckCircle2
                              size={16}
                              className="text-green-500"
                            />
                          ),
                          onClick: () =>
                            handleUpdateStatus(issue.id, IssueStatus.DONE),
                        },
                      ],
                    }}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <button className="px-3 py-2 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-[#D97757] hover:text-white rounded-lg transition-colors border border-gray-200 hover:border-[#D97757]">
                      Trạng thái
                    </button>
                  </Dropdown>

                  <Popconfirm
                    title="Xóa sự cố này?"
                    description="Hành động này không thể hoàn tác."
                    onConfirm={() => handleDeleteIssue(issue.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true, type: "primary" }}
                  >
                    <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </Popconfirm>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE ISSUE MODAL */}
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={600}
        centered
        className="claude-modal"
        closeIcon={
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
            <span className="text-lg">✕</span>
          </div>
        }
      >
        <div className="p-0">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Báo cáo sự cố mới
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Ghi nhận vấn đề từ khách thuê để xử lý kịp thời.
            </p>
          </div>

          <div className="p-6">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCreateIssue}
              className="claude-form"
            >
              <Form.Item
                label="Tiêu đề sự cố"
                name="title"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
              >
                <Input
                  placeholder="Ví dụ: Bóng đèn hỏng, vòi nước rò rỉ..."
                  className="h-12 rounded-xl text-base"
                />
              </Form.Item>

              <Form.Item
                label="Phòng xảy ra sự cố"
                name="roomId"
                rules={[{ required: true, message: "Vui lòng chọn phòng" }]}
              >
                <Select
                  placeholder="-- Chọn phòng --"
                  className="h-12 text-base"
                  showSearch
                  optionFilterProp="label"
                  options={rooms.map((r) => ({
                    label: `${r.name} - ${r.building?.name}`,
                    value: r.id,
                  }))}
                />
              </Form.Item>

              <Form.Item label="Mô tả chi tiết" name="description">
                <Input.TextArea
                  rows={4}
                  placeholder="Mô tả chi tiết vấn đề..."
                  className="rounded-xl p-4 text-base"
                />
              </Form.Item>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl font-bold bg-black text-white hover:bg-[#D97757] transition-colors shadow-lg shadow-gray-200"
                >
                  {submitting ? "Đang gửi..." : "Gửi báo cáo"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </Modal>
    </div>
  );
}
