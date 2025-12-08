'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, Button, Table, InputNumber, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, SendOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { buildingsApi, Building, Room } from '@/lib/api/buildings';
import { invoicesApi } from '@/lib/api/invoices';
import { Invoice, InvoiceLineItem, InvoiceStatus } from '@/types/invoice';

interface Props {
    isOpen: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function CreateInvoiceModal({ isOpen, onCancel, onSuccess }: Props) {
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
    
    // Draft Data
    const [draftInvoice, setDraftInvoice] = useState<Invoice | null>(null);
    const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

    const [form] = Form.useForm();

    useEffect(() => {
        if (isOpen) {
            fetchBuildings();
            setStep(1);
            form.resetFields();
            form.setFieldValue('month', dayjs());
            setDraftInvoice(null);
            setLineItems([]);
        }
    }, [isOpen]);

    const fetchBuildings = async () => {
        try {
            const data = await buildingsApi.getAll();
            setBuildings(data);
        } catch (error) {
            message.error('Lỗi tải danh sách tòa nhà');
        }
    };

    const handleBuildingChange = async (buildingId: number) => {
        setSelectedBuilding(buildingId);
        form.setFieldValue('roomId', null);
        try {
            const data = await buildingsApi.getRooms(buildingId);
            setRooms(data);
        } catch (error) {
            message.error('Lỗi tải danh sách phòng');
        }
    };

    const handleGenerateDraft = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // Fetch contract for room
             const contractsRes = await axiosClient.get(`/contracts?roomId=${values.roomId}&isActive=true`);
             if (contractsRes.data.length === 0) {
                 message.error('Phòng này chưa có hợp đồng đang hoạt động!');
                 setLoading(false);
                 return;
             }
             const contractId = contractsRes.data[0].id;
             
             // 1. Call Preview API
             const previewData = await invoicesApi.preview({
                 contractId,
                 month: values.month.format('MM-YYYY')
             });
             
             // 2. Set data for review (Snapshot)
             setLineItems(previewData.lineItems);
             
             // Store contractId for later use
             setDraftInvoice({ 
                 ...draftInvoice, 
                 contractId, 
                 month: values.month.format('MM-YYYY'),
                 contract: { room: { name: rooms.find(r => r.id === values.roomId)?.name || '' } } 
             } as any);
             
             setStep(2);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Lỗi tính toán hóa đơn');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
        const newItems = [...lineItems];
        newItems[index] = { ...newItems[index], [field]: value };
        
        // Recalculate amount if quantity or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
        }
        
