import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  Languages, 
  Sparkles, 
  Volume2, 
  CheckCircle, 
  RefreshCw,
  Award,
  AlertCircle,
  BookOpen,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function TranslationPractice() {
  const { 
    dbUser, 
    topics, 
    levels, 
    isBackendConnected, 
    speakText, 
    addXp, 
    refreshUserStats 
  } = useApp();

  // Selected config for exercise generation
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  // Exercise state
  const [currentSentence, setCurrentSentence] = useState(null);
  const [userTranslation, setUserTranslation] = useState('');

  // Statuses
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [result, setResult] = useState(null);

  // Set initial default topic & level when fetched
  useEffect(() => {
    if (topics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topics[0].id);
    }
    if (levels.length > 0 && !selectedLevelId) {
      setSelectedLevelId(levels[0].id);
    }
  }, [topics, levels, selectedTopicId, selectedLevelId]);

  // Handler to generate exercise from backend Gemini AI
  const handleGenerateExercise = async () => {
    if (!dbUser?.id) {
      setErrorMsg("User session not found. Please reload or log in.");
      return;
    }
    if (!selectedTopicId || !selectedLevelId) {
      setErrorMsg("Vui lòng chọn Chủ đề và Trình độ trước khi tạo bài tập.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setResult(null);
    setUserTranslation('');

    try {
      const exercise = await api.generateExercise(
        dbUser.id,
        selectedTopicId,
        selectedLevelId,
        selectedDifficulty
      );
      setCurrentSentence(exercise);
    } catch (err) {
      console.error("Generate exercise error:", err);
      setErrorMsg(err.message || "Không thể tạo bài tập từ Backend. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler to submit translation to backend for AI evaluation
  const handleSubmitTranslation = async () => {
    if (!dbUser?.id || !currentSentence?.sentence_id || !userTranslation.trim()) return;

    setIsEvaluating(true);
    setErrorMsg(null);

    try {
      const evalResult = await api.submitExercise(
        dbUser.id,
        currentSentence.sentence_id,
        userTranslation.trim()
      );

      setResult(evalResult);
      addXp(40);
      refreshUserStats();
    } catch (err) {
      console.error("Submit translation error:", err);
      setErrorMsg(err.message || "Không thể gửi câu dịch để chấm điểm. Vui lòng thử lại.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const currentTopicObj = topics.find(t => t.id === selectedTopicId);
  const currentLevelObj = levels.find(l => l.id === selectedLevelId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-indigo-500/20">
        <div>
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Languages className="w-5 h-5 text-indigo-400" /> Adaptive Vietnamese ➔ English Translation Trainer
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Luyện dịch câu Việt - Anh được Gemini AI cá nhân hóa theo trình độ & điểm yếu ngữ pháp của bạn.
          </p>
        </div>

        <button 
          onClick={handleGenerateExercise}
          disabled={isGenerating || !isBackendConnected}
          className="btn-primary text-xs flex items-center gap-2 py-2.5 px-4 shadow-lg shadow-indigo-600/30"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>AI Đang Soạn Câu...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Tạo Bài Tập Mới (Gemini AI)</span>
            </>
          )}
        </button>
      </div>

      {/* Backend Disconnected Alert */}
      {!isBackendConnected && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <strong>Đang kết nối Backend Server (http://localhost:8000)...</strong>
            <p className="mt-0.5">Đảm bảo FastAPI backend đã khởi chạy lệnh <code>python main.py</code> để tạo bài tập bằng AI.</p>
          </div>
        </div>
      )}

      {/* Filter Controls: Topic, Level, Difficulty */}
      <div className="glass-card p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-slate-800">
        {/* Topic Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Chủ Đề (Topic)
          </label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full glass-input p-2.5 text-xs font-semibold focus:outline-none"
            disabled={topics.length === 0}
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                {t.name} ({t.description || 'Tổng hợp'})
              </option>
            ))}
          </select>
        </div>

        {/* Level Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-indigo-400" /> Trình Độ CEFR (Level)
          </label>
          <select
            value={selectedLevelId}
            onChange={(e) => setSelectedLevelId(e.target.value)}
            className="w-full glass-input p-2.5 text-xs font-semibold focus:outline-none"
            disabled={levels.length === 0}
          >
            {levels.map((l) => (
              <option key={l.id} value={l.id} className="bg-slate-900 text-slate-200">
                Level {l.name} - {l.description}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Độ Khó (Difficulty)
          </label>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full glass-input p-2.5 text-xs font-semibold focus:outline-none"
          >
            <option value="easy" className="bg-slate-900">Easy (Dễ - Cấu trúc đơn giản)</option>
            <option value="medium" className="bg-slate-900">Medium (Vừa - Phức hợp vừa phải)</option>
            <option value="hard" className="bg-slate-900">Hard (Khó - Từ vựng & ngữ pháp nâng cao)</option>
          </select>
        </div>
      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" /> {errorMsg}
          </span>
          <button 
            onClick={handleGenerateExercise}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg text-[11px] font-bold transition-all"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Main Translation Practice Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Current Exercise Prompt & Input */}
        <div className="lg:col-span-7 space-y-6">
          {currentSentence ? (
            <>
              {/* Exercise Card */}
              <div className="glass-card p-6 space-y-4 border-l-4 border-l-indigo-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {currentLevelObj?.name || 'CEFR'} • {selectedDifficulty.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Topic: {currentTopicObj?.name || 'General'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">ID: {currentSentence.sentence_id.substring(0, 8)}...</span>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Câu tiếng Việt cần dịch sang tiếng Anh:
                  </label>
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <p className="text-lg font-bold text-white leading-relaxed">
                      "{currentSentence.vietnamese_text}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Translation Input Area */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase">Bản dịch tiếng Anh của bạn:</label>
                  <span className="text-[11px] text-slate-500">{userTranslation.length} ký tự</span>
                </div>
                <textarea
                  value={userTranslation}
                  onChange={(e) => setUserTranslation(e.target.value)}
                  rows={4}
                  className="w-full glass-input p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Nhập bản dịch tiếng Anh của bạn vào đây..."
                  disabled={isEvaluating}
                />

                <button
                  onClick={handleSubmitTranslation}
                  disabled={!userTranslation.trim() || isEvaluating}
                  className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>Gemini AI Đang Phân Tích & Chấm Điểm...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-indigo-200" />
                      <span>Nộp Bài & Nhận Nhận Xét Chi Tiết từ AI</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="glass-card p-12 text-center space-y-4 border-dashed border-slate-700">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Sẵn sàng luyện dịch bài tập mới</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Chọn Chủ đề, Trình độ và bấm nút <strong>"Tạo Bài Tập Mới (Gemini AI)"</strong> để hệ thống tạo câu tiếng Việt cần dịch.
                </p>
              </div>
              <button
                onClick={handleGenerateExercise}
                disabled={isGenerating || !isBackendConnected}
                className="btn-primary py-2.5 px-6 text-xs inline-flex items-center gap-2 mt-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Tạo Bài Tập Đầu Tiên
              </button>
            </div>
          )}
        </div>

        {/* Right Column: AI Feedback & Detailed Mistake Analysis */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div className="glass-card p-6 space-y-6 border-emerald-500/30">
              {/* Score Header */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                result.score >= 80 
                  ? 'bg-gradient-to-r from-emerald-950/50 to-slate-900 border-emerald-500/40' 
                  : result.score >= 50
                  ? 'bg-gradient-to-r from-amber-950/50 to-slate-900 border-amber-500/40'
                  : 'bg-gradient-to-r from-red-950/50 to-slate-900 border-red-500/40'
              }`}>
                <div>
                  <p className="text-xs font-bold text-slate-300">Điểm Đánh Giá Ngữ Pháp & Từ Vựng</p>
                  <h3 className={`text-3xl font-extrabold mt-0.5 ${
                    result.score >= 80 ? 'text-emerald-400' : result.score >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {result.score}/100 Point
                  </h3>
                </div>
                <div className={`p-3 rounded-xl ${
                  result.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {result.is_correct ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                </div>
              </div>

              {/* Overall AI Feedback */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Nhận xét tổng quan từ AI:</label>
                <p className="text-xs text-slate-200 font-medium leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  {result.feedback}
                </p>
              </div>

              {/* Native Model Corrected Translation */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    Bản dịch chuẩn mẫu (Model Answer)
                  </span>
                  <button
                    onClick={() => speakText(result.corrected_answer || result.english_answer)}
                    className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 text-[11px]"
                    title="Nghe phát âm bản dịch chuẩn"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Nghe AI Đọc
                  </button>
                </div>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {result.corrected_answer || result.english_answer}
                </p>
              </div>

              {/* Detailed Mistakes Analysis Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Chi tiết phân tích lỗi sai ({result.mistakes?.length || 0})</span>
                  {result.mistakes?.length === 0 && (
                    <span className="text-emerald-400 text-[11px] font-bold">✨ Hoàn hảo! Không phát hiện lỗi</span>
                  )}
                </h4>

                {result.mistakes && result.mistakes.length > 0 ? (
                  <div className="space-y-2.5">
                    {result.mistakes.map((m, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
                            {m.mistake_type} {m.mistake_subtype ? `• ${m.mistake_subtype}` : ''}
                          </span>
                        </div>

                        {m.wrong_text && (
                          <div className="flex items-center gap-2 text-red-400 font-medium">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Từ/cụm từ sai: <code className="bg-red-950/60 px-1.5 py-0.5 rounded">{m.wrong_text}</code></span>
                          </div>
                        )}

                        {m.correct_text && (
                          <div className="flex items-center gap-2 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Nên sửa thành: <code className="bg-emerald-950/60 px-1.5 py-0.5 rounded">{m.correct_text}</code></span>
                          </div>
                        )}

                        <p className="text-slate-300 text-[11px] leading-relaxed pt-1 border-t border-slate-800">
                          💡 <strong>Giải thích:</strong> {m.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Bản dịch của bạn đạt chất lượng rất xuất sắc! Nhấn "Tạo Bài Tập Mới" để tiếp tục thử thách.
                  </p>
                )}
              </div>

              {/* Next Exercise Button */}
              <button
                onClick={handleGenerateExercise}
                disabled={isGenerating}
                className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Tiếp Tục Làm Câu Tiếp Theo</span>
              </button>
            </div>
          ) : (
            <div className="glass-card p-8 text-center space-y-3 border-dashed border-slate-700">
              <Languages className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">Đang chờ nhận xét từ AI</h4>
              <p className="text-xs text-slate-400">
                Nhập bản dịch tiếng Anh ở bên trái và nhấn <strong>"Nộp Bài & Nhận Nhận Xét"</strong> để xem phân tích ngữ pháp chi tiết từ Gemini AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
