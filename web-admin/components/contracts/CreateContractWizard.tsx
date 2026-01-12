"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  User,
  Home,
  CheckCircle,
  Search,
  ArrowRight,
  Zap,
} from "lucide-react";
import axios from "@/lib/axios-client";
import { message, Form, Input, DatePicker, Select, InputNumber } from "antd";
import dayjs from "dayjs";
import UploadCCCD from "@/components/inputs/UploadCCCD";
import ContractWizardStep from "./ContractWizardStep";
import { Service } from "@/types/service";

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
  buildings: any[];
  services: Service[];
}

export default function CreateContractWizard({
  onCancel,
  onSuccess,
  buildings,
  services,
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  // Selection State
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);

  // Data State
  const [rooms, setRooms] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  // Forms
  const [contractForm] = Form.useForm();
  const [tenantForm] = Form.useForm();

  // --- HANDLERS ---
  const handleBuildingChange = async (buildingId: number) => {
    setSelectedBuilding(buildingId);
    setSelectedRoom(null);
    try {
      const res = await axios.get(`/rooms/by-building/${buildingId}`);
      // Only show AVAILABLE rooms
      const availableRooms = res.data.filter(
        (r: any) => r.status === "AVAILABLE"
      );
      setRooms(availableRooms);
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải danh sách phòng");
    }
  };

  const handleSearchTenant = async (value: string) => {
    if (!value) return;
    try {
      const res = await axios.get(`/tenants/search?q=${value}`);
      setTenants(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateTenantInline = async (values: any) => {
    try {
      const res = await axios.post("/tenants", values);
      setSelectedTenant(res.data);
      message.success("Đã tạo khách mới!");
    } catch (error) {
      console.error(error);
      message.error("Lỗi tạo khách hàng");
    }
  };

  const handleCreateContract = async () => {
    try {
      const values = await contractForm.validateFields();
      if (!selectedRoom || !selectedTenant) return;

      const payload = {
        ...values,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate
          ? values.endDate.format("YYYY-MM-DD")
          : undefined,
        roomId: selectedRoom.id,
        tenantId: selectedTenant.id,
      };

      await axios.post("/contracts", payload);
      message.success("Tạo hợp đồng thành công! 🎉");
      onSuccess();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tạo hợp đồng");
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (currentStep === 2 && selectedRoom) {
      contractForm.setFieldsValue({
        price: selectedRoom.price,
        deposit: selectedRoom.price,
        startDate: dayjs(),
      });
    }
  }, [currentStep, selectedRoom, contractForm]);

  return (
    <div className="p-2 md:p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Tạo Hợp Đồng Mới
        </h2>
        <p className="text-sm text-gray-500">
          Hoàn tất 3 bước để tạo hợp đồng thuê phòng
        </p>
      </div>

      {/* STEPPER */}
      <div className="flex justify-between items-center max-w-2xl mx-auto mb-10 px-4">
        <ContractWizardStep
          current={currentStep}
          index={0}
          icon={<Home size={20} />}
          title="Chọn Phòng"
        />
        <div className="flex-1 h-0.5 bg-gray-100 mx-4" />
        <ContractWizardStep
          current={currentStep}
          index={1}
          icon={<User size={20} />}
          title="Khách Thuê"
        />
        <div className="flex-1 h-0.5 bg-gray-100 mx-4" />
        <ContractWizardStep
          current={currentStep}
          index={2}
          icon={<FileText size={20} />}
          title="Hợp Đồng"
        />
      </div>

      {/* STEP 1: SELECT ROOM */}
      {currentStep === 0 && (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="mb-6">
            <Select
              className="w-full h-14 text-lg"
              placeholder="Chọn tòa nhà..."
              options={buildings.map((b) => ({
                label: b.name,
                value: b.id,
              }))}
              onChange={handleBuildingChange}
            />
          </div>

          {selectedBuilding && (
            <div>
              <h3 className="text-gray-500 font-bold mb-4 uppercase text-xs tracking-wider">
                Danh sách phòng trống ({rooms.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`
                      p-4 rounded-xl border cursor-pointer transition-all relative group overflow-hidden
                      ${
                        selectedRoom?.id === room.id
                          ? "border-[#D97757] bg-orange-50 shadow-md ring-2 ring-[#D97757]/20"
                          : "border-gray-200 bg-white hover:border-[#D97757] hover:shadow-sm"
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-800 text-lg">
                        {room.name}
                      </h4>
                      {selectedRoom?.id === room.id && (
                        <CheckCircle
                          size={20}
                          className="text-[#D97757] animate-in zoom-in"
                        />
                      )}
                    </div>
                    <div className="text-[#D97757] font-bold mb-1">
                      {room.price?.toLocaleString()} ₫
                    </div>
                    {/* Assets/Tags */}
                    {room.assets && room.assets.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {room.assets
                          .slice(0, 3)
                          .map((asset: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-gray-50 text-gray-500 border border-gray-100 px-1.5 py-0.5 rounded"
                            >
                              {asset.name || asset}
                            </span>
                          ))}
                        {room.assets.length > 3 && (
                          <span className="text-[10px] text-gray-400">
                            +{room.assets.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {rooms.length === 0 && (
                  <div className="col-span-3 text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                    <Home size={24} className="mx-auto mb-2 opacity-20" />
                    <p>Không có phòng trống nào.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: SELECT TENANT */}
      {currentStep === 1 && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Option A: Search */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-[#D97757]/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Search size={64} className="text-[#D97757]" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-gray-800">
              Khách thuê cũ
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Tìm kiếm khách hàng đã có trong hệ thống
            </p>

            <Select
              showSearch
              className="w-full h-12"
              placeholder="Nhập tên hoặc số điện thoại..."
              defaultActiveFirstOption={false}
              suffixIcon={null}
              filterOption={false}
              onSearch={handleSearchTenant}
              onChange={(val, option: any) => setSelectedTenant(option.data)}
              notFoundContent={null}
              options={tenants.map((t) => ({
                label: `${t.fullName} - ${t.phone}`,
                value: t.id,
                data: t,
              }))}
            />

            {selectedTenant && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in zoom-in duration-300">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <div className="font-bold text-green-800">
                    {selectedTenant.fullName}
                  </div>
                  <div className="text-sm text-green-600 font-mono">
                    {selectedTenant.phone}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Option B: Create New */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 relative group hover:bg-white hover:border-gray-200 hover:shadow-md transition-all">
            <h3 className="font-bold text-lg mb-1 text-gray-800 flex items-center gap-2">
              <Plus size={18} className="text-[#D97757]" /> Tạo khách mới
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Thêm khách hàng mới ngay tại đây
            </p>

            <Form
              form={tenantForm}
              onFinish={handleCreateTenantInline}
              layout="vertical"
            >
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="fullName"
                  label="Họ tên"
                  rules={[{ required: true }]}
                >
                  <Input
                    className="h-10 rounded-lg"
                    placeholder="Nguyễn Văn A"
                  />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[{ required: true }]}
                >
                  <Input className="h-10 rounded-lg" placeholder="0909..." />
                </Form.Item>

                {/* CCCD Upload */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <Form.Item label="CCCD Mặt Trước" className="mb-0">
                    <UploadCCCD
                      side="front"
                      onUpload={(url) =>
                        tenantForm.setFieldValue(["info", "cccdFront"], url)
                      }
                    />
                  </Form.Item>
                  <Form.Item label="CCCD Mặt Sau" className="mb-0">
                    <UploadCCCD
                      side="back"
                      onUpload={(url) =>
                        tenantForm.setFieldValue(["info", "cccdBack"], url)
                      }
                    />
                  </Form.Item>
                  {/* Hidden fields to store URLs */}
                  <Form.Item name={["info", "cccdFront"]} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item name={["info", "cccdBack"]} hidden>
                    <Input />
                  </Form.Item>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button className="claude-btn-secondary text-sm">
                  Lưu hồ sơ khách
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* STEP 3: CONTRACT DETAILS */}
      {currentStep === 2 && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FileText className="text-[#D97757]" size={20} />
              Thiết lập hợp đồng
            </h3>

            <Form form={contractForm} layout="vertical" className="claude-form">
              <div className="grid grid-cols-2 gap-6">
                <Form.Item
                  name="startDate"
                  label="Ngày bắt đầu"
                  rules={[{ required: true }]}
                >
                  <DatePicker
                    className="w-full h-11 border-gray-200 rounded-lg"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
                <Form.Item name="endDate" label="Ngày kết thúc (Tùy chọn)">
                  <DatePicker
                    className="w-full h-11 border-gray-200 rounded-lg"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
                <Form.Item
                  name="price"
                  label="Giá thuê (VNĐ)"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    className="w-full border-gray-200 rounded-lg font-bold"
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                  />
                </Form.Item>
                <Form.Item
                  name="deposit"
                  label="Tiền cọc (VNĐ)"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    className="w-full border-gray-200 rounded-lg font-bold"
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                  />
                </Form.Item>
              </div>

              {/* SERVICES */}
              <div className="mt-8">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-yellow-500" />
                  Chốt chỉ số điện/nước ban đầu
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {services
                    .filter((s) => s.type === "INDEX")
                    .map((service) => (
                      <Form.Item
                        key={service.id}
                        label={service.name}
                        name={["initialIndexes", service.id.toString()]}
                        rules={[
                          {
                            required: true,
                            message: `Nhập số ${service.name}!`,
                          },
                        ]}
                      >
                        <InputNumber
                          className="w-full border-gray-200 rounded-lg"
                          placeholder="0"
                        />
                      </Form.Item>
                    ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  * Chỉ số này sẽ tính là số cũ cho tháng đầu tiên.
                </p>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <FileText size={20} className="text-gray-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">
                    Tóm tắt hợp đồng
                  </h4>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      Phòng:{" "}
                      <span className="font-bold text-gray-900">
                        {selectedRoom?.name}
                      </span>
                    </p>
                    <p>
                      Khách thuê:{" "}
                      <span className="font-bold text-gray-900">
                        {selectedTenant?.fullName}
                      </span>
                    </p>
                    {selectedTenant?.info?.cccdFront && (
                      <p className="text-green-600 text-xs flex items-center gap-1">
                        <CheckCircle size={10} /> Đã có hồ sơ CCCD
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
        <button
          disabled={currentStep === 0}
          onClick={() => setCurrentStep(currentStep - 1)}
          className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 flex items-center gap-2"
        >
          Quay lại
        </button>

        {currentStep < 2 ? (
          <button
            disabled={
              (currentStep === 0 && !selectedRoom) ||
              (currentStep === 1 && !selectedTenant)
            }
            onClick={() => setCurrentStep(currentStep + 1)}
            className="px-8 py-2.5 font-bold bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 flex items-center gap-2"
          >
            Tiếp tục <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleCreateContract}
            className="px-8 py-2.5 font-bold bg-[#D97757] text-white rounded-xl shadow-lg shadow-orange-200 hover:bg-[#c06040] hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <CheckCircle size={18} />
            Xác nhận tạo HĐ
          </button>
        )}
      </div>
    </div>
  );
}
