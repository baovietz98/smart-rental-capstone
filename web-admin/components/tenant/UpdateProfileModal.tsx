"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { User } from "lucide-react";
import axiosClient from "@/lib/axios-client";

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpdateSuccess: (updatedUser: any) => void;
}

export default function UpdateProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateSuccess,
}: UpdateProfileModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      form.setFieldsValue({
        name: currentUser.name,
        phoneNumber: currentUser.phoneNumber,
      });
    }
  }, [isOpen, currentUser, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const res = await axiosClient.patch("/auth/profile", values);
      message.success("Cập nhật thông tin thành công!");
      onUpdateSuccess(res.data);
      onClose();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật hồ sơ",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Cập nhật thông tin cá nhân"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-4"
      >
        <Form.Item
          label="Họ và tên"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
        >
          <Input
            size="large"
            prefix={<User size={16} className="text-slate-400" />}
          />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phoneNumber"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại" },
            {
              pattern: /^[0-9]{10,11}$/,
              message: "Số điện thoại không hợp lệ",
            },
          ]}
        >
          <Input size="large" placeholder="09xxxx..." />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose} size="large">
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            className="bg-indigo-600 hover:!bg-indigo-700"
          >
            Lưu thay đổi
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
