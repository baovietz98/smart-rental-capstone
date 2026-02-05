"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Phone,
  CreditCard,
  Loader2,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import axios from "@/lib/axios-client";
import { message, Form, Input, Modal } from "antd";

// ... (Add user to interface)
interface Tenant {
  id: number;
  fullName: string;
  phone: string;
  cccd?: string;
  user?: {
    email: string;
  };
  contracts?: {
    room?: {
      name: string;
      building?: {
        name: string;
      };
    };
  }[];
  info?: {
    dob?: string;
    email?: string;
    job?: string;
    licensePlate?: string;
    hometown?: string;
    note?: string;
    cccdFront?: string;
    cccdBack?: string;
  };
}

// Sub-component for Uploading CCCD
const UploadCCCD = ({
  side,
  onUpload,
  defaultValue,
}: {
  side: "front" | "back";
  onUpload: (url: string) => void;
  defaultValue?: string;
  messageApi: any;
}) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(defaultValue || null);

  useEffect(() => {
    if (defaultValue) setImageUrl(defaultValue);
  }, [defaultValue]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/upload/image/tenants", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.data.url;
      setImageUrl(url);
      onUpload(url);
      messageApi.success("Upload ảnh thành công!");
    } catch (error) {
      console.error(error);
      messageApi.error("Lỗi upload ảnh");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 hover:border-[#D97757] transition-all relative h-40 flex items-center justify-center group bg-white">
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
      />
      {loading ? (
        <Loader2 className="animate-spin text-[#D97757]" />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt="CCCD"
          className="h-full object-contain rounded-md"
        />
      ) : (
        <div className="text-gray-400 group-hover:text-[#D97757] transition-colors">
          <Plus className="mx-auto mb-2" />
          <span className="text-xs font-semibold uppercase tracking-wide block">
            {side === "front" ? "Mặt trước" : "Mặt sau"}
          </span>
        </div>
      )}
    </div>
  );
};

