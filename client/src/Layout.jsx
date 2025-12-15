import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, BookOpen, MessageSquare, Settings, LogOut, 
  Search, Bell, Users, FolderGit2, Calendar, Zap, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import NotificationBell from './components/NotificationBell';

const SidebarSection = ({ title, children, collapsed }) => (
  <div className="mb-6">
    {!collapsed && (
      <motion.h3 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="px-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 whitespace-nowrap"
      >
        {title}
      </motion.h3>
    )}
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, badge, collapsed, onClick }) => (
  <div 
    onClick={onClick}
    className={`
    relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-300 group
    ${active 
      ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.2)]' 
      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}
    ${collapsed ? 'justify-center' : ''}
  `}>
    {/* Active Glow Bar */}
    {active && (
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6] ${collapsed ? 'left-1' : 'left-0'}`} />
    )}

    <Icon size={20} className={active ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'} />
    
    {!collapsed && (
      <motion.span 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 1, x: 0 }}
        className="text-sm font-medium whitespace-nowrap"
      >
        {label}
      </motion.span>
    )}
    
    {/* Badge (Number count) */}
    {!collapsed && badge && (
      <span className="ml-auto text-[10px] font-bold bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-400">
        {badge}
      </span>
    )}
    {/* Small Dot for collapsed state if badge exists */}
    {collapsed && badge && (
      <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-[#09090b]" />
    )}
  </div>
);

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { username: 'Guest', email: 'guest@educonnect.com' };

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('educonnect-user-id');
    
    // Navigate to login
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-black overflow-hidden p-4 gap-4 font-sans selection:bg-blue-500/30">
      
      {/* 1. The Collapsible Sidebar */}
      <motion.div 
        layout
        initial={{ width: 280 }}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full bg-[#09090b]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] flex flex-col shadow-2xl relative z-20 shrink-0"
      >
        
        {/* Toggle Button (Floating on the edge) */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-zinc-800 border border-zinc-600 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors z-50 shadow-lg"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo Header */}
        <div className={`h-20 flex items-center ${collapsed ? 'justify-center' : 'px-6 gap-3'} mb-2 transition-all`}>
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Zap size={16} className="text-white fill-white" />
            </div>
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="font-bold text-lg tracking-tight text-white whitespace-nowrap"
              >
                EduConnect
              </motion.span>
            )}
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto px-2 no-scrollbar">
          
          <SidebarSection title="Overview" collapsed={collapsed}>
            <SidebarItem icon={Home} label="Dashboard" active collapsed={collapsed} />
            <SidebarItem icon={Calendar} label="Schedule" badge="2" collapsed={collapsed} />
            <SidebarItem icon={MessageSquare} label="Messages" collapsed={collapsed} onClick={() => navigate('/join-chat')} />
          </SidebarSection>

          <SidebarSection title="My Learning" collapsed={collapsed}>
            <SidebarItem icon={BookOpen} label="Courses" collapsed={collapsed} />
            <SidebarItem icon={FolderGit2} label="Resources" collapsed={collapsed} />
          </SidebarSection>

          <SidebarSection title="Active Groups" collapsed={collapsed}>
            <div className="px-2 space-y-1">
               {/* Group 1 */}
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer group text-zinc-400 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0" />
                  {!collapsed && <span className="text-sm whitespace-nowrap">React Advanced</span>}
                </div>

               {/* Group 2 */}
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer group text-zinc-400 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}>
                  <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  {!collapsed && <span className="text-sm whitespace-nowrap">System Design</span>}
                </div>
            </div>
          </SidebarSection>

        </div>

        {/* User Footer */}
        <div className="p-4 mt-auto border-t border-white/5">
            <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-black border border-white/10 shrink-0" />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{user.username}</div>
                    <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                </div>
              )}
              {!collapsed && <Settings size={16} className="text-zinc-500" />}
            </div>
              
           {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`w-full mt-2 flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors ${collapsed ? 'justify-center' : ''}`}
            >
              <LogOut size={18} />
              {!collapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
        </div>

      </motion.div>

      {/* 2. Main Console Area (Expands automatically) */}
      <div className="flex-1 h-full bg-[#0a0a0a] rounded-[2rem] border border-white/5 relative overflow-hidden flex flex-col shadow-2xl">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 left-0 w-full h-96 bg-indigo-900/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-900/5 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 relative z-10 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md">
          <div className="flex items-center gap-3 text-zinc-400">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-white/10 hover:border-white/20 transition-colors cursor-text w-64">
                <Search size={14} />
                <input className="bg-transparent border-none outline-none text-xs w-full placeholder:text-zinc-500 font-medium" placeholder="Search (Cmd+K)" />
             </div>
          </div>

          <div className="flex items-center gap-4">
             <NotificationBell />
             <button className="text-xs font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                + New Project
             </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 relative z-10 scrollbar-thin scrollbar-thumb-zinc-800">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;