'use client';
import { useState, useEffect } from 'react';
import { Table, Modal, Form, InputNumber, Select, Tag, message, DatePicker, Popconfirm } from 'antd';
import { Plus, Trash2, Zap, Droplets, Filter, Check } from 'lucide-react';
import { readingsApi } from '@/lib/api/readings';
import { servicesApi } from '@/lib/api/services';
import { ServiceReading } from '@/types/reading';
import { Service, ServiceType } from '@/types/service';
import dayjs from 'dayjs';
import axios from '@/lib/axios-client';

export default function ReadingsPage() {
  const [readings, setReadings] = useState<ServiceReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  
  // Filters
  const [month, setMonth] = useState(dayjs().format('MM-YYYY'));
  const [selectedService, setSelectedService] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [form] = Form.useForm();

  const [modalSelectedBuilding, setModalSelectedBuilding] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [serviceData, buildingRes, readingData] = await Promise.all([
        servicesApi.getByType(ServiceType.INDEX),
        axios.get('/buildings'),
        readingsApi.findAll(month, selectedService || undefined)
      ]);
      
      setServices(serviceData);
      setBuildings(buildingRes.data);
      setReadings(readingData);
    } catch (error) {
      console.error(error);
      message.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, selectedService]);

  const handleSave = async (values: any) => {
    try {
      setModalLoading(true);
      // Flatten the bulkReadings structure
      const readings: any[] = [];
      
      values.bulkReadings.forEach((room: any) => {
          room.services.forEach((service: any) => {
              // Only include if newIndex is entered
              if (service.newIndex !== undefined && service.newIndex !== null) {
                  readings.push({
                      contractId: room.contractId,
                      serviceId: service.serviceId,
                      newIndex: service.newIndex,
                      oldIndex: service.oldIndex,
                      isMeterReset: service.isMeterReset,
                  });
              }
          });
      });

      if (readings.length === 0) {
          message.warning('Chưa nhập chỉ số nào!');
          setModalLoading(false);
          return;
      }

      await readingsApi.bulkCreate(month, readings);
      
      message.success(`Đã lưu ${readings.length} chỉ số thành công!`);
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi lưu chỉ số');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await readingsApi.delete(id);
      message.success('Đã xóa bản ghi!');
      fetchData();
    } catch (error) {
      message.error('Lỗi khi xóa');
    }
  };

  const columns = [
    {
      title: 'Phòng / Tòa nhà',
      key: 'room',
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (_: any, record: ServiceReading) => (
        <div>
          <div className="font-bold text-gray-900">{record.contract?.room.name}</div>
          <div className="text-xs text-gray-400 font-medium">{record.contract?.room.building.name}</div>
        </div>
      ),
    },
    {
      title: 'Dịch vụ',
      dataIndex: ['service', 'name'],
      key: 'service',
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (text: string) => {
        let Icon = Zap;
        let colorClass = "text-yellow-600 bg-yellow-50 border-yellow-100";
        if (text.toLowerCase().includes('nước')) {
            Icon = Droplets;
            colorClass = "text-blue-600 bg-blue-50 border-blue-100";
        }
        return (
            <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${colorClass}`}>
                    <Icon size={14} />
                </div>
                <span className="font-semibold text-gray-700 text-sm">{text}</span>
            </div>
        );
      }
    },
    {
      title: 'Chỉ số cũ',
      dataIndex: 'oldIndex',
      key: 'oldIndex',
      align: 'right' as const,
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (val: number) => <span className="font-mono text-gray-600">{val.toLocaleString()}</span>,
    },
    {
      title: 'Chỉ số mới',
      dataIndex: 'newIndex',
      key: 'newIndex',
      align: 'right' as const,
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (val: number) => <span className="font-bold text-blue-600 font-mono">{val.toLocaleString()}</span>,
    },
    {
      title: 'Sử dụng',
      dataIndex: 'usage',
      key: 'usage',
      align: 'center' as const,
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (val: number, record: ServiceReading) => (
          <span className="font-bold text-gray-700 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{val} {record.service.unit}</span>
      ),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalCost',
      key: 'totalCost',
      align: 'right' as const,
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (val: number) => <span className="font-bold text-emerald-600 font-mono">{val.toLocaleString()} đ</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isBilled',
      key: 'isBilled',
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (isBilled: boolean) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isBilled ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
          {isBilled ? 'Đã lên HĐ' : 'Chưa lên HĐ'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      className: 'bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider font-semibold py-3',
      render: (_: any, record: ServiceReading) => (
        !record.isBilled && (
            <Popconfirm 
                title="Xác nhận xóa?" 
                description="Hành động này không thể hoàn tác."
                onConfirm={() => handleDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true, type: 'primary' }}
            >
                <button className="text-gray-400 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={16} />
                </button>
            </Popconfirm>
        )
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-gray-900 font-sans p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
            <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Readings</h1>
            <p className="text-gray-500 mt-1">Ghi nhận chỉ số điện nước hàng tháng.</p>
            </div>
            
            <button 
            onClick={() => {
                form.resetFields();
                setIsModalOpen(true);
            }}
            className="claude-btn-primary flex items-center gap-2 group bg-black text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
            <span>Chốt số mới</span>
            </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-500 mr-2">
            <Filter size={16} />
            <span className="text-sm font-medium uppercase tracking-wide">Bộ lọc</span>
            </div>
            
            <DatePicker 
            picker="month" 
            format="MM-YYYY"
            allowClear={false}
            value={dayjs(month, 'MM-YYYY')}
            onChange={(date) => setMonth(date ? date.format('MM-YYYY') : dayjs().format('MM-YYYY'))}
            className="w-40 border-gray-200 hover:border-gray-300 focus:border-black rounded-md"
            />

            <Select
            placeholder="Dịch vụ"
            allowClear
            className="w-40"
            value={selectedService}
            onChange={(val) => setSelectedService(val ?? null)}
            variant="borderless"
            style={{ border: '1px solid #e5e7eb', borderRadius: '6px' }}
            >
                {/* <Select.Option value={null}>Tất cả</Select.Option> Remove null option, use allowClear */}
                {services.map(s => (
                    <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                ))}
            </Select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <Table
            columns={columns}
            dataSource={readings}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            rowClassName="hover:bg-gray-50 transition-colors"
            />
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        title={null}
        className="gumroad-modal"
        width={1200}
        centered
        closeIcon={<span>✕</span>}
      >
        <div className="bg-white">
            {/* HEADER */}
            <div className="bg-[#FFD700] border-b-[3px] border-black p-4 flex items-center justify-between">
                <div className="bg-white border-2 border-black px-4 py-1 transform -rotate-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-xl font-black uppercase m-0 tracking-tighter">
                        CHỐT SỐ THÁNG {month}
                    </h2>
                </div>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto bg-gray-50">
                <Form form={form} layout="vertical" onFinish={handleSave} className="font-mono">
                    
                    {/* SECTION 1: BUILDING */}
                    <div className="mb-6">
                        <Form.Item name="buildingId" rules={[{ required: true, message: 'Vui lòng chọn tòa nhà' }]} className="mb-0">
                            <Select
                                className="gumroad-select w-full text-lg"
                                placeholder="Chọn tòa nhà để bắt đầu..."
                                onChange={async (val) => {
                                    setModalSelectedBuilding(val);
                                    setModalLoading(true);
                                    try {
                                        const data = await readingsApi.prepareBulk({ buildingId: val, month });
                                        const formReadings = data.map((room: any) => ({
                                            roomId: room.roomId,
                                            roomName: room.roomName,
                                            contractId: room.contractId,
                                            services: room.services.map((s: any) => ({
                                                serviceId: s.serviceId,
                                                serviceName: s.serviceName,
                                                price: s.price,
                                                oldIndex: s.oldIndex,
                                                newIndex: s.newIndex,
                                                isMeterReset: false,
                                            }))
                                        }));
                                        form.setFieldValue('bulkReadings', formReadings);
                                    } catch (error) {
                                        message.error('Lỗi tải dữ liệu tòa nhà');
                                    } finally {
                                        setModalLoading(false);
                                    }
                                }}
                            >
                                {buildings.map(b => (
                                    <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    {/* SECTION 2: COMPACT TABLE (PREMIUM) */}
                    <Form.List name="bulkReadings">
                        {(fields) => (
                            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider border-b border-gray-200">
                                            <th className="px-4 py-2 font-semibold w-[18%]">Phòng</th>
                                            <th className="px-4 py-2 font-semibold w-[14%]">Dịch vụ</th>
                                            <th className="px-4 py-2 font-semibold w-[13%] text-right">Chỉ số cũ</th>
                                            <th className="px-4 py-2 font-semibold w-[18%] text-center">Chỉ số mới</th>
                                            <th className="px-4 py-2 font-semibold w-[17%] text-center">Thay đồng hồ</th>
                                            <th className="px-4 py-2 font-semibold w-[10%] text-right">Sử dụng</th>
                                            <th className="px-4 py-2 font-semibold w-[10%] text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {fields.map((field, index) => {
                                            const room = form.getFieldValue(['bulkReadings', index]);
                                            return room.services.map((service: any, sIndex: number) => {
                                                const isElec = service.serviceName.toLowerCase().includes('điện');
                                                // Subtle indicator instead of full background
                                                const indicatorColor = isElec ? 'bg-yellow-400' : 'bg-blue-400';
                                                const icon = isElec ? <Zap size={14} className="text-yellow-600" /> : <Droplets size={14} className="text-blue-600" />;
                                                
                                                const isFirstService = sIndex === 0;
                                                const rowSpan = room.services.length;

                                                return (
                                                    <tr key={`${field.key}-${service.serviceId}`} className="hover:bg-gray-50/50 transition-colors group">
                                                        {/* Room Info (Merged Cell) */}
                                                        {isFirstService && (
                                                            <td rowSpan={rowSpan} className="px-4 py-2 border-r border-gray-100 bg-white align-top">
                                                                <div className="font-bold text-gray-900 text-base">{room.roomName}</div>
                                                                <div className="text-[11px] text-gray-400 font-medium mt-0.5">HĐ #{room.contractId}</div>
                                                            </td>
                                                        )}

                                                        {/* Service Info */}
                                                        <td className="px-4 py-2 align-middle relative">
                                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${indicatorColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-500">
                                                                    {icon}
                                                                </div>
                                                                <span className="font-semibold text-xs text-gray-700 uppercase tracking-tight">{service.serviceName}</span>
                                                            </div>
                                                        </td>

                                                        {/* Old Index */}
                                                        <td className="px-4 py-2 text-right font-mono text-gray-500 align-middle text-sm">
                                                            <div className="h-[32px] flex items-center justify-end">
                                                                {service.oldIndex?.toLocaleString()}
                                                            </div>
                                                        </td>

                                                        {/* New Index Input */}
                                                        <td className="px-4 py-2 align-middle relative">
                                                            <div className="h-[32px] flex items-center justify-center relative w-full">
                                                                <Form.Item
                                                                    name={[field.name, 'services', sIndex, 'newIndex']}
                                                                    rules={[
                                                                        { required: true, message: '' },
                                                                        ({ getFieldValue }) => ({
                                                                            validator(_, value) {
                                                                                if (!value && value !== 0) return Promise.resolve();
                                                                                const old = getFieldValue(['bulkReadings', index, 'services', sIndex, 'oldIndex']) || 0;
                                                                                const isReset = getFieldValue(['bulkReadings', index, 'services', sIndex, 'isMeterReset']);
                                                                                if (!isReset && value < old) {
                                                                                    return Promise.reject(new Error('')); // Empty error message to avoid duplication
                                                                                }
                                                                                return Promise.resolve();
                                                                            },
                                                                        }),
                                                                    ]}
                                                                    dependencies={[['bulkReadings', index, 'services', sIndex, 'isMeterReset']]}
                                                                    className="mb-0 w-auto" // Changed from w-full to w-auto
                                                                    help={null} // Hide default error message to avoid duplication
                                                                >
                                                                    <InputNumber 
                                                                        className="w-[100px] font-mono font-medium text-gray-900 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black rounded px-2 py-1 text-center h-[32px] shadow-sm transition-all placeholder:text-gray-300 hover:border-gray-300 flex items-center" 
                                                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                                        parser={value => value ? value.replace(/\$\s?|(,*)/g, '') : ''}
                                                                        placeholder="0"
                                                                    />
                                                                </Form.Item>
                                                                
                                                                {/* Floating Error */}
                                                                <Form.Item shouldUpdate className="mb-0">
                                                                    {({ getFieldValue }) => {
                                                                        const s = getFieldValue(['bulkReadings', index, 'services', sIndex]);
                                                                        if (!s || s.newIndex === undefined || s.newIndex === null) return null;
                                                                        const hasError = !s.isMeterReset && s.newIndex < s.oldIndex;
                                                                        if (hasError) {
                                                                            return (
                                                                                <div className="absolute left-1/2 -translate-x-1/2 -top-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 animate-in fade-in slide-in-from-bottom-1 pointer-events-none whitespace-nowrap">
                                                                                    Thấp hơn cũ!
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    }}
                                                                </Form.Item>
                                                            </div>
                                                        </td>

                                                        {/* Reset Checkbox */}
                                                        <td className="px-4 py-2 text-center align-middle">
                                                            <div className="h-[32px] flex items-center justify-center gap-2">
                                                                <Form.Item 
                                                                    name={[field.name, 'services', sIndex, 'isMeterReset']} 
                                                                    valuePropName="checked" 
                                                                    className="mb-0 flex justify-center"
                                                                >
                                                                    <div 
                                                                        className="cursor-pointer flex justify-center group/check"
                                                                        onClick={() => {
                                                                            const readings = form.getFieldValue('bulkReadings');
                                                                            const currentVal = readings[index].services[sIndex].isMeterReset;
                                                                            readings[index].services[sIndex].isMeterReset = !currentVal;
                                                                            form.setFieldValue('bulkReadings', [...readings]);
                                                                        }}
                                                                    >
                                                                        <Form.Item shouldUpdate className="mb-0">
                                                                            {({ getFieldValue }) => {
                                                                                const isReset = getFieldValue(['bulkReadings', index, 'services', sIndex, 'isMeterReset']);
                                                                                return (
                                                                                    <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${isReset ? 'bg-black border-black' : 'bg-white border-gray-300 group-hover/check:border-gray-400'}`}>
                                                                                        {isReset && <Check size={12} className="text-white" />}
                                                                                    </div>
                                                                                );
                                                                            }}
                                                                        </Form.Item>
                                                                    </div>
                                                                </Form.Item>
                                                                <Form.Item shouldUpdate className="mb-0">
                                                                    {({ getFieldValue }) => {
                                                                        const isReset = getFieldValue(['bulkReadings', index, 'services', sIndex, 'isMeterReset']);
                                                                        if (isReset) {
                                                                            return <span className="text-[10px] text-orange-600 font-bold leading-none">Thay mới</span>;
                                                                        }
                                                                        return null;
                                                                    }}
                                                                </Form.Item>
                                                            </div>
                                                        </td>

                                                        {/* Usage */}
                                                        <td className="px-4 py-2 text-right align-middle">
                                                            <div className="h-[32px] flex items-center justify-end">
                                                                <Form.Item shouldUpdate className="mb-0">
                                                                    {({ getFieldValue }) => {
                                                                        const s = getFieldValue(['bulkReadings', index, 'services', sIndex]);
                                                                        if (!s || s.newIndex === undefined || s.newIndex === null) return <span className="text-gray-300 font-mono">-</span>;
                                                                        const usage = s.isMeterReset ? s.newIndex : Math.max(0, s.newIndex - s.oldIndex);
                                                                        return <span className="font-bold text-blue-600 font-mono">{usage.toLocaleString()}</span>;
                                                                    }}
                                                                </Form.Item>
                                                            </div>
                                                        </td>

                                                        {/* Total Cost */}
                                                        <td className="px-4 py-2 text-right align-middle">
                                                            <div className="flex flex-col justify-center items-end min-h-[32px]">
                                                                <Form.Item shouldUpdate className="mb-0">
                                                                    {({ getFieldValue }) => {
                                                                        const s = getFieldValue(['bulkReadings', index, 'services', sIndex]);
                                                                        if (!s || s.newIndex === undefined || s.newIndex === null) return <span className="text-gray-300 font-mono">-</span>;
                                                                        const usage = s.isMeterReset ? s.newIndex : Math.max(0, s.newIndex - s.oldIndex);
                                                                        const total = usage * (s.price || 0);
                                                                        return (
                                                                            <div className="flex flex-col items-end">
                                                                                <span className="font-bold text-emerald-600 font-mono text-sm">{total.toLocaleString()}</span>
                                                                                <span className="text-[10px] text-gray-400 font-mono">
                                                                                    {usage.toLocaleString()} x {s.price?.toLocaleString()}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    }}
                                                                </Form.Item>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })}
                                        
                                        {fields.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-12 text-center text-gray-400 italic bg-gray-50/50">
                                                    {modalSelectedBuilding ? 'Không có phòng nào đang thuê.' : 'Vui lòng chọn tòa nhà để bắt đầu.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Form.List>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 sticky bottom-0 z-10 mt-0 rounded-b-xl">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="h-10 px-6 font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-white hover:border-gray-400 transition-all shadow-sm"
                        >
                            Hủy bỏ
                        </button>
                        <Form.Item shouldUpdate className="mb-0">
                            {({ getFieldValue }) => {
                                const bulkReadings = getFieldValue('bulkReadings') || [];
                                const grandTotal = bulkReadings.reduce((totalSum: number, room: any) => {
                                    const roomTotal = room.services.reduce((sum: number, s: any) => {
                                        if (s.newIndex === undefined || s.newIndex === null) return sum;
                                        const usage = s.isMeterReset ? s.newIndex : Math.max(0, s.newIndex - s.oldIndex);
                                        return sum + (usage * (s.price || 0));
                                    }, 0);
                                    return totalSum + roomTotal;
                                }, 0);

                                return (
                                    <button 
                                        onClick={() => form.submit()}
                                        disabled={modalLoading}
                                        className={`h-10 px-6 font-semibold rounded-lg bg-black text-white hover:bg-gray-800 transition-all shadow-sm flex items-center gap-2 ${modalLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <span>{modalLoading ? 'Đang lưu...' : 'Lưu tất cả'}</span>
                                        {grandTotal > 0 && (
                                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono">
                                                {grandTotal.toLocaleString()} đ
                                            </span>
                                        )}
                                    </button>
                                );
                            }}
                        </Form.Item>
                    </div>
                </Form>
            </div>
        </div>
      </Modal>
    </div>
  );
}
