'use client';

import { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios-client';
import { useParams } from 'next/navigation';
import { 
  Home, 
  Zap, 
  Droplets, 
  Wifi, 
  Trash2, 
  Car, 
  AlertCircle
} from 'lucide-react';

interface InvoiceLineItem {
  type: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  note?: string;
}

interface Invoice {
  id: number;
  month: string;
  totalAmount: number;
  status: string;
  contract: {
    room: {
      name: string;
      building: {
        name: string;
        address: string;
      };
    };
    tenant: {
      fullName: string;
      phone: string;
    };
  };
  lineItems: InvoiceLineItem[];
  createdAt: string;
}

export default function PublicBillPage() {
  const { code } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (code) {
      axiosClient.get(`/invoices/public/${code}`)
        .then(res => {
          setInvoice(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('Không tìm thấy hóa đơn hoặc đường dẫn không hợp lệ.');
          setLoading(false);
        });
    }
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center">
        <div className="text-2xl font-bold animate-pulse">Đang tải hóa đơn...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center p-4">
        <div className="gumroad-card bg-red-100 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold mb-2">Lỗi</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-400';
      case 'PARTIAL': return 'bg-yellow-400';
      case 'OVERDUE': return 'bg-red-400';
      case 'CANCELLED': return 'bg-gray-400';
      default: return 'bg-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID': return 'ĐÃ THANH TOÁN';
      case 'PARTIAL': return 'THANH TOÁN 1 PHẦN';
      case 'OVERDUE': return 'QUÁ HẠN';
      case 'CANCELLED': return 'ĐÃ HỦY';
      case 'PUBLISHED': return 'CHƯA THANH TOÁN';
      case 'DRAFT': return 'NHÁP';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">Hóa Đơn Tiền Nhà</h1>
          <div className="inline-block bg-black text-white px-4 py-1 font-bold transform -rotate-2">
            Tháng {invoice.month}
          </div>
        </div>

        {/* Main Card */}
        <div className="gumroad-card bg-white mb-6">
          {/* Status Badge */}
          <div className={`absolute -top-3 -right-3 border-2 border-black px-3 py-1 font-bold text-sm transform rotate-3 ${getStatusColor(invoice.status)}`}>
            {getStatusText(invoice.status)}
          </div>

          {/* Room Info */}
          <div className="border-b-2 border-black pb-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-5 h-5" />
              <span className="font-bold text-lg">{invoice.contract.room.name}</span>
            </div>
            <div className="text-sm text-gray-600 pl-7">
              {invoice.contract.room.building.name} - {invoice.contract.room.building.address}
            </div>
          </div>

          {/* Tenant Info */}
          <div className="border-b-2 border-black pb-4 mb-4">
             <div className="flex justify-between items-center">
                <span className="font-bold">Khách thuê:</span>
                <span>{invoice.contract.tenant.fullName}</span>
             </div>
             <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                <span>SĐT:</span>
                <span>{invoice.contract.tenant.phone}</span>
             </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            {invoice.lineItems.map((item, index) => (
              <div key={index} className="flex justify-between items-start text-sm">
                <div className="flex-1">
                  <div className="font-bold flex items-center gap-2">
                    {item.type === 'RENT' && <Home className="w-4 h-4" />}
                    {item.type === 'ELECTRIC' && <Zap className="w-4 h-4" />}
                    {item.type === 'WATER' && <Droplets className="w-4 h-4" />}
                    {item.type === 'FIXED' && item.name.toLowerCase().includes('wifi') && <Wifi className="w-4 h-4" />}
                    {item.type === 'FIXED' && item.name.toLowerCase().includes('rác') && <Trash2 className="w-4 h-4" />}
                    {item.type === 'FIXED' && item.name.toLowerCase().includes('xe') && <Car className="w-4 h-4" />}
                    {item.name}
                  </div>
                  {item.note && <div className="text-xs text-gray-500 pl-6">{item.note}</div>}
                  <div className="pl-6 text-xs text-gray-500">
                    {item.quantity} {item.unit} x {formatCurrency(item.unitPrice)}
                  </div>
                </div>
                <div className="font-bold">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t-2 border-black mt-4 pt-4">
            <div className="flex justify-between items-center text-xl font-black">
              <span>TỔNG CỘNG</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer / Contact */}
        <div className="text-center text-sm text-gray-500">
          <p>Cảm ơn bạn đã sử dụng dịch vụ!</p>
          <p className="mt-1">Mọi thắc mắc vui lòng liên hệ chủ nhà.</p>
        </div>
      </div>
    </div>
  );
}
