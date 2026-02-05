"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Button,
  Table,
  InputNumber,
  Input,
  message,
  Popconfirm,
} from "antd";
import {
  Plus,
  Trash2,
  Save,
  Send,
  Calculator,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import dayjs from "dayjs";
import { buildingsApi, Building, Room } from "@/lib/api/buildings";
import { invoicesApi } from "@/lib/api/invoices";
import { Invoice, InvoiceLineItem } from "@/types/invoice";
import axiosClient from "@/lib/axios-client";

interface Props {
  isOpen: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CreateInvoiceModal({
  isOpen,
  onCancel,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);

  // Draft Data
  const [draftInvoice, setDraftInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<
    (InvoiceLineItem & { _id: string })[]
  >([]);

  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      fetchBuildings();
      setStep(1);
      form.resetFields();
      form.setFieldValue("month", dayjs());
      setDraftInvoice(null);
      setLineItems([]);
    }
  }, [isOpen]);

  const fetchBuildings = async () => {
    try {
      const data = await buildingsApi.getAll();
      setBuildings(data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải danh sách tòa nhà");
    }
  };

  const handleBuildingChange = async (buildingId: number) => {
    setSelectedBuilding(buildingId);
    form.setFieldValue("roomId", null);
    try {
      const data = await buildingsApi.getRooms(buildingId);
      setRooms(data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải danh sách phòng");
    }
  };

  const handleGenerateDraft = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Fetch contract for room
      const contractsRes = await axiosClient.get(
        `/contracts?roomId=${values.roomId}&isActive=true`,
      );
      if (contractsRes.data.length === 0) {
        message.error("Phòng này chưa có hợp đồng đang hoạt động!");
        setLoading(false);
        return;
      }
      const contractId = contractsRes.data[0].id;

      // 1. Call Preview API
      const previewData = await invoicesApi.preview({
        contractId,
        month: values.month.format("MM-YYYY"),
      });

      // 2. Set data for review (Snapshot)
      setLineItems(
        previewData.lineItems.map((item) => ({
          ...item,
          _id: Math.random().toString(36).substr(2, 9),
        })),
      );

      // Store contractId for later use
      setDraftInvoice({
        ...draftInvoice,
        contractId,
        month: values.month.format("MM-YYYY"),
        contract: {
          room: { name: rooms.find((r) => r.id === values.roomId)?.name || "" },
        },
      } as any);

      setStep(2);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi tính toán hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLineItem = (
    index: number,
    field: keyof InvoiceLineItem,
    value: any,
  ) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amount if quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].amount =
        newItems[index].quantity * newItems[index].unitPrice;
    }

    setLineItems(newItems);
  };

  const handleDeleteLineItem = (index: number) => {
    const newItems = [...lineItems];
    newItems.splice(index, 1);
    setLineItems(newItems);
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        type: "EXTRA",
        name: "Chi phí khác",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        note: "",
        _id: Math.random().toString(36).substr(2, 9),
      },
    ]);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleSave = async (publish: boolean = false) => {
    if (!draftInvoice?.contractId) return;
    setLoading(true);
    try {
      // 3. Create Invoice with Snapshot (lineItems)
      // Remove _id before sending
      const cleanLineItems = lineItems.map(({ _id, ...item }) => item);
      const invoice = await invoicesApi.generateDraft({
        contractId: draftInvoice.contractId,
        month: draftInvoice.month,
        lineItems: cleanLineItems, // Send the snapshot!
      });

      // 4. Publish if requested
      if (publish) {
        await invoicesApi.publish(invoice.id);
        message.success("Đã phát hành hóa đơn thành công!");
      } else {
        message.success("Đã tạo hóa đơn thành công!");
      }

      onSuccess();
    } catch (error: any) {
      if (error.response?.status === 409) {
        message.warning("Hóa đơn cho phòng này trong tháng đã tồn tại!");
        onSuccess();
      } else {
        message.error(error.response?.data?.message || "Lỗi khi lưu hóa đơn");
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Loại",
      dataIndex: "type",
      width: 100,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-semibold py-3",
      render: (type: string) => (
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
            type === "RENT"
              ? "bg-blue-50 text-blue-700 border-blue-100"
              : type === "ELECTRIC"
                ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                : type === "WATER"
                  ? "bg-cyan-50 text-cyan-700 border-cyan-100"
                  : type === "DEBT"
                    ? "bg-red-50 text-red-700 border-red-100"
                    : "bg-gray-100 text-gray-600 border-gray-200"
          }`}
        >
          {type}
        </span>
      ),
    },
    {
      title: "Tên khoản thu",
      dataIndex: "name",
      className:
        "bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-semibold py-3",
      render: (text: string, record: InvoiceLineItem, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleUpdateLineItem(index, "name", e.target.value)}
          className="font-medium text-gray-700 border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent"
        />
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 100,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-semibold py-3",
      render: (val: number, record: InvoiceLineItem, index: number) => (
        <InputNumber
          value={val}
          onChange={(val) => handleUpdateLineItem(index, "quantity", val)}
          className="w-full border-gray-200 rounded-lg"
        />
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      width: 140,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-semibold py-3",
      render: (val: number, record: InvoiceLineItem, index: number) => (
        <InputNumber
          value={val}
          min={0}
          max={9999999999}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) =>
            value?.replace(/\$\s?|(,*)/g, "") as unknown as number
          }
          onChange={(val) => handleUpdateLineItem(index, "unitPrice", val)}
          className="w-full border-gray-200 rounded-lg font-mono text-gray-600"
          placeholder="0"
        />
      ),
    },
    {
      title: "Thành tiền",
      dataIndex: "amount",
      width: 140,
      align: "right" as const,
      className:
        "bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-semibold py-3",
      render: (val: number) => (
        <span className="font-bold text-gray-900 font-mono">
          {val.toLocaleString()}
        </span>
      ),
    },
    {
      title: "",
      width: 50,
      className: "bg-gray-50 py-3",
      render: (_: any, __: any, index: number) => (
        <button
          onClick={() => handleDeleteLineItem(index)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={onCancel}
      title={null}
      footer={null}
      width={900}
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
      centered
    >
      <div className="bg-[#FAF9F6] px-8 py-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#D97757]">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#2D2D2C] font-serif m-0 flex items-center gap-2">
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-400 hover:text-[#D97757] transition-colors mr-1"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              {step === 1 ? "Tạo hóa đơn mới" : "Chi tiết hóa đơn"}
            </h3>
            <p className="text-gray-500 text-sm m-0">
              {step === 1
                ? "Chọn phòng và tháng để tính toán hóa đơn"
                : `Kiểm tra và điều chỉnh các khoản thu cho tháng ${draftInvoice?.month}`}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 bg-white">
        {step === 1 ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleGenerateDraft}
            className="claude-form"
            requiredMark={false}
          >
            <div className="grid grid-cols-2 gap-6 mb-6">
              <Form.Item
                name="buildingId"
                label={
                  <span className="font-semibold text-gray-700">Tòa nhà</span>
                }
                rules={[{ required: true, message: "Chọn tòa nhà" }]}
              >
                <Select
                  placeholder="Chọn tòa nhà..."
                  onChange={handleBuildingChange}
                  options={buildings.map((b) => ({
                    label: b.name,
                    value: b.id,
                  }))}
                  className="h-12 text-base"
                  popupClassName="claude-select-popup"
                  dropdownStyle={{ backgroundColor: "#ffffff" }}
                />
              </Form.Item>
              <Form.Item
                name="roomId"
                label={
                  <span className="font-semibold text-gray-700">Phòng</span>
                }
                rules={[{ required: true, message: "Chọn phòng" }]}
              >
                <Select
                  placeholder="Chọn phòng..."
                  options={rooms.map((r) => ({ label: r.name, value: r.id }))}
                  disabled={!selectedBuilding}
                  className="h-12 text-base"
                  popupClassName="claude-select-popup"
                  dropdownStyle={{ backgroundColor: "#ffffff" }}
                />
              </Form.Item>
            </div>
            <Form.Item
              name="month"
              label={
                <span className="font-semibold text-gray-700">
                  Tháng hóa đơn
                </span>
              }
              rules={[{ required: true, message: "Chọn tháng" }]}
              className="mb-8"
            >
              <DatePicker
                picker="month"
                format="MM-YYYY"
                className="w-full h-12 rounded-xl text-base"
              />
            </Form.Item>

            <div className="mt-8 flex justify-end pt-4 border-t border-gray-50">
              <button
                type="submit"
                disabled={loading}
                className="claude-btn-primary flex items-center gap-2 px-8 h-11 rounded-xl shadow-lg shadow-orange-100 hover:shadow-orange-200"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                <Calculator size={18} />
                <span>Tính hóa đơn (Preview)</span>
              </button>
            </div>
          </Form>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Info Card */}
            <div className="bg-[#FAF9F6] p-4 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Phòng
                </div>
                <div className="text-xl font-bold text-[#2D2D2C]">
                  {draftInvoice?.contract?.room.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Tổng cộng (Tạm tính)
                </div>
                <div className="text-2xl font-black text-[#D97757] tracking-tight">
                  {calculateTotal().toLocaleString()} ₫
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <Table
                dataSource={lineItems}
                columns={columns}
                pagination={false}
                rowKey="_id"
                className="claude-table-dense"
              />
              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={handleAddLineItem}
                  className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#D97757] transition-colors px-2 py-1 rounded hover:bg-white"
                >
                  <Plus size={16} />
                  <span>Thêm khoản thu khác</span>
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 mt-4 justify-end pt-6 border-t border-gray-50">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Quay lại
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                <span>Lưu nháp</span>
              </button>
              <Popconfirm
                title="Xác nhận phát hành"
                description="Hóa đơn sẽ được chuyển sang trạng thái PUBLISHED."
                onConfirm={() => handleSave(true)}
                okButtonProps={{ className: "bg-[#D97757]" }}
              >
                <button
                  className="claude-btn-primary px-6 py-2.5 rounded-xl shadow-lg shadow-orange-100 hover:shadow-xl flex items-center gap-2"
                  disabled={loading}
                >
                  <Send size={18} />
                  <span>Phát hành ngay</span>
                </button>
              </Popconfirm>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
