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
import { RewardedAdModal } from './components/RewardedAdModal';
import { InstallModal } from './components/InstallModal';
import { BottomBannerAd } from './components/BottomBannerAd';
import { Footer } from './components/Footer';
import { INITIAL_COMMUNITY_STATS, INITIAL_OFFLINE_PACKS } from './data/mockData';
import { CommunityStats, LanguageMode, OfflineStudyPack } from './types';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('chat');
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

  // Modals
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isRewardedAdModalOpen, setIsRewardedAdModalOpen] = useState(false);

  // Sync online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch live stats from server if online
  useEffect(() => {
    if (!isOffline) {
      fetch('/api/impact')
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

    if (!isOffline) {
      fetch('/api/support-meal', {
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

    if (!isOffline) {
      fetch('/api/support-meal', {
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
        mealsCount={stats.mealsServed}
      />

      {/* Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        downloadedCount={downloadedCount}
      />

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

        {activeTab === 'offline-packs' && (
          <OfflinePacksTab
            packs={packs}
            onToggleDownload={handleToggleDownloadPack}
            fontSize={fontSize}
          />
        )}

        {activeTab === 'feeding' && (
          <FeedingTab
            stats={stats}
            onSponsorMeal={handleSponsorMeal}
            onWatchAdToFeed={() => setIsRewardedAdModalOpen(true)}
          />
        )}

        {activeTab === 'media' && <MediaGalleryTab />}

        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={stats}
            onOpenFeedModal={() => setActiveTab('feeding')}
            onWatchAdToFeed={() => setIsRewardedAdModalOpen(true)}
          />
        )}

        {activeTab === 'monetization' && (
          <AdUnitsTab
            stats={stats}
            onWatchAdToFeed={() => setIsRewardedAdModalOpen(true)}
          />
        )}
      </main>

      {/* Non-intrusive Bottom Banner Ad Simulation */}
      <BottomBannerAd onWatchAd={() => setIsRewardedAdModalOpen(true)} />

      {/* Footer */}
      <Footer
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenFeedModal={() => setActiveTab('feeding')}
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
    </div>
  );
}
