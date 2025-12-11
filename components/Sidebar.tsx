import React from 'react';
import { LayoutDashboard, ShoppingBasket, Route, TrendingUp, LogOut } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onReset: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onReset }) => {
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.BASKET, label: 'The Basket', icon: ShoppingBasket },
    { id: AppView.JOURNEY, label: 'The Journey', icon: Route },
    { id: AppView.WAR_ROOM, label: 'War Room', icon: TrendingUp },
  ];

  return (
    <div className="w-20 lg:w-64 fixed left-0 top-0 h-full bg-slate-950/95 border-r border-white/10 flex flex-col z-40 backdrop-blur-xl">
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
        <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-400 to-violet-600 shrink-0" />
        <span className="hidden lg:block ml-3 font-bold tracking-tight text-lg text-white">NEBULA</span>
      </div>

      <nav className="flex-1 py-8 flex flex-col gap-2 px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="hidden lg:block font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={onReset}
          className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-rose-900/10 hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block font-medium text-sm">Reset Data</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;