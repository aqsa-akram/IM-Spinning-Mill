import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Clock, 
  Building2, 
  Wrench, 
  Truck, 
  Package, 
  ShoppingCart,
  Factory,
  LogOut,
  DollarSign,
  ClipboardCheck,
  Calendar,
  Wallet,
  TestTube,
  UserSquare,
  Boxes // ✅ NEW: Icon for Inventory
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Updated menu structure with Inventory added
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    
    // Organization
    { icon: Building2, label: 'Departments', path: '/departments' },
    { icon: Clock, label: 'Shifts', path: '/shifts' },
    
    // HR Management
    { icon: UserSquare, label: 'Staff', path: '/staff' },
    { icon: ClipboardCheck, label: 'Attendance', path: '/hr/attendance' },
    { icon: Calendar, label: 'Leaves', path: '/hr/leaves' },
    { icon: Wallet, label: 'Payroll', path: '/hr/payroll' },
    
    // Production
    { icon: Factory, label: 'Production', path: '/production' },
    { icon: TestTube, label: 'Quality Control', path: '/quality-control' },
    
    // Inventory & Supply Chain
    { icon: Boxes, label: 'Inventory', path: '/inventory' }, // ✅ NEW: Main Inventory Page
    { icon: Package, label: 'Raw Materials', path: '/inventory/raw-materials' },
    { icon: Package, label: 'Products', path: '/inventory/products' },
    { icon: Truck, label: 'Suppliers', path: '/inventory/suppliers' },
    { icon: ShoppingCart, label: 'Purchases', path: '/inventory/purchases' },
    
    // Asset Management
    { icon: Wrench, label: 'Machinery', path: '/machinery' },
    
    // Finance
    { icon: DollarSign, label: 'Finance', path: '/finance' },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-brand-900 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl z-20`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-brand-800">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-gold rounded flex items-center justify-center font-bold text-brand-900">
                IM
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight">IM Spinning</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Enterprise ERP</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-accent-gold rounded flex items-center justify-center font-bold text-brand-900">
              IM
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={index}>
                  <a 
                    href={item.path}
                    className={`flex items-center p-3 rounded-lg transition-all group ${
                      isActive 
                        ? 'bg-brand-500 text-white shadow-md' 
                        : 'hover:bg-brand-800 text-gray-300 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
                    
                    <span className={`ml-3 font-medium text-sm transition-opacity duration-200 ${!isSidebarOpen && 'hidden'}`}>
                      {item.label}
                    </span>
                    
                    {/* Tooltip for collapsed state */}
                    {!isSidebarOpen && (
                      <div className="absolute left-16 bg-brand-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg pointer-events-none">
                        {item.label}
                      </div>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-brand-800">
           <button 
             onClick={handleLogout}
             className="flex items-center p-2 text-gray-400 hover:text-red-400 hover:bg-brand-800 rounded-lg w-full transition-colors"
           >
            <LogOut size={20} />
            <span className={`ml-3 font-medium ${!isSidebarOpen && 'hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-brand-700 transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-sm font-medium text-brand-900">
                {JSON.parse(localStorage.getItem('user') || '{}')?.fullName || 'Admin User'}
              </span>
              <span className="block text-xs text-gray-500 uppercase">
                {JSON.parse(localStorage.getItem('user') || '{}')?.role || 'Super Admin'}
              </span>
            </div>
            <div className="h-10 w-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold border border-brand-200">
              {(JSON.parse(localStorage.getItem('user') || '{}')?.fullName || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
