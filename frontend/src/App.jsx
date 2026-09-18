import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TranslationPractice from './components/TranslationPractice';
import Settings from './components/Settings';

function MainContent() {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 bg-slate-950 min-h-screen overflow-y-auto">
      <Navbar />
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'translation' && <TranslationPractice />}
      {activeTab === 'settings' && <Settings />}
    </main>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
        <Sidebar />
        <MainContent />
      </div>
    </AppProvider>
  );
}
