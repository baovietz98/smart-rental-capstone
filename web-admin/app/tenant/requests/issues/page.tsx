"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  Plus,
  Filter,
  MoreVertical,
  MapPin,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  Upload,
  Camera,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload as AntUpload,
  message,
  Tag,
  Tabs,
  Empty,
  Skeleton,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import axiosClient from "@/lib/axios-client";
import dayjs from "dayjs";

// -- Interfaces --
interface Issue {
  id: number;
  title: string;
  description?: string;
  status: "OPEN" | "PROCESSING" | "DONE";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  images?: string[];
  createdAt: string;
  room?: {
    name: string;
  };
}

interface ContractResponse {
  id: number;
  roomId: number;
  room: {
    id: number;
    name: string;
    building: {
      name: string;
    };
  };
}

export default function TenantIssuesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [contract, setContract] = useState<ContractResponse | null>(null);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  // -- Fetch Data --
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Get User Contract (to know which room to filter)
      const profileRes = await axiosClient.get("/auth/profile");
      const contracts = profileRes.data.tenant?.contracts || [];
      const activeContract =
        contracts.find((c: any) => c.isActive) || contracts[0];

      if (!activeContract) {
        message.warning("Không tìm thấy hợp đồng thuê!");
        return;
      }

      setContract(activeContract);

      // 2. Get Issues for this room
      if (activeContract.room?.id) {
        const issuesRes = await axiosClient.get(
          `/issues/room/${activeContract.room.id}`,
        );
        setIssues(issuesRes.data);
      }
    } catch (error) {
      console.error("Fetch issues error:", error);
      message.error("Lỗi tải dữ liệu sự cố");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -- Handlers --

  const handleCreate = async (values: any) => {
    if (!contract?.room?.id) return;

    try {
      setCreateLoading(true);

      // 1. Upload Images
      const imageUrls: string[] = [];
      if (fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach((file) => {
          if (file.originFileObj) {
            formData.append("files", file.originFileObj);
          }
        });

        const uploadRes = await axiosClient.post(
          "/upload/images/issues",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );

        // Backend returns { data: [ { url, publicId }, ... ] }
        if (uploadRes.data?.data) {
          const urls = uploadRes.data.data.map((item: any) => item.url);
          imageUrls.push(...urls);
        }
      }

      // 2. Create Issue
      await axiosClient.post("/issues", {
        title: values.title,
        description: values.description,
        priority: values.priority,
        roomId: contract.room.id,
        images: imageUrls,
      });

      message.success("Gửi yêu cầu thành công!");
      setIsModalOpen(false);
      form.resetFields();
      setFileList([]);
      fetchData(); // Refresh list
    } catch (error: any) {
      console.error("Create issue error:", error);
      message.error(error.response?.data?.message || "Lỗi khi tạo yêu cầu");
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "PROCESSING":
        return "bg-orange-50 text-orange-600 border-orange-100";
      case "DONE":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Chờ xử lý";
      case "PROCESSING":
        return "Đang xử lý";
      case "DONE":
        return "Hoàn thành";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "red";
      case "HIGH":
        return "orange";
      case "LOW":
        return "blue";
      default:
        return "default"; // Normal
    }
  };

  const filteredIssues =
    statusFilter === "ALL"
      ? issues
      : issues.filter((i) => i.status === statusFilter);

  // Preview Logic
  const handlePreview = async (file: UploadFile) => {
    setPreviewImage(file.url || (file.preview as string) || "");
    setPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] pb-24 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md px-5 py-4 flex items-center gap-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm transition-all">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center active:scale-95 transition-all text-slate-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Báo sự cố
          </h1>
          {contract && (
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <MapPin size={10} />
              Phòng {contract.room.name} - {contract.room.building.name}
            </p>
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-200 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Tabs / Filter */}
      <div className="px-5 pt-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "OPEN", label: "Chờ xử lý" },
            { key: "PROCESSING", label: "Đang xử lý" },
            { key: "DONE", label: "Hoàn thành" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                statusFilter === item.key
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {loading && !issues.length ? (
          <>
            <Skeleton active avatar paragraph={{ rows: 2 }} />
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </>
        ) : filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-900 font-bold text-lg">
              Chưa có sự cố nào
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Nhấn nút <span className="font-bold text-slate-900">+</span> góc
              phải để báo cáo
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-indigo-100 group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusColorClass(issue.status)}`}
                    >
                      {getStatusLabel(issue.status)}
                    </span>
                    {issue.priority !== "NORMAL" && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          issue.priority === "URGENT"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : issue.priority === "HIGH"
                              ? "bg-orange-50 text-orange-600 border-orange-100"
                              : "bg-blue-50 text-blue-600 border-blue-100"
                        }`}
                      >
                        {issue.priority === "URGENT"
                          ? "KHẨN CẤP"
                          : issue.priority === "HIGH"
                            ? "CAO"
                            : "THẤP"}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-700 transition-colors">
                    {issue.title}
                  </h3>
                </div>
                {issue.images && issue.images.length > 0 && (
                  <div className="ml-4 w-16 h-16 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                    <img
                      src={issue.images[0]}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed bg-slate-50 p-3 rounded-lg">
                {issue.description || "Không có mô tả chi tiết"}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Clock size={14} />
                  {dayjs(issue.createdAt).format("HH:mm DD/MM/YYYY")}
                </div>
                {issue.images && issue.images.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md font-bold">
                    <ImageIcon size={14} /> {issue.images.length} ảnh
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        closeIcon={
          <div className="absolute right-4 top-4 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-slate-500">
            <XCircle size={20} />
          </div>
        }
        styles={{
          content: {
            borderRadius: 24,
            padding: "32px 24px",
            overflow: "visible",
            boxShadow:
              "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          },
          mask: {
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0,0,0,0.4)",
          },
        }}
        width={400}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Báo sự cố mới
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Chúng tôi sẽ xử lý sớm nhất có thể
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ priority: "NORMAL" }}
          requiredMark={false}
        >
          <Form.Item
            name="title"
            label={
              <span className="font-bold text-slate-700 text-sm">
                Tiêu đề sự cố <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
            className="mb-5"
          >
            <Input
              placeholder="VD: Hỏng vòi nước, Điều hòa rỉ nước..."
              className="font-medium rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 hover:bg-white hover:border-slate-300 py-3 transition-all"
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label={
              <span className="font-bold text-slate-700 text-sm">
                Mức độ ưu tiên
              </span>
            }
            className="mb-5"
          >
            <Select
              size="large"
              className="rounded-xl custom-select-modern"
              dropdownStyle={{ borderRadius: "12px", padding: "8px" }}
            >
              <Select.Option value="LOW">🔵 Thấp (Không gấp)</Select.Option>
              <Select.Option value="NORMAL">🟢 Bình thường</Select.Option>
              <Select.Option value="HIGH">🟠 Cao (Cần sớm)</Select.Option>
              <Select.Option value="URGENT">
                🔴 Khẩn cấp (Ngay lập tức)
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span className="font-bold text-slate-700 text-sm">
                Mô tả chi tiết
              </span>
            }
            className="mb-5"
          >
            <Input.TextArea
              rows={4}
              placeholder="Mô tả tình trạng, vị trí hỏng..."
              className="font-medium rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 hover:bg-white hover:border-slate-300 !resize-none p-3 transition-all"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-bold text-slate-700 text-sm">
                Hình ảnh minh chứng
              </span>
            }
            className="mb-8"
          >
            <AntUpload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              onPreview={handlePreview}
              beforeUpload={() => false}
              maxCount={3}
              className="custom-upload-modern"
            >
              {fileList.length < 3 && (
                <div className="flex flex-col items-center justify-center text-slate-400 opacity-80 hover:opacity-100 hover:text-indigo-600 transition-all">
                  <Camera size={24} strokeWidth={1.5} />
                  <span className="text-[10px] uppercase font-bold mt-2 tracking-wider">
                    Thêm ảnh
                  </span>
                </div>
              )}
            </AntUpload>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={createLoading}
            className="bg-slate-900 hover:!bg-indigo-600 h-12 text-base font-bold rounded-xl shadow-lg border-none transition-all active:scale-[0.98]"
          >
            Gửi yêu cầu
          </Button>
        </Form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        centered
        styles={{
          mask: {
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(0,0,0,0.8)",
          },
        }}
      >
        <img
          alt="Preview"
          style={{ width: "100%", borderRadius: "12px" }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
}
