import { Modal } from 'antd';
import dayjs from 'dayjs';
import { User, Home, Calendar } from 'lucide-react';
import { Service } from '@/types/service';

interface ContractDetailModalProps {
    open: boolean;
    onCancel: () => void;
    contract: any;
    services: Service[];
}

export default function ContractDetailModal({ open, onCancel, contract, services }: ContractDetailModalProps) {
    if (!contract) return null;

    // Helper to get service name
    const getServiceName = (id: string) => {
        const service = services.find(s => s.id === Number(id));
        return service ? service.name : `Service #${id}`;
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            title={null}
            className="gumroad-modal"
            width={700}
            closeIcon={<span className="text-xl font-bold">✕</span>}
            centered
        >
            <div className="bg-white" style={{ backgroundImage: 'linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(to right, #E5E7EB 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                {/* HEADER */}
                <div className="bg-[#FFD700] border-b-[3px] border-black p-6 flex items-center justify-between">
                    <div className="bg-white border-2 border-black px-4 py-1 transform -rotate-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="text-2xl font-black uppercase m-0 tracking-tighter">
                            CHI TIẾT HỢP ĐỒNG
                        </h2>
                    </div>
                    <div className="font-mono font-bold text-lg border-2 border-black bg-white px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        #{contract.id}
                    </div>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    {/* 1. ROOM INFO */}
                    <div className="mb-8">
                        <div className="inline-block bg-[#4DA2FF] border-2 border-black px-3 py-1 mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
                            <span className="font-black text-sm uppercase text-white tracking-wide flex items-center gap-2">
                                <Home size={16} /> THÔNG TIN PHÒNG
                            </span>
                        </div>
                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase">Tòa nhà</div>
                                    <div className="font-bold text-lg">{contract.room?.building?.name}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase">Phòng</div>
                                    <div className="font-bold text-lg">{contract.room?.name}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase">Giá thuê</div>
                                    <div className="font-mono font-bold text-lg">{contract.price?.toLocaleString()} đ</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase">Trạng thái</div>
                                    <div className="font-bold">
                                        {contract.isActive ? (
                                            <span className="text-green-600 bg-green-100 px-2 py-0.5 border border-black text-xs">ĐANG HIỆU LỰC</span>
                                        ) : (
                                            <span className="text-red-600 bg-red-100 px-2 py-0.5 border border-black text-xs">ĐÃ KẾT THÚC</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. TENANT INFO */}
                    <div className="mb-8">
                        <div className="inline-block bg-[#FF69B4] border-2 border-black px-3 py-1 mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
                            <span className="font-black text-sm uppercase text-white tracking-wide flex items-center gap-2">
                                <User size={16} /> KHÁCH THUÊ
                            </span>
                        </div>
                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs font-bold text-gray-500 uppercase">Họ và tên</div>
                                            <div className="font-bold text-lg">{contract.tenant?.fullName}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-500 uppercase">Số điện thoại</div>
                                            <div className="font-mono font-bold text-lg">{contract.tenant?.phone}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* CCCD Images */}
                            {(contract.tenant?.info?.cccdFront || contract.tenant?.info?.cccdBack) && (
                                <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
                                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Giấy tờ tùy thân</div>
                                    <div className="flex gap-4">
                                        {contract.tenant?.info?.cccdFront && (
                                            <div className="border-2 border-black p-1 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                <img src={contract.tenant.info.cccdFront} alt="CCCD Front" className="h-24 object-cover" />
                                            </div>
                                        )}
                                        {contract.tenant?.info?.cccdBack && (
                                            <div className="border-2 border-black p-1 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                <img src={contract.tenant.info.cccdBack} alt="CCCD Back" className="h-24 object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. CONTRACT TIMELINE */}
                    <div>
                        <div className="inline-block bg-[#00E054] border-2 border-black px-3 py-1 mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
                            <span className="font-black text-sm uppercase text-white tracking-wide flex items-center gap-2">
                                <Calendar size={16} /> THỜI HẠN & THANH TOÁN
                            </span>
                        </div>
                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs font-bold text-gray-500 uppercase">Ngày bắt đầu</span>
                                    </div>
                                    <div className="font-mono font-bold text-xl border-b-2 border-black inline-block">
                                        {dayjs(contract.startDate).format('DD/MM/YYYY')}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span className="text-xs font-bold text-gray-500 uppercase">Ngày kết thúc</span>
                                    </div>
                                    <div className="font-mono font-bold text-xl border-b-2 border-black inline-block">
                                        {contract.endDate ? dayjs(contract.endDate).format('DD/MM/YYYY') : 'Vô thời hạn'}
                                    </div>
                                </div>
                                
                                <div className="col-span-2 mt-2 pt-2 border-t-2 border-dashed border-gray-300">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold uppercase text-gray-600">Tiền cọc cam kết</span>
                                        <span className="font-mono font-black text-xl">
                                            {contract.deposit?.toLocaleString()} đ
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold uppercase text-gray-600">Đã đóng thực tế</span>
                                        <span className={`font-mono font-black text-xl ${contract.paidDeposit < contract.deposit ? 'text-red-500' : 'text-green-600'}`}>
                                            {contract.paidDeposit?.toLocaleString()} đ
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. INITIAL INDEXES */}
                    {contract.initialIndexes && Object.keys(contract.initialIndexes).length > 0 && (
                        <div className="mt-8">
                            <div className="inline-block bg-[#fff59d] border-2 border-black px-3 py-1 mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
                                <span className="font-black text-sm uppercase text-black tracking-wide flex items-center gap-2">
                                    ⚡ CHỈ SỐ BÀN GIAO
                                </span>
                            </div>
                            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(contract.initialIndexes).map(([key, value]: [string, any]) => (
                                        <div key={key} className="border-2 border-black p-2 bg-gray-50 text-center">
                                            <div className="text-xs font-bold text-gray-500 uppercase mb-1">{getServiceName(key)}</div>
                                            <div className="font-mono font-black text-xl">{value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
