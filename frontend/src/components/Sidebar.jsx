import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Languages, 
  Settings as SettingsIcon,
  Sparkles,
  Award,
  CheckCircle2
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Live Stats' },
  { id: 'translation', label: 'Translation Trainer', icon: Languages, badge: 'Việt - Anh' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, badge: null },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, user, isBackendConnected } = useApp();

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 min-h-screen flex flex-col justify-between p-4 backdrop-blur-xl shrink-0 z-30">
      <div>
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-slate-800/60">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              ENGLISH<span className="text-indigo-400 font-extrabold">_ASSIT</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              Backend Connected
              <span className={`w-2 h-2 rounded-full inline-block ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/80 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/50'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Mini CEFR Target Card */}
      <div className="glass-card p-3.5 mt-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">CEFR Target</span>
          </div>
          <span className="text-xs font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
            {user.cefrLevel} ➔ {user.targetGoal}
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full w-[75%]" />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 text-center">Adaptive Translation Engine</p>
      </div>
    </aside>
  );
}
