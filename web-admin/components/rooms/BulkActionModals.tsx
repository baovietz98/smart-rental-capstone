import React, { useState } from "react";
import { Modal, Form, Input, InputNumber, Radio } from "antd";
import {
  DollarOutlined,
  ToolOutlined,
  SendOutlined,
  CloseOutlined,
} from "@ant-design/icons";

export type BulkActionType = "PRICE" | "ISSUE" | "NOTIFY" | null;

interface BulkActionModalsProps {
  open: boolean;
  type: BulkActionType;
  onCancel: () => void;
  onConfirm: (values: any) => void;
  loading: boolean;
  selectedCount: number;
}

const BulkActionModals: React.FC<BulkActionModalsProps> = ({
  open,
  type,
  onCancel,
  onConfirm,
  loading,
  selectedCount,
}) => {
  const [form] = Form.useForm();
  const [priceType, setPriceType] = useState<
    "PERCENTAGE" | "FIXED_ADD" | "FIXED_SET"
  >("PERCENTAGE");

  // Reset form when type changes or Modal opens
  React.useEffect(() => {
    if (open) {
      form.resetFields();
      setPriceType("PERCENTAGE");
    }
  }, [open, type, form]);

  if (!type) return null;

  let title = "";
  let icon = null;
  let content = null;
  let accentColor = "#2D2D2C"; // Default black

  switch (type) {
    case "PRICE":
      title = "Tăng giá đồng loạt";
      icon = <DollarOutlined className="text-emerald-500 text-xl" />;
      accentColor = "#10B981";
      content = (
        <>
          <Form.Item
            name="type"
            label={
              <span className="font-semibold text-gray-700">
                Hình thức tăng giá
              </span>
            }
            initialValue="PERCENTAGE"
          >
            <Radio.Group
              onChange={(e) => setPriceType(e.target.value)}
              className="flex flex-col gap-3"
            >
              <Radio value="PERCENTAGE" className="font-medium text-gray-600">
                Tăng theo phần trăm (%)
              </Radio>
              <Radio value="FIXED_ADD" className="font-medium text-gray-600">
                Cộng thêm số tiền cố định (VNĐ)
              </Radio>
              <Radio value="FIXED_SET" className="font-medium text-gray-600">
                Thiết lập giá mới đồng loạt (VNĐ)
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="value"
            label={
              <span className="font-semibold text-gray-700">
                {priceType === "PERCENTAGE" ? "Nhập số % tăng" : "Nhập số tiền"}
              </span>
            }
            rules={[{ required: true, message: "Vui lòng nhập giá trị" }]}
          >
            <InputNumber
              className="w-full h-11 rounded-lg pt-1 border-gray-200"
              formatter={(value) =>
                priceType !== "PERCENTAGE"
                  ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  : `${value}`
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              addonAfter={priceType === "PERCENTAGE" ? "%" : "VNĐ"}
              min={0}
            />
          </Form.Item>
          <div className="bg-yellow-50 p-4 rounded-xl text-sm text-yellow-700 border border-yellow-100 flex items-start gap-2">
            <span className="text-lg">💡</span>
            <span className="mt-0.5">
              Giá phòng sẽ được cập nhật ngay lập tức cho{" "}
              <strong>{selectedCount}</strong> phòng đã chọn.
            </span>
          </div>
        </>
      );
      break;

    case "ISSUE":
      title = "Báo bảo trì đồng loạt";
      icon = <ToolOutlined className="text-orange-500 text-xl" />;
      accentColor = "#F97316";
      content = (
        <>
          <Form.Item
            name="title"
            label={
              <span className="font-semibold text-gray-700">Tiêu đề sự cố</span>
            }
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input
              className="h-11 rounded-lg border-gray-200"
              placeholder="VD: Kiểm tra máy lạnh định kỳ"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span className="font-semibold text-gray-700">
                Mô tả chi tiết
              </span>
            }
          >
            <Input.TextArea
              rows={4}
              className="rounded-lg border-gray-200"
              placeholder="Mô tả chi tiết..."
            />
          </Form.Item>
        </>
      );
      break;

    case "NOTIFY":
      title = "Gửi thông báo Zalo";
      icon = <SendOutlined className="text-blue-500 text-xl" />;
      accentColor = "#3B82F6";
      content = (
        <>
          <Form.Item
            name="message"
            label={
              <span className="font-semibold text-gray-700">
                Nội dung thông báo
              </span>
            }
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <Input.TextArea
              rows={4}
              className="rounded-lg border-gray-200"
              placeholder="VD: Thông báo lịch cúp điện vào ngày mai..."
              showCount
              maxLength={500}
            />
          </Form.Item>
          <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 border border-blue-100 flex items-start gap-2">
            <span className="text-lg">ℹ️</span>
            <span className="mt-0.5">
              Hệ thống sẽ gửi tin nhắn Zalo đến tất cả khách thuê đang ở trong{" "}
              <strong>{selectedCount}</strong> phòng đã chọn.
            </span>
          </div>
        </>
      );
      break;
  }

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onConfirm(values);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={null}
      width={520}
      closeIcon={null}
      centered
      className="claude-modal"
      styles={
        {
          content: {
            padding: 0,
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
          },
        } as any
      }
    >
      <div className="bg-white">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            {icon}
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-[#2D2D2C] m-0 leading-tight">
                {title}
              </h2>
              <span className="text-xs text-gray-500 font-medium">
                Áp dụng cho {selectedCount} phòng
              </span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition-colors"
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="p-6">
          <Form form={form} layout="vertical" className="flex flex-col gap-2">
            {content}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-all text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleOk}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                {loading && <span className="animate-spin">⏳</span>}
                {type === "NOTIFY" ? "Gửi ngay" : "Xác nhận"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </Modal>
  );
};

export default BulkActionModals;
