import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, User, LogOut } from 'lucide-react';
// ✅ FIXED IMPORT PATH (Goes up 2 levels: layout -> components -> src -> context)
import { useAuth } from '../../context/AuthContext';

const MainLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 1. The Persistent Sidebar */}
      <Sidebar />
      
      {/* 2. The Main Content Area (Offset by Sidebar width) */}
      <div className="flex-1 ml-72 flex flex-col transition-all duration-300">
        
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Dashboard Overview
          </h2>
          
          <div className="flex items-center gap-6">
            {/* Notifications */}
            <button className="relative p-2 text-slate-400 hover:text-brand-500 transition-colors rounded-full hover:bg-slate-100">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent-red rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-200"></div>
            
            {/* User Profile */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-700 leading-none">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-xs text-brand-500 uppercase font-semibold mt-1">
                  {user?.role || 'Staff'}
                </p>
              </div>
              
              <div className="w-10 h-10 rounded-full bg-brand-50 border-2 border-brand-100 flex items-center justify-center text-brand-700">
                <User size={20} />
              </div>
              
              <button 
                onClick={logout} 
                className="ml-2 p-2 text-slate-400 hover:text-accent-red hover:bg-red-50 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content (Renders Dashboard, StaffPage, etc.) */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;