import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../utils/api';
import { 
  LayoutDashboard, Building2, Factory, Package, 
  Users, Wrench, ChevronRight, ChevronDown,
  UserSquare, Clock, Calendar, Wallet, ClipboardCheck, 
  TestTube, AlertCircle, TrendingUp, ShoppingCart, DollarSign
} from 'lucide-react';

const MENU_ITEMS = [
  { 
    label: 'Dashboard', 
    path: '/', 
    icon: LayoutDashboard 
  },
  { 
    label: 'Organization',
    icon: Building2,
    subItems: [
      { label: 'Departments', path: '/departments', icon: Building2 },
      { label: 'Shifts', path: '/shifts', icon: Clock },
    ]
  },
  { 
    label: 'HR Management',
    icon: Users,
    subItems: [
      { label: 'Staff', path: '/staff', icon: UserSquare },
      { label: 'Attendance', path: '/hr/attendance', icon: ClipboardCheck },
      { label: 'Leaves', path: '/hr/leaves', icon: Calendar },
      { label: 'Payroll', path: '/hr/payroll', icon: Wallet },
    ]
  },
  { 
    label: 'Production',
    icon: Factory,
    subItems: [
      { label: 'Production Records', path: '/production', icon: Factory },
      { label: 'Quality Control', path: '/quality-control', icon: TestTube },
    ]
  },
  { 
    label: 'Inventory',
    icon: Package,
    subItems: [
      { label: 'Raw Materials', path: '/inventory/raw-materials', icon: Package },
      { label: 'Products', path: '/inventory/products', icon: Package },
      { label: 'Suppliers', path: '/inventory/suppliers', icon: Users },
      { label: 'Purchases', path: '/inventory/purchases', icon: ShoppingCart },
    ]
  },
  { 
    label: 'Machinery', 
    path: '/machinery', 
    icon: Wrench 
  },
  { 
    label: 'Finance', 
    path: '/finance', 
    icon: DollarSign 
  },
];

const Sidebar = () => {
  const [expandedSections, setExpandedSections] = useState(['HR Management', 'Production', 'Inventory']);
  const [alerts, setAlerts] = useState({
    attendance: 0,
    leaves: 0,
    machinery: 0,
    inventory: 0,
    unpaidBills: 0
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const [attendanceRes, leavesRes, machineryRes, inventoryRes, purchasesRes] = await Promise.all([
        api.get('/attendance/report/daily').catch(() => ({ data: { data: { unmarked: 0 } } })),
        api.get('/leaves?status=pending&limit=1').catch(() => ({ data: { data: { pagination: { totalCount: 0 } } } })),
        api.get('/machinery/stats/overview').catch(() => ({ data: { data: { maintenanceDue: 0 } } })),
        api.get('/raw-materials/stats/overview').catch(() => ({ data: { data: { needsReorder: 0 } } })),
        api.get('/purchases/simple').catch(() => ({ data: { data: { purchases: [] } } }))
      ]);

      // Count unpaid bills
      const unpaidCount = purchasesRes.data.data.purchases.filter(
        p => p.paymentStatus === 'unpaid' || p.paymentStatus === 'partially-paid'
      ).length;

      setAlerts({
        attendance: attendanceRes.data.data.unmarked || 0,
        leaves: leavesRes.data.data.pagination?.totalCount || 0,
        machinery: machineryRes.data.data.maintenanceDue || 0,
        inventory: inventoryRes.data.data.needsReorder || 0,
        unpaidBills: unpaidCount
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const toggleSection = (label) => {
    setExpandedSections(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  return (
    <aside className="w-72 bg-brand-900 text-white flex flex-col fixed h-full z-20 shadow-2xl">
      {/* Brand */}
      <div className="h-20 flex items-center px-8 border-b border-brand-800">
        <div className="w-8 h-8 bg-accent-gold rounded flex items-center justify-center font-bold text-brand-900 mr-3">
          IM
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">IM Spinning</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Enterprise ERP</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {MENU_ITEMS.map((item) => (
          <div key={item.label}>
            {item.subItems ? (
              <>
                <button
                  onClick={() => toggleSection(item.label)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-lg transition-all duration-200 text-slate-400 hover:bg-brand-800 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} strokeWidth={1.5} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.label === 'HR Management' && (alerts.attendance > 0 || alerts.leaves > 0) && (
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                    {item.label === 'Inventory' && alerts.inventory > 0 && (
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                    )}
                    {expandedSections.includes(item.label) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                </button>
                
                {expandedSections.includes(item.label) && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-brand-800 pl-2">
                    {item.subItems.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        className={({ isActive }) => `
                          flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm
                          ${isActive 
                            ? 'bg-brand-500 text-white shadow-md' 
                            : 'text-slate-400 hover:bg-brand-800 hover:text-white'}
                        `}
                      >
                        <subItem.icon size={16} strokeWidth={1.5} />
                        <span className="font-medium">{subItem.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center justify-between px-4 py-3.5 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-slate-400 hover:bg-brand-800 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} strokeWidth={1.5} />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.label === 'Finance' && alerts.unpaidBills > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {alerts.unpaidBills}
                    </span>
                  )}
                  <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      {/* Footer with Alerts */}
      <div className="p-4 border-t border-brand-800">
        <div className="bg-brand-800 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs text-slate-400 mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></div>
              <span className="text-xs font-medium text-accent-green">Operational</span>
            </div>
          </div>

          {(alerts.attendance > 0 || alerts.leaves > 0 || alerts.inventory > 0 || alerts.machinery > 0 || alerts.unpaidBills > 0) && (
            <div className="pt-2 border-t border-brand-700">
              <p className="text-xs text-slate-400 mb-2">Active Alerts</p>
              <div className="space-y-1">
                {alerts.unpaidBills > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Unpaid Bills
                    </span>
                    <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {alerts.unpaidBills}
                    </span>
                  </div>
                )}
                {alerts.attendance > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Attendance
                    </span>
                    <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {alerts.attendance}
                    </span>
                  </div>
                )}
                {alerts.leaves > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-yellow-400 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Leaves
                    </span>
                    <span className="bg-yellow-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {alerts.leaves}
                    </span>
                  </div>
                )}
                {alerts.machinery > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Maintenance
                    </span>
                    <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {alerts.machinery}
                    </span>
                  </div>
                )}
                {alerts.inventory > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-orange-400 flex items-center gap-1">
                      <TrendingUp size={12} className="transform rotate-180" />
                      Low Stock
                    </span>
                    <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {alerts.inventory}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;