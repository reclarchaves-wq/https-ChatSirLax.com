/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { ChatTab } from './components/ChatTab';
import { OfflinePacksTab } from './components/OfflinePacksTab';
import { FeedingTab } from './components/FeedingTab';
import { MediaGalleryTab } from './components/MediaGalleryTab';
import { DashboardTab } from './components/DashboardTab';
import { AdUnitsTab } from './components/AdUnitsTab';
import { Achievements } from './components/Achievements';
import { RewardedAdModal } from './components/RewardedAdModal';
import { InstallModal } from './components/InstallModal';
import { LegalGovernanceModal, GovernanceDocTab } from './components/LegalGovernanceModal';
import { BottomBannerAd } from './components/BottomBannerAd';
import { Footer } from './components/Footer';
import { INITIAL_COMMUNITY_STATS, INITIAL_OFFLINE_PACKS } from './data/mockData';
import { CommunityStats, LanguageMode, OfflineStudyPack, StudyStreakState, UserActivityStats } from './types';
import { getApiBaseUrl } from './services/chatService';
import { SpeechService } from './services/speechService';
import {
  createInitialStreakState,
  recordProblemSolvedToday,
  simulateNextConsecutiveDay,
  syncStreakOnOpen,
} from './utils/streakUtils';
import confetti from 'canvas-confetti';

