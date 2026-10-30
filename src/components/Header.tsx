import React from 'react';
import { SIR_LAX_AVATAR } from '../data/mockData';
import { Wifi, WifiOff, Volume2, Sparkles, HeartHandshake, ShieldCheck, Download } from 'lucide-react';
import { LanguageMode } from '../types';

interface HeaderProps {
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  onOpenAdUnits: () => void;
  onOpenFeedModal: () => void;
  onOpenInstallModal: () => void;
  fontSize: 'normal' | 'large' | 'huge';
  setFontSize: (size: 'normal' | 'large' | 'huge') => void;
  mealsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isOffline,
  setIsOffline,
  language,
  setLanguage,
  onOpenAdUnits,
  onOpenFeedModal,
  onOpenInstallModal,
  fontSize,
  setFontSize,
  mealsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white shadow-md border-b-4 border-amber-300">
      {/* Top micro bar for offline & feeding emergency announcement */}
      <div className="bg-amber-800/80 px-3 py-1 text-xs flex flex-wrap items-center justify-between text-amber-100 gap-2 border-b border-amber-700/50">
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 uppercase tracking-wide">
            APK Mission
          </span>
          <span className="truncate">
            &ldquo;EDUCATION IS THE KEY FOR CHANGE!&rdquo; 🇵🇭 Free for all pupils &amp; college youth
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
              isOffline
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-emerald-600/80 text-emerald-100 hover:bg-emerald-600'
            }`}
            title="Toggle offline test mode"
          >
            {isOffline ? <WifiOff size={12} /> : <Wifi size={12} />}
            {isOffline ? 'Offline Mode Active' : 'Online'}
          </button>

          <button
            onClick={onOpenInstallModal}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded transition cursor-pointer font-semibold"
          >
            <Download size={12} /> Install APK
          </button>
        </div>
      </div>

      {/* Main header body */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={onOpenInstallModal}>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white p-0.5 transform transition group-hover:scale-105">
              <img
                src={SIR_LAX_AVATAR}
                alt="Chat Sir Lax Avatar"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-amber-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-amber-900 shadow">
              APK
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm font-['Fredoka',sans-serif]">
                Chat Sir Lax
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] bg-amber-400/30 text-amber-100 px-2 py-0.5 rounded-full border border-amber-200/40">
                <ShieldCheck size={12} /> Verified Teacher Bot
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-100 font-medium line-clamp-1">
              Easy English &bull; Homework &bull; DIY Projects &bull; Voice Assistant
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Font Size Accessibility Toggler */}
          <div className="hidden lg:flex items-center bg-amber-700/60 rounded-xl p-0.5 border border-amber-500/50 text-xs">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded-lg transition font-semibold ${
                fontSize === 'normal' ? 'bg-white text-amber-900 shadow' : 'text-amber-100 hover:text-white'
              }`}
              title="Normal Text"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded-lg transition font-bold text-sm ${
                fontSize === 'large' ? 'bg-white text-amber-900 shadow' : 'text-amber-100 hover:text-white'
              }`}
              title="Large Text for Easy Reading"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('huge')}
              className={`px-2 py-1 rounded-lg transition font-extrabold text-base ${
                fontSize === 'huge' ? 'bg-white text-amber-900 shadow' : 'text-amber-100 hover:text-white'
              }`}
              title="Extra Large Text for Kids"
            >
              A++
            </button>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageMode)}
            className="bg-amber-700/90 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-xl px-2.5 py-1.5 border border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-sm cursor-pointer"
          >
            <option value="simple-english">🌟 Simple English</option>
            <option value="filipino">🇵🇭 Tagalog / Filipino</option>
            <option value="bilingual">📖 Bilingual (EN + TL)</option>
          </select>

          {/* Quick Sponsor Meal button */}
          <button
            onClick={onOpenFeedModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl shadow-md transition transform hover:scale-105 cursor-pointer border border-rose-300"
          >
            <HeartHandshake size={15} className="text-yellow-200 animate-pulse" />
            <span className="hidden sm:inline">Feed Students</span>
            <span className="bg-black/25 px-1.5 py-0.5 rounded-full text-[11px]">
              {mealsCount.toLocaleString()}
            </span>
          </button>

          {/* Secret Key & Ad Units Config button */}
          <button
            onClick={onOpenAdUnits}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-amber-900/60 hover:bg-amber-900 text-amber-100 hover:text-white rounded-xl border border-amber-600 transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Secret Ad Units & Monetization Setup"
          >
            <Sparkles size={14} className="text-yellow-300" />
            <span className="hidden xl:inline">Ad Units Key</span>
          </button>
        </div>
      </div>
    </header>
  );
};
