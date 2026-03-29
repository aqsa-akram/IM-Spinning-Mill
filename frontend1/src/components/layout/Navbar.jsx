import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Factory, Package, 
  Users, ShoppingCart, LifeBuoy, Bell, LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import './Navbar.css'; // create this empty or add styles to index.css

const MODULES = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Organization', path: '/organization', icon: Building2 }, // Parent route
  { label: 'Operations', path: '/production', icon: Factory },
  { label: 'Inventory', path: '/inventory', icon: Package },
  { label: 'HR & Payroll', path: '/hr', icon: Users },
  { label: 'Sales', path: '/sales', icon: ShoppingCart },
  { label: 'Support', path: '/support', icon: LifeBuoy },
];

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      {/* 1. Brand */}
      <div className="brand">
        <div className="logo-box">IM</div>
        <div className="brand-info">
          <h1>IM Spinning</h1>
          <span>Management System</span>
        </div>
      </div>

      {/* 2. Main Navigation Modules */}
      <nav className="nav-modules">
        {MODULES.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 3. User Controls */}
      <div className="user-controls">
        <button className="icon-btn"><Bell size={20} /></button>
        <div className="divider"></div>
        <div className="user-info">
          <p className="user-name">{user?.fullName}</p>
          <p className="user-role">{user?.role}</p>
        </div>
        <button onClick={logout} className="logout-btn" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

// Add these styles to your CSS file or Navbar.css
/*
.navbar {
  height: var(--nav-height);
  background: var(--primary-navy);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
.brand { display: flex; align-items: center; gap: 12px; }
.logo-box { width: 36px; height: 36px; background: var(--accent-gold); color: var(--primary-navy); font-weight: 800; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
.brand-info h1 { font-size: 16px; font-weight: 700; margin: 0; }
.brand-info span { font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }

.nav-modules { display: flex; gap: 4px; height: 100%; }
.nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 20px; color: #94A3B8; text-decoration: none; font-size: 11px; text-transform: uppercase; font-weight: 600; gap: 4px; transition: all 0.2s; border-bottom: 3px solid transparent; }
.nav-item:hover { color: white; background: rgba(255,255,255,0.05); }
.nav-item.active { color: var(--accent-gold); border-bottom-color: var(--accent-gold); background: rgba(255,255,255,0.05); }

.user-controls { display: flex; align-items: center; gap: 16px; }
.user-info { text-align: right; }
.user-name { font-size: 14px; font-weight: 600; }
.user-role { font-size: 11px; color: #94A3B8; text-transform: uppercase; }
.logout-btn { background: rgba(255,255,255,0.1); border: none; color: white; padding: 8px; border-radius: 50%; cursor: pointer; }
.logout-btn:hover { background: var(--alert-red); }
*/

export default Navbar;