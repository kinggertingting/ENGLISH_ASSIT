import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MessageSquare, 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  Sparkles, 
  User, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Award,
  Globe
} from 'lucide-react';

const PERSONAS = [
  { id: 'friend', name: 'Alex (Native Friend)', avatar: '🧑‍🦱', desc: 'Casual, modern idioms, friendly vibes' },
  { id: 'teacher', name: 'Prof. Sarah (Patient Tutor)', avatar: '👩‍🏫', desc: 'Step-by-step guidance & grammar explanations' },
  { id: 'examiner', name: 'Dr. Sterling (IELTS Examiner)', avatar: '👨‍💼', desc: 'Strict evaluation, band scores & vocabulary feedback' }
];

const SCENARIOS = [
  { id: 'coffee', name: '☕ Coffee Shop Chat', prompt: 'You are ordering coffee and chatting about weekend plans.' },
  { id: 'interview', name: '💼 Job Interview Prep', prompt: 'You are interviewing for a Senior Software Engineer position.' },
  { id: 'travel', name: '✈️ Airport & Travel', prompt: 'You are checking in at international airport customs.' },
  { id: 'business', name: '🤝 Business Negotiation', prompt: 'You are negotiating a commercial project deal.' },
  { id: 'ielts', name: '🎙️ IELTS Speaking Mock', prompt: 'Simulate IELTS Speaking Part 1 general questions.' }
];

const INITIAL_MESSAGES = {
  coffee: [
    { sender: 'tutor', text: "Hey there! Welcome to StarBeans. What can I get started for you today?", feedback: null },
  ],
  interview: [
    { sender: 'tutor', text: "Good morning! Thank you for coming in today. Could you start by introducing yourself and sharing your background?", feedback: null },
  ],
  travel: [
    { sender: 'tutor', text: "Good afternoon, passport and landing card please. What is the main purpose of your visit to London today?", feedback: null },
  ],
  business: [
    { sender: 'tutor', text: "Thanks for meeting today. We reviewed your initial proposal, but we feel the pricing is slightly above our budget. Where can we find flexibility?", feedback: null },
  ],
  ielts: [
    { sender: 'tutor', text: "Good day. In this first part, I'd like to ask you some questions about yourself. Let's talk about your hometown. Where is your hometown located?", feedback: null },
  ]
};

export default function AITutor() {
  const { speakText, addXp } = useApp();

  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [messages, setMessages] = useState(INITIAL_MESSAGES.coffee);
  const [inputMsg, setInputMsg] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleScenarioChange = (sc) => {
    setSelectedScenario(sc);
    setMessages(INITIAL_MESSAGES[sc.id] || INITIAL_MESSAGES.coffee);
  };

  const handleSendMessage = () => {
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    setInputMsg('');

    // Append User Message
    const updatedMessages = [...messages, { sender: 'user', text: userText, feedback: null }];
    setMessages(updatedMessages);
    setIsThinking(true);

    // Simulate AI Intelligence with real-time feedback after short delay
    setTimeout(() => {
      let aiReply = "";
      let grammarTip = null;

      // Smart simulation response generator based on scenario & input
      if (selectedScenario.id === 'coffee') {
        aiReply = `Awesome choice! One ${userText.toLowerCase().includes('latte') ? 'Latte' : 'Coffee'} coming right up. Would you like oat milk or regular dairy with that?`;
        if (!userText.toLowerCase().includes('please') && !userText.toLowerCase().includes('could')) {
          grammarTip = "Politeness Tip: Adding 'Could I please get...' sounds more natural to native speakers!";
        }
      } else if (selectedScenario.id === 'interview') {
        aiReply = "That's a very compelling background! How do you handle high-pressure deadlines or conflicting priorities in a team environment?";
        if (userText.length < 25) {
          grammarTip = "Interview Tip: Use the STAR method (Situation, Task, Action, Result) to give a complete 3-4 sentence answer.";
        }
      } else if (selectedScenario.id === 'travel') {
        aiReply = "Understood. How many days do you plan to stay in the country, and where will you be residing during your stay?";
        grammarTip = "Vocabulary Tip: Use 'residing at' or 'staying at [Hotel Name]' for immigration precision.";
      } else {
        aiReply = "Thank you for clarifying that point! Could you elaborate further on how that aligns with your key objectives?";
        grammarTip = "Advanced Phrasing: You used concise phrasing! Great job expanding your vocabulary range.";
      }

      setMessages(prev => [
        ...prev,
        { sender: 'tutor', text: aiReply, feedback: grammarTip }
      ]);
      setIsThinking(false);

      // Auto play TTS voice
      speakText(aiReply);
      addXp(15);
    }, 1200);
  };

  // Web Speech Microphone Recording
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Speech Recognition API is not supported in this browser. You can type your message below!");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    if (!isRecording) {
      setIsRecording(true);
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMsg(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Controls: Persona & Scenario Selection */}
      <div className="glass-card p-6 space-y-6 border-indigo-500/20">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">1. Select AI Tutor Persona</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-start gap-3.5 ${
                  selectedPersona.id === p.id 
                    ? 'bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-500 shadow-lg shadow-indigo-500/15' 
                    : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <span className="text-3xl">{p.avatar}</span>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {p.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">2. Select Roleplay Scenario</h3>
          <div className="flex flex-wrap gap-2.5">
            {SCENARIOS.map(s => (
              <button
                key={s.id}
                onClick={() => handleScenarioChange(s)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  selectedScenario.id === s.id
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700/60'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Chat Interface */}
      <div className="glass-card flex flex-col h-[580px] border-indigo-500/20 overflow-hidden">
        {/* Chat Top Banner */}
        <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xl shadow-md">
              {selectedPersona.avatar}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                {selectedPersona.name}
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h4>
              <p className="text-xs text-slate-400">{selectedScenario.name} • Live Audio Ready</p>
            </div>
          </div>

          <button 
            onClick={() => setMessages(INITIAL_MESSAGES[selectedScenario.id] || INITIAL_MESSAGES.coffee)}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Reset Conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restart
          </button>
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-2.5 max-w-[80%]">
                {msg.sender === 'tutor' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-900/80 border border-indigo-500/30 flex items-center justify-center text-sm shrink-0">
                    {selectedPersona.avatar}
                  </div>
                )}

                <div 
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {msg.sender === 'tutor' && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="p-2 rounded-full bg-slate-800/80 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all border border-slate-700 shrink-0"
                    title="Play Audio Pronunciation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Inline Grammar & Fluency Feedback Card */}
              {msg.feedback && (
                <div className="mt-2 ml-10 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 max-w-[75%] animate-fadeIn">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{msg.feedback}</span>
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-full bg-indigo-900/80 flex items-center justify-center text-sm">
                {selectedPersona.avatar}
              </div>
              <span className="flex items-center gap-1">
                AI Tutor is formulating response...
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              </span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Controls Bar */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={toggleSpeechRecognition}
            className={`p-3 rounded-xl border transition-all ${
              isRecording
                ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-lg shadow-red-500/30'
                : 'bg-slate-800/80 text-indigo-400 border-slate-700 hover:bg-slate-700'
            }`}
            title={isRecording ? "Listening... Click to stop" : "Click to speak with microphone"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isRecording ? "Listening to your speech..." : "Type your message in English..."}
            className="flex-1 glass-input px-4 py-3 text-sm focus:outline-none"
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputMsg.trim() || isThinking}
            className="btn-primary py-3 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
