import { Modal, Tag, Button, Spin, Descriptions, Divider, message } from "antd";
import { useEffect, useState } from "react";
import axios from "@/lib/axios-client";
import {
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  WarningOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

export default function RoomDetailModal({
  open,
  roomId,
  onCancel,
  onCreateContract,
  onMaintenanceAction,
}: {
  open: boolean;
  roomId: number | null;
  onCancel: () => void;
  onCreateContract?: (room: any) => void;
  onMaintenanceAction?: (room: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [activeContract, setActiveContract] = useState<any>(null);

  useEffect(() => {
    if (open && roomId) {
      fetchRoomDetails();
    } else {
      setRoom(null);
      setActiveContract(null);
    }
  }, [open, roomId]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      // Fetch Room info (including issues)
      const roomRes = await axios.get(`/rooms/${roomId}`);
      setRoom(roomRes.data);

      // Fetch Contracts to find active one
      const contractRes = await axios.get(`/contracts/room/${roomId}`);
      const contracts = contractRes.data;
      const active = contracts.find((c: any) => c.isActive);
      setActiveContract(active || null);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải thông tin phòng");
    } finally {
      setLoading(false);
    }
  };

  if (!roomId) return null;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="h-10 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 font-medium transition-colors"
          >
            Đóng
          </button>

          {room?.status === "AVAILABLE" && onCreateContract && (
            <button
              onClick={() => onCreateContract(room)}
              className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5"
            >
              <UserOutlined /> Tạo Hợp Đồng
            </button>
          )}

          {room?.status === "MAINTENANCE" && onMaintenanceAction && (
            <button
              onClick={() => onMaintenanceAction(room)}
              className="h-10 px-6 rounded-xl bg-[#D97757] hover:bg-[#c06040] text-white font-bold flex items-center gap-2 shadow-lg shadow-orange-100 transition-all hover:-translate-y-0.5"
            >
              <ToolOutlined /> Cập nhật Bảo trì
            </button>
          )}
        </div>
      }
      title={
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">Phòng {room?.name}</span>
          {room?.status && (
            <Tag
              color={
                room.status === "RENTED"
                  ? "pink"
                  : room.status === "AVAILABLE"
                    ? "green"
                    : "orange"
              }
            >
              {room.status === "RENTED"
                ? "ĐANG Ở"
                : room.status === "MAINTENANCE"
                  ? "BẢO TRÌ"
                  : "TRỐNG"}
            </Tag>
          )}
        </div>
      }
      width={700}
      centered
      className="claude-modal"
    >
      {loading ? (
        <div className="h-60 flex items-center justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <div className="font-sans text-[#2D2D2C]">
          {/* 1. BASIC INFO */}
          <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold mb-1">
                Thông tin cơ bản
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Giá phòng:</span>
                  <span className="font-bold text-[#D97757]">
                    {room?.price ? formatCurrency(room.price) : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Diện tích:</span>
                  <span className="font-medium">
                    {room?.area ? `${room.area} m²` : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tầng:</span>
                  <span className="font-medium">{room?.floor}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold mb-1">
                Tiện ích / Tài sản
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {room?.assets &&
                Array.isArray(room.assets) &&
                room.assets.length > 0 ? (
                  room.assets.map((asset: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600"
                    >
                      {asset}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 italic text-sm">
                    Chưa cập nhật
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. TENANT & CONTRACT INFO */}
          {activeContract ? (
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
                <UserOutlined /> Người thuê & Hợp đồng
              </h3>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="grid grid-cols-2 gap-y-4 gap-x-8 relative z-10">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Khách thuê</p>
                    <p className="font-bold text-lg text-[#2D2D2C]">
                      {activeContract.tenant?.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activeContract.tenant?.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Thời hạn hợp đồng
                    </p>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <CalendarOutlined className="text-gray-400" />
                      {dayjs(activeContract.startDate).format("DD/MM/YYYY")} -
                      {activeContract.endDate
                        ? dayjs(activeContract.endDate).format("DD/MM/YYYY")
                        : "Vô thời hạn"}
                    </p>
                    {activeContract.endDate &&
                      dayjs(activeContract.endDate).diff(dayjs(), "days") <
                        30 &&
                      dayjs(activeContract.endDate).diff(dayjs(), "days") >
                        0 && (
                        <Tag color="red" className="mt-1">
                          Sắp hết hạn (
                          {dayjs(activeContract.endDate).diff(dayjs(), "days")}{" "}
                          ngày)
                        </Tag>
                      )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Tiền cọc</p>
                    <p className="font-medium">
                      {formatCurrency(activeContract.deposit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Ngày đóng tiền
                    </p>
                    <p className="font-medium">
                      Ngày {activeContract.paymentDay} hàng tháng
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : room?.status === "RENTED" ? (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl text-orange-600 flex items-center gap-2">
              <WarningOutlined /> Không tìm thấy hợp đồng kích hoạt dù trạng
              thái là ĐANG Ở.
            </div>
          ) : (
            <div className="mb-6 p-8 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
              <CheckCircleOutlined className="text-2xl mb-2 opacity-50" />
              <span>Phòng này hiện chưa có người thuê</span>
            </div>
          )}

          {/* 3. ISSUES / MAINTENANCE */}
          {room?.issues?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
                <ToolOutlined /> Vấn đề / Sự cố
              </h3>
              <div className="space-y-2">
                {room.issues
                  .filter(
                    (i: any) => i.status !== "DONE" && i.status !== "CLOSED",
                  )
                  .map((issue: any) => (
                    <div
                      key={issue.id}
                      className="p-3 bg-red-50 border border-red-100 rounded-lg flex justify-between items-center"
                    >
                      <div className="flex items-start gap-2">
                        <WarningOutlined className="mt-1 text-red-500" />
                        <div>
                          <p className="text-sm font-bold text-red-700">
                            {issue.title}
                          </p>
                          <p className="text-xs text-red-600 opacity-80">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                      <Tag color={issue.status === "OPEN" ? "red" : "gold"}>
                        {issue.status === "OPEN" ? "MỚI" : "ĐANG XỬ LÝ"}
                      </Tag>
                    </div>
                  ))}
                {room.issues.filter(
                  (i: any) => i.status !== "DONE" && i.status !== "CLOSED",
                ).length === 0 && (
                  <div className="text-sm text-gray-400 italic">
                    Không có sự cố nào đang chờ xử lý.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
