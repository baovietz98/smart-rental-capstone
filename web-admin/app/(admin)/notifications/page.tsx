"use client";

import React, { useState, useEffect } from "react";
import axiosClient from "@/lib/axios-client";
import { Button, Table, Modal, Form, Input, Select, Tag, message } from "antd";
import { Plus, Bell, Calendar, User, ArrowRight } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/notifications");
      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      messageApi.error("Lỗi tải danh sách thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      setSubmitting(true);
      await axiosClient.post("/notifications", values);
      messageApi.success("Tạo thông báo thành công");
      setIsModalVisible(false);
      form.resetFields();
      fetchNotifications();
    } catch (error) {
      console.error("Create notification failed:", error);
      messageApi.error("Lỗi tạo thông báo");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[#2D2D2C]">{text}</span>
          <span className="text-sm text-gray-500 truncate max-w-xs">
            {record.content}
          </span>
        </div>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type: string) => {
        let color = "blue";
        let label = "Thông tin";
        if (type === "WARNING") {
          color = "orange";
          label = "Cảnh báo";
        } else if (type === "URGENT") {
          color = "red";
          label = "Khẩn cấp";
        }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Người tạo",
      key: "creator",
      width: 150,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2 text-gray-600">
          <User size={14} />
          <span className="text-sm">Admin</span>
        </div>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) => (
        <div className="text-sm text-gray-500">
          {dayjs(date).format("DD/MM/YYYY HH:mm")}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {contextHolder}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-[#2D2D2C] mb-2 flex items-center gap-3">
            <span className="p-2 bg-[#F2F2F0] rounded-xl text-[#D97757]">
              <Bell size={28} />
            </span>
            Bảng tin cư dân
          </h1>
          <p className="text-gray-500">
            Gửi thông báo đến tất cả cư dân trong hệ thống
          </p>
        </div>
        <button
          onClick={() => setIsModalVisible(true)}
          className="claude-btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Tạo thông báo</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table
          columns={columns}
          dataSource={notifications}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="p-2"
        />
      </div>

      {/* Create Modal - Premium Redesign */}
      <Modal
        title={null}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
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
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#2D2D2C] font-serif m-0">
                Tạo thông báo mới
              </h3>
              <p className="text-gray-500 text-sm m-0">
                Gửi tin nhắn đến toàn bộ cư dân
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
            requiredMark={false}
          >
            <Form.Item
              name="title"
              label={
                <span className="text-sm font-semibold text-gray-700">
                  Tiêu đề thông báo
                </span>
              }
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
              className="mb-6"
            >
              <Input
                placeholder="Ví dụ: Thông báo bảo trì thang máy"
                className="hover:border-[#D97757] focus:border-[#D97757] w-full px-4 py-3 rounded-xl border-gray-200 bg-gray-50 font-medium transition-all"
              />
            </Form.Item>

            <Form.Item
              name="type"
              label={
                <span className="text-sm font-semibold text-gray-700">
                  Loại tin
                </span>
              }
              initialValue="INFO"
              className="mb-6"
            >
              <Select
                className="w-full h-12 text-base"
                popupClassName="claude-select-popup"
                dropdownStyle={{
                  backgroundColor: "#ffffff",
                }}
                optionLabelProp="label"
              >
                <Select.Option value="INFO" label="Thông tin chung">
                  <div className="flex items-center gap-2 py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></span>
                    <span className="text-gray-700 font-medium">
                      Thông tin chung
                    </span>
                  </div>
                </Select.Option>
                <Select.Option value="WARNING" label="Cảnh báo / Lưu ý">
                  <div className="flex items-center gap-2 py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-200"></span>
                    <span className="text-gray-700 font-medium">
                      Cảnh báo / Lưu ý
                    </span>
                  </div>
                </Select.Option>
                <Select.Option value="URGENT" label="Khẩn cấp">
                  <div className="flex items-center gap-2 py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200"></span>
                    <span className="text-gray-700 font-medium">Khẩn cấp</span>
                  </div>
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="content"
              label={
                <span className="text-sm font-semibold text-gray-700">
                  Nội dung chi tiết
                </span>
              }
              rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
              className="mb-8"
            >
              <Input.TextArea
                rows={6}
                placeholder="Nhập nội dung thông báo..."
                className="hover:border-[#D97757] focus:border-[#D97757] px-4 py-3 rounded-xl border-gray-200 bg-gray-50 transition-all resize-none"
              />
            </Form.Item>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
              <button
                type="button"
                onClick={() => setIsModalVisible(false)}
                className="bg-white border-0 text-gray-500 font-medium hover:bg-gray-50 hover:text-gray-900 rounded-xl h-11 px-6 transition-colors"
                disabled={submitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="claude-btn-primary flex items-center gap-2 px-8 h-11 rounded-xl shadow-lg shadow-orange-100 hover:shadow-orange-200"
              >
                Gửi ngay <ArrowRight size={18} />
              </button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
