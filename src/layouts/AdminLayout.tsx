import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Search, Bell, UserCircle } from 'lucide-react';

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Branded Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
             <h1 className="font-serif font-bold text-xl text-kenya-green-900 tracking-tight">Kenya Gazette</h1>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-3">Portal</span>
          </div>
          <div className="flex items-center gap-5">
            <button className="text-slate-400 hover:text-kenya-green-800 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-slate-400 hover:text-kenya-green-800 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-kenya-gold-500 rounded-full border border-white"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer">
              <UserCircle className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
