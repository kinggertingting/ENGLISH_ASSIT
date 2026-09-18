import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  PenTool, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Copy, 
  ArrowRight,
  TrendingUp,
  BookOpen
} from 'lucide-react';

const ESSAY_PROMPTS = [
  { 
    id: 1, 
    type: "IELTS Task 2", 
    title: "University Tuition", 
    prompt: "Some people believe that university education should be free for everyone, while others argue that students should pay for their tertiary studies. Discuss both views and give your opinion." 
  },
  { 
    id: 2, 
    type: "IELTS Task 2", 
    title: "Artificial Intelligence & Jobs", 
    prompt: "The rapid development of artificial intelligence will transform the global workforce. Do the advantages of this trend outweigh the disadvantages?" 
  },
  { 
    id: 3, 
    type: "IELTS Task 1", 
    title: "Global Energy Consumption", 
    prompt: "The chart below shows energy consumption by source in five countries. Summarize the information by selecting and reporting the main features." 
  }
];

const SAMPLE_ESSAY = `In recent years, the debate regarding whether higher education should be publicly funded has gained significant traction. While critics argue that tuition fees place a heavy financial burden on families, proponents maintain that paid tuition ensures academic quality. In my view, providing state-funded tertiary education yields far greater societal and economic benefits.

Firstly, free university education promotes equal opportunities across socioeconomic classes. When tuition costs are eliminated, talented students from low-income backgrounds can pursue higher qualifications without incurring crippling student debt. Consequently, this enhances social mobility and fosters a merit-based workforce.

Furthermore, a highly educated populace directly drives economic growth. Graduates in fields such as engineering, medicine, and technology contribute to national innovation. 

In conclusion, although funding universities requires substantial tax allocations, the long-term economic returns far outweigh the costs. Governments should therefore prioritize investing in higher education.`;

export default function WritingEvaluator() {
  const { addXp } = useApp();

  const [selectedPrompt, setSelectedPrompt] = useState(ESSAY_PROMPTS[0]);
  const [essayText, setEssayText] = useState(SAMPLE_ESSAY);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;

  const handleEvaluate = () => {
    if (wordCount < 50) {
      alert("Please write at least 50 words to get a comprehensive essay evaluation!");
      return;
    }

    setIsAnalyzing(true);

    setTimeout(() => {
      setEvaluationResult({
        overallBand: 7.5,
        criteria: {
          taskAchievement: { score: 7.5, feedback: "Fully addresses all parts of the prompt with clear position throughout." },
          coherenceCohesion: { score: 8.0, feedback: "Paragraphs are logically structured with effective cohesive devices ('Firstly', 'Furthermore', 'In conclusion')." },
          lexicalResource: { score: 7.0, feedback: "Good range of academic vocabulary ('societal', 'incurring crippling debt', 'socioeconomic')." },
          grammarAccuracy: { score: 7.5, feedback: "Wide variety of complex clause structures with minor punctuation polish needed." }
        },
        improvedEssay: essayText.replace(
          "has gained significant traction.", 
          "has emerged as a focal point of public discourse."
        ).replace(
          "economic growth.",
          "sustainable macroeconomic prosperity."
        ),
        keyUpgrades: [
          { original: "gained significant traction", upgraded: "emerged as a focal point of public discourse", reason: "Elevates Band Score to 8.0+ Lexical Resource" },
          { original: "economic growth", upgraded: "sustainable macroeconomic prosperity", reason: "Native collocations" }
        ]
      });

      setIsAnalyzing(false);
      addXp(60);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-indigo-500/20">
        <div>
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <PenTool className="w-5 h-5 text-indigo-400" /> AI Essay & Writing Evaluator
          </h3>
          <p className="text-xs text-slate-400 mt-1">Get instant IELTS Band Scores (0.0 - 9.0) with detailed criteria breakdown and diff correction.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-xl border border-indigo-500/20">
            {wordCount} Words Total
          </span>
          <button
            onClick={handleEvaluate}
            disabled={isAnalyzing}
            className="btn-primary py-2.5 px-6"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Evaluating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Evaluate Essay
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Prompt & Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Prompt Library & Text Input */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prompt Selector */}
          <div className="glass-card p-5 space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Essay Prompt</label>
            <div className="space-y-2">
              {ESSAY_PROMPTS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPrompt(p)}
                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                    selectedPrompt.id === p.id 
                      ? 'bg-indigo-900/40 border-indigo-500 text-white font-bold' 
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-indigo-400 font-bold">{p.type}: {p.title}</span>
                  </div>
                  <p className="text-slate-400 line-clamp-2">{p.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Essay Input Box */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Essay Submission</label>
              <span className={`text-xs font-bold ${wordCount >= 250 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {wordCount} / 250+ Target Words
              </span>
            </div>

            <textarea
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              rows={12}
              className="w-full glass-input p-4 text-sm leading-relaxed font-sans focus:outline-none"
              placeholder="Paste or write your essay here in English..."
            />
          </div>
        </div>

        {/* Right Column: AI Analysis Result Card */}
        <div className="lg:col-span-5 space-y-6">
          {evaluationResult ? (
            <div className="glass-card p-6 space-y-6 border-indigo-500/30">
              {/* Band Score Header */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/30">
                <div>
                  <p className="text-xs font-bold text-slate-300 uppercase">Estimated IELTS Score</p>
                  <h3 className="text-4xl font-extrabold text-amber-400 mt-0.5">{evaluationResult.overallBand} Band</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
                  <Award className="w-8 h-8 text-amber-400" />
                </div>
              </div>

              {/* Criterion Breakdown Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase">IELTS Criteria Scores</h4>
                
                {Object.entries(evaluationResult.criteria).map(([key, data]) => (
                  <div key={key} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-200 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        {data.score} / 9.0
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1">{data.feedback}</p>
                  </div>
                ))}
              </div>

              {/* Side-by-Side Upgrade Highlights */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Recommended Band 8.0+ Vocabulary Upgrades</h4>
                {evaluationResult.keyUpgrades.map((up, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="line-through text-slate-400">{up.original}</span>
                      <ArrowRight className="w-3 h-3 text-purple-400" />
                      <span className="font-bold text-purple-300">{up.upgraded}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{up.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center space-y-4 border-dashed border-slate-700">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Ready for Essay Evaluation</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Click "Evaluate Essay" above to get detailed criterion feedback and band score analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
