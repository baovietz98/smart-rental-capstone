"use client";
import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Popconfirm,
} from "antd";
import {
  Plus,
  Edit,
  Trash2,
  Zap,
  Droplets,
  Wifi,
  Box,
  Loader2,
} from "lucide-react";
import { servicesApi } from "@/lib/api/services";
import { Service, ServiceType, CalculationType } from "@/types/service";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await servicesApi.getAll(true); // Include inactive
      setServices(data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải danh sách dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSave = async (values: Partial<Service>) => {
    try {
      setSubmitting(true);
      if (editingId) {
        await servicesApi.update(editingId, values);
        message.success("Cập nhật dịch vụ thành công!");
      } else {
        await servicesApi.create(values);
        message.success("Thêm dịch vụ thành công!");
      }
      form.resetFields();
      setIsModalOpen(false);
      setEditingId(null);
      fetchServices();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu dịch vụ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record: Service) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await servicesApi.delete(id);
      message.success("Đã xóa dịch vụ!");
      fetchServices();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi xóa dịch vụ");
    }
  };

  const handleSeed = async () => {
    try {
      await servicesApi.seed();
      message.success("Đã khởi tạo dữ liệu mẫu!");
      fetchServices();
    } catch (error) {
      message.error("Lỗi khởi tạo");
    }
  };

  // --- RENDER HELPERS ---
  const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("điện"))
      return <Zap size={20} className="text-yellow-600" />;
    if (n.includes("nước"))
      return <Droplets size={20} className="text-blue-600" />;
    if (n.includes("wifi") || n.includes("internet"))
      return <Wifi size={20} className="text-purple-600" />;
    return <Box size={20} className="text-gray-600" />;
  };

  const getServiceColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("điện")) return "bg-yellow-50 border-yellow-200";
    if (n.includes("nước")) return "bg-blue-50 border-blue-200";
    if (n.includes("wifi") || n.includes("internet"))
      return "bg-purple-50 border-purple-200";
    return "bg-gray-50 border-gray-200";
  };

  return (
    <div className="claude-page p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl claude-header mb-2">
              Quản lý Dịch vụ
            </h1>
            <p className="text-gray-500 font-sans text-lg">
              Thiết lập giá điện, nước và các chi phí khác.
            </p>
          </div>

          <div className="flex gap-3">
            {services.length === 0 && (
              <Button onClick={handleSeed}>Khởi tạo mẫu</Button>
            )}
            <button
              onClick={() => {
                setEditingId(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
              className="claude-btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Thêm dịch vụ</span>
            </button>
          </div>
        </div>

        {/* SERVICES GRID */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#D97757]" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="claude-card p-6 flex flex-col justify-between group hover:border-[#D97757]/50 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${getServiceColor(
                        service.name
                      )}`}
                    >
                      {getServiceIcon(service.name)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <Popconfirm
                        title="Xóa dịch vụ?"
                        description="Hành động này không thể hoàn tác."
                        onConfirm={() => handleDelete(service.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {service.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-bold text-[#D97757] font-mono">
                      {service.price.toLocaleString()}
                    </span>
                    <span className="text-gray-500 font-medium">
                      đ / {service.unit}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        service.type === ServiceType.INDEX
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : "bg-orange-50 text-orange-700 border-orange-100"
                      }`}
                    >
                      {service.type === ServiceType.INDEX
                        ? "Theo chỉ số"
                        : "Cố định"}
                    </span>
                    {service.type === ServiceType.FIXED &&
                      service.calculationType && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-purple-50 text-purple-700 border-purple-100">
                          {service.calculationType === CalculationType.PER_ROOM
                            ? "Theo phòng"
                            : "Theo người"}
                        </span>
                      )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </span>
                  <span
                    className={`flex items-center gap-1.5 text-sm font-bold ${
                      service.isActive ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        service.isActive ? "bg-green-600" : "bg-gray-400"
                      }`}
                    />
                    {service.isActive ? "Đang hoạt động" : "Đã ẩn"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={500}
        className="claude-modal"
        centered
        closeIcon={
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
            <span className="text-lg">✕</span>
          </div>
        }
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">
            {editingId ? "Cập Nhật Dịch Vụ" : "Thêm Dịch Vụ Mới"}
          </h2>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            className="claude-form"
          >
            <Form.Item
              name="name"
              label="Tên dịch vụ"
              rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ" }]}
            >
              <Input
                className="h-11 rounded-xl border-gray-200 focus:border-[#D97757] hover:border-[#D97757]"
                placeholder="VD: Tiền điện"
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="price"
                label="Đơn giá"
                rules={[{ required: true, message: "Nhập đơn giá" }]}
              >
                <InputNumber
                  className="w-full h-11 py-1 rounded-xl border-gray-200 focus:border-[#D97757] hover:border-[#D97757]"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                  placeholder="0"
                />
              </Form.Item>
              <Form.Item
                name="unit"
                label="Đơn vị tính"
                rules={[{ required: true, message: "Nhập đơn vị" }]}
              >
                <Input
                  className="h-11 rounded-xl border-gray-200 focus:border-[#D97757] hover:border-[#D97757]"
                  placeholder="VD: kWh, m3..."
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="type"
                label="Loại dịch vụ"
                rules={[{ required: true }]}
              >
                <Select className="h-11 rounded-xl">
                  <Select.Option value={ServiceType.INDEX}>
                    Theo chỉ số (Điện/Nước)
                  </Select.Option>
                  <Select.Option value={ServiceType.FIXED}>
                    Cố định hàng tháng
                  </Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                noStyle
                shouldUpdate={(prev, current) => prev.type !== current.type}
              >
                {({ getFieldValue }) =>
                  getFieldValue("type") === ServiceType.FIXED ? (
                    <Form.Item
                      name="calculationType"
                      label="Cách tính"
                      rules={[{ required: true }]}
                    >
                      <Select className="h-11 rounded-xl">
                        <Select.Option value={CalculationType.PER_ROOM}>
                          Theo phòng
                        </Select.Option>
                        <Select.Option value={CalculationType.PER_PERSON}>
                          Theo người
                        </Select.Option>
                      </Select>
                    </Form.Item>
                  ) : (
                    <div />
                  )
                }
              </Form.Item>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
              <span className="font-bold text-gray-700">
                Trạng thái hoạt động
              </span>
              <Form.Item
                name="isActive"
                valuePropName="checked"
                initialValue={true}
                className="mb-0"
              >
                <Switch />
              </Form.Item>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 font-bold bg-[#D97757] text-white rounded-xl shadow-lg shadow-orange-200 hover:bg-[#c06040] hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                {submitting ? "Đang lưu..." : "Lưu Dịch Vụ"}
              </button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
