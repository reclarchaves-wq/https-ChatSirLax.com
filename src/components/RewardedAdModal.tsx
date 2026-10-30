import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, UtensilsCrossed, CheckCircle2, X, Play } from 'lucide-react';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const [countdown, setCountdown] = useState(8);
  const [adFinished, setAdFinished] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(8);
      setAdFinished(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAdFinished(true);
          try {
            confetti({
              particleCount: 90,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f59e0b', '#10b981', '#ef4444', '#3b82f6'],
            });
          } catch (_) {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-stone-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-amber-400 text-white animate-in zoom-in-95 duration-200">
        {/* Top status */}
        <div className="bg-amber-600 px-4 py-2.5 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-yellow-200" />
            <span>Sponsor Ad: Feeding a Student in Progress</span>
          </div>
          {adFinished ? (
            <button
              onClick={() => {
                onCompleted();
                onClose();
              }}
              className="bg-white text-stone-900 px-2 py-0.5 rounded-full text-[11px] font-extrabold cursor-pointer hover:bg-amber-100"
            >
              Close &amp; Claim Meal &times;
            </button>
          ) : (
            <span className="bg-black/40 px-2 py-0.5 rounded text-[11px]">
              Reward in: {countdown}s
            </span>
          )}
        </div>

        {/* Video / Creative simulation */}
        <div className="p-6 text-center space-y-4">
          {!adFinished ? (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/30 animate-pulse">
                <UtensilsCrossed size={32} />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                  Community Sponsor Message
                </span>
                <h4 className="text-lg font-black mt-1 font-['Fredoka',sans-serif]">
                  Supporting Free Education &amp; Warm Meals for Children
                </h4>
                <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                  Thank you for taking a few seconds of your time! This sponsored ad unit directly funds
                  warm chicken soup and boiled eggs for early-grade kids and college youth.
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-stone-700">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${((8 - countdown) / 8) * 100}%` }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-400/40">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                  Mission Accomplished!
                </span>
                <h4 className="text-xl font-black mt-1 text-white font-['Fredoka',sans-serif]">
                  You Just Fed 1 Student! 🍲
                </h4>
                <p className="text-xs text-stone-300 mt-2">
                  1 warm bowl of arroz caldo and an egg has been credited to our community feeding hub counter.
                  Maraming salamat sa iyong kabutihan!
                </p>
              </div>

              <button
                onClick={() => {
                  onCompleted();
                  onClose();
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-stone-900 font-black rounded-2xl text-sm transition transform hover:scale-102 cursor-pointer shadow-md"
              >
                Claim &amp; Return to Chat Sir Lax
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
