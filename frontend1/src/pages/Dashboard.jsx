import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { 
  Users, Wrench, AlertTriangle, TrendingUp, TrendingDown,
  Package, ShoppingCart, Activity, ArrowRight, CheckCircle, Loader2, Factory,
  ClipboardCheck, Calendar, Wallet, TestTube, DollarSign, PieChart as PieChartIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';


const Dashboard = () => {
  const [stats, setStats] = useState({
    staff: { activeStaff: 0, onLeave: 0, totalStaff: 0 },
    machinery: { activeMachinery: 0, maintenanceDue: 0, totalMachinery: 0 },
    inventory: { needsReorder: 0, totalStockValue: 0 },
    purchases: { pendingOrders: 0, totalValue: 0 },
    production: { totalProduction: { total: 0 }, efficiency: { avgEfficiency: 0 } },
    attendance: { 
      markedToday: 0, 
      unmarked: 0, 
      breakdown: [],
      totalStaff: 0
    },
    leaves: { pending: 0 },
    finance: { income: 0, expense: 0, netProfit: 0, totalTransactions: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [staffRes, machRes, matRes, purchRes, prodRes, attRes, leaveRes, financeRes] = await Promise.all([
          api.get('/staff/stats/overview'),
          api.get('/machinery/stats/overview'),
          api.get('/raw-materials/stats/overview'),
          api.get('/purchases/stats/overview'),
          api.get('/production/stats/overview'),
          api.get('/attendance/report/daily').catch(() => ({ 
            data: { 
              data: { 
                markedAttendance: 0, 
                unmarked: 0, 
                breakdown: [],
                totalStaff: 0 
              } 
            } 
          })),
          api.get('/leaves?status=pending&limit=1').catch(() => ({ 
            data: { data: { pagination: { totalCount: 0 } } } 
          })),
          api.get('/finance/stats/overview').catch(() => ({
            data: { data: { income: 0, expense: 0, netProfit: 0, totalTransactions: 0 } }
          }))
        ]);

        const pendingCount = purchRes.data.data.byStatus?.find(s => s._id === 'pending')?.count || 0;

        setStats({
          staff: staffRes.data.data,
          machinery: machRes.data.data,
          inventory: matRes.data.data,
          purchases: { 
            pendingOrders: pendingCount,
            totalValue: purchRes.data.data.totalValue?.total || 0
          },
          production: prodRes.data.data,
          attendance: {
            markedToday: attRes.data.data.markedAttendance || 0,
            unmarked: attRes.data.data.unmarked || 0,
            breakdown: attRes.data.data.breakdown || [],
            totalStaff: attRes.data.data.totalStaff || 0
          },
          leaves: {
            pending: leaveRes.data.data.pagination?.totalCount || 0
          },
          finance: financeRes.data.data
        });
      } catch (error) {
        console.error("Dashboard Sync Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Prepare pie chart data
  const attendancePieData = [
    {
      name: 'Present',
      value: stats.attendance.breakdown?.find(b => b._id === 'present')?.count || 0,
      color: '#10b981'
    },
    {
      name: 'Absent',
      value: stats.attendance.breakdown?.find(b => b._id === 'absent')?.count || 0,
      color: '#ef4444'
    },
    {
      name: 'Half Day',
      value: stats.attendance.breakdown?.find(b => b._id === 'half-day')?.count || 0,
      color: '#f59e0b'
    },
    {
      name: 'Late',
      value: stats.attendance.breakdown?.find(b => b._id === 'late')?.count || 0,
      color: '#f97316'
    },
    {
      name: 'On Leave',
      value: stats.attendance.breakdown?.find(b => b._id === 'on-leave')?.count || 0,
      color: '#3b82f6'
    },
    {
      name: 'Unmarked',
      value: stats.attendance.unmarked || 0,
      color: '#6b7280'
    }
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading Operational Data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm">Real-time metrics from IM Spinning Mills</p>
        </div>
        <div className="text-xs font-medium bg-white px-3 py-1.5 rounded-full border shadow-sm text-gray-600">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards Grid - Updated with Finance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Production Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Output</p>
              <h3 className="text-2xl font-bold text-brand-900 mt-1">
                {stats.production.totalProduction.total?.toLocaleString() || 0} 
                <span className="text-sm font-normal text-gray-400 ml-1">kg</span>
              </h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Factory size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className={`flex items-center font-medium ${stats.production.efficiency.avgEfficiency >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
              <Activity size={14} className="mr-1" /> 
              Eff: {stats.production.efficiency.avgEfficiency?.toFixed(1) || 0}%
            </span>
            <Link to="/production" className="text-brand-500 text-xs flex items-center hover:underline">
              View Log <ArrowRight size={12} className="ml-1"/>
            </Link>
          </div>
        </div>

        {/* Financial Health Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-sm font-medium text-gray-500">Net Profit/Loss</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.finance.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs. {Math.abs(stats.finance.netProfit)?.toLocaleString() || 0}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${stats.finance.netProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {stats.finance.netProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="flex items-center text-gray-600">
              <DollarSign size={14} className="mr-1" />
              {stats.finance.totalTransactions} Transactions
            </span>
            <Link to="/finance" className="text-brand-500 text-xs flex items-center hover:underline">
              Details <ArrowRight size={12} className="ml-1"/>
            </Link>
          </div>
        </div>

        {/* Machinery Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Machines</p>
              <h3 className="text-2xl font-bold text-brand-900 mt-1">
                {stats.machinery.activeMachinery}<span className="text-gray-400 text-lg">/{stats.machinery.totalMachinery}</span>
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${stats.machinery.maintenanceDue > 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              <Wrench size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {stats.machinery.maintenanceDue > 0 ? (
              <Link to="/machinery" className="text-red-600 flex items-center font-medium hover:underline">
                <AlertTriangle size={14} className="mr-1" />
                {stats.machinery.maintenanceDue} Maintenance Due
              </Link>
            ) : (
              <span className="text-green-600 flex items-center">
                <CheckCircle size={14} className="mr-1" /> All Systems Nominal
              </span>
            )}
          </div>
        </div>

        {/* Staff Metrics */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Staff</p>
              <h3 className="text-2xl font-bold text-brand-900 mt-1">
                {stats.staff.activeStaff}
              </h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
              {stats.staff.onLeave} On Leave
            </span>
            <Link to="/staff" className="text-brand-500 hover:text-brand-700 flex items-center text-xs">
              View <ArrowRight size={12} className="ml-1"/>
            </Link>
          </div>
        </div>
      </div>

      {/* Finance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-green-900 uppercase tracking-wider">Total Income</h3>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-green-700">
            Rs. {stats.finance.income?.toLocaleString() || 0}
          </p>
          <Link to="/finance?type=INCOME" className="text-xs text-green-700 hover:text-green-800 flex items-center mt-2">
            View Income Transactions <ArrowRight size={12} className="ml-1" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-sm border border-red-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-red-900 uppercase tracking-wider">Total Expenses</h3>
            <TrendingDown className="text-red-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-red-700">
            Rs. {stats.finance.expense?.toLocaleString() || 0}
          </p>
          <Link to="/finance?type=EXPENSE" className="text-xs text-red-700 hover:text-red-800 flex items-center mt-2">
            View Expense Transactions <ArrowRight size={12} className="ml-1" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">Stock Value</h3>
            <Package className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-blue-700">
            Rs. {stats.inventory.totalStockValue?.toLocaleString()}
          </p>
          {stats.inventory.needsReorder > 0 && (
            <Link to="/inventory/raw-materials" className="text-xs text-red-600 flex items-center mt-2">
              <AlertTriangle size={12} className="mr-1" />
              {stats.inventory.needsReorder} Items Low Stock
            </Link>
          )}
        </div>
      </div>

      {/* Attendance Pie Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Today's Attendance</h3>
            <Link to="/hr/attendance" className="text-xs text-brand-600 hover:text-brand-700 flex items-center">
              View All <ArrowRight size={12} className="ml-1" />
            </Link>
          </div>
          
          {attendancePieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {attendancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {attendancePieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-gray-700">{item.name}</span>
                    <span className="font-bold ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Total Count */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Staff</span>
                  <span className="text-lg font-bold text-brand-900">{stats.attendance.totalStaff}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ClipboardCheck size={48} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No attendance data for today</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/production" className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-200 flex flex-col items-center justify-center text-center transition group">
              <Factory size={20} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">Record Output</span>
            </Link>

            <Link to="/hr/attendance" className="p-3 border rounded-lg hover:bg-green-50 hover:border-green-200 flex flex-col items-center justify-center text-center transition group">
              <ClipboardCheck size={20} className="text-green-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">Mark Attendance</span>
            </Link>

            <Link to="/quality-control" className="p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-200 flex flex-col items-center justify-center text-center transition group">
              <TestTube size={20} className="text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">Quality Test</span>
            </Link>

            <Link to="/inventory/purchases" className="p-3 border rounded-lg hover:bg-orange-50 hover:border-orange-200 flex flex-col items-center justify-center text-center transition group">
              <ShoppingCart size={20} className="text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">New Purchase</span>
            </Link>
            
            <Link to="/machinery" className="p-3 border rounded-lg hover:bg-red-50 hover:border-red-200 flex flex-col items-center justify-center text-center transition group">
              <Wrench size={20} className="text-red-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">Log Maintenance</span>
            </Link>

            <Link to="/hr/leaves" className="p-3 border rounded-lg hover:bg-indigo-50 hover:border-indigo-200 flex flex-col items-center justify-center text-center transition group">
              <Calendar size={20} className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">Manage Leaves</span>
            </Link>
            
            <Link to="/hr/payroll" className="p-3 border rounded-lg hover:bg-teal-50 hover:border-teal-200 flex flex-col items-center justify-center text-center transition group">
              <Wallet size={20} className="text-teal-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">Process Payroll</span>
            </Link>
            
            <Link to="/finance" className="p-3 border rounded-lg hover:bg-emerald-50 hover:border-emerald-200 flex flex-col items-center justify-center text-center transition group">
              <DollarSign size={20} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">Finance</span>
            </Link>
          </div>
        </div>

        {/* System Alerts Feed */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">System Alerts</h3>
          <div className="space-y-3">
            {stats.machinery.maintenanceDue > 0 && (
              <div className="flex items-start p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm">
                <AlertTriangle size={18} className="mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Critical Maintenance Required</span>
                  <span className="opacity-90">{stats.machinery.maintenanceDue} machines have passed their maintenance interval.</span>
                </div>
              </div>
            )}

            {stats.inventory.needsReorder > 0 && (
              <div className="flex items-start p-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-100 text-sm">
                <Package size={18} className="mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Low Stock Warning</span>
                  <span className="opacity-90">{stats.inventory.needsReorder} raw materials are below their reorder level threshold.</span>
                </div>
              </div>
            )}

            {stats.attendance.unmarked > 0 && (
              <div className="flex items-start p-3 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100 text-sm">
                <ClipboardCheck size={18} className="mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Attendance Pending</span>
                  <span className="opacity-90">{stats.attendance.unmarked} staff members have not marked attendance today.</span>
                </div>
              </div>
            )}

            {stats.leaves.pending > 0 && (
              <div className="flex items-start p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-sm">
                <Calendar size={18} className="mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Leave Requests Pending</span>
                  <span className="opacity-90">{stats.leaves.pending} leave applications are awaiting approval.</span>
                </div>
              </div>
            )}

            {stats.finance.netProfit < 0 && (
              <div className="flex items-start p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm">
                <TrendingDown size={18} className="mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Negative Cashflow</span>
                  <span className="opacity-90">Expenses exceed income. Review financial transactions.</span>
                </div>
              </div>
            )}

            {stats.machinery.maintenanceDue === 0 && 
             stats.inventory.needsReorder === 0 && 
             stats.attendance.unmarked === 0 && 
             stats.leaves.pending === 0 && 
             stats.finance.netProfit >= 0 && (
               <div className="flex items-center justify-center h-32 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                 <div className="text-center">
                   <CheckCircle size={24} className="mx-auto mb-2 text-green-400" />
                   <p>No critical alerts. Operations normal.</p>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;