const VALID_TABS: TabKey[] = [
  'chat',
  'offline-packs',
  'feeding',
  'media',
  'dashboard',
  'achievements',
  'monetization',
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab') as TabKey | null;
      if (tabParam && VALID_TABS.includes(tabParam)) {
        return tabParam;
      }
    }
    return 'chat';
  });
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [language, setLanguage] = useState<LanguageMode>('simple-english');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('normal');

  // Stats state
  const [stats, setStats] = useState<CommunityStats>(() => {
    const saved = localStorage.getItem('csl_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return INITIAL_COMMUNITY_STATS;
  });

  // Offline packs state
  const [packs, setPacks] = useState<OfflineStudyPack[]>(() => {
    const saved = localStorage.getItem('csl_packs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return INITIAL_OFFLINE_PACKS;
  });

  // User personal achievement stats
  const [userStats, setUserStats] = useState<UserActivityStats>(() => {
    const saved = localStorage.getItem('csl_user_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return {
      homeworksSolved: 7, // Seeded at 7 so the student can easily reach the 10 homeworks solved milestone!
      mealsSponsored: 12,
      packsDownloaded: 2,
      voiceListens: 4,
      diyProjectsViewed: 2,
    };
  });

  // Daily Study Streak state (persisted locally for offline & online)
  const [streakState, setStreakState] = useState<StudyStreakState>(() => {
    const saved = localStorage.getItem('csl_study_streak');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as StudyStreakState;
        const synced = syncStreakOnOpen(parsed);
        localStorage.setItem('csl_study_streak', JSON.stringify(synced));
        return synced;
      } catch (_) {}
    }
    const initial = createInitialStreakState();
    localStorage.setItem('csl_study_streak', JSON.stringify(initial));
    return initial;
  });

  const [streakCelebrationMessage, setStreakCelebrationMessage] = useState<string | null>(null);

  // Calculate unlocked badges count dynamically
  const unlockedBadgesCount = [
    userStats.homeworksSolved >= 1,
    userStats.homeworksSolved >= 5,
    userStats.homeworksSolved >= 10,
    userStats.homeworksSolved >= 25,
    userStats.mealsSponsored >= 1,
    userStats.mealsSponsored >= 10,
    userStats.mealsSponsored >= 50,
    userStats.mealsSponsored >= 100,
    userStats.packsDownloaded >= 1,
    userStats.packsDownloaded >= 3,
    userStats.voiceListens >= 3,
    userStats.diyProjectsViewed >= 1,
    streakState.longestStreak >= 3 || streakState.currentStreak >= 3,
    streakState.longestStreak >= 7 || streakState.currentStreak >= 7,
    streakState.longestStreak >= 14 || streakState.currentStreak >= 14,
  ].filter(Boolean).length;

  // Modals
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isRewardedAdModalOpen, setIsRewardedAdModalOpen] = useState(false);
  const [governanceTab, setGovernanceTab] = useState<GovernanceDocTab>(() => {
    if (typeof window !== 'undefined') {
      const docParam = new URLSearchParams(window.location.search).get('doc') as GovernanceDocTab | null;
      if (docParam && ['owner', 'privacy', 'donations', 'terms'].includes(docParam)) {
        return docParam;
      }
    }
    return 'owner';
  });
  const [isGovernanceModalOpen, setIsGovernanceModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const docParam = new URLSearchParams(window.location.search).get('doc');
      return !!docParam && ['owner', 'privacy', 'donations', 'terms'].includes(docParam);
    }
    return false;
  });

  const handleOpenGovernance = (tab: GovernanceDocTab) => {
    setGovernanceTab(tab);
    setIsGovernanceModalOpen(true);
  };

  // Sync online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleDaySync = () => {
      if (document.visibilityState === 'visible') {
        setStreakState((prev) => {
          const synced = syncStreakOnOpen(prev);
          if (
            synced.currentStreak !== prev.currentStreak ||
            synced.todaySolvedCount !== prev.todaySolvedCount ||
            synced.lastOpenedDate !== prev.lastOpenedDate
          ) {
            localStorage.setItem('csl_study_streak', JSON.stringify(synced));
            return synced;
          }
          return prev;
        });
      }
    };

    window.addEventListener('focus', handleDaySync);
    document.addEventListener('visibilitychange', handleDaySync);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleDaySync);
      document.removeEventListener('visibilitychange', handleDaySync);
    };
  }, []);

  // Fetch live stats from server if online
  useEffect(() => {
    if (!isOffline) {
      fetch(`${getApiBaseUrl()}/api/impact`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.stats) {
            setStats(data.stats);
            localStorage.setItem('csl_stats', JSON.stringify(data.stats));
          }
        })
        .catch((err) => console.log('Loaded local stats cache:', err));
    }
  }, [isOffline]);

  // Handle toggling pack download
  const handleToggleDownloadPack = (packId: string) => {
    setPacks((prev) => {
      const next = prev.map((p) => {
        if (p.id === packId) {
          const newState = !p.downloaded;
          if (newState) {
            try {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#0284c7', '#38bdf8', '#fbbf24'],
              });
            } catch (_) {}
          }
          return { ...p, downloaded: newState };
        }
        return p;
      });
      localStorage.setItem('csl_packs', JSON.stringify(next));
      return next;
    });

    setStats((prev) => {
      const updated = {
        ...prev,
        offlinePacksDownloaded: prev.offlinePacksDownloaded + 1,
      };
      localStorage.setItem('csl_stats', JSON.stringify(updated));
      return updated;
    });

    setUserStats((prev) => {
      const updated = {
        ...prev,
        packsDownloaded: prev.packsDownloaded + 1,
      };
      localStorage.setItem('csl_user_stats', JSON.stringify(updated));
      return updated;
    });
  };

  // Handle sponsoring meals
  const handleSponsorMeal = (count: number, donorName?: string) => {
    setStats((prev) => {
      const updated = {
        ...prev,
        mealsServed: prev.mealsServed + count,
      };
      localStorage.setItem('csl_stats', JSON.stringify(updated));
      return updated;
    });

    setUserStats((prev) => {
      const nextMeals = prev.mealsSponsored + count;
      const updated = {
        ...prev,
        mealsSponsored: nextMeals,
      };
      localStorage.setItem('csl_user_stats', JSON.stringify(updated));

      // Check for milestone: 100 Meals Sponsored!
      if (nextMeals >= 100 && prev.mealsSponsored < 100) {
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
          });
        } catch (_) {}
      }
      return updated;
    });

    if (!isOffline) {
      fetch(`${getApiBaseUrl()}/api/support-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'direct-sponsor', count, donorName }),
      }).catch((e) => console.log('Offline queue:', e));
    }
  };

  // Handle watching ad to feed
  const handleWatchAdReward = () => {
    setStats((prev) => {
      const updated = {
        ...prev,
        mealsServed: prev.mealsServed + 1,
        adSponsoredMeals: prev.adSponsoredMeals + 1,
      };
      localStorage.setItem('csl_stats', JSON.stringify(updated));
      return updated;
    });

    setUserStats((prev) => {
      const nextMeals = prev.mealsSponsored + 1;
      const updated = {
        ...prev,
        mealsSponsored: nextMeals,
      };
      localStorage.setItem('csl_user_stats', JSON.stringify(updated));

      if (nextMeals >= 100 && prev.mealsSponsored < 100) {
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
          });
        } catch (_) {}
      }
      return updated;
    });

    if (!isOffline) {
      fetch(`${getApiBaseUrl()}/api/support-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ad-watch', count: 1 }),
      }).catch((e) => console.log('Offline queue:', e));
    }
  };

  const handleSolveHomework = () => {
    setStats((prev) => {
      const updated = {
        ...prev,
        homeworkSolved: prev.homeworkSolved + 1,
      };
      localStorage.setItem('csl_stats', JSON.stringify(updated));
      return updated;
    });

    const nextHw = userStats.homeworksSolved + 1;
    setUserStats((prev) => {
      const updated = {
        ...prev,
        homeworksSolved: prev.homeworksSolved + 1,
      };
      localStorage.setItem('csl_user_stats', JSON.stringify(updated));
      return updated;
    });

    // Check for milestone: 10 Homeworks Solved!
    if (nextHw === 10) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'],
        });
      } catch (_) {}
    }

    // Update Daily Study Streak cleanly without side effects inside updater
    const { nextState, unlockedThreeDayBadge, streakIncremented } = recordProblemSolvedToday(streakState);
    localStorage.setItem('csl_study_streak', JSON.stringify(nextState));
    setStreakState(nextState);

    if (unlockedThreeDayBadge) {
      try {
        confetti({
          particleCount: 130,
          spread: 90,
          origin: { y: 0.55 },
          colors: ['#f97316', '#f59e0b', '#fbbf24', '#10b981'],
        });
      } catch (_) {}
      setStreakCelebrationMessage(
        '🔥 Badge Unlocked: 3-Day Study Streak Flame! You solved problems for 3 consecutive days!'
      );
      SpeechService.speak(
        'Mabuhay! Congratulations anak! You unlocked the 3-Day Study Streak Flame badge for studying three days in a row!'
      );
    } else if (streakIncremented) {
      setStreakCelebrationMessage(
        `🔥 Day ${nextState.currentStreak} Study Streak! Keep going to unlock your 3-Day Flame Badge!`
      );
    }
  };

  const handleSimulateNextDay = () => {
    setStats((prev) => {
      const updated = { ...prev, homeworkSolved: prev.homeworkSolved + 1 };
      localStorage.setItem('csl_stats', JSON.stringify(updated));
      return updated;
    });

    setUserStats((prev) => {
      const updated = { ...prev, homeworksSolved: prev.homeworksSolved + 1 };
      localStorage.setItem('csl_user_stats', JSON.stringify(updated));
      return updated;
    });

    const { nextState, unlockedThreeDayBadge } = simulateNextConsecutiveDay(streakState);
    localStorage.setItem('csl_study_streak', JSON.stringify(nextState));
    setStreakState(nextState);

    if (unlockedThreeDayBadge) {
      try {
        confetti({
          particleCount: 140,
          spread: 95,
          origin: { y: 0.5 },
          colors: ['#f97316', '#f59e0b', '#fbbf24', '#10b981', '#ef4444'],
        });
      } catch (_) {}
      setStreakCelebrationMessage(
        '🔥 Badge Unlocked: 3-Day Study Streak Flame! You studied for 3 consecutive days!'
      );
      SpeechService.speak(
        'Amazing job anak! You reached 3 consecutive days of studying and unlocked the 3-Day Study Streak Flame badge!'
      );
    } else {
      try {
        confetti({ particleCount: 45, spread: 55, origin: { y: 0.7 } });
      } catch (_) {}
      setStreakCelebrationMessage(`🔥 Day ${nextState.currentStreak} Streak Recorded!`);
    }
  };

  const downloadedCount = packs.filter((p) => p.downloaded).length;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* Header */}
      <Header
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        language={language}
        setLanguage={setLanguage}
        fontSize={fontSize}
        setFontSize={setFontSize}
        onOpenAdUnits={() => setActiveTab('monetization')}
        onOpenFeedModal={() => setActiveTab('feeding')}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenAchievements={() => setActiveTab('achievements')}
        unlockedBadgesCount={unlockedBadgesCount}
        currentStreak={streakState.currentStreak}
        solvedToday={streakState.todaySolvedCount > 0}
        mealsCount={stats.mealsServed}
      />

      {/* Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        downloadedCount={downloadedCount}
        unlockedBadgesCount={unlockedBadgesCount}
      />

      {/* Streak Celebration Banner */}
      {streakCelebrationMessage && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-sm">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
            <span>{streakCelebrationMessage}</span>
            <div className="flex items-center gap-2 shrink-0">
              {activeTab !== 'achievements' && (
                <button
                  onClick={() => setActiveTab('achievements')}
                  className="bg-white text-orange-900 px-2.5 py-1 rounded-lg text-xs font-black hover:bg-orange-50 transition cursor-pointer"
                >
                  View Badge
                </button>
              )}
              <button
                onClick={() => setStreakCelebrationMessage(null)}
                className="text-white/80 hover:text-white px-1.5 font-bold cursor-pointer"
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-2">
        {activeTab === 'chat' && (
          <ChatTab
            language={language}
            fontSize={fontSize}
            isForceOffline={isOffline}
            onSolveHomework={handleSolveHomework}
          />
        )}

        {activeTab === 'achievements' && (
          <Achievements
            userStats={userStats}
            communityStats={stats}
            streakState={streakState}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onSolveHomeworkQuick={handleSolveHomework}
            onSimulateNextDay={handleSimulateNextDay}
            onSponsorMealQuick={(count) => handleSponsorMeal(count)}
            onWatchAdQuick={() => setIsRewardedAdModalOpen(true)}
          />
        )}

        {activeTab === 'offline-packs' && (
          <OfflinePacksTab
            packs={packs}
            onToggleDownload={handleToggleDownloadPack}
            onSolveHomework={handleSolveHomework}
            fontSize={fontSize}
          />
        )}

        {activeTab === 'feeding' && (
          <FeedingTab
            stats={stats}
            onSponsorMeal={handleSponsorMeal}
            onWatchAdToFeed={() => setIsRewardedAdModalOpen(true)}
            onOpenGovernance={handleOpenGovernance}
          />
        )}

        {activeTab === 'media' && <MediaGalleryTab />}

        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={stats}
            onOpenFeedModal={() => setActiveTab('feeding')}
            onWatchAdToFeed={() => setIsRewardedAdModalOpen(true)}
            onNavigateToAchievements={() => setActiveTab('achievements')}
          />
        )}

        {activeTab === 'monetization' && (
          <AdUnitsTab
            stats={stats}
            onWatchAdToFeed={() => setIsRewardedAdModalOpen(true)}
            onOpenGovernance={handleOpenGovernance}
          />
        )}
      </main>

      {/* Non-intrusive Bottom Banner Ad Simulation */}
      <BottomBannerAd onWatchAd={() => setIsRewardedAdModalOpen(true)} />

      {/* Footer */}
      <Footer
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenFeedModal={() => setActiveTab('feeding')}
        onOpenGovernance={handleOpenGovernance}
      />

      {/* Modals */}
      <RewardedAdModal
        isOpen={isRewardedAdModalOpen}
        onClose={() => setIsRewardedAdModalOpen(false)}
        onCompleted={handleWatchAdReward}
      />

      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      <LegalGovernanceModal
        isOpen={isGovernanceModalOpen}
        initialTab={governanceTab}
        onClose={() => setIsGovernanceModalOpen(false)}
      />
    </div>
  );
}
