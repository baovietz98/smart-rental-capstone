"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Home,
  Hotel,
  Warehouse,
  LayoutGrid,
  Loader2,
  Edit,
  Trash2,
  Plus,
  MapPin,
} from "lucide-react";
import axios from "@/lib/axios-client";
import { message, Form, Input } from "antd";

// Filter definitions
const buildingFilters = [
  { id: "all", label: "Tất cả", icon: <LayoutGrid size={18} /> },
  { id: "apartment", label: "Chung cư Mini", icon: <Building2 size={18} /> },
  { id: "house", label: "Nhà trọ", icon: <Home size={18} /> },
  { id: "homestay", label: "Homestay", icon: <Hotel size={18} /> },
  { id: "dorm", label: "Ký túc xá", icon: <Warehouse size={18} /> },
];

interface Building {
  id: number;
  name: string;
  address: string;
  totalRooms: number;
  availableRooms: number;
  rentedRooms: number;
  maintenanceRooms: number;
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [activeFilter, setActiveFilter] = useState("all");
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // 1. Fetch Buildings
  const fetchBuildings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/buildings");
      console.log("Buildings response:", res.data);
      setBuildings(Array.isArray(res.data) ? res.data : []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      const msg =
        error.response?.data?.message || "Không thể tải danh sách nhà!";
      setError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  // 2. Create Building
  const handleCreateBuilding = async (values: any) => {
    try {
      await axios.post("/buildings", values);
      message.success("Thêm nhà thành công!");
      setIsCreateModalOpen(false);
      form.resetFields();
      fetchBuildings();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi thêm nhà");
    }
  };

  // 3. Edit Building
  const openEditModal = (building: Building) => {
    setEditingBuilding(building);
    editForm.setFieldsValue({
      name: building.name,
      address: building.address,
    });
  };

  const handleUpdateBuilding = async (values: any) => {
    if (!editingBuilding) return;
    try {
      await axios.patch(`/buildings/${editingBuilding.id}`, values);
      message.success("Cập nhật thành công!");
      setEditingBuilding(null);
      fetchBuildings();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi cập nhật nhà");
    }
  };

  // 4. Delete Building
  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await axios.delete(`/buildings/${deleteId}`);
        message.success("Đã xóa nhà thành công!");
        fetchBuildings();
      } catch (error: any) {
        if (error.response?.status === 404) {
          message.error("Không thể xóa: Nhà này đang có phòng!");
        } else {
          message.error("Lỗi khi xóa nhà");
        }
      } finally {
        setDeleteId(null);
      }
    }
  };

  return (
    <div className="claude-page p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl claude-header mb-2">
              Buildings
            </h1>
            <p className="text-gray-500 font-sans text-lg">
              Quản lý danh sách tòa nhà & khu trọ.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="claude-btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Thêm tòa nhà</span>
          </button>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-2 mb-8">
          {buildingFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeFilter === filter.id
                  ? "bg-[#D97757] text-white shadow-md"
                  : "bg-white text-gray-600 border border-[#E5E5E0] hover:bg-[#F9F9F7] hover:border-[#D97757]/30"
              }`}
            >
              {filter.icon}
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* GRID VIEW */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
            <strong>Lỗi:</strong> {error}. Vui lòng thử tải lại hoặc đăng nhập
            lại.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-10 h-10 text-[#D97757]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(buildings) &&
              buildings.map((item) => {
                // Badge Logic
                const isEmpty = item.totalRooms === 0;
                const isFull = !isEmpty && item.availableRooms === 0;

                return (
                  <div
                    key={item.id}
                    className="claude-card p-6 hover:-translate-y-1 transition-all duration-300 group"
                  >
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl claude-header leading-tight mb-2">
                          <Link
                            href={`/rooms?buildingId=${item.id}`}
                            className="hover:text-[#D97757] transition-colors"
                          >
                            {item.name}
                          </Link>
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 line-clamp-1">
                          <MapPin size={14} className="text-[#D97757]" />{" "}
                          {item.address}
                        </p>
                      </div>

                      {isEmpty ? (
                        <span className="claude-badge bg-gray-100 text-gray-600 border border-gray-200">
                          Empty
                        </span>
                      ) : isFull ? (
                        <span className="claude-badge claude-badge-orange">
                          Full
                        </span>
                      ) : (
                        <span className="claude-badge claude-badge-green">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Card Body (Stats) */}
                    <div className="grid grid-cols-2 gap-4 py-6 border-y border-[#F0F0F0] mb-4">
                      <div className="text-center p-2 rounded-lg hover:bg-[#F9F9F7] transition-colors">
                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                          Phòng
                        </span>
                        <span className="text-2xl font-bold text-[#2D2D2C]">
                          {item.totalRooms}
                        </span>
                      </div>
                      <div className="text-center p-2 rounded-lg hover:bg-[#F9F9F7] transition-colors">
                        <span className="block text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">
                          Trống
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {item.availableRooms}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer (Actions) */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-mono">
                        ID: #{item.id}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="flex items-center gap-1 px-3 py-1.5 text-gray-600 bg-white border border-gray-200 rounded-md hover:border-[#D97757] hover:text-[#D97757] transition-all shadow-sm"
                        >
                          <Edit size={14} />{" "}
                          <span className="font-semibold">Sửa</span>
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-red-600 bg-white border border-gray-200 rounded-md hover:border-red-500 hover:bg-red-50 transition-all shadow-sm"
                        >
                          <Trash2 size={14} />{" "}
                          <span className="font-semibold">Xóa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* Add New Card Placeholder */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="border-2 border-dashed border-[#E5E5E0] rounded-xl hover:border-[#D97757] hover:bg-[#F9F9F7] min-h-[250px] flex flex-col items-center justify-center gap-4 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-white border border-[#E5E5E0] group-hover:border-[#D97757] flex items-center justify-center transition-colors shadow-sm">
                <Plus
                  size={24}
                  className="text-gray-400 group-hover:text-[#D97757]"
                />
              </div>
              <span className="font-semibold text-gray-400 group-hover:text-[#D97757]">
                Thêm tòa nhà mới
              </span>
            </button>
          </div>
        )}

        {/* CREATE MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
              onClick={() => setIsCreateModalOpen(false)}
            ></div>
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>

              <div className="mb-6">
                <h2 className="text-2xl claude-header mb-2">
                  Thêm tòa nhà mới
                </h2>
                <p className="text-gray-500">
                  Nhập thông tin cơ bản cho tòa nhà mới của bạn.
                </p>
              </div>

              <Form
                form={form}
                onFinish={handleCreateBuilding}
                layout="vertical"
              >
                <div className="space-y-4">
                  <Form.Item
                    label={
                      <span className="font-medium text-gray-700">
                        Tên tòa nhà
                      </span>
                    }
                    name="name"
                    rules={[{ required: true, message: "Nhập tên tòa nhà!" }]}
                  >
                    <Input
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757] outline-none transition-all"
                      placeholder="VD: Nhà trọ Xanh"
                      autoFocus
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="font-medium text-gray-700">Địa chỉ</span>
                    }
                    name="address"
                    rules={[{ required: true, message: "Nhập địa chỉ!" }]}
                  >
                    <Input
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757] outline-none transition-all"
                      placeholder="VD: 123 Đường Láng"
                    />
                  </Form.Item>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="claude-btn-secondary"
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="claude-btn-primary">
                    Tạo tòa nhà
                  </button>
                </div>
              </Form>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editingBuilding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
              onClick={() => setEditingBuilding(null)}
            ></div>
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => setEditingBuilding(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>

              <div className="mb-6">
                <h2 className="text-2xl claude-header mb-2">
                  Chỉnh sửa tòa nhà
                </h2>
                <p className="text-gray-500">
                  Cập nhật thông tin cho {editingBuilding.name}.
                </p>
              </div>

              <Form
                form={editForm}
                onFinish={handleUpdateBuilding}
                layout="vertical"
              >
                <div className="space-y-4">
                  <Form.Item
                    label={
                      <span className="font-medium text-gray-700">
                        Tên tòa nhà
                      </span>
                    }
                    name="name"
                    rules={[{ required: true, message: "Nhập tên tòa nhà!" }]}
                  >
                    <Input
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757] outline-none transition-all"
                      autoFocus
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="font-medium text-gray-700">Địa chỉ</span>
                    }
                    name="address"
                    rules={[{ required: true, message: "Nhập địa chỉ!" }]}
                  >
                    <Input className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757] outline-none transition-all" />
                  </Form.Item>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingBuilding(null)}
                    className="claude-btn-secondary"
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="claude-btn-primary">
                    Lưu thay đổi
                  </button>
                </div>
              </Form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
              onClick={() => setDeleteId(null)}
            ></div>
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <Trash2 size={24} />
                </div>
                <h2 className="text-2xl claude-header mb-2">
                  Xóa tòa nhà này?
                </h2>
                <p className="text-gray-500">
                  Hành động này không thể hoàn tác. Bạn chỉ có thể xóa khi tòa
                  nhà{" "}
                  <span className="font-bold text-gray-800">
                    KHÔNG CÒN PHÒNG
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
