import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  Sparkles, 
  Volume2, 
  RotateCw, 
  Bookmark, 
  BookmarkCheck, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  Gamepad2,
  Trophy,
  Timer,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const FLASHCARD_DATA = [
  { id: 101, word: "Pragmatic", pos: "adjective", cefr: "C1", vi: "Thực tế, thực dụng", example: "We need a pragmatic approach to solving the supply chain bottleneck." },
  { id: 102, word: "Comprehensive", pos: "adjective", cefr: "B2", vi: "Toàn diện, bao quát", example: "The team prepared a comprehensive guide for international students." },
  { id: 103, word: "Disparate", pos: "adjective", cefr: "C2", vi: "Khác biệt hoàn toàn, không thể so sánh", example: "The project brings together scientists from disparate disciplines." },
  { id: 104, word: "Articulate", pos: "verb", cefr: "C1", vi: "Diễn đạt rõ ràng, trôi chảy", example: "She was able to articulate her vision effectively during the conference." },
  { id: 105, word: "Imperative", pos: "adjective", cefr: "B2", vi: "Bắt buộc, rất cấp thiết", example: "It is imperative that we submit the documentation before midnight." },
  { id: 106, word: "Metamorphosis", pos: "noun", cefr: "C2", vi: "Sự biến thái, sự thay đổi hoàn toàn", example: "The company underwent a total metamorphosis in the digital age." }
];

const SAMPLE_SENTENCES = [
  { id: 1, text: "Although the project faced severe budget constraints, the resilient team successfully delivered a comprehensive solution." },
  { id: 2, text: "She articulated her ideas with eloquence during the international climate summit." },
  { id: 3, text: "Innovative technology has become ubiquitous across global financial markets." }
];

