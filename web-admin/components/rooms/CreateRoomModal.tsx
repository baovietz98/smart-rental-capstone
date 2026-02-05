import { Modal, Form, Input, InputNumber, Select, Radio, Tag } from "antd";
import { useEffect } from "react";
import { ManOutlined, WomanOutlined, TeamOutlined } from "@ant-design/icons";

interface CreateRoomModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (values: any) => void;
  loading?: boolean;
  buildings?: any[]; // Optional list of buildings for selection
  initialBuildingId?: number;
}

export default function CreateRoomModal({
  open,
  onCancel,
  onConfirm,
  loading,
  buildings = [],
  initialBuildingId,
}: CreateRoomModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialBuildingId) {
        form.setFieldValue("buildingId", initialBuildingId);
      }
    }
  }, [open, form, initialBuildingId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onConfirm(values);
    } catch {
      // Form validation error
    }
  };

  return (
    <Modal
      open={open}
      destroyOnHidden={true}
      onCancel={onCancel}
      footer={null}
      title={null}
      className="claude-modal-override"
      width={600}
      style={{ maxWidth: "calc(100vw - 20px)", top: 20, margin: "0 auto" }}
      closeIcon={
        <span className="text-xl text-gray-400 hover:text-[#D97757] transition-colors duration-200">
          ✕
        </span>
      }
      centered
      styles={{
        content: {
          padding: 0,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
        },
      }}
    >
      <div className="bg-[#FCFCFA] p-6 md:p-10 font-[family-name:Inter]">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-3xl font-serif font-bold text-[#2D2D2C] mb-2 tracking-tight">
            Thêm Phòng Mới
          </h2>
          <p className="text-[#6B6B6A] text-xs md:text-sm font-medium">
            Tạo phòng mới vào hệ thống quản lý
          </p>
        </div>

        <Form form={form} layout="vertical" className="claude-form">
          {/* Building Select - Only show if buildings list is provided */}
          {buildings && buildings.length > 0 && (
            <Form.Item
              label={
                <span className="text-[#2D2D2C] font-semibold text-sm">
                  Tòa nhà
                </span>
              }
              name="buildingId"
              rules={[{ required: true, message: "Vui lòng chọn tòa nhà!" }]}
            >
              <Select
                placeholder="Chọn tòa nhà..."
                className="claude-select h-10"
                options={buildings.map((b) => ({ value: b.id, label: b.name }))}
                disabled={!!initialBuildingId}
              />
            </Form.Item>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Form.Item
              label={
                <span className="text-[#2D2D2C] font-semibold text-sm">
                  Tên phòng
                </span>
              }
              name="name"
              rules={[{ required: true, message: "Nhập tên phòng!" }]}
            >
              <Input
                className="h-10 rounded-lg border-[#E5E5E0] bg-white text-[#2D2D2C] focus:border-[#D97757] focus:shadow-[0_0_0_2px_rgba(217,119,87,0.1)] hover:border-[#D97757]/60 transition-all font-medium placeholder:text-gray-300"
                placeholder="VD: P.101"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-[#2D2D2C] font-semibold text-sm">
                  Tầng
                </span>
              }
              name="floor"
              initialValue={1}
            >
              <InputNumber
                className="w-full h-10 pt-1 rounded-lg border-[#E5E5E0] bg-white focus:border-[#D97757] focus:shadow-[0_0_0_2px_rgba(217,119,87,0.1)] hover:border-[#D97757]/60 transition-all"
                min={1}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            <Form.Item
              label={
                <span className="text-[#2D2D2C] font-semibold text-sm">
                  Giá thuê
                </span>
              }
              name="price"
              rules={[{ required: true, message: "Nhập giá tiền!" }]}
            >
              <InputNumber
                className="w-full h-10 pt-1 rounded-lg border-[#E5E5E0] bg-white focus:border-[#D97757] focus:shadow-[0_0_0_2px_rgba(217,119,87,0.1)] hover:border-[#D97757]/60 transition-all"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) =>
                  value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                }
                placeholder="3,500,000"
                addonAfter={
                  <span className="text-[#6B6B6A] font-medium bg-[#F4F4F0] border-l border-[#E5E5E0] px-3">
                    ₫
                  </span>
                }
              />
            </Form.Item>
            <Form.Item
              label={
                <span className="text-[#2D2D2C] font-semibold text-sm">
                  Tiền cọc{" "}
                  <span className="text-gray-400 font-normal">(Gợi ý)</span>
                </span>
              }
              name="depositPrice"
            >
              <InputNumber
                className="w-full h-10 pt-1 rounded-lg border-[#E5E5E0] bg-white focus:border-[#D97757] focus:shadow-[0_0_0_2px_rgba(217,119,87,0.1)] hover:border-[#D97757]/60 transition-all"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) =>
                  value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                }
                placeholder="3,500,000"
                addonAfter={
                  <span className="text-[#6B6B6A] font-medium bg-[#F4F4F0] border-l border-[#E5E5E0] px-3">
                    ₫
                  </span>
                }
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            <Form.Item
              label={
                <span className="text-[#2D2D2C] font-semibold text-sm">
                  Diện tích
                </span>
              }
              name="area"
            >
              <InputNumber
                className="w-full h-10 pt-1 rounded-lg border-[#E5E5E0] bg-white focus:border-[#D97757] focus:shadow-[0_0_0_2px_rgba(217,119,87,0.1)] hover:border-[#D97757]/60 transition-all"
                placeholder="25"
                addonAfter={
                  <span className="text-[#6B6B6A] font-medium bg-[#F4F4F0] border-l border-[#E5E5E0] px-3">
                    m²
                  </span>
                }
              />
            </Form.Item>
            <Form.Item
              label={
                <span className="text-[#2D2D2C] font-semibold text-sm">
                  Giới tính
                </span>
              }
              name="gender"
              initialValue="ALL"
            >
              <Radio.Group className="w-full flex bg-[#F0F0ED] p-1 rounded-lg">
                <Radio.Button
                  value="ALL"
                  className="flex-1 text-center h-8 flex items-center justify-center rounded-md border-0 bg-transparent text-[#6B6B6A] font-medium hover:text-[#D97757] [&.ant-radio-button-wrapper-checked]:bg-white [&.ant-radio-button-wrapper-checked]:text-[#D97757] [&.ant-radio-button-wrapper-checked]:shadow-sm transition-all before:!hidden"
                >
                  <TeamOutlined className="mr-1.5" /> Tất cả
                </Radio.Button>
                <Radio.Button
                  value="MALE"
                  className="flex-1 text-center h-8 flex items-center justify-center rounded-md border-0 bg-transparent text-[#6B6B6A] font-medium hover:text-[#D97757] [&.ant-radio-button-wrapper-checked]:bg-white [&.ant-radio-button-wrapper-checked]:text-[#D97757] [&.ant-radio-button-wrapper-checked]:shadow-sm transition-all before:!hidden"
                >
                  <ManOutlined className="mr-1.5" /> Nam
                </Radio.Button>
                <Radio.Button
                  value="FEMALE"
                  className="flex-1 text-center h-8 flex items-center justify-center rounded-md border-0 bg-transparent text-[#6B6B6A] font-medium hover:text-[#D97757] [&.ant-radio-button-wrapper-checked]:bg-white [&.ant-radio-button-wrapper-checked]:text-[#D97757] [&.ant-radio-button-wrapper-checked]:shadow-sm transition-all before:!hidden"
                >
                  <WomanOutlined className="mr-1.5" /> Nữ
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            <Form.Item
              className="col-span-1"
              label={
                <span className="text-[#2D2D2C] font-semibold text-sm">
                  Số người tối đa
                </span>
              }
              name="maxTenants"
              initialValue={2}
            >
              <InputNumber
                className="w-full h-10 pt-1 rounded-lg border-[#E5E5E0] bg-white focus:border-[#D97757] focus:shadow-[0_0_0_2px_rgba(217,119,87,0.1)] hover:border-[#D97757]/60 transition-all text-center font-semibold"
                min={1}
              />
            </Form.Item>
          </div>

          <Form.Item
            label={
              <span className="text-[#2D2D2C] font-semibold text-sm">
                Tiện ích / Tài sản
              </span>
            }
            name="assets"
            className="mt-2"
          >
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder="Chọn tiện ích..."
              maxTagCount="responsive"
              listHeight={180}
              popupClassName="claude-select-popup"
              options={[
                { value: "Điều hòa", label: "❄️ Điều hòa" },
                { value: "Nóng lạnh", label: "🔥 Nóng lạnh" },
                { value: "Tủ lạnh", label: "🧊 Tủ lạnh" },
                { value: "Máy giặt", label: "🧺 Máy giặt" },
                { value: "Giường", label: "🛏️ Giường" },
                { value: "Tủ quần áo", label: "🚪 Tủ quần áo" },
                { value: "Bếp", label: "🍳 Bếp" },
                { value: "Wifi", label: "📶 Wifi" },
                { value: "Chỗ để xe", label: "🛵 Chỗ để xe" },
              ]}
              className="claude-select h-10"
              tagRender={(props) => (
                <Tag
                  closable={props.closable}
                  onClose={props.onClose}
                  style={{ marginRight: 4 }}
                  className="bg-[#F4F4F0] border border-[#E5E5E0] text-[#2D2D2C] px-2.5 py-1 rounded-md flex items-center font-medium"
                >
                  {props.label}
                </Tag>
              )}
            />
          </Form.Item>

          <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 mt-8 md:mt-10 pt-4 md:pt-6 border-t border-[#E5E5E0] items-center">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-[#E5E5E0] bg-white text-[#6B6B6A] font-semibold text-sm hover:bg-[#F4F4F0] hover:text-[#2D2D2C] transition-all duration-200"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#D97757] text-white font-semibold text-sm shadow-[0_2px_0_0_#B05C3F] hover:bg-[#C06040] hover:shadow-[0_1px_0_0_#B05C3F] hover:translate-y-[1px] active:translate-y-[2px] active:shadow-none transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Đang lưu..." : "Lưu Phòng"}
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
