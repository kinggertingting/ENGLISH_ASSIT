import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

const AppContext = createContext();

const DEFAULT_USER = {
  name: "Learner",
  avatar: "✨",
  cefrLevel: "B2",
  targetGoal: "C1",
  streakDays: 5,
  xp: 1240,
  dailyXpGoal: 200,
  todayXp: 85,
  completedToday: false,
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('english_assit_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [dbUser, setDbUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [topics, setTopics] = useState([]);
  const [levels, setLevels] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [loadingBackend, setLoadingBackend] = useState(true);

  const [audioSettings, setAudioSettings] = useState(() => {
    const saved = localStorage.getItem('english_assit_audio');
    return saved ? JSON.parse(saved) : { accent: 'en-US', rate: 1.0, pitch: 1.0 };
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    localStorage.setItem('english_assit_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('english_assit_audio', JSON.stringify(audioSettings));
  }, [audioSettings]);

  // Fetch initial data & authenticate user with Backend API
  const initBackendUser = useCallback(async (usernameToUse) => {
    setLoadingBackend(true);
    setBackendError(null);
    try {
      // 1. Login or create user in DB
      const dbUserRes = await api.loginUser(usernameToUse || user.name || "Learner");
      setDbUser(dbUserRes);

      // 2. Fetch Topics & Levels
      const [topicsRes, levelsRes, statsRes] = await Promise.all([
        api.getTopics().catch(() => []),
        api.getLevels().catch(() => []),
        api.getUserStats(dbUserRes.id).catch(() => null),
      ]);

      setTopics(topicsRes);
      setLevels(levelsRes);
      setUserStats(statsRes);
      setIsBackendConnected(true);
    } catch (err) {
      console.error("Backend Connection Error:", err);
      setIsBackendConnected(false);
      setBackendError(err.message || "Cannot connect to Backend server (http://localhost:8000).");
    } finally {
      setLoadingBackend(false);
    }
  }, [user.name]);

  useEffect(() => {
    initBackendUser(user.name);
  }, [initBackendUser, user.name]);

  // Refresh user stats from Backend
  const refreshUserStats = async () => {
    if (!dbUser?.id) return;
    try {
      const stats = await api.getUserStats(dbUser.id);
      setUserStats(stats);
    } catch (err) {
      console.error("Failed to refresh user stats:", err);
    }
  };

  // Add XP with celebratory confetti when daily goal reached
  const addXp = (amount) => {
    setUser(prev => {
      const newTodayXp = prev.todayXp + amount;
      const newXp = prev.xp + amount;
      const goalReached = newTodayXp >= prev.dailyXpGoal && !prev.completedToday;

      if (goalReached) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      return {
        ...prev,
        xp: newXp,
        todayXp: newTodayXp,
        completedToday: goalReached ? true : prev.completedToday
      };
    });
  };

  // Text-To-Speech synthesizer helper
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = audioSettings.rate;
    utterance.pitch = audioSettings.pitch;

    // Pick matching voice accent
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.includes(audioSettings.accent)) || voices.find(v => v.lang.startsWith('en'));
    if (matchingVoice) utterance.voice = matchingVoice;

    window.speechSynthesis.speak(utterance);
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      dbUser,
      userStats,
      topics,
      levels,
      isBackendConnected,
      backendError,
      loadingBackend,
      initBackendUser,
      refreshUserStats,
      audioSettings,
      setAudioSettings,
      activeTab,
      setActiveTab,
      addXp,
      speakText
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
