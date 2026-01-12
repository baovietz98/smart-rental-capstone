import { Modal } from "antd";
import dayjs from "dayjs";
import { User, Home, Calendar } from "lucide-react";
import { Service } from "@/types/service";

interface ContractDetailModalProps {
  open: boolean;
  onCancel: () => void;
  contract: any;
  services: Service[];
}

export default function ContractDetailModal({
  open,
  onCancel,
  contract,
  services,
}: ContractDetailModalProps) {
  if (!contract) return null;

  // Helper to get service name
  const getServiceName = (id: string) => {
    const service = services.find((s) => s.id === Number(id));
    return service ? service.name : `Service #${id}`;
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={null}
      className="claude-modal"
      width={700}
      closeIcon={
        <span className="text-xl text-gray-400 hover:text-gray-600 transition-colors">
          ✕
        </span>
      }
      centered
    >
      <div className="p-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 font-serif mb-1">
              Chi tiết hợp đồng
            </h2>
            <p className="text-gray-500 font-mono text-sm">
              ID: #{contract.id}
            </p>
          </div>
          <div className="">
            {contract.isActive ? (
              <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-bold border border-green-100">
                ĐANG HIỆU LỰC
              </span>
            ) : (
              <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-bold border border-red-100">
                ĐÃ KẾT THÚC
              </span>
            )}
          </div>
        </div>

        <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* 1. ROOM INFO */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Home size={16} className="text-[#D97757]" /> Info Phòng
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-1">
                  Tòa nhà
                </div>
                <div className="font-medium text-gray-900">
                  {contract.room?.building?.name}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-1">
                  Phòng
                </div>
                <div className="font-medium text-gray-900 text-lg">
                  {contract.room?.name}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-1">
                  Giá thuê
                </div>
                <div className="font-mono font-bold text-[#D97757]">
                  {contract.price?.toLocaleString()} đ
                </div>
              </div>
            </div>
          </div>

          {/* 2. TENANT INFO */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-[#D97757]/30 transition-colors">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <User size={16} className="text-[#D97757]" /> Khách thuê
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-1">
                  Họ và tên
                </div>
                <div className="font-medium text-gray-900">
                  {contract.tenant?.fullName}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-1">
                  Số điện thoại
                </div>
                <div className="font-mono font-medium text-gray-900">
                  {contract.tenant?.phone}
                </div>
              </div>
            </div>

            {/* CCCD Images */}
            {(contract.tenant?.info?.cccdFront ||
              contract.tenant?.info?.cccdBack) && (
              <div className="pt-4 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-400 uppercase mb-3">
                  Giấy tờ tùy thân
                </div>
                <div className="flex gap-4">
                  {contract.tenant?.info?.cccdFront && (
                    <div className="border border-gray-200 rounded-lg p-1 bg-white shadow-sm h-24 w-36 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={contract.tenant.info.cccdFront}
                        alt="CCCD Front"
                        className="h-full w-full object-cover rounded"
                      />
                    </div>
                  )}
                  {contract.tenant?.info?.cccdBack && (
                    <div className="border border-gray-200 rounded-lg p-1 bg-white shadow-sm h-24 w-36 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={contract.tenant.info.cccdBack}
                        alt="CCCD Back"
                        className="h-full w-full object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. CONTRACT TIMELINE */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-[#D97757]" /> Thời hạn & Thanh
              toán
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    Ngày bắt đầu
                  </span>
                </div>
                <div className="font-mono font-medium text-lg">
                  {dayjs(contract.startDate).format("DD/MM/YYYY")}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    Ngày kết thúc
                  </span>
                </div>
                <div className="font-mono font-medium text-lg">
                  {contract.endDate
                    ? dayjs(contract.endDate).format("DD/MM/YYYY")
                    : "Vô thời hạn"}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Tiền cọc cam kết
                </span>
                <span className="font-mono font-bold text-lg text-gray-900">
                  {contract.deposit?.toLocaleString()} đ
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Đã đóng thực tế
                </span>
                <span
                  className={`font-mono font-bold text-lg ${
                    contract.paidDeposit < contract.deposit
                      ? "text-red-500"
                      : "text-green-600"
                  }`}
                >
                  {contract.paidDeposit?.toLocaleString()} đ
                </span>
              </div>
            </div>
          </div>

          {/* 4. INITIAL INDEXES */}
          {contract.initialIndexes &&
            Object.keys(contract.initialIndexes).length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                  Chỉ số bàn giao
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(contract.initialIndexes).map(
                    ([key, value]: [string, any]) => (
                      <div
                        key={key}
                        className="border border-gray-200 rounded-lg p-3 bg-white text-center shadow-sm"
                      >
                        <div className="text-xs font-bold text-gray-400 uppercase mb-1">
                          {getServiceName(key)}
                        </div>
                        <div className="font-mono font-bold text-lg text-gray-800">
                          {value}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </Modal>
  );
}
