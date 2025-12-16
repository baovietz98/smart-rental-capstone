"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  Loader2,
  Construction,
  Trash2,
  Edit,
} from "lucide-react";
import { message, Modal, Form, Input, Select, Button, Dropdown } from "antd";
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

  useEffect(() => {
    fetchIssues();
    fetchRooms();
  }, [filterStatus]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params: any = {};
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

  const handleCreateIssue = async (values: any) => {
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
      message.error("Lỗi cập nhật trạng thái");
    }
  };

  const handleDeleteIssue = async (id: number) => {
    Modal.confirm({
      title: "Xóa sự cố?",
      content: "Bạn có chắc chắn muốn xóa báo cáo này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await axiosClient.delete(`/issues/${id}`);
          message.success("Đã xóa sự cố!");
          fetchIssues();
        } catch (error) {
          message.error("Lỗi khi xóa sự cố");
        }
      },
    });
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.OPEN:
        return (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 uppercase tracking-wider border border-red-200">
            <AlertCircle size={12} /> Mới
          </span>
        );
      case IssueStatus.PROCESSING:
        return (
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 uppercase tracking-wider border border-orange-200">
            <Loader2 size={12} className="animate-spin" /> Đang xử lý
          </span>
        );
      case IssueStatus.DONE:
        return (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 uppercase tracking-wider border border-green-200">
            <CheckCircle2 size={12} /> Đã xong
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

  return (
    <div className="claude-page p-6 md:p-12 transition-all min-h-screen bg-[var(--bg-page)] text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl claude-header mb-3">
              Quản lý sự cố
            </h1>
            <p className="text-gray-500 font-sans text-lg">
              Theo dõi và xử lý các vấn đề phát sinh từ khách thuê.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="claude-btn-primary flex items-center gap-2 group bg-black text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            <Plus
              size={20}
              className="group-hover:rotate-90 transition-transform"
            />
            <span>Báo cáo sự cố</span>
          </button>
        </header>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex bg-white rounded-lg p-1.5 border border-[#E5E5E0] shadow-sm">
            {[
              { key: "ALL", label: "Tất cả" },
              { key: "OPEN", label: "Mới" },
              { key: "PROCESSING", label: "Đang xử lý" },
              { key: "DONE", label: "Đã xong" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setFilterStatus(s.key)}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                  filterStatus === s.key
                    ? "bg-black text-white shadow-md"
                    : "text-gray-500 hover:text-black hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-auto">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm sự cố..."
              className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-black w-full md:w-64 transition-all font-medium"
            />
          </div>
        </div>

        {/* Issue List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-black" size={32} />
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : issues.length === 0 ? (
            <div className="py-20 text-center text-gray-400 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center">
              <Construction size={48} className="mb-4 text-gray-300" />
              <p className="font-medium">Không có sự cố nào.</p>
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center group hover:shadow-md transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-[#2D2D2C] font-mono group-hover:text-[var(--primary)] transition-colors">
                      {issue.title}
                    </h3>
                    {getStatusBadge(issue.status)}
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100 inline-block max-w-2xl">
                    {issue.description || "Không có mô tả chi tiết"}
                  </p>

                  <div className="flex items-center gap-6 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded">
                      <MapPin size={14} />
                      <span>
                        {issue.room?.building?.name || "Chưa rõ"} •{" "}
                        {issue.room?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{dayjs(issue.createdAt).fromNow()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                        { type: "divider" },
                        {
                          key: "DELETE",
                          label: "Xóa sự cố",
                          icon: <Trash2 size={16} className="text-red-500" />,
                          danger: true,
                          onClick: () => handleDeleteIssue(issue.id),
                        },
                      ],
                    }}
                    trigger={["click"]}
                  >
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black transition-colors border border-transparent hover:border-gray-200">
                      <MoreHorizontal size={20} />
                    </button>
                  </Dropdown>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE ISSUE MODAL */}
      <Modal
        title={
          <span className="text-xl font-bold font-mono">BÁO CÁO SỰ CỐ MỚI</span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreateIssue}>
          <Form.Item
            label="Tiêu đề sự cố"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input
              placeholder="Ví dụ: Bóng đèn hỏng, vòi nước rò rỉ..."
              className="font-medium"
            />
          </Form.Item>

          <Form.Item
            label="Phòng xảy ra sự cố"
            name="roomId"
            rules={[{ required: true, message: "Vui lòng chọn phòng" }]}
          >
            <Select
              placeholder="Chọn phòng..."
              showSearch
              optionFilterProp="label"
              options={rooms.map((r) => ({
                label: `${r.name} - ${r.building?.name}`,
                value: r.id,
              }))}
            />
          </Form.Item>

          <Form.Item label="Mô tả chi tiết" name="description">
            <Input.TextArea rows={4} placeholder="Mô tả chi tiết vấn đề..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              className="bg-black hover:bg-gray-800"
            >
              Gửi báo cáo
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
