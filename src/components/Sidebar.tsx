import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Globe, Users, Activity, FileText } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-kenya-green-900 text-white flex flex-col h-full border-r border-kenya-green-800">
      <div className="p-6 flex items-center gap-3 border-b border-kenya-green-800">
        <div className="w-8 h-8 bg-kenya-gold-500 rounded flex items-center justify-center text-kenya-green-900">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-serif font-bold text-sm tracking-tight text-white">KENYA GAZETTE</span>
          <span className="text-[10px] text-kenya-gold-400 font-mono tracking-widest">ALERT SYSTEM</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-6">
        <NavLink to="/admin" end className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-kenya-green-800 text-white' : 'text-emerald-100/70 hover:text-white hover:bg-kenya-green-800/50'}`}>
          <LayoutDashboard className="w-4 h-4" />
          Live Dashboard
        </NavLink>
        <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-kenya-green-800 text-white' : 'text-emerald-100/70 hover:text-white hover:bg-kenya-green-800/50'}`}>
          <Globe className="w-4 h-4" />
          Public Archive
        </NavLink>
        <NavLink to="/admin/subscribers" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-kenya-green-800 text-white' : 'text-emerald-100/70 hover:text-white hover:bg-kenya-green-800/50'}`}>
          <Users className="w-4 h-4" />
          Subscribers
        </NavLink>
        <NavLink to="/admin/pipeline" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-kenya-green-800 text-white' : 'text-emerald-100/70 hover:text-white hover:bg-kenya-green-800/50'}`}>
          <Activity className="w-4 h-4" />
          Pipeline Health
        </NavLink>
      </nav>

      <div className="p-6 mt-auto border-t border-kenya-green-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-kenya-gold-400 animate-pulse"></div>
          <span className="text-xs text-emerald-100/90 font-medium">Ingestion Active</span>
        </div>
        <span className="text-[10px] text-emerald-100/50 uppercase tracking-widest font-bold">Build v1.04 — Amasai</span>
      </div>
    </aside>
  );
}
