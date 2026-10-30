import React, { useState } from 'react';
import { Sparkles, X, ChevronUp, ChevronDown, UtensilsCrossed } from 'lucide-react';

interface BottomBannerAdProps {
  onWatchAd: () => void;
}

export const BottomBannerAd: React.FC<BottomBannerAdProps> = ({ onWatchAd }) => {
  const [minimized, setMinimized] = useState(false);
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none flex justify-center px-2 pb-2">
      <div className="pointer-events-auto bg-stone-900/95 backdrop-blur-md text-white border-t sm:border border-amber-400/50 rounded-2xl shadow-xl max-w-2xl w-full p-2.5 sm:px-4 flex items-center justify-between gap-3">
        {!minimized ? (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
              <div className="truncate">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-300">
                  <span>COMMUNITY SPONSOR AD UNIT</span>
                  <span className="text-[9px] bg-stone-800 px-1.5 py-0.2 rounded font-mono text-stone-400">
                    ca-app-pub-banner
                  </span>
                </div>
                <p className="text-xs text-stone-200 truncate">
                  100% of ad revenue provides hot chicken arroz caldo for hungry students.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onWatchAd}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <UtensilsCrossed size={12} />
                <span className="hidden sm:inline">Feed Student</span>
              </button>

              <button
                onClick={() => setMinimized(true)}
                className="text-stone-400 hover:text-white p-1 cursor-pointer"
                title="Minimize banner"
              >
                <ChevronDown size={15} />
              </button>

              <button
                onClick={() => setClosed(true)}
                className="text-stone-400 hover:text-white p-1 cursor-pointer"
                title="Close ad"
              >
                <X size={15} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-xs">
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <Sparkles size={13} /> Sponsor Ad Active (Supports Feeding Program)
            </span>
            <button
              onClick={() => setMinimized(false)}
              className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-2 py-0.5 rounded cursor-pointer font-bold"
            >
              Expand
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
