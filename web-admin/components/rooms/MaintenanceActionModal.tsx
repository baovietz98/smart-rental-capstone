import { Modal } from "antd";
import {
  ToolOutlined,
  WarningOutlined,
  RightOutlined,
} from "@ant-design/icons";

interface MaintenanceActionModalProps {
  open: boolean;
  onCancel: () => void;
  onSelectMinor: () => void; // Sửa chữa nhỏ -> Open Issue Modal
  onSelectMajor: () => void; // Sửa chữa lớn -> Trigger Major logic
}

export default function MaintenanceActionModal({
  open,
  onCancel,
  onSelectMinor,
  onSelectMajor,
}: MaintenanceActionModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title={null}
      width={600}
      centered
      className="claude-modal"
      styles={{
        body: {
          padding: 0,
          borderRadius: "16px",
          overflow: "hidden",
        },
      }}
    >
      <div className="bg-[#FAFAF9] p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold font-mono text-[#2D2D2C] mb-1">
          CHỌN LOẠI BẢO TRÌ
        </h2>
        <p className="text-gray-500 text-sm">
          Vui lòng xác định mức độ bảo trì để hệ thống xử lý phù hợp
        </p>
      </div>

      <div className="p-6 flex flex-col gap-4">
        {/* OPTION 1: MINOR */}
        <button
          onClick={onSelectMinor}
          className="group flex items-start gap-4 p-4 border border-gray-200 rounded-xl bg-white hover:border-black hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
            <ToolOutlined className="text-xl" />
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-[#2D2D2C] group-hover:text-blue-600 transition-colors">
                Sửa chữa nhỏ / Báo cáo sự cố
              </h3>
              <RightOutlined className="text-gray-300 group-hover:text-black" />
            </div>
            <p className="text-sm text-gray-500">
              Khách vẫn đang ở. Chỉ ghi nhận sự cố để xử lý (hỏng bóng đèn, tắc
              nước...).
              <br />
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                Không đổi trạng thái phòng
              </span>
            </p>
          </div>
        </button>

        {/* OPTION 2: MAJOR */}
        <button
          onClick={onSelectMajor}
          className="group flex items-start gap-4 p-4 border border-gray-200 rounded-xl bg-white hover:border-orange-500 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 mt-1">
            <WarningOutlined className="text-xl" />
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-[#2D2D2C] group-hover:text-orange-600 transition-colors">
                Bảo trì lớn / Cần phòng trống
              </h3>
              <RightOutlined className="text-gray-300 group-hover:text-black" />
            </div>
            <p className="text-sm text-gray-500">
              Cần khách chuyển đi hoặc trả phòng để sửa chữa (Sơn lại, chống
              thấm...).
              <br />
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded mt-1 inline-block">
                Yêu cầu phòng Trống hoặc Chuyển phòng
              </span>
            </p>
          </div>
        </button>
      </div>
    </Modal>
  );
}
