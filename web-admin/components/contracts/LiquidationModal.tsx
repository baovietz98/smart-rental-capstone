import { Modal, Form, DatePicker, InputNumber, Input, Descriptions, Divider } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

interface LiquidationModalProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: (values: any) => void;
    contract: any;
    loading?: boolean;
}

export default function LiquidationModal({ open, onCancel, onConfirm, contract, loading }: LiquidationModalProps) {
    const [form] = Form.useForm();
    const [refundAmount, setRefundAmount] = useState(0);

    useEffect(() => {
        if (open && contract) {
            form.setFieldsValue({
                returnDate: dayjs(),
                deductions: 0,
                note: '',
            });
            // Don't call setRefundAmount here to avoid cascading render
            // It will be calculated by onValuesChange or we can set it initially if needed
        }
    }, [open, contract, form]);

    const handleValuesChange = (_: any, allValues: any) => {
        const deposit = contract?.paidDeposit || 0;
        const deductions = allValues.deductions || 0;
        setRefundAmount(deposit - deductions);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onConfirm(values);
        } catch (error) {
            // Form validation error
        }
    };

    if (!contract) return null;

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
                <div className="bg-[#FF4D4D] border-b-[3px] border-black p-6 flex items-center justify-between">
                    <div className="bg-white border-2 border-black px-4 py-1 transform -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="text-2xl font-black uppercase m-0 tracking-tighter text-red-600">
                            THANH LÝ HỢP ĐỒNG
                        </h2>
                    </div>
                </div>

                <div className="p-8">
                    <div className="bg-red-50 border-2 border-black p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                        <p className="font-bold text-red-700 uppercase mb-1">Xác nhận thanh lý cho:</p>
                        <p className="text-xl font-black">{contract.room?.name} - {contract.room?.building?.name}</p>
                        <p className="text-gray-600 font-mono text-sm">Khách thuê: {contract.tenant?.fullName}</p>
                    </div>

                    <Form form={form} layout="vertical" onValuesChange={handleValuesChange} className="font-mono">
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item name="returnDate" label={<span className="font-bold uppercase">Ngày trả phòng</span>} rules={[{ required: true }]}>
                                <DatePicker className="w-full h-10 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" format="DD/MM/YYYY" />
                            </Form.Item>
                            <Form.Item label={<span className="font-bold uppercase">Tiền cọc thực đóng</span>}>
                                <div className="h-10 flex items-center px-3 bg-gray-100 border-2 border-black font-mono font-bold text-lg">
                                    {contract.paidDeposit?.toLocaleString()} đ
                                </div>
                            </Form.Item>
                        </div>

                        <Form.Item name="deductions" label={<span className="font-bold uppercase">Trừ phí (Hỏng hóc, điện nước...)</span>} initialValue={0}>
                            <InputNumber 
                                className="w-full h-10 border-2 border-black pt-1 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value ? value.replace(/\$\s?|(,*)/g, '') : ''}
                                min={0}
                            />
                        </Form.Item>

                        <Form.Item name="note" label={<span className="font-bold uppercase">Ghi chú / Lý do trừ tiền</span>}>
                            <Input.TextArea rows={3} className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" placeholder="Nhập chi tiết các khoản trừ..." />
                        </Form.Item>

                        <Divider className="border-black border-dashed" />

                        <div className="flex justify-between items-center text-xl mb-6 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                            <span className="font-bold uppercase">Hoàn lại khách:</span>
                            <span className={`font-black font-mono text-2xl ${refundAmount < 0 ? 'text-red-600' : 'text-[#00E054]'}`}>
                                {refundAmount.toLocaleString()} đ
                            </span>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={onCancel} className="px-6 py-2 font-bold border-2 border-black hover:bg-gray-100 uppercase">
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={handleSubmit} 
                                disabled={loading}
                                className="px-6 py-2 font-bold bg-[#FF4D4D] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all uppercase"
                            >
                                {loading ? 'Đang xử lý...' : 'Xác nhận thanh lý'}
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </Modal>
    );
}
