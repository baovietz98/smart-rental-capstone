"use client";

import { useState, useEffect, useMemo } from "react";
import { message, Spin, Empty, Checkbox, Dropdown, Modal, Tooltip } from "antd";
import {
  PlusOutlined,
  LoadingOutlined,
  DollarOutlined,
  ToolOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  HomeOutlined,
  SearchOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "next/navigation";
import axios from "@/lib/axios-client";
import CreateRoomModal from "@/components/rooms/CreateRoomModal";
import EditRoomModal from "@/components/rooms/EditRoomModal";
import BulkActionModals, {
  BulkActionType,
} from "@/components/rooms/BulkActionModals";
import MaintenanceActionModal from "@/components/rooms/MaintenanceActionModal";
import MajorMaintenanceWarningModal from "@/components/rooms/MajorMaintenanceWarningModal";
import MoveRoomModal from "@/components/rooms/MoveRoomModal";
import { useRouter } from "next/navigation";
import RoomDetailModal from "@/components/rooms/RoomDetailModal";
import { servicesApi } from "@/lib/api/services";
import { Service } from "@/types/service";
import CreateContractWizard from "@/components/contracts/CreateContractWizard";

// Helper: Format Currency
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

export default function AllRoomsPage() {
  const router = useRouter();

  // Data State
  const [rooms, setRooms] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]); // Added services state
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeStatusFilter, setActiveStatusFilter] = useState("ALL");
  const [activeBuildingFilter, setActiveBuildingFilter] = useState<
    number | "ALL"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  // Detail Modal State
  const [detailRoomId, setDetailRoomId] = useState<number | null>(null);

  // Create Contract State
  const [createContractRoom, setCreateContractRoom] = useState<any>(null);
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);

  // Advanced Maintenance State
  const [maintenanceRoom, setMaintenanceRoom] = useState<any>(null); // Room triggering maintenance
  const [warningRoom, setWarningRoom] = useState<any>(null); // Room triggering warning
  const [moveContractId, setMoveContractId] = useState<number | null>(null);
  const [isMoveRoomModalOpen, setIsMoveRoomModalOpen] = useState(false);

  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");

  // Bulk Action State
  const [bulkActionType, setBulkActionType] = useState<BulkActionType>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // 1. FETCH DATA
  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel fetch: All Rooms, Buildings, Services
      const [roomsRes, buildingsRes, servicesRes] = await Promise.all([
        axios.get("/rooms"),
        axios.get("/buildings"),
        servicesApi.getAll(),
      ]);
      setRooms(roomsRes.data);
      setBuildings(buildingsRes.data);
      setServices(servicesRes);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải dữ liệu phòng!");
    } finally {
      setLoading(false);
    }
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    fetchData();
  }, []);

  // Handle URL params for filtering
  useEffect(() => {
    const buildingIdParam = searchParams.get("buildingId");
    if (buildingIdParam) {
      setActiveBuildingFilter(Number(buildingIdParam));
    }
  }, [searchParams]);

  // 2. FILTER & SEARCH LOGIC
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // 1. Filter by Status
      const statusMatch =
        activeStatusFilter === "ALL" || room.status === activeStatusFilter;

      // 2. Filter by Building
      const buildingMatch =
        activeBuildingFilter === "ALL" ||
        room.buildingId === activeBuildingFilter;

      // 3. Search by Name (Room Code)
      const searchMatch = room.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return statusMatch && buildingMatch && searchMatch;
    });
  }, [rooms, activeStatusFilter, activeBuildingFilter, searchQuery]);

  // Statistics for badges (depend on Building Filter but NOT Status Filter)
  const stats = useMemo(() => {
    const roomsInBuilding =
      activeBuildingFilter === "ALL"
        ? rooms
        : rooms.filter((r) => r.buildingId === activeBuildingFilter);

    return {
      all: roomsInBuilding.length,
      available: roomsInBuilding.filter((r) => r.status === "AVAILABLE").length,
      rented: roomsInBuilding.filter((r) => r.status === "RENTED").length,
      maintenance: roomsInBuilding.filter((r) => r.status === "MAINTENANCE")
        .length,
    };
  }, [rooms, activeBuildingFilter]);

  // 3. ACTIONS
  // NOTE: Create Room from here needs BuildingID selection logic or strict to inside building page.
  // Ideally, redirect user to specific building or show Modal with Building Select.
  // simpler for now: Disable "Add Room" here OR redirect to Buildings list?
  // Let's allow simple Add but maybe default building needs to be handled in Modal?
  // Checking CreateRoomModal... It likely takes BuildingId as prop.
  // We should create a modified Modal or handle it.
  // For safety, let's keep "Add Room" but maybe it requires a Building to be filtered first?
  // OR -> Just hide Add Room button here if no building selected, enforce flow?
  // Actually, Users prefer flexibility. Let's see...

  const handleCreateRoom = async (values: any) => {
    try {
      const payload = {
        ...values,
        price: Number(values.price),
        depositPrice: values.depositPrice
          ? Number(values.depositPrice)
          : undefined,
        area: values.area ? Number(values.area) : undefined,
        floor: values.floor ? Number(values.floor) : 1,
        maxTenants: values.maxTenants ? Number(values.maxTenants) : 2,
        // buildingId is handled by form if not passed
      };

      await axios.post("/rooms", payload);
      message.success("Thêm phòng thành công! 🎉");
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Create room error:", error);
      message.error(error.response?.data?.message || "Lỗi khi thêm phòng");
    }
  };

  const handleUpdateRoom = async (roomId: number, values: any) => {
    try {
      const payload = {
        ...values,
        price: Number(values.price),
        depositPrice: values.depositPrice
          ? Number(values.depositPrice)
          : undefined,
        area: values.area ? Number(values.area) : undefined,
        floor: values.floor ? Number(values.floor) : 1,
        maxTenants: values.maxTenants ? Number(values.maxTenants) : 2,
      };

      await axios.patch(`/rooms/${roomId}`, payload);
      message.success("Cập nhật phòng thành công! ✅");
      setIsEditModalOpen(false);
      setEditingRoom(null);
      fetchData();
    } catch (error: any) {
      console.error("Update room error:", error);
      message.error("Lỗi khi cập nhật phòng");
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<any>(null);

  // ... existing code ...

  const handleDeleteRoom = (room: any) => {
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await axios.delete(`/rooms/${roomToDelete.id}`);
      message.success("Đã xóa phòng thành công! 🗑️");
      setIsDeleteModalOpen(false);
      setRoomToDelete(null);
      fetchData();
    } catch (error: any) {
      message.error("Lỗi khi xóa phòng. Có thể phòng đang có hợp đồng.");
    }
  };

  const handleUpdateStatus = async (roomId: number, status: string) => {
    try {
      await axios.patch(`/rooms/${roomId}/status`, null, {
        params: { status },
      });
      message.success("Cập nhật trạng thái thành công!");
      fetchData();
    } catch (error: any) {
      message.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const toggleSelection = (roomId: number) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId],
    );
  };

  const handleBulkAction = (actionType: BulkActionType) => {
    setBulkActionType(actionType);
  };

  const confirmBulkAction = async (values: any) => {
    if (!bulkActionType) return;
    setIsBulkLoading(true);
    try {
      const payload = { roomIds: selectedRooms, ...values };

      if (bulkActionType === "PRICE") {
        await axios.post("/rooms/bulk/price", payload);
        message.success(`Đã cập nhật giá cho ${selectedRooms.length} phòng!`);
      } else if (bulkActionType === "ISSUE") {
        await axios.post("/rooms/bulk/issues", payload);
        message.success(`Đã tạo sự cố cho ${selectedRooms.length} phòng!`);
      } else if (bulkActionType === "NOTIFY") {
        await axios.post("/rooms/bulk/notify", payload);
        message.success(`Đã gửi thông báo đến ${selectedRooms.length} phòng!`);
      }

      setBulkActionType(null);
      setSelectedRooms([]);
      setIsSelectionMode(false);
      fetchData();
    } catch (error) {
      console.error("Bulk action error", error);
      message.error("Lỗi khi thực hiện thao tác hàng loạt");
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="claude-page min-h-screen bg-[#F9F9F7] text-[#2D2D2C] font-sans p-6 md:p-12 transition-all">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl claude-header mb-2 text-[#2D2D2C]">
            Tất cả phòng
          </h1>
          <p className="text-gray-500 font-sans text-lg">
            Quản lý toàn bộ danh sách phòng của hệ thống
          </p>
        </div>

        {/* VIEW TOOLS */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="claude-btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <PlusOutlined />
            <span>Thêm phòng</span>
          </button>

          {/* VIEW MODE TOGGLE */}
          <div className="flex bg-white p-1 gap-1 rounded-xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setViewMode("GRID")}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === "GRID"
                  ? "bg-[#F2F2F0] text-[#D97757] shadow-sm"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
              title="Xem lưới"
            >
              <AppstoreOutlined className="text-lg" />
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === "LIST"
                  ? "bg-[#F2F2F0] text-[#D97757] shadow-sm"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
              title="Xem danh sách"
            >
              <UnorderedListOutlined className="text-lg" />
            </button>
          </div>

          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-gray-400 hidden md:inline tracking-wider">
              Chọn:
            </span>
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedRooms([]);
              }}
              className={`
                relative w-10 h-6 rounded-full transition-colors duration-300 focus:outline-none
                ${isSelectionMode ? "bg-[#D97757]" : "bg-gray-200"}
              `}
            >
              <span
                className={`
                  absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm
                  ${isSelectionMode ? "translate-x-4" : "translate-x-0"}
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER BAR (PREMIUM STYLE) */}
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-center mb-8">
        {/* LEFT: STATUS FILTERS (Pills) */}
        <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-1 w-full xl:w-auto">
          {[
            { id: "ALL", label: "Tất cả", count: stats.all },
            { id: "AVAILABLE", label: "Trống", count: stats.available },
            { id: "RENTED", label: "Đang ở", count: stats.rented },
            { id: "MAINTENANCE", label: "Bảo trì", count: stats.maintenance },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setActiveStatusFilter(status.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2
                ${
                  activeStatusFilter === status.id
                    ? "bg-[#2D2D2C] text-white shadow-md"
                    : "text-gray-500 hover:bg-[#F2F2F0] hover:text-[#2D2D2C]"
                }
              `}
            >
              {status.label}
              <span
                className={`
                  px-1.5 py-0.5 rounded text-[10px] 
                  ${
                    activeStatusFilter === status.id
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }
                `}
              >
                {status.count}
              </span>
            </button>
          ))}
        </div>

        {/* RIGHT: BUILDING FILTER & SEARCH */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          <div className="relative group min-w-[200px]">
            <select
              value={activeBuildingFilter}
              onChange={(e) =>
                setActiveBuildingFilter(
                  e.target.value === "ALL" ? "ALL" : Number(e.target.value),
                )
              }
              className="appearance-none w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium cursor-pointer hover:border-[#D97757] focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 transition-all text-gray-700 shadow-sm"
            >
              <option value="ALL">Tất cả tòa nhà</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 bg-white pl-2">
              <HomeOutlined />
            </div>
          </div>

          <div className="relative min-w-[280px]">
            <input
              type="text"
              placeholder="Tìm theo tên phòng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all placeholder:text-gray-400 text-gray-700 shadow-sm"
            />
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spin
            indicator={
              <LoadingOutlined
                style={{ fontSize: 48, color: "#D97757" }}
                spin
              />
            }
          />
        </div>
      ) : (
        <>
          {viewMode === "LIST" ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9F9F7] text-gray-500 uppercase text-xs font-bold tracking-wider border-b border-gray-200">
                    <th className="p-4 pl-6">Phòng</th>
                    <th className="p-4">Tòa nhà</th>
                    <th className="p-4">Vị trí</th>
                    <th className="p-4">Diện tích</th>
                    <th className="p-4">Giá</th>
                    <th className="p-4">Số người</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 pr-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {filteredRooms.map((room) => {
                    const isSelected = selectedRooms.includes(room.id);
                    return (
                      <tr
                        key={room.id}
                        className={`transition-colors ${
                          isSelected ? "bg-[#FFF5F1]" : "hover:bg-[#F9F9F7]"
                        } cursor-pointer`}
                        onClick={() =>
                          isSelectionMode && toggleSelection(room.id)
                        }
                      >
                        <td className="p-4 pl-6 font-bold text-[#2D2D2C]">
                          <div className="flex items-center gap-3 text-lg">
                            {(isSelectionMode || isSelected) && (
                              <Checkbox
                                checked={isSelected}
                                className="accent-[#D97757]"
                              />
                            )}
                            {room.name}
                            {(() => {
                              if (!room.issues) return null;

                              const activeIssues = room.issues.filter(
                                (i: any) =>
                                  i.status === "OPEN" ||
                                  i.status === "PROCESSING",
                              );
                              if (activeIssues.length === 0) return null;

                              const openIssues = activeIssues.filter(
                                (i: any) => i.status === "OPEN",
                              );
                              const processingIssues = activeIssues.filter(
                                (i: any) => i.status === "PROCESSING",
                              );

                              return (
                                <Tooltip
                                  title={
                                    <div className="flex flex-col gap-1 min-w-[200px]">
                                      <div className="font-bold border-b border-gray-500 pb-1 mb-1">
                                        Danh sách sự cố:
                                      </div>
                                      {activeIssues.map((i: any) => (
                                        <div
                                          key={i.id}
                                          className="flex items-center gap-2"
                                        >
                                          <span
                                            className={`w-2 h-2 rounded-full ${
                                              i.status === "OPEN"
                                                ? "bg-red-500"
                                                : "bg-yellow-500"
                                            }`}
                                          ></span>
                                          <span>{i.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                  }
                                >
                                  <div className="flex gap-1 ml-2">
                                    {openIssues.length > 0 && (
                                      <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded flex items-center gap-1 shadow-sm font-bold animate-pulse">
                                        <WarningOutlined /> {openIssues.length}
                                      </span>
                                    )}
                                    {processingIssues.length > 0 && (
                                      <span className="px-1.5 py-0.5 text-[10px] bg-yellow-100 text-yellow-700 rounded flex items-center gap-1 shadow-sm font-bold">
                                        <ToolOutlined />{" "}
                                        {processingIssues.length}
                                      </span>
                                    )}
                                  </div>
                                </Tooltip>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="p-4 text-gray-500">
                          {room.building?.name ||
                            buildings.find((b) => b.id === room.buildingId)
                              ?.name ||
                            "N/A"}
                        </td>
                        <td className="p-4">Tầng {room.floor}</td>
                        <td className="p-4">
                          {room.area ? `${room.area} m²` : "-"}
                        </td>
                        <td className="p-4 font-mono font-bold text-[#D97757]">
                          {formatCurrency(room.price)}
                        </td>
                        <td className="p-4">
                          <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded-lg">
                            {room._count?.contracts || 0} / {room.maxTenants}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              room.status === "RENTED"
                                ? "bg-pink-100 text-pink-700"
                                : room.status === "MAINTENANCE"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {room.status === "RENTED"
                              ? "ĐANG Ở"
                              : room.status === "MAINTENANCE"
                                ? "BẢO TRÌ"
                                : "TRỐNG"}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRoom(room);
                                setIsEditModalOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-[#D97757] hover:bg-[#F2F2F0] rounded-lg transition-colors"
                            >
                              <EditOutlined />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRoom(room);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <DeleteOutlined />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRooms.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-12 text-center text-gray-400 italic"
                      >
                        Không tìm thấy phòng nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID VIEW REIMPLEMENTATION */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredRooms.length === 0 && (
                <div className="col-span-full py-20 flex justify-center">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span className="font-sans text-gray-400">
                        Không tìm thấy phòng nào.
                      </span>
                    }
                  />
                </div>
              )}
              {filteredRooms.map((room) => {
                // Lookup building name
                const buildingName =
                  room.building?.name ||
                  buildings.find((b) => b.id === room.buildingId)?.name;

                return (
                  <div
                    key={room.id}
                    onClick={(e) => {
                      if (
                        (e.target as HTMLElement).closest("button") ||
                        (e.target as HTMLElement).closest(
                          ".ant-dropdown-trigger",
                        )
                      )
                        return;
                      if (isSelectionMode) {
                        toggleSelection(room.id);
                      } else {
                        setDetailRoomId(room.id);
                      }
                    }}
                    className={`
                             relative flex flex-col justify-between transition-all cursor-pointer overflow-hidden rounded-2xl group
                             ${
                               selectedRooms.includes(room.id)
                                 ? "ring-2 ring-[#D97757] bg-[#FFF5F1]"
                                 : `border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 ${
                                     room.status === "AVAILABLE"
                                       ? "bg-[#F0FDF4]" /* Subtle Green for Available */
                                       : room.status === "MAINTENANCE"
                                         ? "bg-[#FEFCE8]" /* Subtle Yellow for Maintenance */
                                         : "bg-white" /* White for Rented/Others */
                                   }`
                             }
                         `}
                    style={{ minHeight: "320px" }}
                  >
                    {/* SELECTION CHECKBOX (Custom) */}
                    {(isSelectionMode || selectedRooms.includes(room.id)) && (
                      <div className="absolute top-3 left-3 z-20">
                        <Checkbox
                          checked={selectedRooms.includes(room.id)}
                          className="scale-110 shadow-sm"
                        />
                      </div>
                    )}

                    {/* HEADER */}
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-[#FAFAFA]">
                      <span
                        className="text-xs font-bold uppercase truncate max-w-[120px] text-gray-400 tracking-wide flex items-center gap-1"
                        title={buildingName}
                      >
                        <HomeOutlined /> {buildingName}
                      </span>
                      <Dropdown
                        menu={{
                          items: (() => {
                            const items = [];
                            // Logic matches original exactly
                            if (room.status === "RENTED") {
                              items.push({
                                key: "AVAILABLE_DISABLED",
                                label: (
                                  <Tooltip title="Vui lòng thanh lý hợp đồng trước khi chuyển sang Trống">
                                    <span className="text-gray-400 cursor-not-allowed flex items-center gap-2">
                                      <CheckCircleOutlined />
                                      Trống (Disabled)
                                    </span>
                                  </Tooltip>
                                ),
                                disabled: true,
                              });
                              items.push({
                                key: "MAINTENANCE",
                                label: "Bảo trì",
                                icon: (
                                  <WarningOutlined className="text-yellow-500" />
                                ),
                                onClick: () => setMaintenanceRoom(room),
                              });
                            } else if (room.status === "AVAILABLE") {
                              items.push({
                                key: "RENTED_DISABLED",
                                label: (
                                  <Tooltip title="Vui lòng bấm 'Tạo Hợp Đồng' để chuyển sang Đang ở">
                                    <span className="text-gray-400 cursor-not-allowed flex items-center gap-2">
                                      <CheckCircleOutlined />
                                      Đang ở (Disabled)
                                    </span>
                                  </Tooltip>
                                ),
                                disabled: true,
                              });
                              items.push({
                                key: "MAINTENANCE",
                                label: "Bảo trì",
                                icon: (
                                  <WarningOutlined className="text-yellow-500" />
                                ),
                                onClick: () =>
                                  handleUpdateStatus(room.id, "MAINTENANCE"),
                              });
                            } else if (room.status === "MAINTENANCE") {
                              items.push({
                                key: "AVAILABLE",
                                label: "Trống",
                                icon: (
                                  <CheckCircleOutlined className="text-green-500" />
                                ),
                                onClick: () =>
                                  handleUpdateStatus(room.id, "AVAILABLE"),
                              });
                              items.push({
                                key: "RENTED",
                                label: "Đang ở (Thủ công)",
                                icon: (
                                  <CheckCircleOutlined className="text-pink-500" />
                                ),
                                onClick: () =>
                                  handleUpdateStatus(room.id, "RENTED"),
                              });
                            }

                            return items;
                          })(),
                        }}
                        trigger={["click"]}
                      >
                        <div className="flex gap-2 items-center">
                          <div
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full cursor-pointer hover:opacity-80 flex items-center gap-1 border border-transparent shadow-sm ${
                              room.status === "RENTED"
                                ? "bg-pink-100 text-pink-700"
                                : room.status === "MAINTENANCE"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {room.status === "RENTED"
                              ? "ĐANG Ở"
                              : room.status === "MAINTENANCE"
                                ? "BẢO TRÌ"
                                : "TRỐNG"}{" "}
                            <MoreOutlined className="text-[10px]" />
                          </div>
                        </div>
                      </Dropdown>
                    </div>
                    {/* BODY */}
                    <div className="p-5 flex-grow flex flex-col">
                      <h3 className="font-bold font-mono text-3xl m-0 tracking-tight mb-1 text-[var(--text-primary)]">
                        {room.name}
                      </h3>
                      <div className="text-gray-500 font-medium text-xs mb-4 flex items-center gap-2">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          Tầng {room.floor}
                        </span>
                        <span>•</span>
                        <span>{room.area} m²</span>
                      </div>

                      {/* ISSUE BANNER (Prominent) */}
                      {(() => {
                        if (!room.issues) return null;
                        const activeIssues = room.issues.filter(
                          (i: any) =>
                            i.status === "OPEN" || i.status === "PROCESSING",
                        );
                        if (activeIssues.length === 0) return null;

                        return (
                          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-xs font-bold animate-pulse">
                            <WarningOutlined className="mt-0.5" />
                            <div className="flex flex-col">
                              <span>
                                {activeIssues.length} Vấn đề cần xử lý
                              </span>
                              <span className="text-[10px] font-normal opacity-80">
                                {activeIssues[0].title}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="font-mono font-bold text-xl text-[var(--primary)] mb-4">
                        {formatCurrency(room.price)}
                        <span className="text-xs text-gray-400 font-sans ml-1">
                          /tháng
                        </span>
                      </div>

                      {/* UTILITIES / ASSETS */}
                      <div className="mt-auto">
                        <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">
                          Tiện ích:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {room.assets && room.assets.length > 0 ? (
                            room.assets
                              .slice(0, 4)
                              .map((asset: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200"
                                >
                                  {asset}
                                </span>
                              ))
                          ) : (
                            <span className="text-[10px] text-gray-300 italic">
                              Trống
                            </span>
                          )}
                          {room.assets && room.assets.length > 4 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">
                              +{room.assets.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="p-3 bg-gray-50/50 border-t border-gray-100 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setEditingRoom(room);
                          setIsEditModalOpen(true);
                        }}
                        className="claude-btn-secondary text-xs py-1.5 flex justify-center items-center gap-1"
                      >
                        <EditOutlined /> Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room)}
                        className="bg-white border text-red-500 border-red-100 hover:bg-red-50 text-xs font-bold py-1.5 rounded-lg transition-all flex justify-center items-center gap-1"
                      >
                        <DeleteOutlined /> Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* EDIT MODAL ONLY - CREATE DISABLED FOR GLOBAL VIEW TO AVOID COMPLEXITY */}
      <CreateRoomModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onConfirm={handleCreateRoom}
        loading={loading}
        buildings={buildings}
        initialBuildingId={
          activeBuildingFilter !== "ALL" ? activeBuildingFilter : undefined
        }
      />

      <EditRoomModal
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingRoom(null);
        }}
        onConfirm={handleUpdateRoom}
        loading={loading}
        room={editingRoom}
      />

      <BulkActionModals
        open={!!bulkActionType}
        type={bulkActionType}
        onCancel={() => setBulkActionType(null)}
        onConfirm={confirmBulkAction}
        loading={isBulkLoading}
        selectedCount={selectedRooms.length}
      />

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      <Modal
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        footer={null}
        title={null}
        width={400}
        centered
        closeIcon={null}
        className="claude-delete-modal"
        styles={
          {
            content: {
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            },
          } as any
        }
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-4 text-xl">
            <WarningOutlined />
          </div>

          <h3 className="text-xl font-serif font-bold text-[#2D2D2C] mb-2">
            Xóa phòng?
          </h3>

          <p className="text-gray-500 text-sm mb-6">
            Bạn có chắc chắn muốn xóa phòng{" "}
            <span className="font-bold text-[#2D2D2C]">
              {roomToDelete?.name}
            </span>
            ?
            <br />
            Hành động này không thể hoàn tác.
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[#E5E5E0] bg-white text-[#6B6B6A] font-semibold text-sm hover:bg-[#F4F4F0] hover:text-[#2D2D2C] transition-all"
            >
              Hủy bỏ
            </button>
            <button
              onClick={confirmDeleteRoom}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#EB5757] text-white font-semibold text-sm shadow-[0_2px_0_0_#C53030] hover:bg-[#D94545] hover:shadow-[0_1px_0_0_#C53030] hover:translate-y-[1px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Xóa ngay
            </button>
          </div>
        </div>
      </Modal>

      {/* BULK ACTIONS TOOLBAR */}
      {selectedRooms.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white p-4 border-2 border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="font-bold text-lg border-r border-gray-600 pr-6">
            Đã chọn{" "}
            <span className="text-[#FF90E8] text-2xl">
              {selectedRooms.length}
            </span>{" "}
            phòng
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => handleBulkAction("PRICE")}
              className="flex items-center gap-2 hover:text-[#FF90E8] font-bold transition-colors"
            >
              <DollarOutlined /> Tăng giá đồng loạt
            </button>
            <button
              onClick={() => handleBulkAction("NOTIFY")}
              className="flex items-center gap-2 hover:text-[#FF90E8] font-bold transition-colors"
            >
              <SendOutlined /> Gửi thông báo (Zalo)
            </button>
            <button
              onClick={() => handleBulkAction("ISSUE")}
              className="flex items-center gap-2 hover:text-[#FF90E8] font-bold transition-colors"
            >
              <ToolOutlined /> Báo bảo trì
            </button>
          </div>
          <button
            onClick={() => setSelectedRooms([])}
            className="ml-4 text-gray-400 hover:text-white"
          >
            Hủy chọn
          </button>
        </div>
      )}

      {/* --- ADVANCED MAINTENANCE MODALS --- */}

      {/* 1. SELECTION MODAL */}
      <MaintenanceActionModal
        open={!!maintenanceRoom}
        onCancel={() => setMaintenanceRoom(null)}
        onSelectMinor={() => {
          setMaintenanceRoom(null);
          // Redirect to Issues page to report
          message.info("Chuyển hướng đến trang Báo cáo sự cố...");
          router.push("/issues");
        }}
        onSelectMajor={async () => {
          // Check if room has active contract
          if (!maintenanceRoom) return;

          // Optimistic Check via API to be sure
          try {
            const res = await axios.get(
              `/contracts/room/${maintenanceRoom.id}`,
            );
            const contracts = res.data;
            const active = contracts.find((c: any) => c.isActive);

            if (active) {
              setMoveContractId(active.id); // Save contract ID for Move logic
              setWarningRoom(maintenanceRoom); // Show Warning
            } else {
              // No active contract? Just allow update to MAINTENANCE
              handleUpdateStatus(maintenanceRoom.id, "MAINTENANCE");
            }
          } catch (e) {
            console.error(e);
            message.error("Không thể kiểm tra hợp đồng của phòng này");
          } finally {
            setMaintenanceRoom(null);
          }
        }}
      />

      {/* 2. WARNING MODAL */}
      <MajorMaintenanceWarningModal
        open={!!warningRoom}
        roomName={warningRoom?.name}
        onCancel={() => {
          setWarningRoom(null);
          setMoveContractId(null);
        }}
        onLiquidate={() => {
          message.info("Chức năng Thanh lý hợp đồng đang được phát triển");
          // Logic for Liquidate...
        }}
        onMoveRoom={() => {
          setWarningRoom(null);
          setIsMoveRoomModalOpen(true);
        }}
      />

      {/* 3. MOVE ROOM MODAL */}
      <MoveRoomModal
        open={isMoveRoomModalOpen}
        onCancel={() => {
          setIsMoveRoomModalOpen(false);
          setMoveContractId(null);
        }}
        contractId={moveContractId || undefined}
        // Filter AVAILABLE rooms only, exclude current room
        availableRooms={rooms.filter(
          (r) => r.status === "AVAILABLE" && r.id !== warningRoom?.id,
        )}
        services={[]} // TODO: Fetch services from API
        onSuccess={() => {
          setIsMoveRoomModalOpen(false);
          setMoveContractId(null);
          setWarningRoom(null);
          message.success("Đã chuyển phòng thành công!");
          fetchData(); // Reload rooms
        }}
      />
      <RoomDetailModal
        open={!!detailRoomId}
        roomId={detailRoomId}
        onCancel={() => setDetailRoomId(null)}
        onCreateContract={(room) => {
          setCreateContractRoom(room);
          setDetailRoomId(null);
          setIsCreateContractOpen(true);
        }}
        onMaintenanceAction={(room) => {
          setMaintenanceRoom(room);
          setDetailRoomId(null);
        }}
      />

      <Modal
        open={isCreateContractOpen}
        onCancel={() => setIsCreateContractOpen(false)}
        footer={null}
        width={900}
        centered
        destroyOnHidden
        className="claude-modal"
        closeIcon={
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <span className="text-xl pb-1">&times;</span>
          </div>
        }
      >
        <CreateContractWizard
          onCancel={() => setIsCreateContractOpen(false)}
          onSuccess={() => {
            setIsCreateContractOpen(false);
            fetchData();
          }}
          buildings={buildings}
          services={services}
          initialRoom={createContractRoom}
        />
      </Modal>
    </div>
  );
}
