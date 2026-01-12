import {
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Input,
  Descriptions,
  Divider,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

interface LiquidationModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (values: any) => void;
  contract: any;
  loading?: boolean;
}

export default function LiquidationModal({
  open,
  onCancel,
  onConfirm,
  contract,
  loading,
}: LiquidationModalProps) {
  const [form] = Form.useForm();
  const deductions = Form.useWatch("deductions", form);
  const refundAmount = (contract?.paidDeposit || 0) - (deductions || 0);

  useEffect(() => {
    if (open && contract) {
      form.setFieldsValue({
        returnDate: dayjs(),
        deductions: 0,
        note: "",
      });
    }
  }, [open, contract, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onConfirm(values);
    } catch (error) {
      // Form validation error
    }
  };

  if (!contract) return null;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={null}
      className="claude-modal"
      width={600}
      closeIcon={
        <span className="text-xl text-gray-400 hover:text-gray-600 transition-colors">
          ✕
        </span>
      }
      centered
    >
      <div className="p-8">
        {/* HEADER */}
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-red-600 font-serif mb-1 flex items-center gap-2">
            Thanh lý hợp đồng
          </h2>
          <p className="text-gray-500">
            Xác nhận kết thúc hợp đồng sớm cho phòng{" "}
            <span className="font-bold text-gray-800">
              {contract.room?.name}
            </span>
          </p>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-100 mb-6 flex items-start gap-3">
          <div className="mt-1 text-red-500">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">Lưu ý quan trọng</p>
            <p className="text-xs text-red-600 mt-1">
              Hành động này sẽ kết thúc hợp đồng ngay lập tức. Hãy đảm bảo đã
              kiểm tra phòng và chốt các chỉ số điện nước trước khi xác nhận.
            </p>
          </div>
        </div>

        <Form form={form} layout="vertical" className="claude-form">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="returnDate"
              label="Ngày trả phòng"
              rules={[{ required: true }]}
            >
              <DatePicker
                className="w-full h-11 border-gray-200 rounded-lg"
                format="DD/MM/YYYY"
              />
            </Form.Item>
            <Form.Item label="Tiền cọc thực đóng">
              <div className="h-11 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold text-gray-700">
                {contract.paidDeposit?.toLocaleString()} đ
              </div>
            </Form.Item>
          </div>

          <Form.Item
            name="deductions"
            label="Trừ phí (Hỏng hóc, điện nước...)"
            initialValue={0}
          >
            <InputNumber
              className="w-full h-11 border-gray-200 rounded-lg pt-1"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) =>
                value ? value.replace(/\$\s?|(,*)/g, "") : ""
              }
              min={0}
            />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú / Lý do trừ tiền">
            <Input.TextArea
              rows={3}
              className="border-gray-200 rounded-lg"
              placeholder="Nhập chi tiết các khoản trừ..."
            />
          </Form.Item>

          <Divider className="my-6" />

          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
            <span className="font-bold text-gray-600">Hoàn lại khách:</span>
            <span
              className={`font-mono font-bold text-2xl ${
                refundAmount < 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {refundAmount.toLocaleString()} đ
            </span>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 font-bold bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {loading ? "Đang xử lý..." : "Xác nhận thanh lý"}
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
