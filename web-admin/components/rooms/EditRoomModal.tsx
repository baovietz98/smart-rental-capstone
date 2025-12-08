import { Modal, Form, Input, InputNumber, Select, Radio, Tag } from 'antd';
import { useEffect } from 'react';
import { ManOutlined, WomanOutlined, TeamOutlined } from '@ant-design/icons';

interface EditRoomModalProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: (id: number, values: any) => void;
    loading?: boolean;
    room: any;
}

export default function EditRoomModal({ open, onCancel, onConfirm, loading, room }: EditRoomModalProps) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open && room) {
            form.setFieldsValue({
                name: room.name,
                floor: room.floor,
                price: room.price,
                depositPrice: room.depositPrice, // Assuming this field exists or needs to be mapped
                area: room.area,
                gender: room.gender || 'ALL',
                maxTenants: room.maxTenants,
                assets: room.assets || [],
            });
        } else {
            form.resetFields();
        }
    }, [open, room, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (room) {
                onConfirm(room.id, values);
            }
        } catch {
            // Form validation error
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            title={null}
            className="gumroad-modal"
            width={600}
            closeIcon={<span className="text-xl font-bold">✕</span>}
            centered
        >
            <div className="bg-white" style={{ backgroundImage: 'linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(to right, #E5E7EB 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                {/* HEADER */}
                <div className="bg-[#FF90E8] border-b-[3px] border-black p-6 flex items-center justify-between">
                    <div className="bg-white border-2 border-black px-4 py-1 transform -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="text-2xl font-black uppercase m-0 tracking-tighter">
                            CẬP NHẬT PHÒNG
                        </h2>
                    </div>
                </div>

                <div className="p-8">
                    <Form form={form} layout="vertical" className="font-mono">
                        <div className="grid grid-cols-2 gap-6">
                            <Form.Item label={<span className="font-bold text-lg uppercase">Tên phòng</span>} name="name" rules={[{ required: true, message: 'Nhập tên phòng!' }]}>
                                <Input className="gumroad-input" placeholder="VD: P.101" />
                            </Form.Item>
                            
                            <Form.Item label={<span className="font-bold text-lg uppercase">Tầng</span>} name="floor">
                                <InputNumber 
                                    className="w-full border-2 border-black shadow-[4px_4px_0px_#000] text-lg rounded-none h-12 pt-1"
                                    min={1}
                                />
                            </Form.Item>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <Form.Item label={<span className="font-bold text-lg uppercase">Giá thuê</span>} name="price" rules={[{ required: true, message: 'Nhập giá tiền!' }]}>
                                <InputNumber 
                                    className="w-full border-2 border-black shadow-[4px_4px_0px_#000] text-lg rounded-none h-12 pt-1"
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                                    placeholder="3,500,000"
                                    addonAfter={<span className="font-bold">₫</span>}
                                />
                            </Form.Item>
                            {/* Note: depositPrice might not be in the Room model directly, usually in Contract, but keeping for consistency if needed */}
                            <Form.Item label={<span className="font-bold text-lg uppercase">Tiền cọc (Gợi ý)</span>} name="depositPrice">
                               <InputNumber 
                                  className="w-full border-2 border-black shadow-[4px_4px_0px_#000] text-lg rounded-none h-12 pt-1" 
                                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                                  placeholder="3,500,000" 
                                  addonAfter={<span className="font-bold">₫</span>}
                               />
                            </Form.Item>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <Form.Item label={<span className="font-bold text-lg uppercase">Diện tích</span>} name="area">
                               <InputNumber 
                                  className="w-full border-2 border-black shadow-[4px_4px_0px_#000] text-lg rounded-none h-12 pt-1" 
                                  placeholder="25" 
                                  addonAfter={<span className="font-bold">m²</span>}
                               />
                            </Form.Item>
                            <Form.Item label={<span className="font-bold text-lg uppercase">Giới tính</span>} name="gender">
                                <Radio.Group className="w-full flex gap-2">
                                    <Radio.Button value="ALL" className="flex-1 text-center font-bold border-2 border-black h-12 flex items-center justify-center hover:bg-gray-100 peer-checked:bg-black peer-checked:text-white">
                                        <TeamOutlined /> Tất cả
                                    </Radio.Button>
                                    <Radio.Button value="MALE" className="flex-1 text-center font-bold border-2 border-black h-12 flex items-center justify-center hover:bg-blue-50 text-blue-600">
                                        <ManOutlined /> Nam
                                    </Radio.Button>
                                    <Radio.Button value="FEMALE" className="flex-1 text-center font-bold border-2 border-black h-12 flex items-center justify-center hover:bg-pink-50 text-pink-600">
                                        <WomanOutlined /> Nữ
                                    </Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item label={<span className="font-bold text-lg uppercase">Số người tối đa</span>} name="maxTenants">
                               <InputNumber 
                                  className="w-full border-2 border-black shadow-[4px_4px_0px_#000] text-lg rounded-none h-12 pt-1" 
                               />
                            </Form.Item>
                        </div>

                        <Form.Item label={<span className="font-bold text-lg uppercase">Tiện ích / Tài sản</span>} name="assets">
                            <Select
                                mode="tags"
                                style={{ width: '100%' }}
                                placeholder="Chọn tiện ích..."
                                options={[
                                    { value: 'Điều hòa', label: '❄️ Điều hòa' },
                                    { value: 'Nóng lạnh', label: '🔥 Nóng lạnh' },
                                    { value: 'Tủ lạnh', label: '🧊 Tủ lạnh' },
                                    { value: 'Máy giặt', label: '🧺 Máy giặt' },
                                    { value: 'Giường', label: '🛏️ Giường' },
                                    { value: 'Tủ quần áo', label: '🚪 Tủ quần áo' },
                                    { value: 'Bếp', label: '🍳 Bếp' },
                                    { value: 'Wifi', label: '📶 Wifi' },
                                    { value: 'Chỗ để xe', label: '🛵 Chỗ để xe' },
                                ]}
                                className="gumroad-select-override h-12"
                                tagRender={(props) => (
                                    <Tag color="black" closable={props.closable} onClose={props.onClose} style={{ marginRight: 3 }}>
                                        <span className="font-bold text-white">{props.label}</span>
                                    </Tag>
                                )}
                            />
                        </Form.Item>

                        <div className="flex justify-end gap-4 mt-8 pt-4 border-t-2 border-black border-dashed">
                            <button type="button" onClick={onCancel} className="px-6 py-3 font-bold border-2 border-black hover:bg-gray-100 uppercase text-lg">
                                Hủy
                            </button>
                            <button 
                                type="button" 
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-3 font-bold bg-[#FF90E8] text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all uppercase text-lg"
                            >
                                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </Modal>
    );
}