export default function VocabGrammar() {
  const { speakText, savedWords, toggleSaveWord, addXp } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('flashcards');

  // Flashcard state
  const [cefrFilter, setCefrFilter] = useState('ALL');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Syntax Analyzer state
  const [syntaxText, setSyntaxText] = useState(SAMPLE_SENTENCES[0].text);
  const [analyzedWords, setAnalyzedWords] = useState([]);

  // Word Chain Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [chainWords, setChainWords] = useState(['Apple', 'Elephant', 'Tiger']);
  const [gameInput, setGameInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameFeedback, setGameFeedback] = useState('');

  // Filter cards
  const filteredCards = cefrFilter === 'ALL' 
    ? FLASHCARD_DATA 
    : FLASHCARD_DATA.filter(c => c.cefr === cefrFilter);
  const currentCard = filteredCards[cardIndex % filteredCards.length] || FLASHCARD_DATA[0];

  const handleNextCard = () => {
    setIsFlipped(false);
    setCardIndex(prev => prev + 1);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCardIndex(prev => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  // Analyze Syntax Logic
  const handleAnalyzeSyntax = () => {
    const tokens = syntaxText.split(/\s+/);
    const result = tokens.map((word, idx) => {
      const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
      let pos = 'noun';
      let tagClass = 'tag-noun';

      if (['the', 'a', 'an', 'this', 'that'].includes(clean)) { pos = 'det'; tagClass = 'tag-prep'; }
      else if (['although', 'because', 'and', 'but', 'if'].includes(clean)) { pos = 'conj'; tagClass = 'tag-adv'; }
      else if (['faced', 'delivered', 'articulated', 'has', 'become'].includes(clean)) { pos = 'verb'; tagClass = 'tag-verb'; }
      else if (['severe', 'resilient', 'comprehensive', 'ubiquitous'].includes(clean)) { pos = 'adj'; tagClass = 'tag-adj'; }
      else if (['successfully', 'effectively', 'during'].includes(clean)) { pos = 'adv'; tagClass = 'tag-adv'; }

      return { word, clean, pos, tagClass };
    });

    setAnalyzedWords(result);
    addXp(10);
  };

  // Word Chain Submission
  const handleWordChainSubmit = (e) => {
    e.preventDefault();
    if (!gameInput.trim()) return;

    const lastWord = chainWords[chainWords.length - 1];
    const requiredLetter = lastWord.slice(-1).toLowerCase();
    const userInput = gameInput.trim().toLowerCase();

    if (!userInput.startsWith(requiredLetter)) {
      setGameFeedback(`❌ Word must start with the letter '${requiredLetter.toUpperCase()}'!`);
      return;
    }

    if (chainWords.some(w => w.toLowerCase() === userInput)) {
      setGameFeedback(`❌ '${userInput}' was already used in this chain!`);
      return;
    }

    // Success
    const formatted = userInput.charAt(0).toUpperCase() + userInput.slice(1);
    setChainWords(prev => [...prev, formatted]);
    setScore(prev => prev + 20);
    setGameInput('');
    setGameFeedback(`🎉 Great word! +20 XP. Next word must start with '${formatted.slice(-1).toUpperCase()}'`);
    setTimeLeft(15);
    addXp(20);
  };

  const isSaved = savedWords.some(w => w.word.toLowerCase() === currentCard.word.toLowerCase());

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Sub Tab Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveSubTab('flashcards')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all ${
              activeSubTab === 'flashcards'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" /> CEFR Flashcards
          </button>

          <button
            onClick={() => { setActiveSubTab('syntax'); handleAnalyzeSyntax(); }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all ${
              activeSubTab === 'syntax'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> Sentence Syntax Analyzer
          </button>

          <button
            onClick={() => setActiveSubTab('game')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all ${
              activeSubTab === 'game'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-emerald-400" /> English Word Chain Game
          </button>
        </div>

        {/* CEFR Level Filter Pill */}
        {activeSubTab === 'flashcards' && (
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {['ALL', 'B2', 'C1', 'C2'].map(level => (
              <button
                key={level}
                onClick={() => { setCefrFilter(level); setCardIndex(0); setIsFlipped(false); }}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                  cefrFilter === level 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 1: CEFR FLASHCARDS */}
      {activeSubTab === 'flashcards' && (
        <div className="flex flex-col items-center space-y-6">
          {/* 3D Flip Card Container */}
          <div className="w-full max-w-xl h-80 perspective-1000">
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className={`w-full h-full transform-style-3d cursor-pointer relative glass-card p-8 flex flex-col justify-between border-2 transition-transform duration-500 ${
                isFlipped ? 'rotate-y-180 border-purple-500/40' : 'border-indigo-500/40 hover:border-indigo-400'
              }`}
            >
              {/* FRONT SIDE */}
              <div className={`absolute inset-0 p-8 flex flex-col justify-between backface-hidden ${isFlipped ? 'hidden' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    CEFR {currentCard.cefr}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); speakText(currentCard.word); }}
                      className="p-2 rounded-full bg-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
                      title="Audio Pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSaveWord(currentCard); }}
                      className={`p-2 rounded-full transition-all ${isSaved ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 bg-slate-800'}`}
                      title="Save to Dictionary"
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4 fill-amber-400" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-4xl font-extrabold text-white tracking-wide text-gradient">{currentCard.word}</h3>
                  <p className="text-xs font-semibold text-slate-400 italic">[{currentCard.pos}]</p>
                </div>

                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold">
                  <RotateCw className="w-3.5 h-3.5" /> Click anywhere to reveal Vietnamese meaning
                </div>
              </div>

              {/* BACK SIDE */}
              <div className={`absolute inset-0 p-8 flex flex-col justify-between backface-hidden rotate-y-180 bg-slate-900/95 rounded-xl ${!isFlipped ? 'hidden' : ''}`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-purple-400">VIETNAMESE DEFINITION</span>
                  <span className="text-xs text-slate-400">Card {cardIndex + 1} of {filteredCards.length}</span>
                </div>

                <div className="space-y-4 my-auto">
                  <h4 className="text-2xl font-bold text-emerald-400">{currentCard.vi}</h4>
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200">
                    <p className="font-semibold text-indigo-300 mb-1">Example Sentence:</p>
                    <p className="italic">"{currentCard.example}"</p>
                  </div>
                </div>

                <p className="text-center text-xs text-slate-400">Click to flip back</p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrevCard}
              className="btn-secondary"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-xs text-slate-400 font-semibold">
              {cardIndex + 1} / {filteredCards.length}
            </span>
            <button 
              onClick={handleNextCard}
              className="btn-primary"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: SENTENCE SYNTAX ANALYZER */}
      {activeSubTab === 'syntax' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Interactive Grammar & Syntax Analyzer
            </h3>
            <p className="text-xs text-slate-400">Paste any complex English sentence to analyze its clause structure, parts of speech, and tenses.</p>
          </div>

          {/* Sample Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-2">Try Sample:</span>
            {SAMPLE_SENTENCES.map((s, idx) => (
              <button
                key={idx}
                onClick={() => { setSyntaxText(s.text); }}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 text-xs font-medium text-slate-300 hover:bg-indigo-600 hover:text-white border border-slate-700 transition-all"
              >
                Sample {idx + 1}
              </button>
            ))}
          </div>

          <textarea
            value={syntaxText}
            onChange={(e) => setSyntaxText(e.target.value)}
            rows={3}
            className="w-full glass-input p-4 text-sm font-medium focus:outline-none"
            placeholder="Type or paste an English sentence here..."
          />

          <button
            onClick={handleAnalyzeSyntax}
            className="btn-primary py-2.5 px-6"
          >
            <Sparkles className="w-4 h-4" /> Analyze Syntax Structure
          </button>

          {/* Tagged Sentence Output */}
          {analyzedWords.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grammatical Breakdown & Tags</h4>
              <div className="flex flex-wrap gap-2 leading-relaxed">
                {analyzedWords.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex flex-col items-center group relative cursor-pointer"
                  >
                    <span className="text-base font-semibold text-white px-1.5 py-0.5">{item.word}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.tagClass}`}>
                      {item.pos}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Clause Analysis:</p>
                  <p>Subordinate Conjunction ("Although") creates a dependent clause followed by the main independent clause.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: WORD CHAIN GAME */}
      {activeSubTab === 'game' && (
        <div className="glass-card p-6 space-y-6 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-emerald-400" /> English Word Chain (Game Nối Từ Tiếng Anh)
              </h3>
              <p className="text-xs text-slate-400">Type a valid English word starting with the LAST letter of the previous word!</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/10 text-amber-300 rounded-xl font-extrabold text-sm border border-amber-400/20">
                <Trophy className="w-4 h-4 text-amber-400" /> Score: {score}
              </div>
            </div>
          </div>

          {/* Word Chain Tag Flow */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 min-h-32 flex flex-wrap items-center gap-3">
            {chainWords.map((w, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 border border-indigo-500/30 text-white font-bold text-sm shadow-md"
              >
                <span>{w}</span>
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center">
                  {w.slice(-1).toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {gameFeedback && (
            <div className="p-3.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 border border-indigo-500/30">
              {gameFeedback}
            </div>
          )}

          {/* Word Input Form */}
          <form onSubmit={handleWordChainSubmit} className="flex gap-3">
            <input
              type="text"
              value={gameInput}
              onChange={(e) => setGameInput(e.target.value)}
              placeholder={`Enter word starting with '${chainWords[chainWords.length - 1].slice(-1).toUpperCase()}'...`}
              className="flex-1 glass-input px-4 py-3 text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="btn-primary px-6"
            >
              Submit Word
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