export default function TenantsPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // State for viewing full details
  const [viewDetailModalOpen, setViewDetailModalOpen] = useState(false);
  const [selectedTenantDetail, setSelectedTenantDetail] =
    useState<Tenant | null>(null);

  const fetchTenants = async (query = "") => {
    setLoading(true);
    try {
      const endpoint = query ? `/tenants/search?q=${query}` : "/tenants";
      const res = await axios.get(endpoint);
      setTenants(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      messageApi.error("Không thể tải danh sách khách thuê!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTenants(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync form data when modal opens for editing
  // Sync form data when modal opens for editing
  useEffect(() => {
    if (isModalOpen && editingTenant) {
      // Merge user email into info.email for display in form
      const formValues = {
        ...editingTenant,
        info: {
          ...editingTenant.info,
          email: editingTenant.user?.email || editingTenant.info?.email,
        },
      };
      form.setFieldsValue(formValues);
    } else if (isModalOpen && !editingTenant) {
      form.resetFields();
    }
  }, [isModalOpen, editingTenant, form]);

  const handleSaveTenant = async (values: Omit<Tenant, "id" | "contracts">) => {
    try {
      if (editingId) {
        await axios.patch(`/tenants/${editingId}`, values);
        messageApi.success("Cập nhật khách thuê thành công!");
      } else {
        await axios.post("/tenants", values);
        messageApi.success("Thêm khách thuê thành công!");
      }
      form.resetFields();
      setIsModalOpen(false);
      setEditingId(null);
      setEditingTenant(null);
      fetchTenants(searchTerm);
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 409) {
        messageApi.error("Số điện thoại đã tồn tại!");
      } else {
        messageApi.error("Lỗi khi lưu khách thuê");
      }
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingId(tenant.id);
    setEditingTenant(tenant);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await axios.delete(`/tenants/${deleteId}`);
        messageApi.success("Đã xóa khách thuê!");
        fetchTenants(searchTerm);
      } catch (error: any) {
        if (error.response?.status === 409) {
          messageApi.error("Không thể xóa: Khách đang có hợp đồng!");
        } else {
          messageApi.error("Lỗi khi xóa khách thuê");
        }
      } finally {
        setDeleteId(null);
      }
    }
  };

  const handleViewDetail = (tenant: Tenant) => {
    setSelectedTenantDetail(tenant);
    setViewDetailModalOpen(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
    setEditingId(null);
    setEditingTenant(null);
  };

  return (
    <div className="claude-page p-6 md:p-12">
      {contextHolder}
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl claude-header mb-2">Tenants</h1>
            <p className="text-gray-500 font-sans text-lg">
              Quản lý hồ sơ khách thuê trọ.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="claude-btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Thêm khách mới</span>
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mb-8 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, CCCD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all font-medium text-gray-700 shadow-sm"
          />
        </div>

        {/* LIST VIEW (CLEAN CARD LIST) */}
        <div className="grid gap-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-8 h-8 text-[#D97757]" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-400">Không tìm thấy khách thuê nào.</p>
            </div>
          ) : (
            tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="claude-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-[#D97757]/30 transition-all"
              >
                <div className="flex items-start md:items-center gap-4 flex-1">
                  <div
                    onClick={() => handleViewDetail(tenant)}
                    className="w-12 h-12 rounded-full bg-[#F5F5F0] text-[#D97757] flex items-center justify-center font-bold text-lg cursor-pointer hover:bg-[#D97757] hover:text-white transition-colors"
                  >
                    {tenant.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3
                      onClick={() => handleViewDetail(tenant)}
                      className="text-lg font-bold text-[#2D2D2C] cursor-pointer hover:text-[#D97757] transition-colors"
                    >
                      {tenant.fullName}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1.5">
                        <Phone size={14} /> {tenant.phone}
                      </span>
                      {tenant.cccd && (
                        <span className="flex items-center gap-1.5">
                          <CreditCard size={14} /> {tenant.cccd}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ROOM INFO */}
                <div className="flex-1 md:text-left">
                  {tenant.contracts?.[0] ? (
                    <div className="inline-flex flex-col">
                      <span className="text-sm font-semibold text-[#2D2D2C]">
                        {tenant.contracts[0].room?.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {tenant.contracts[0].room?.building?.name}
                      </span>
                    </div>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-medium">
                      Chưa thuê
                    </span>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 transition-opacity">
                  <button
                    onClick={() => handleViewDetail(tenant)}
                    className="p-2 text-gray-400 hover:text-[#D97757] hover:bg-[#F9F9F7] rounded-lg transition-all"
                    title="Xem chi tiết"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(tenant)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Sửa thông tin"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(tenant.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ADD/EDIT MODAL */}
        <Modal
          open={isModalOpen}
          onCancel={handleCancel}
          footer={null}
          width={700}
          centered
          closeIcon={null}
          className="claude-modal"
        >
          <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden p-8">
            <button
              onClick={handleCancel}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>

            <div className="mb-8">
              <h2 className="text-2xl claude-header mb-2">
                {editingId ? "Chỉnh sửa hồ sơ" : "Thêm khách thuê mới"}
              </h2>
              <p className="text-gray-500">
                Nhập đầy đủ thông tin cá nhân và giấy tờ tùy thân.
              </p>
            </div>

            <Form form={form} onFinish={handleSaveTenant} layout="vertical">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">Họ và tên</span>
                  }
                  name="fullName"
                  rules={[{ required: true, message: "Nhập họ tên!" }]}
                >
                  <Input
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757] outline-none transition-all"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">
                      Số điện thoại
                    </span>
                  }
                  name="phone"
                  rules={[
                    { required: true, message: "Nhập SĐT!" },
                    { len: 10, message: "SĐT phải 10 số" },
                  ]}
                >
                  <Input
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757] outline-none transition-all"
                    placeholder="0901234567"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">CCCD/CMND</span>
                  }
                  name="cccd"
                >
                  <Input
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757] outline-none transition-all"
                    placeholder="001234567890"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="font-medium text-gray-700">Ngày sinh</span>
                  }
                  name={["info", "dob"]}
                >
                  <Input
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757] outline-none transition-all"
                    placeholder="DD/MM/YYYY"
                  />
                </Form.Item>
              </div>

              <div className="border-t border-gray-100 pt-6 mb-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
                  Thông tin bổ sung
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item
                    label={
                      <span className="font-medium text-gray-700">Email</span>
                    }
                    name={["info", "email"]}
                  >
                    <Input
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D97757] outline-none"
                      placeholder="example@email.com"
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span className="font-medium text-gray-700">
                        Nghề nghiệp
                      </span>
                    }
                    name={["info", "job"]}
                  >
                    <Input
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D97757] outline-none"
                      placeholder="VD: Sinh viên"
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span className="font-medium text-gray-700">
                        Quê quán (Thường trú)
                      </span>
                    }
                    name={["info", "hometown"]}
                    className="md:col-span-2"
                  >
                    <Input
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D97757] outline-none"
                      placeholder="Địa chỉ thường trú..."
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span className="font-medium text-gray-700">
                        Biển số xe
                      </span>
                    }
                    name={["info", "licensePlate"]}
                  >
                    <Input
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D97757] outline-none"
                      placeholder="29A-123.45"
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span className="font-medium text-gray-700">Ghi chú</span>
                    }
                    name={["info", "note"]}
                  >
                    <Input
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#D97757] outline-none"
                      placeholder="Ghi chú thêm..."
                    />
                  </Form.Item>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mb-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
                  Ảnh giấy tờ tùy thân
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <UploadCCCD
                      side="front"
                      defaultValue={form.getFieldValue(["info", "cccdFront"])}
                      onUpload={(url) =>
                        form.setFieldValue(["info", "cccdFront"], url)
                      }
                      messageApi={messageApi}
                    />
                    <Form.Item name={["info", "cccdFront"]} hidden>
                      <Input />
                    </Form.Item>
                  </div>
                  <div>
                    <UploadCCCD
                      side="back"
                      defaultValue={form.getFieldValue(["info", "cccdBack"])}
                      onUpload={(url) =>
                        form.setFieldValue(["info", "cccdBack"], url)
                      }
                      messageApi={messageApi}
                    />
                    <Form.Item name={["info", "cccdBack"]} hidden>
                      <Input />
                    </Form.Item>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="claude-btn-secondary"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="claude-btn-primary px-8">
                  Lưu hồ sơ
                </button>
              </div>
            </Form>
          </div>
        </Modal>

        {/* VIEW DETAIL MODAL */}
        <Modal
          open={viewDetailModalOpen}
          onCancel={() => setViewDetailModalOpen(false)}
          footer={null}
          width={600}
          centered
          closeIcon={null}
          className="claude-modal"
        >
          {selectedTenantDetail && (
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden p-8">
              <button
                onClick={() => setViewDetailModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>

              {/* header */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-[#F5F5F0] text-[#D97757] flex items-center justify-center font-bold text-4xl mb-4 border-4 border-white shadow-sm font-serif">
                  {selectedTenantDetail.fullName.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl claude-header mb-1 text-center">
                  {selectedTenantDetail.fullName}
                </h2>
                <div className="flex gap-2 text-sm text-gray-500">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                    ID: #{selectedTenantDetail.id}
                  </span>
                  {selectedTenantDetail.contracts?.[0] ? (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                      {selectedTenantDetail.contracts[0].room?.name} -{" "}
                      {selectedTenantDetail.contracts[0].room?.building?.name}
                    </span>
                  ) : (
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">
                      Chưa thuê
                    </span>
                  )}
                </div>
              </div>

              {/* info grid */}
              <div className="bg-[#F9F9F7] rounded-xl p-6 mb-6">
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      Số điện thoại
                    </label>
                    <p className="font-semibold text-gray-800">
                      {selectedTenantDetail.phone}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      CCCD/CMND
                    </label>
                    <p className="font-semibold text-gray-800">
                      {selectedTenantDetail.cccd || "---"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      Ngày sinh
                    </label>
                    <p className="font-semibold text-gray-800">
                      {selectedTenantDetail.info?.dob || "---"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      Email
                    </label>
                    <p className="font-semibold text-gray-800">
                      {selectedTenantDetail.user?.email ||
                        selectedTenantDetail.info?.email ||
                        "---"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      Nghề nghiệp
                    </label>
                    <p className="font-semibold text-gray-800">
                      {selectedTenantDetail.info?.job || "---"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      Biển số xe
                    </label>
                    <p className="font-semibold text-gray-800">
                      {selectedTenantDetail.info?.licensePlate || "---"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      Quê quán
                    </label>
                    <p className="font-semibold text-gray-800">
                      {selectedTenantDetail.info?.hometown || "---"}
                    </p>
                  </div>
                  {selectedTenantDetail.info?.note && (
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                        Ghi chú
                      </label>
                      <p className="font-semibold text-gray-800 italic">
                        {selectedTenantDetail.info.note}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* photos */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Giấy tờ tùy thân
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-2 h-32 flex items-center justify-center">
                    {selectedTenantDetail.info?.cccdFront ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selectedTenantDetail.info!.cccdFront}
                        alt="CCCD Front"
                        className="h-full object-contain cursor-pointer"
                        onClick={() =>
                          window.open(
                            selectedTenantDetail.info!.cccdFront!,
                            "_blank",
                          )
                        }
                      />
                    ) : (
                      <span className="text-xs text-gray-300">
                        Không có ảnh mặt trước
                      </span>
                    )}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-2 h-32 flex items-center justify-center">
                    {selectedTenantDetail.info?.cccdBack ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selectedTenantDetail.info!.cccdBack}
                        alt="CCCD Back"
                        className="h-full object-contain cursor-pointer"
                        onClick={() =>
                          window.open(
                            selectedTenantDetail.info!.cccdBack!,
                            "_blank",
                          )
                        }
                      />
                    ) : (
                      <span className="text-xs text-gray-300">
                        Không có ảnh mặt sau
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* DELETE CONFIRMATION MODAL */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            ></div>
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <Trash2 size={24} />
                </div>
                <h2 className="text-2xl claude-header mb-2">
                  Xóa khách thuê này?
                </h2>
                <p className="text-gray-500">
                  Hành động này không thể hoàn tác. Bạn chỉ có thể xóa khi khách
                  thuê{" "}
                  <span className="font-bold text-gray-800">
                    KHÔNG CÒN HỢP ĐỒNG
                  </span>{" "}
                  nào.
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="claude-btn-secondary w-full"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors w-full shadow-sm"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
