import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  User, 
  Server, 
  RotateCcw, 
  Save, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Settings() {
  const { 
    user, 
    setUser, 
    dbUser, 
    audioSettings, 
    setAudioSettings, 
    speakText, 
    initBackendUser, 
    isBackendConnected,
    backendError 
  } = useApp();

  const [usernameInput, setUsernameInput] = useState(user.name || '');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestVoice = () => {
    speakText("Hello! This is your customized AI voice assistant for ENGLISH_ASSIT.");
  };

  const handleSaveUsername = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setIsSavingUser(true);
    setSavedSuccess(false);

    try {
      setUser(prev => ({ ...prev, name: usernameInput.trim() }));
      await initBackendUser(usernameInput.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save user:", err);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleResetData = () => {
    if (confirm("Bạn có chắc chắn muốn reset dữ liệu cá nhân lưu trên trình duyệt?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header Card */}
      <div className="glass-card p-6 border-indigo-500/20">
        <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-400" /> Platform Settings & User Profile
        </h3>
        <p className="text-xs text-slate-400 mt-1">Cấu hình kết nối Backend API, tài khoản người dùng và giọng đọc AI (TTS).</p>
      </div>

      {/* 1. Backend Server Connection Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" /> Trạng Thái Kết Nối FastAPI Backend
          </h4>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isBackendConnected 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            {isBackendConnected ? '🟢 Connected' : '🟡 Disconnected'}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">API Endpoint URL:</span>
            <span className="font-mono text-indigo-300">http://localhost:8000/api</span>
          </div>

          {dbUser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Database User ID:</span>
                <span className="font-mono text-white font-bold">{dbUser.id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block">Registered Username:</span>
                <span className="font-bold text-emerald-400">{dbUser.username}</span>
              </div>
            </div>
          )}

          {backendError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{backendError}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. User Profile Form */}
      <form onSubmit={handleSaveUsername} className="glass-card p-6 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" /> Đồng Bộ Tài Khoản Người Dùng (Backend DB)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Tên người dùng (Username)</label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full glass-input p-3 text-sm focus:outline-none"
              placeholder="Nhập tên người dùng..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Trình độ CEFR Mục Tiêu</label>
            <select
              value={user.targetGoal}
              onChange={(e) => setUser(prev => ({ ...prev, targetGoal: e.target.value }))}
              className="w-full glass-input p-3 text-sm font-medium focus:outline-none"
            >
              <option value="B1" className="bg-slate-900">B1 Intermediate</option>
              <option value="B2" className="bg-slate-900">B2 Upper Intermediate</option>
              <option value="C1" className="bg-slate-900">C1 Advanced Mastery</option>
              <option value="C2" className="bg-slate-900">C2 Native Level Mastery</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSavingUser}
            className="btn-primary py-2.5 px-6 text-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingUser ? "Đang lưu & đăng nhập BE..." : "Lưu & Đăng Nhập Cùng BE"}</span>
          </button>

          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Đã đồng bộ tài khoản thành công!
            </span>
          )}
        </div>
      </form>

      {/* 3. Audio Voice Config */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-400" /> Audio Speech Synthesis & Accent Engine
          </h4>
          <button 
            type="button"
            onClick={handleTestVoice}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            🔊 Nghe Thử Giọng Đọc
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Giọng Đọc Tiếng Anh (Accent)</label>
            <select
              value={audioSettings.accent}
              onChange={(e) => setAudioSettings(prev => ({ ...prev, accent: e.target.value }))}
              className="w-full glass-input p-3 text-sm font-medium focus:outline-none"
            >
              <option value="en-US" className="bg-slate-900">🇺🇸 American English (US)</option>
              <option value="en-GB" className="bg-slate-900">🇬🇧 British English (UK)</option>
              <option value="en-AU" className="bg-slate-900">🇦🇺 Australian English (AU)</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span className="uppercase">Tốc độ phát âm (Speed)</span>
              <span className="text-indigo-400 font-extrabold">{audioSettings.rate}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.25"
              step="0.05"
              value={audioSettings.rate}
              onChange={(e) => setAudioSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
              className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.75x (Chậm)</span>
              <span>1.0x (Chuẩn)</span>
              <span>1.25x (Nhanh)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Reset Data */}
      <div className="glass-card p-6 flex items-center justify-between border-red-500/20">
        <div>
          <h4 className="text-sm font-bold text-white">Reset Trình Duyệt & Cache</h4>
          <p className="text-xs text-slate-400">Xóa dữ liệu lưu trữ local storage trên trình duyệt để khởi động lại.</p>
        </div>
        <button
          type="button"
          onClick={handleResetData}
          className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Cache
        </button>
      </div>
    </div>
  );
}
