"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Calendar,
  User,
  Home,
  Loader2,
  X,
  Search,
  ArrowRight,
  Trash2,
  Eye,
  Phone,
} from "lucide-react";
import axios from "@/lib/axios-client";
import { servicesApi } from "@/lib/api/services";
import { Service } from "@/types/service";
import { message, Input, Select, Modal } from "antd";
import dayjs from "dayjs";
import LiquidationModal from "@/components/contracts/LiquidationModal";
import ExtensionModal from "@/components/contracts/ExtensionModal";
import ContractDetailModal from "@/components/contracts/ContractDetailModal";

import CreateContractWizard from "@/components/contracts/CreateContractWizard";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modals State
  const [liquidationModalOpen, setLiquidationModalOpen] = useState(false);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters State
  const [filterStatus, setFilterStatus] = useState<string>("ACTIVE");
  const [filterBuilding, setFilterBuilding] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");

  // Data for Wizard (still fetched here to pass down, or fetched inside?)
  // We fetched buildings and services here previously.
  const [buildings, setBuildings] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/contracts");
      setContracts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải danh sách hợp đồng!");
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const res = await axios.get("/buildings");
      setBuildings(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await servicesApi.getAll();
      setServices(res);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchBuildings();
    fetchServices();
  }, []);

  // --- FILTER LOGIC ---
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      // 1. Status Filter
      if (filterStatus === "ACTIVE" && !contract.isActive) return false;
      if (filterStatus === "ENDED" && contract.isActive) return false;
      if (filterStatus === "EXPIRING") {
        if (!contract.isActive || !contract.endDate) return false;
        const daysLeft = dayjs(contract.endDate).diff(dayjs(), "day");
        if (daysLeft < 0 || daysLeft > 30) return false;
      }

      // 2. Building Filter
      if (filterBuilding && contract.room?.building?.id !== filterBuilding)
        return false;

      // 3. Search Filter
      if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        const tenantName = contract.tenant?.fullName?.toLowerCase() || "";
        const roomName = contract.room?.name?.toLowerCase() || "";
        const contractCode = `CTR-${contract.id.toString().padStart(3, "0")}`;

        if (
          !tenantName.includes(lowerSearch) &&
          !roomName.includes(lowerSearch) &&
          !contractCode.toLowerCase().includes(lowerSearch)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [contracts, filterStatus, filterBuilding, searchText]);

  // --- ACTIONS ---
  const handleLiquidation = async (values: any) => {
    setActionLoading(true);
    try {
      // Note: In a real app, we might want to save the liquidation record/invoice here.
      // For now, we just terminate the contract as per requirement.
      await axios.patch(`/contracts/${selectedContract.id}/terminate`);
      message.success(
        `Đã thanh lý hợp đồng. Hoàn lại khách: ${(
          (selectedContract.deposit || 0) - (values.deductions || 0)
        ).toLocaleString()}đ`
      );
      setLiquidationModalOpen(false);
      fetchContracts();
    } catch (error) {
      message.error("Lỗi khi thanh lý hợp đồng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtension = async (values: any) => {
    setActionLoading(true);
    try {
      await axios.patch(`/contracts/${selectedContract.id}`, {
        endDate: values.endDate.format("YYYY-MM-DD"),
        price: values.price,
      });
      message.success("Gia hạn hợp đồng thành công!");
      setExtensionModalOpen(false);
      fetchContracts();
    } catch (error) {
      message.error("Lỗi khi gia hạn hợp đồng");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="claude-page p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl claude-header mb-2">
              Contracts
            </h1>
            <p className="text-gray-500 font-sans text-lg">
              Quản lý hợp đồng thuê nhà.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="claude-btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Tạo hợp đồng mới</span>
          </button>
        </div>

        {/* FILTERS */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            className="w-full h-11"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { label: "Tất cả trạng thái", value: "ALL" },
              { label: "Đang hiệu lực", value: "ACTIVE" },
              { label: "Sắp hết hạn (30 ngày)", value: "EXPIRING" },
              { label: "Đã thanh lý", value: "ENDED" },
            ]}
          />
          <Select
            className="w-full h-11"
            placeholder="Lọc theo tòa nhà"
            allowClear
            onChange={setFilterBuilding}
            options={buildings.map((b) => ({ label: b.name, value: b.id }))}
          />
          <Input
            className="w-full h-11 rounded-lg border-gray-200 hover:border-[#D97757] focus:border-[#D97757]"
            placeholder="Tìm tên khách, phòng, mã HĐ..."
            prefix={<Search size={18} className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* CONTRACTS LIST */}
        <div className="grid gap-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-8 h-8 text-[#D97757]" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-400">Không tìm thấy hợp đồng nào.</p>
            </div>
          ) : (
            filteredContracts.map((contract) => {
              const start = dayjs(contract.startDate);
              const end = contract.endDate ? dayjs(contract.endDate) : null;
              const isExpiring =
                end &&
                end.diff(dayjs(), "day") <= 30 &&
                end.diff(dayjs(), "day") >= 0;

              return (
                <div
                  key={contract.id}
                  className="claude-card p-5 sm:p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-[#D97757]/30 transition-all hover:shadow-md"
                >
                  {/* LEFT: ROOM info */}
                  <div className="flex-1 w-full md:w-auto self-start md:self-center">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold font-mono border border-gray-200">
                        #{contract.id}
                      </span>
                      {contract.isActive ? (
                        isExpiring ? (
                          <span className="bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-orange-100">
                            SẮP HẾT HẠN
                          </span>
                        ) : (
                          <span className="bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-100">
                            HIỆU LỰC
                          </span>
                        )
                      ) : (
                        <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-red-100">
                          ĐÃ THANH LÝ
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 flex flex-wrap items-center gap-2 mb-2">
                      <span className="flex items-center gap-2">
                        <Home size={18} className="text-[#D97757]" />
                        {contract.room?.name}
                      </span>
                      <span className="text-gray-400 font-normal text-sm md:text-base">
                        @ {contract.room?.building?.name}
                      </span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                        <User size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-700">
                          {contract.tenant?.fullName}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                        <Phone size={14} className="text-gray-400" />
                        <span className="font-mono">
                          {contract.tenant?.phone}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* MIDDLE: TIMELINE & PRICE */}
                  <div className="flex-1 w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                          Thời hạn
                        </p>
                        <div className="text-sm font-medium flex items-center gap-2 text-gray-700">
                          <span className="font-mono">
                            {start.format("DD/MM/YY")}
                          </span>
                          <ArrowRight size={12} className="text-gray-300" />
                          <span className="font-mono">
                            {end ? end.format("DD/MM/YY") : "∞"}
                          </span>
                        </div>
                        {isExpiring && contract.isActive && (
                          <p className="text-xs text-red-500 font-bold mt-1 bg-red-50 inline-block px-2 py-0.5 rounded">
                            Còn {end?.diff(dayjs(), "day")} ngày
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                          Giá trị hợp đồng
                        </p>
                        <p className="text-base font-bold text-[#D97757]">
                          {contract.price?.toLocaleString()} ₫
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Cọc: {contract.deposit?.toLocaleString()} ₫
                          {contract.paidDeposit < contract.deposit && (
                            <span className="text-red-500 font-bold ml-1 bg-red-50 px-1 rounded">
                              (!Thiếu)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: ACTIONS */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0">
                    <button
                      onClick={() => {
                        setSelectedContract(contract);
                        setDetailModalOpen(true);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#D97757] hover:bg-orange-50 rounded-xl transition-all border border-transparent hover:border-orange-100"
                      title="Xem chi tiết"
                    >
                      <Eye size={20} />
                    </button>
                    {contract.isActive && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedContract(contract);
                            setExtensionModalOpen(true);
                          }}
                          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                          title="Gia hạn"
                        >
                          <Calendar size={20} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContract(contract);
                            setLiquidationModalOpen(true);
                          }}
                          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                          title="Thanh lý"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODALS */}
      <ContractDetailModal
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        contract={selectedContract}
        services={services}
      />

      <LiquidationModal
        open={liquidationModalOpen}
        onCancel={() => setLiquidationModalOpen(false)}
        onConfirm={handleLiquidation}
        contract={selectedContract}
        loading={actionLoading}
      />

      <ExtensionModal
        open={extensionModalOpen}
        onCancel={() => setExtensionModalOpen(false)}
        onConfirm={handleExtension}
        contract={selectedContract}
        loading={actionLoading}
      />

      {/* CREATE CONTRACT WIZARD MODAL */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        centered
        destroyOnHidden // Ensure everything is reset when closed
        className="claude-modal"
        closeIcon={
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <X size={18} />
          </div>
        }
      >
        <CreateContractWizard
          onCancel={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchContracts();
          }}
          buildings={buildings}
          services={services}
        />
      </Modal>
    </div>
  );
}
