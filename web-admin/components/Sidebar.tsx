'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  DoorOpen, 
  Users, 
  FileText, 
  Wallet,
  LogOut,
  Receipt,
  Zap,
  Droplets
} from 'lucide-react';

const menuItems = [
  { name: 'Tổng quan', href: '/', icon: LayoutDashboard },
  { name: 'Tòa nhà', href: '/buildings', icon: Building2 },
  { name: 'Phòng', href: '/rooms', icon: DoorOpen }, // Note: This route might need to be created or linked correctly
  { name: 'Khách thuê', href: '/tenants', icon: Users },
  { name: 'Hợp đồng', href: '/contracts', icon: FileText },
  { name: 'Dịch vụ', href: '/services', icon: Zap },
  { name: 'Chốt số', href: '/readings', icon: Droplets },
  { name: 'Hóa đơn', href: '/invoices', icon: Receipt },
  { name: 'Tài chính', href: '/finance', icon: Wallet },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r-2 border-black h-screen fixed left-0 top-0 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b-2 border-black bg-[#FFC900]">
        <h1 className="text-4xl font-black tracking-tighter uppercase flex flex-col leading-none">
          CAMEL
          <span className="text-sm font-bold tracking-[0.3em] text-white bg-black px-1 w-fit mt-1">STAY</span>
        </h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          let isActive = false;
          if (item.href === '/') {
            isActive = pathname === '/';
          } else if (item.href === '/rooms') {
            isActive = pathname?.includes('/rooms') ?? false;
          } else if (item.href === '/buildings') {
            isActive = (pathname?.startsWith('/buildings') ?? false) && !(pathname?.includes('/rooms') ?? false);
          } else {
            isActive = pathname?.startsWith(item.href) ?? false;
          }
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 font-bold text-sm transition-all border-2
                ${isActive 
                  ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(100,100,100,0.5)] translate-x-1' 
                  : 'bg-white text-black border-transparent hover:border-black hover:bg-[#F4F4F0] hover:translate-x-1'
                }
              `}
            >
              <Icon size={20} strokeWidth={2.5} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t-2 border-black bg-gray-50">
        <button 
          onClick={async () => {
            try {
              // 1. Call API to invalidate token (optional)
              // await axiosClient.post('/auth/logout'); 
            } catch (error) {
              console.error('Logout error', error);
            } finally {
              // 2. Clear Local Storage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              
              // 3. Clear Cookie
              document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              
              // 4. Redirect
              window.location.href = '/login';
            }
          }}
          className="flex items-center gap-3 w-full px-4 py-3 font-bold text-sm border-2 border-black bg-white hover:bg-red-100 transition-colors shadow-[2px_2px_0px_0px_black]"
        >
          <LogOut size={20} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
