import { Modal } from "antd";
import {
  WarningOutlined,
  ImportOutlined,
  SwapOutlined,
} from "@ant-design/icons";

interface MajorMaintenanceWarningModalProps {
  open: boolean;
  onCancel: () => void;
  roomName: string;
  onLiquidate: () => void; // Thanh lý HĐ
  onMoveRoom: () => void; // Chuyển phòng
}

export default function MajorMaintenanceWarningModal({
  open,
  onCancel,
  roomName,
  onLiquidate,
  onMoveRoom,
}: MajorMaintenanceWarningModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={null}
      width={500}
      centered
      className="claude-delete-modal" // Reusing styling
      styles={{
        body: {
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        },
      }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4 text-2xl animate-pulse">
          <WarningOutlined />
        </div>

        <h3 className="text-xl font-bold font-mono text-[#2D2D2C] mb-2 uppercase">
          Cảnh báo hợp đồng
        </h3>

        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          Phòng{" "}
          <span className="font-bold text-black border-b border-black">
            {roomName}
          </span>{" "}
          đang có hợp đồng thuê còn hiệu lực.
          <br />
          Để thực hiện <strong>Bảo trì lớn</strong>, bạn cần giải phóng phòng
          này.
        </p>

        <div className="flex flex-col gap-3 w-full">
          {/* ACTION 1: MOVE ROOM */}
          <button
            onClick={onMoveRoom}
            className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-all shadow-lg group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[#FF90E8]">
                <SwapOutlined />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">
                  Chuyển khách sang phòng khác
                </div>
                <div className="text-[10px] text-gray-400">
                  Giữ nguyên hợp đồng, chỉ đổi phòng
                </div>
              </div>
            </div>
            <SwapOutlined className="transform group-hover:translate-x-1 transition-transform" />
          </button>

          {/* ACTION 2: LIQUIDATE */}
          <button
            onClick={onLiquidate}
            className="w-full flex items-center justify-between px-5 py-3 rounded-xl border-2 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <ImportOutlined />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Thanh lý hợp đồng</div>
                <div className="text-[10px] text-red-400">
                  Kết thúc thuê và trả phòng
                </div>
              </div>
            </div>
            <ImportOutlined className="transform group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onCancel}
            className="mt-2 text-gray-400 hover:text-black text-xs font-bold uppercase tracking-wider"
          >
            Hủy bỏ thao tác
          </button>
        </div>
      </div>
    </Modal>
  );
}
