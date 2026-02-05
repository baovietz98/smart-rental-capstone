import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  DatePicker,
} from "antd";
import { invoicesApi } from "@/lib/api/invoices";
import { Invoice } from "@/types/invoice";
import dayjs from "dayjs";

interface PaymentModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  invoice: Invoice | null;
}

export default function PaymentModal({
  isOpen,
  onCancel,
  onSuccess,
  invoice,
}: PaymentModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && invoice) {
      form.setFieldsValue({
        amount: invoice.debtAmount,
        method: "BANK",
        note: "",
        paymentDate: dayjs(),
      });
    }
  }, [isOpen, invoice, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!invoice) return;

      setLoading(true);
      await invoicesApi.recordPayment(invoice.id, {
        amount: values.amount,
        method: values.method,
        note: values.note,
        paymentDate: values.paymentDate.toISOString(),
      });

      message.success("Thanh toán thành công! 💸");
      onSuccess();
      onCancel();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi thanh toán");
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      title={
        <span className="text-lg md:text-2xl font-black uppercase">
          💰 Thanh toán hóa đơn #{invoice.id}
        </span>
      }
      className="gumroad-modal"
      width="90vw"
      style={{ maxWidth: 500 }}
      footer={[
        <button
          key="cancel"
          onClick={onCancel}
          className="gumroad-btn-secondary px-3 md:px-4 py-2 mr-2 font-bold uppercase text-sm md:text-base w-full sm:w-auto mb-2 sm:mb-0"
        >
          Hủy
        </button>,
        <button
          key="submit"
          onClick={handleOk}
          disabled={loading}
          className="bg-[#00E054] text-white border-2 border-black px-4 md:px-6 py-2 font-bold shadow-[4px_4px_0px_0px_black] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all uppercase text-sm md:text-base w-full sm:w-auto"
        >
          {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
        </button>,
      ]}
    >
      <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 border-2 border-black">
        <div className="flex justify-between mb-2 text-sm md:text-base">
          <span className="font-bold">Tổng tiền:</span>
          <span className="font-mono font-bold text-base md:text-lg">
            {invoice.totalAmount.toLocaleString()} đ
          </span>
        </div>
        <div className="flex justify-between mb-2 text-sm md:text-base">
          <span className="font-bold">Đã trả:</span>
          <span className="font-mono font-bold text-green-600">
            {invoice.paidAmount.toLocaleString()} đ
          </span>
        </div>
        <div className="flex justify-between border-t-2 border-black pt-2 text-sm md:text-base">
          <span className="font-black text-red-600 uppercase">Còn nợ:</span>
          <span className="font-mono font-black text-lg md:text-xl text-red-600">
            {invoice.debtAmount.toLocaleString()} đ
          </span>
        </div>
      </div>

      <Form form={form} layout="vertical" className="font-mono">
        <Form.Item
          label={
            <span className="font-bold text-sm md:text-base">
              Số tiền thanh toán
            </span>
          }
          name="amount"
          rules={[{ required: true, message: "Vui lòng nhập số tiền!" }]}
        >
          <InputNumber
            className="w-full gumroad-input"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) =>
              value?.replace(/\$\s?|(,*)/g, "") as unknown as number
            }
            addonAfter="VNĐ"
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="font-bold text-sm md:text-base">Phương thức</span>
          }
          name="method"
          rules={[{ required: true }]}
        >
          <Select className="gumroad-select">
            <Select.Option value="CASH">Tiền mặt (CASH)</Select.Option>
            <Select.Option value="BANK">Chuyển khoản (BANK)</Select.Option>
            <Select.Option value="MOMO">Momo</Select.Option>
            <Select.Option value="ZALOPAY">ZaloPay</Select.Option>
            <Select.Option value="OTHER">Khác</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={
            <span className="font-bold text-sm md:text-base">
              Ngày thanh toán
            </span>
          }
          name="paymentDate"
        >
          <DatePicker className="w-full gumroad-input" format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          label={
            <span className="font-bold text-sm md:text-base">Ghi chú</span>
          }
          name="note"
        >
          <Input.TextArea
            className="gumroad-input"
            rows={2}
            placeholder="VD: CK Vietcombank..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