        setLineItems(newItems);
    };

    const handleDeleteLineItem = (index: number) => {
        const newItems = [...lineItems];
        newItems.splice(index, 1);
        setLineItems(newItems);
    };

    const handleAddLineItem = () => {
        setLineItems([
            ...lineItems,
            {
                type: 'EXTRA',
                name: 'Chi phí khác',
                quantity: 1,
                unitPrice: 0,
                amount: 0,
                note: ''
            }
        ]);
    };

    const calculateTotal = () => {
        return lineItems.reduce((sum, item) => sum + item.amount, 0);
    };

    const handleSave = async (publish: boolean = false) => {
        if (!draftInvoice?.contractId) return;
        setLoading(true);
        try {
            // 3. Create Invoice with Snapshot (lineItems)
            const invoice = await invoicesApi.generateDraft({
                contractId: draftInvoice.contractId,
                month: draftInvoice.month,
                lineItems: lineItems // Send the snapshot!
            });

            // 4. Publish if requested
            if (publish) {
                await invoicesApi.publish(invoice.id);
                message.success('Đã phát hành hóa đơn thành công!');
            } else {
                message.success('Đã tạo hóa đơn thành công!');
            }
            
            onSuccess();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Lỗi khi lưu hóa đơn');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Loại',
            dataIndex: 'type',
            width: 100,
            render: (type: string) => (
                <span className={`text-xs font-bold px-2 py-1 border border-black ${
                    type === 'RENT' ? 'bg-blue-100' :
                    type === 'ELECTRIC' ? 'bg-yellow-100' :
                    type === 'WATER' ? 'bg-blue-50' :
                    type === 'DEBT' ? 'bg-red-100' :
                    'bg-gray-100'
                }`}>
                    {type}
                </span>
            )
        },
        {
            title: 'Tên khoản thu',
            dataIndex: 'name',
            render: (text: string, record: InvoiceLineItem, index: number) => (
                <Input 
                    value={text} 
                    onChange={(e) => handleUpdateLineItem(index, 'name', e.target.value)}
                    className="font-bold"
                />
            )
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            width: 100,
            render: (val: number, record: InvoiceLineItem, index: number) => (
                <InputNumber 
                    value={val} 
                    onChange={(val) => handleUpdateLineItem(index, 'quantity', val)}
                    className="w-full"
                />
            )
        },
        {
            title: 'Đơn giá',
            dataIndex: 'unitPrice',
            width: 150,
            render: (val: number, record: InvoiceLineItem, index: number) => (
                <InputNumber 
                    value={val} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                    onChange={(val) => handleUpdateLineItem(index, 'unitPrice', val)}
                    className="w-full"
                />
            )
        },
        {
            title: 'Thành tiền',
            dataIndex: 'amount',
            width: 150,
            render: (val: number) => (
                <span className="font-black">{val.toLocaleString()}</span>
            )
        },
        {
            title: '',
            width: 50,
            render: (_: any, __: any, index: number) => (
                <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDeleteLineItem(index)}
                />
            )
        }
    ];

    return (
        <Modal
            open={isOpen}
            onCancel={onCancel}
            title={<span className="text-xl font-black uppercase">Tạo hóa đơn mới</span>}
            footer={null}
            width={900}
            className="neobrutalism-modal"
        >
            {step === 1 ? (
                <Form form={form} layout="vertical" onFinish={handleGenerateDraft}>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="buildingId" label="Chọn Tòa nhà" rules={[{ required: true }]}>
                            <Select 
                                placeholder="Chọn tòa nhà" 
                                onChange={handleBuildingChange}
                                options={buildings.map(b => ({ label: b.name, value: b.id }))}
                                className="h-10"
                            />
                        </Form.Item>
                        <Form.Item name="roomId" label="Chọn Phòng" rules={[{ required: true }]}>
                            <Select 
                                placeholder="Chọn phòng" 
                                options={rooms.map(r => ({ label: r.name, value: r.id }))}
                                disabled={!selectedBuilding}
                                className="h-10"
                            />
                        </Form.Item>
                    </div>
                    <Form.Item name="month" label="Tháng hóa đơn" rules={[{ required: true }]}>
                        <DatePicker picker="month" format="MM-YYYY" className="w-full h-10" />
                    </Form.Item>
                    
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        className="w-full h-12 bg-black text-white font-bold text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-y-[2px] hover:translate-x-[2px] transition-all"
                    >
                        <CalculatorOutlined /> XEM TRƯỚC (PREVIEW)
                    </Button>
                </Form>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="bg-yellow-50 p-4 border-2 border-black">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">Hóa đơn tháng: {draftInvoice?.month}</span>
                            <span className="font-bold">Phòng: {draftInvoice?.contract?.room.name}</span>
                        </div>
                        <div className="text-sm text-gray-500 italic">
                            * Kiểm tra kỹ các khoản thu trước khi tạo hóa đơn. Dữ liệu này sẽ được lưu chính xác như bạn thấy.
                        </div>
                    </div>

                    <Table 
                        dataSource={lineItems}
                        columns={columns}
                        pagination={false}
                        rowKey={(record) => Math.random().toString()} // Temp key
                        className="border-2 border-black"
                        summary={(pageData) => {
                            const total = calculateTotal();
                            return (
                                <Table.Summary.Row className="bg-gray-50 font-black text-lg">
                                    <Table.Summary.Cell index={0} colSpan={4} className="text-right uppercase">Tổng cộng:</Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} colSpan={2}>{total.toLocaleString()} ₫</Table.Summary.Cell>
                                </Table.Summary.Row>
                            );
                        }}
                    />

                    <Button onClick={handleAddLineItem} icon={<PlusOutlined />} className="self-start border-dashed border-black">
                        Thêm dòng
                    </Button>

                    <div className="flex gap-3 mt-4 justify-end">
                        <Button onClick={() => setStep(1)} className="h-10 font-bold border-2 border-black">
                            Quay lại
                        </Button>
                        <Button 
                            onClick={() => handleSave(false)} 
                            loading={loading}
                            className="h-10 font-bold border-2 border-black bg-white hover:bg-gray-50"
                        >
                            <SaveOutlined /> Tạo hóa đơn
                        </Button>
                        <Popconfirm
                            title="Xác nhận phát hành"
                            description="Hóa đơn sẽ được chuyển sang trạng thái PUBLISHED và gửi thông báo (nếu có)."
                            onConfirm={() => handleSave(true)}
                        >
                            <Button 
                                type="primary" 
                                loading={loading}
                                className="h-10 font-bold border-2 border-black bg-[#00E054] text-black hover:bg-[#00c04b]"
                            >
                                <SendOutlined /> Tạo & Phát hành
                            </Button>
                        </Popconfirm>
                    </div>
                </div>
            )}
        </Modal>
    );
}

// Need to import axiosClient for the contract fetch workaround
import axiosClient from '@/lib/axios-client';
