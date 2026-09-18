import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  Languages, 
  Zap,
  Target,
  BarChart3,
  AlertTriangle,
  BookOpen
} from 'lucide-react';

export default function Dashboard() {
  const { user, dbUser, userStats, setActiveTab, isBackendConnected } = useApp();

  const totalAttempts = userStats?.total_attempts ?? 0;
  const correctAttempts = userStats?.correct_attempts ?? 0;
  const accuracyRate = userStats?.accuracy_rate ?? 0;
  const averageScore = userStats?.average_score ?? 0;
  const topWeaknesses = userStats?.top_weaknesses ?? [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden glass-card p-8 bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> LEVEL {user.cefrLevel} LEARNER
              </span>
              <span className="text-slate-400 text-xs font-medium">Target: {user.targetGoal} Mastery</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Xin chào, <span className="text-gradient">{dbUser?.username || user.name}!</span> 👋
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Hệ thống đang tích hợp <strong className="text-emerald-400 font-bold">FastAPI & Gemini AI</strong> để phân tích trình độ và gợi ý bài tập dịch Việt - Anh tối ưu nhất.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('translation')}
              className="btn-primary flex items-center gap-2 py-3 px-6 text-sm shadow-xl shadow-indigo-600/30"
            >
              <Languages className="w-4 h-4" /> Bắt Đầu Luyện Dịch Việt - Anh
            </button>
          </div>
        </div>
      </div>

      {/* Backend Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 glass-card-hover border-l-4 border-l-indigo-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400">TỔNG SỐ CÂU ĐÃ DỊCH</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalAttempts} Bài Tập</h3>
              <p className="text-xs text-indigo-400 font-medium mt-1">Đã chấm bởi Gemini AI</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 glass-card-hover border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400">SỐ CÂU DỊCH CHÍNH XÁC</p>
              <h3 className="text-2xl font-bold text-white mt-1">{correctAttempts} Câu</h3>
              <p className="text-xs text-emerald-400 font-medium mt-1">Đạt chuẩn ngữ pháp</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 glass-card-hover border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400">TỈ LỆ CHÍNH XÁC (ACCURACY)</p>
              <h3 className="text-2xl font-bold text-white mt-1">{accuracyRate}%</h3>
              <p className="text-xs text-purple-400 font-medium mt-1">Trung bình tổng thể</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 glass-card-hover border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400">ĐIỂM TRUNG BÌNH (AVG SCORE)</p>
              <h3 className="text-2xl font-bold text-white mt-1">{averageScore}/100</h3>
              <p className="text-xs text-amber-400 font-medium mt-1">Điểm Gemini AI đánh giá</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-6 h-6 fill-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Breakdown: Weaknesses Analysis & Practice Gateway */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Top Mistake Weaknesses */}
        <div className="lg:col-span-7 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" /> Thống Kê Dạng Lỗi Sai Thường Gặp
                </h3>
                <p className="text-xs text-slate-400">Được tổng hợp trực tiếp từ cơ sở dữ liệu bài dịch của bạn</p>
              </div>
              <span className="text-xs font-semibold bg-amber-500/10 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/20">
                Top {topWeaknesses.length} Lỗi
              </span>
            </div>

            {topWeaknesses.length > 0 ? (
              <div className="space-y-4 my-4">
                {topWeaknesses.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span className="text-slate-200">{item.subtype}</span>
                      <span className="text-amber-400 font-bold">{item.count} lần vi phạm</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full" 
                        style={{ width: `${Math.min(100, item.count * 20)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl space-y-2 my-4">
                <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Chưa ghi nhận dữ liệu lỗi sai. Hãy thực hành làm bài tập dịch để AI ghi nhận thống kê!</p>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-300">💡 Thuật Toán Thích Ứng Tự Động</p>
              <p className="text-xs text-slate-400">Khi bạn làm bài mới, Gemini AI sẽ tự động tạo câu xoáy sâu vào các dạng lỗi sai ở trên.</p>
            </div>
            <button
              onClick={() => setActiveTab('translation')}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              Luyện ngay <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Active Learning Features Overview */}
        <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-indigo-400" /> Luyện Tập Cùng Backend
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Languages className="w-4 h-4 text-indigo-400" /> Translation Trainer (Việt - Anh)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Sẵn sàng
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tạo câu tiếng Việt thông minh theo từng chủ đề & cấp độ CEFR, sau đó phân tích ngữ pháp bài dịch của bạn bằng LLM Agent.
                </p>
                <button
                  onClick={() => setActiveTab('translation')}
                  className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2 mt-2"
                >
                  <Languages className="w-4 h-4" /> Mở Bộ Luyện Dịch Việt - Anh
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
                <p className="font-bold text-slate-300">ℹ️ Lưu ý về các tính năng chưa có Backend</p>
                <p className="text-slate-400">
                  Các tính năng chưa phát triển API ở phía server (*AI Voice Tutor, Vocab Flashcards, Writing IELTS Evaluator*) đã được ẩn tạm thời để đảm bảo trải nghiệm liền mạch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
