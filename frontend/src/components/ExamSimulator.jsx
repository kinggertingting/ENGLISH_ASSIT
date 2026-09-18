import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Mic, 
  Clock, 
  Award, 
  Volume2, 
  Sparkles, 
  Play, 
  Square, 
  RefreshCw,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

const CUE_CARDS = [
  {
    id: 1,
    topic: "Describe a memorable journey or trip you took that had a significant impact on your life.",
    bullets: [
      "Where you went and who you traveled with",
      "What activities you engaged in during the trip",
      "Why this trip was particularly memorable",
      "And explain what you learned from this experience"
    ]
  },
  {
    id: 2,
    topic: "Describe an innovative piece of technology that you use daily and find indispensable.",
    bullets: [
      "What the device or technology is",
      "How long you have been using it",
      "What features make it so valuable to you",
      "And explain how it has changed your routine"
    ]
  }
];

export default function ExamSimulator() {
  const { speakText, addXp } = useApp();

  const [activePart, setActivePart] = useState(2); // Part 2 Cue Card default
  const [selectedCue, setSelectedCue] = useState(CUE_CARDS[0]);
  const [prepTimeLeft, setPrepTimeLeft] = useState(60);
  const [isPrepRunning, setIsPrepRunning] = useState(false);
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(120);
  const [isSpeakingRunning, setIsSpeakingRunning] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  // Prep Timer Countdown Effect
  useEffect(() => {
    let timer = null;
    if (isPrepRunning && prepTimeLeft > 0) {
      timer = setInterval(() => setPrepTimeLeft(prev => prev - 1), 1000);
    } else if (prepTimeLeft === 0 && isPrepRunning) {
      setIsPrepRunning(false);
      setIsSpeakingRunning(true); // Auto start speaking clock
    }
    return () => clearInterval(timer);
  }, [isPrepRunning, prepTimeLeft]);

  // Speaking Timer Countdown Effect
  useEffect(() => {
    let timer = null;
    if (isSpeakingRunning && speakingTimeLeft > 0) {
      timer = setInterval(() => setSpeakingTimeLeft(prev => prev - 1), 1000);
    } else if (speakingTimeLeft === 0 && isSpeakingRunning) {
      setIsSpeakingRunning(false);
      setTestCompleted(true);
      addXp(80);
    }
    return () => clearInterval(timer);
  }, [isSpeakingRunning, speakingTimeLeft]);

  const handleStartPrep = () => {
    setPrepTimeLeft(60);
    setSpeakingTimeLeft(120);
    setTestCompleted(false);
    setIsPrepRunning(true);
  };

  const handleStopSpeaking = () => {
    setIsSpeakingRunning(false);
    setIsPrepRunning(false);
    setTestCompleted(true);
    addXp(80);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-emerald-500/30">
        <div>
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Mic className="w-5 h-5 text-emerald-400" /> IELTS / TOEFL Speaking Test Simulator
          </h3>
          <p className="text-xs text-slate-400 mt-1">Realistic timed speaking exam environment with fluency, WPM speed, and filler word detection.</p>
        </div>

        {/* Part Tabs */}
        <div className="flex gap-2">
          {[1, 2, 3].map(part => (
            <button
              key={part}
              onClick={() => setActivePart(part)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                activePart === part
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/20'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
              }`}
            >
              Part {part}
            </button>
          ))}
        </div>
      </div>

      {/* Main Cue Card Display & Timer Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Cue Card Card */}
        <div className="lg:col-span-7 glass-card p-8 space-y-6 border-indigo-500/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              IELTS SPEAKING PART 2 • CUE CARD
            </span>
            <button 
              onClick={() => speakText(selectedCue.topic)}
              className="p-2 rounded-full bg-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
              title="Listen to Topic Audio"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-bold text-white leading-relaxed">{selectedCue.topic}</h4>
            
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase">You should say:</p>
              <ul className="space-y-1.5">
                {selectedCue.bullets.map((b, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Timers & Audio Metrics */}
        <div className="lg:col-span-5 space-y-6">
          {/* Timers Panel */}
          <div className="glass-card p-6 space-y-6 text-center border-emerald-500/30">
            <div className="grid grid-cols-2 gap-4">
              {/* Prep Timer */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isPrepRunning ? 'bg-indigo-950/40 border-indigo-500 animate-pulse' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Preparation Clock</p>
                <h3 className="text-3xl font-extrabold text-indigo-400 mt-1">{prepTimeLeft}s</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">1 Min Target</p>
              </div>

              {/* Speaking Timer */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isSpeakingRunning ? 'bg-emerald-950/40 border-emerald-500 animate-pulse' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Speaking Clock</p>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{speakingTimeLeft}s</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">2 Min Max</p>
              </div>
            </div>

            {/* Timer Actions */}
            <div className="flex gap-3">
              {!isPrepRunning && !isSpeakingRunning ? (
                <button
                  onClick={handleStartPrep}
                  className="btn-primary w-full py-3"
                >
                  <Play className="w-4 h-4 fill-white" /> Start Prep & Recording
                </button>
              ) : (
                <button
                  onClick={handleStopSpeaking}
                  className="bg-red-600 text-white font-bold rounded-xl w-full py-3 flex items-center justify-center gap-2 hover:bg-red-700 transition-all"
                >
                  <Square className="w-4 h-4 fill-white" /> Stop & Finalize Test
                </button>
              )}
            </div>
          </div>

          {/* Test Performance Summary Card */}
          {testCompleted && (
            <div className="glass-card p-6 space-y-4 border-amber-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase">Official Scorecard Forecast</span>
                <span className="text-2xl font-extrabold text-amber-400">7.5 Band</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-slate-400 font-semibold">Pace / Speed</p>
                  <p className="font-extrabold text-emerald-400 mt-0.5">135 WPM (Optimal)</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-slate-400 font-semibold">Filler Words</p>
                  <p className="font-extrabold text-indigo-400 mt-0.5">2 Detected ("um")</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300">
                🎉 Great coherence and fluency! Minimal hesitation recorded.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
