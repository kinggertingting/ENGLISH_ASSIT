import React from 'react';
import { useApp } from '../context/AppContext';
import { Flame, Zap, Volume2, Sparkles, Server } from 'lucide-react';

const titles = {
  dashboard: 'Learning Analytics Dashboard',
  translation: 'Vietnamese-to-English Translation Trainer',
  settings: 'Personalization & Settings',
};

export default function Navbar() {
  const { activeTab, user, dbUser, audioSettings, isBackendConnected } = useApp();

  const xpPercent = Math.min(100, Math.round((user.todayXp / user.dailyXpGoal) * 100));

  return (
    <header className="h-20 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {titles[activeTab] || 'Dashboard'}
        </h2>
        
        {/* Connection status badge */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
          isBackendConnected 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          <Server className="w-3 h-3" />
          {isBackendConnected ? 'FastAPI Connected' : 'Connecting BE...'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Daily Streak Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold shadow-sm">
          <Flame className="w-4 h-4 fill-orange-400 text-orange-400 animate-pulse" />
          <span>{user.streakDays} Day Streak</span>
        </div>

        {/* Daily XP Progress Pill */}
        <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{user.xp} XP</span>
          </div>
          <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
            <div 
              className="bg-gradient-to-r from-amber-400 to-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 font-semibold">{user.todayXp}/{user.dailyXpGoal}</span>
        </div>

        {/* Accent Voice Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">
          <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>{audioSettings.accent === 'en-US' ? '🇺🇸 US Voice' : audioSettings.accent === 'en-GB' ? '🇬🇧 UK Voice' : '🇦🇺 AU Voice'}</span>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-purple-500/20">
            {user.avatar}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-white">{dbUser?.username || user.name}</p>
            <p className="text-[10px] font-semibold text-indigo-400">{dbUser?.id ? `ID: ${dbUser.id.substring(0, 8)}...` : user.cefrLevel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
