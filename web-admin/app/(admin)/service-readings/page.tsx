'use client';
import { useState, useEffect, useRef } from 'react';
import { Table, DatePicker, Select, Button, InputNumber, message, Card, Tag } from 'antd';
import { Save, Loader2, Zap, Droplets } from 'lucide-react';
import dayjs from 'dayjs';
import { readingsApi } from '@/lib/api/readings';
import { buildingsApi } from '@/lib/api/buildings';
import { Building } from '@/types/room';

interface ServiceReadingRow {
    roomId: number;
    roomName: string;
    contractId: number;
    services: {
        serviceId: number;
        serviceName: string;
        oldIndex: number;
        newIndex: number | null;
        isBilled: boolean;
    }[];
}

export default function ServiceReadingsPage() {
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
    const [month, setMonth] = useState(dayjs());
    const [data, setData] = useState<ServiceReadingRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Refs for input navigation
    const inputsRef = useRef<(HTMLInputElement | null)[][]>([]);

    useEffect(() => {
        fetchBuildings();
    }, []);

    useEffect(() => {
        if (selectedBuildingId) {
            fetchData();
        }
    }, [selectedBuildingId, month]);

    const fetchBuildings = async () => {
        try {
            const res = await buildingsApi.getAll();
            setBuildings(res);
            if (res.length > 0) setSelectedBuildingId(res[0].id);
        } catch (error) {
            message.error('Lỗi tải danh sách tòa nhà');
        }
    };

    const fetchData = async () => {
        if (!selectedBuildingId) return;
        setLoading(true);
        try {
            const res = await readingsApi.prepareBulk({
                buildingId: selectedBuildingId,
                month: month.format('MM-YYYY')
            });
            setData(res);
            // Reset refs
            inputsRef.current = res.map(() => []);
        } catch (error) {
            console.error(error);
            message.error('Lỗi tải dữ liệu chốt số');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (rowIndex: number, serviceIndex: number, value: number | null) => {
        const newData = [...data];
        newData[rowIndex].services[serviceIndex].newIndex = value;
        setData(newData);
    };

    const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, serviceIndex: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Move to next row, same column
            const nextRowIndex = rowIndex + 1;
            if (nextRowIndex < data.length) {
                const nextInput = inputsRef.current[nextRowIndex]?.[serviceIndex];
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                }
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Flatten data to send to bulk API
            const readingsToSave = [];
            for (const row of data) {
                for (const service of row.services) {
                    // Only save if newIndex is entered and valid
                    if (service.newIndex !== null && service.newIndex >= service.oldIndex && !service.isBilled) {
                        readingsToSave.push({
                            contractId: row.contractId,
                            serviceId: service.serviceId,
                            newIndex: service.newIndex
                        });
                    }
                }
            }

            if (readingsToSave.length === 0) {
                message.warning('Không có dữ liệu hợp lệ để lưu (Số mới phải >= Số cũ)');
                setSaving(false);
                return;
            }

            await readingsApi.bulkCreate(month.format('MM-YYYY'), readingsToSave);
            message.success(`Đã lưu ${readingsToSave.length} chỉ số thành công!`);
            fetchData(); // Refresh to update status
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Lỗi khi lưu dữ liệu');
        } finally {
            setSaving(false);
        }
    };

    // Dynamic columns based on services
    // Assuming all rooms have same services for simplicity, or we find unique services
    const uniqueServices = Array.from(new Set(data.flatMap(r => r.services.map(s => s.serviceName))));
    
    // Map service names to IDs for column rendering (taking first occurrence)
    const serviceMap = uniqueServices.map(name => {
        const found = data.find(r => r.services.find(s => s.serviceName === name))?.services.find(s => s.serviceName === name);
        return { name, id: found?.serviceId };
    });

    const columns = [
        {
            title: 'PHÒNG',
            dataIndex: 'roomName',
            key: 'roomName',
            width: 150,
            fixed: 'left' as const,
            render: (text: string) => <span className="font-black text-lg">{text}</span>
        },
        ...serviceMap.map((service, sIndex) => ({
            title: (
                <div className="flex items-center gap-2 uppercase">
                    {service.name === 'Điện' ? <Zap size={16} className="text-yellow-500 fill-yellow-500"/> : 
                     service.name === 'Nước' ? <Droplets size={16} className="text-blue-500 fill-blue-500"/> : null}
                    {service.name}
                </div>
            ),
            key: service.name,
            render: (_: any, record: ServiceReadingRow, rIndex: number) => {
                const item = record.services.find(s => s.serviceName === service.name);
                if (!item) return <span className="text-gray-400">-</span>;

                return (
                    <div className="flex items-center gap-2">
                        <div className="w-20 text-right text-gray-500 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {item.oldIndex}
                        </div>
                        <span className="text-gray-400">→</span>
                        <InputNumber
                            ref={(el) => {
                                if (!inputsRef.current[rIndex]) inputsRef.current[rIndex] = [];
                                inputsRef.current[rIndex][sIndex] = el as any; // Antd InputNumber ref is tricky, casting to any for now
                            }}
                            value={item.newIndex}
                            onChange={(val) => handleInputChange(rIndex, rIndex, val)} // Wait, sIndex logic is tricky if services vary.
                            // Better: Find index in record.services
                            // Let's fix onChange logic below
                            disabled={item.isBilled}
                            className={`w-24 font-bold ${item.isBilled ? 'bg-green-50 border-green-500 text-green-700' : ''}`}
                            placeholder="Số mới"
                            onKeyDown={(e) => handleKeyDown(e, rIndex, sIndex)}
                            status={item.newIndex !== null && item.newIndex < item.oldIndex ? 'error' : ''}
                        />
                        {item.isBilled && <Tag color="green">Đã chốt</Tag>}
                    </div>
                );
            }
        }))
    ];

    // Fix render function for InputNumber onChange
    const renderInput = (record: ServiceReadingRow, rIndex: number, serviceName: string, sIndex: number) => {
        const sItemIndex = record.services.findIndex(s => s.serviceName === serviceName);
        if (sItemIndex === -1) return <span className="text-gray-400">-</span>;
        const item = record.services[sItemIndex];

        return (
            <div className="flex items-center gap-2">
                <div className="w-20 text-right text-gray-500 font-mono text-sm bg-gray-100 px-2 py-1 rounded border border-gray-200">
                    {item.oldIndex}
                </div>
                <span className="text-gray-400">→</span>
                <InputNumber
                    value={item.newIndex}
                    onChange={(val) => handleInputChange(rIndex, sItemIndex, val)}
                    disabled={item.isBilled}
                    className={`w-28 font-bold ${item.isBilled ? 'bg-green-50 border-green-500 text-green-700' : ''}`}
                    placeholder="Nhập số mới..."
                    onKeyDown={(e) => handleKeyDown(e, rIndex, sIndex)}
                    status={item.newIndex !== null && item.newIndex < item.oldIndex ? 'error' : ''}
                />
                {item.isBilled && <Tag color="success" className="font-bold">ĐÃ CHỐT</Tag>}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f0f0f0] p-8 font-sans">
             {/* HEADER */}
            <div className="flex justify-between items-end mb-8 border-b-4 border-black pb-6">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter mb-2 uppercase">Chốt số điện nước</h1>
                    <p className="text-gray-600 font-bold text-lg">Nhập chỉ số hàng tháng nhanh chóng (Dạng Excel).</p>
                </div>
                
                <Button 
                    onClick={handleSave}
                    loading={saving}
                    disabled={loading}
                    className="flex items-center gap-3 bg-[#00E054] text-black border-4 border-black px-6 py-6 font-black text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
                >
                    <Save size={28} strokeWidth={3} /> 
                    LƯU TẤT CẢ
                </Button>
            </div>

            {/* FILTERS */}
            <div className="flex gap-4 mb-8 bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] items-center">
                <div className="flex flex-col">
                    <span className="text-xs font-bold mb-1 uppercase text-gray-500">Chọn Tòa nhà</span>
                    <Select
                        value={selectedBuildingId}
                        onChange={setSelectedBuildingId}
                        options={buildings.map(b => ({ label: b.name, value: b.id }))}
                        className="h-12 w-64 [&>.ant-select-selector]:!border-2 [&>.ant-select-selector]:!border-black [&>.ant-select-selector]:!h-12 [&>.ant-select-selector]:!flex [&>.ant-select-selector]:!items-center [&_.ant-select-selection-item]:!font-bold [&_.ant-select-selection-item]:!text-lg"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold mb-1 uppercase text-gray-500">Tháng chốt số</span>
                    <DatePicker 
                        picker="month" 
                        format="MM-YYYY"
                        allowClear={false}
                        value={month}
                        onChange={(val) => val && setMonth(val)}
                        className="h-12 border-2 border-black font-bold text-lg w-48"
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <Table
                    dataSource={data}
                    rowKey="roomId"
                    loading={loading}
                    pagination={false}
                    className="neobrutalism-table"
                    columns={[
                        {
                            title: 'PHÒNG',
                            dataIndex: 'roomName',
                            key: 'roomName',
                            width: 150,
                            render: (text: string) => <span className="font-black text-xl">{text}</span>
                        },
                        ...serviceMap.map((service, sIndex) => ({
                            title: (
                                <div className="flex items-center gap-2 uppercase text-lg">
                                    {service.name === 'Điện' ? <Zap size={20} className="text-yellow-500 fill-yellow-500"/> : 
                                     service.name === 'Nước' ? <Droplets size={20} className="text-blue-500 fill-blue-500"/> : null}
                                    {service.name}
                                </div>
                            ),
                            key: service.name,
                            render: (_: any, record: ServiceReadingRow, rIndex: number) => renderInput(record, rIndex, service.name!, sIndex)
                        }))
                    ]}
                />
            </div>

            <style jsx global>{`
                .neobrutalism-table .ant-table-thead > tr > th {
                    background-color: #000 !important;
                    color: #fff !important;
                    text-transform: uppercase;
                    font-weight: 900;
                    border-right: 2px solid #fff !important;
                    border-bottom: 4px solid #000 !important;
                    border-radius: 0 !important;
                    padding: 16px !important;
                }
                .neobrutalism-table .ant-table-thead > tr > th:last-child {
                    border-right: none !important;
                }
                .neobrutalism-table .ant-table-tbody > tr > td {
                    border-bottom: 2px solid #000 !important;
                    font-weight: 500;
                    padding: 16px !important;
                }
                .neobrutalism-table .ant-table-row:hover > td {
                    background-color: #fff9db !important;
                }
            `}</style>
        </div>
    );
}
