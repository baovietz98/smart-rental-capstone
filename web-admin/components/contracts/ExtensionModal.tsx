import { Modal, Form, DatePicker, InputNumber } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

interface ExtensionModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (values: any) => void;
  contract: any;
  loading?: boolean;
}

export default function ExtensionModal({
  open,
  onCancel,
  onConfirm,
  contract,
  loading,
}: ExtensionModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && contract) {
      form.setFieldsValue({
        endDate: contract.endDate
          ? dayjs(contract.endDate).add(6, "month")
          : dayjs().add(6, "month"),
        price: contract.price,
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
      width={500}
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
          <h2 className="text-2xl font-bold text-[#4DA2FF] font-serif mb-1 flex items-center gap-2">
            Gia hạn hợp đồng
          </h2>
          <p className="text-gray-500">
            Gia hạn thời gian thuê cho phòng{" "}
            <span className="font-bold text-gray-800">
              {contract.room?.name}
            </span>
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-6">
          <p className="text-sm font-bold text-blue-800 uppercase mb-2">
            Thông tin hiện tại
          </p>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-gray-600">Ngày kết thúc cũ:</span>
            <span className="font-mono font-bold text-gray-900">
              {contract.endDate
                ? dayjs(contract.endDate).format("DD/MM/YYYY")
                : "Vô thời hạn"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Giá thuê hiện tại:</span>
            <span className="font-mono font-bold text-gray-900">
              {contract.price?.toLocaleString()} đ
            </span>
          </div>
        </div>

        <Form form={form} layout="vertical" className="claude-form">
          <Form.Item
            name="endDate"
            label="Ngày kết thúc mới"
            rules={[{ required: true }]}
          >
            <DatePicker
              className="w-full h-11 border-gray-200 rounded-lg"
              format="DD/MM/YYYY"
            />
          </Form.Item>

          <Form.Item
            name="price"
            label="Giá thuê mới (nếu thay đổi)"
            rules={[{ required: true }]}
          >
            <InputNumber
              className="w-full h-11 border-gray-200 rounded-lg pt-1"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) =>
                value ? value.replace(/\$\s?|(,*)/g, "") : ""
              }
            />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 font-bold bg-[#4DA2FF] text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {loading ? "Đang xử lý..." : "Xác nhận gia hạn"}
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
