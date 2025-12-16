import React, { useState } from "react";
import { Modal, Form, Input, InputNumber, Radio, message } from "antd";
import { DollarOutlined, ToolOutlined, SendOutlined } from "@ant-design/icons";

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

  switch (type) {
    case "PRICE":
      title = `Tăng giá đồng loạt (${selectedCount} phòng)`;
      icon = <DollarOutlined className="text-green-500 mr-2" />;
      content = (
        <>
          <Form.Item
            name="type"
            label="Hình thức tăng giá"
            initialValue="PERCENTAGE"
          >
            <Radio.Group
              onChange={(e) => setPriceType(e.target.value)}
              className="flex flex-col gap-2"
            >
              <Radio value="PERCENTAGE">Tăng theo phần trăm (%)</Radio>
              <Radio value="FIXED_ADD">Cộng thêm số tiền cố định (VNĐ)</Radio>
              <Radio value="FIXED_SET">Thiết lập giá mới đồng loạt (VNĐ)</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="value"
            label={
              priceType === "PERCENTAGE" ? "Nhập số % tăng" : "Nhập số tiền"
            }
            rules={[{ required: true, message: "Vui lòng nhập giá trị" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
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
          <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-700 border border-yellow-200">
            Lưu ý: Giá phòng sẽ được cập nhật ngay lập tức cho {selectedCount}{" "}
            phòng đã chọn.
          </div>
        </>
      );
      break;

    case "ISSUE":
      title = `Báo bảo trì đồng loạt (${selectedCount} phòng)`;
      icon = <ToolOutlined className="text-orange-500 mr-2" />;
      content = (
        <>
          <Form.Item
            name="title"
            label="Tiêu đề sự cố"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="VD: Kiểm tra máy lạnh định kỳ" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả chi tiết">
            <Input.TextArea rows={4} placeholder="Mô tả chi tiết..." />
          </Form.Item>
        </>
      );
      break;

    case "NOTIFY":
      title = `Gửi thông báo Zalo (${selectedCount} phòng)`;
      icon = <SendOutlined className="text-blue-500 mr-2" />;
      content = (
        <>
          <Form.Item
            name="message"
            label="Nội dung thông báo"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="VD: Thông báo lịch cúp điện vào ngày mai..."
              showCount
              maxLength={500}
            />
          </Form.Item>
          <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 border border-blue-200">
            Hệ thống sẽ gửi tin nhắn Zalo đến tất cả khách thuê đang ở trong các
            phòng đã chọn.
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
      title={
        <div className="flex items-center text-lg">
          {icon} {title}
        </div>
      }
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      destroyOnHidden
      okText={type === "NOTIFY" ? "Gửi ngay" : "Xác nhận"}
      okButtonProps={{ className: "bg-black" }}
    >
      <Form form={form} layout="vertical">
        {content}
      </Form>
    </Modal>
  );
};

export default BulkActionModals;
