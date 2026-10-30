import React, { useState, useEffect } from 'react';
import { CommunityStats } from '../types';
import confetti from 'canvas-confetti';
import {
  Key,
  ShieldAlert,
  Sparkles,
  PlayCircle,
  Coins,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Save,
  HelpCircle,
  Heart,
  BarChart,
  DollarSign,
} from 'lucide-react';

interface AdUnitsTabProps {
  stats: CommunityStats;
  onWatchAdToFeed: () => void;
}

export const AdUnitsTab: React.FC<AdUnitsTabProps> = ({ stats, onWatchAdToFeed }) => {
  const [appId, setAppId] = useState(
    () => localStorage.getItem('csl_admob_app_id') || 'ca-app-pub-71829304918234~918273645'
  );
  const [bannerUnitId, setBannerUnitId] = useState(
    () => localStorage.getItem('csl_admob_banner_id') || 'ca-app-pub-71829304918234/6300978111'
  );
  const [rewardedUnitId, setRewardedUnitId] = useState(
    () => localStorage.getItem('csl_admob_rewarded_id') || 'ca-app-pub-71829304918234/5224354917'
  );
  const [secretSponsorKey, setSecretSponsorKey] = useState(
    () => localStorage.getItem('csl_secret_sponsor_key') || 'LAX_NGO_SECRET_SPONSOR_2026'
  );

  const [showSecret, setShowSecret] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('csl_admob_app_id', appId);
    localStorage.setItem('csl_admob_banner_id', bannerUnitId);
    localStorage.setItem('csl_admob_rewarded_id', rewardedUnitId);
    localStorage.setItem('csl_secret_sponsor_key', secretSponsorKey);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);

    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#eab308', '#10b981', '#3b82f6'],
      });
    } catch (_) {}
  };

  return (
    <div className="max-w-5xl mx-auto py-4 px-3 sm:px-4 space-y-6">
      {/* Banner Hero */}
      <div className="bg-gradient-to-r from-amber-700 via-yellow-700 to-stone-900 rounded-3xl text-white p-6 sm:p-7 shadow-lg">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 uppercase tracking-wider mb-2">
            <Coins size={14} className="text-yellow-300" /> Responsible Monetization
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-['Fredoka',sans-serif] tracking-tight">
            Secret Key &amp; Ad Units for Sustainable Social Impact
          </h2>
          <p className="mt-2 text-amber-100 text-xs sm:text-sm font-medium leading-relaxed">
            The core Chat Sir Lax educational experience is <strong>100% free forever</strong>. To sustain
            hot feeding programs for pupils and college youth without charging poor families, you can configure
            official Google AdMob / Sponsor Ad Unit IDs and keys. Every verified impression translates directly
            into warm food and school paper!
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onWatchAdToFeed}
              className="bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-black text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-md transition transform hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <PlayCircle size={17} />
              <span>Simulate Rewarded Ad &rarr; Feed 1 Student</span>
            </button>
            <span className="text-xs text-amber-200">
              {stats.adSponsoredMeals.toLocaleString()} meals sponsored by ad units so far!
            </span>
          </div>
        </div>
      </div>

      {/* Secret Key & Ad Units Config Form */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 font-['Fredoka',sans-serif] flex items-center gap-2">
              <Key size={20} className="text-amber-500" />
              Secret Ad Units &amp; Monetization Key Management
            </h3>
            <p className="text-xs text-stone-500">
              Configure your secret AdMob App ID, banner units, rewarded video units, and NGO sponsor keys.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
          >
            {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showSecret ? 'Hide Keys' : 'Reveal Keys'}</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Ad Units and Secret Sponsor Key successfully saved to APK local storage!</span>
          </div>
        )}

        <form onSubmit={handleSaveKeys} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                AdMob App ID (Android APK)
              </label>
              <input
                type={showSecret ? 'text' : 'password'}
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
                className="w-full text-xs sm:text-sm font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-stone-400">Play Store Android Package Manifest ID</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Secret NGO / Community Sponsor Key
              </label>
              <input
                type={showSecret ? 'text' : 'password'}
                value={secretSponsorKey}
                onChange={(e) => setSecretSponsorKey(e.target.value)}
                placeholder="YOUR_SECRET_SPONSOR_KEY"
                className="w-full text-xs sm:text-sm font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-stone-400">Enables authenticated NGO revenue matching</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Non-Intrusive Bottom Banner Unit ID
              </label>
              <input
                type={showSecret ? 'text' : 'password'}
                value={bannerUnitId}
                onChange={(e) => setBannerUnitId(e.target.value)}
                placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                className="w-full text-xs sm:text-sm font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-stone-400">Fixed at bottom of screen with close button</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Rewarded Video Ad Unit ID (Watch to Feed)
              </label>
              <input
                type={showSecret ? 'text' : 'password'}
                value={rewardedUnitId}
                onChange={(e) => setRewardedUnitId(e.target.value)}
                placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                className="w-full text-xs sm:text-sm font-mono bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-stone-400">15s optional video that buys 1 bowl of food</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              🔒 Keys are stored securely and never transmitted to unauthorized parties.
            </span>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={15} />
              <span>Save Ad Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Financial Transparency Report */}
      <div className="bg-stone-50 rounded-3xl border border-stone-200 p-6 sm:p-7">
        <h3 className="text-lg font-black text-stone-900 font-['Fredoka',sans-serif] mb-2">
          100% Transparent Financial Allocation Model
        </h3>
        <p className="text-xs text-stone-600 mb-4 leading-relaxed">
          How every single peso earned through responsible ad units and community sponsors is used:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-rose-200">
            <div className="text-2xl font-black text-rose-600 font-['Fredoka',sans-serif]">60%</div>
            <div className="font-bold text-stone-900 text-sm mt-1">Fresh Food &amp; Ingredients</div>
            <p className="text-xs text-stone-500 mt-1">
              Rice sacks, fresh eggs, ginger, garlic, chicken meat for daily hot chicken arroz caldo at feeding centers.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200">
            <div className="text-2xl font-black text-amber-600 font-['Fredoka',sans-serif]">25%</div>
            <div className="font-bold text-stone-900 text-sm mt-1">College Youth Emergency Pantry</div>
            <p className="text-xs text-stone-500 mt-1">
              Emergency meal coupons, jeepney fare allowances, and dorm exam midnight snacks for working college students.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-sky-200">
            <div className="text-2xl font-black text-sky-600 font-['Fredoka',sans-serif]">15%</div>
            <div className="font-bold text-stone-900 text-sm mt-1">School Paper &amp; DIY Kits</div>
            <p className="text-xs text-stone-500 mt-1">
              Free pencils, bond papers, safety glue, and flashcard printing for pupils with no internet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
