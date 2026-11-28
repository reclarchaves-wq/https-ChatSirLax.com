import React, { useState, useEffect } from 'react';
import { SIR_LAX_AVATAR } from '../data/mockData';
import confetti from 'canvas-confetti';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Download,
  Check,
  Smartphone,
  WifiOff,
  Volume2,
  X,
  Share2,
  Copy,
  Laptop,
  CheckCircle2,
  Code2,
  ExternalLink,
  Terminal,
} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'apk-build' | 'ios' | 'pc'>(() =>
    isIOS ? 'ios' : 'android'
  );
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    }
  }, [isIOS]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#10b981', '#3b82f6'],
          });
        } catch (_) {}
      }
    } else {
      setActiveTab(isIOS ? 'ios' : 'android');
    }
  };

  const copyShareLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow bg-white shrink-0">
              <img src={SIR_LAX_AVATAR} alt="Chat Sir Lax Icon" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-black text-lg font-['Fredoka',sans-serif]">Install &amp; Build Chat Sir Lax APK</h3>
              <p className="text-xs text-amber-100">Capacitor Android Project &bull; PWA Instant App &bull; Free</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Main 1-Click Install CTA */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-center space-y-2">
            <h4 className="font-black text-base text-stone-900 font-['Fredoka',sans-serif]">
              Instant Install on Your Phone (No Play Store Wait)
            </h4>
            <p className="text-xs text-stone-600">
              Install directly on Android Chrome or build the native <code>.apk</code> from the included Capacitor Android project.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1 justify-center">
              {!isInstalled && (
                <button
                  onClick={handleNativeInstall}
                  className="w-full sm:w-auto flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black rounded-xl text-xs sm:text-sm transition transform hover:scale-102 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Smartphone size={17} />
                  <span>
                    {isInstallable
                      ? 'Tap to Install App'
                      : isIOS
                      ? 'How to Install on iPhone'
                      : 'How to Install on Android'}
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('apk-build')}
                className="py-3 px-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={15} className="text-amber-400" />
                <span>Build .APK File</span>
              </button>

              <button
                onClick={copyShareLink}
                className="py-3 px-3 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Copy app link to send to students or family"
              >
                {isCopied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                <span>{isCopied ? 'Copied!' : 'Link'}</span>
              </button>
            </div>

            {(installSuccess || isInstalled) && (
              <div className="text-xs font-bold text-emerald-800 bg-emerald-100 p-2 rounded-xl flex items-center justify-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>
                  {installSuccess
                    ? 'App successfully installed to your home screen!'
                    : 'Running in installed standalone app mode!'}
                </span>
              </div>
            )}
          </div>

          {/* Device & APK Build Tabs */}
          <div>
            <div className="grid grid-cols-4 gap-1 border-b border-stone-200 pb-2">
              <button
                onClick={() => setActiveTab('android')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Smartphone size={13} />
                <span>Android</span>
              </button>

              <button
                onClick={() => setActiveTab('apk-build')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'apk-build'
                    ? 'bg-amber-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Code2 size={13} />
                <span>APK Build</span>
              </button>

              <button
                onClick={() => setActiveTab('ios')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Share2 size={13} />
                <span>iPhone</span>
              </button>

              <button
                onClick={() => setActiveTab('pc')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'pc'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Laptop size={13} />
                <span>Laptop</span>
              </button>
            </div>

            {/* Instruction Steps */}
            <div className="mt-3 bg-stone-50 rounded-2xl p-3.5 border border-stone-200 text-xs text-stone-700 space-y-2.5">
              {activeTab === 'android' && (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <span>Open this page in <strong>Google Chrome</strong> on your Android phone.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <span>Tap the <strong>three dots (⋮)</strong> at the top right corner of Chrome.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <span>Select <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                    <span>The <strong>Chat Sir Lax</strong> icon will appear on your phone screen and work offline!</span>
                  </div>
                </>
              )}

              {activeTab === 'apk-build' && (
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1.5">
                    <div className="font-black text-stone-900 flex items-center gap-1.5">
                      <Terminal size={14} className="text-amber-600" />
                      <span>Option A: Free Store .AAB &amp; Student .APK (GitHub Actions)</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Push to GitHub <code>main</code> and open the <strong>Actions</strong> tab to download both <strong>ChatSirLax-Android-APK</strong> (for direct student sideloading, Amazon Appstore, and Samsung Galaxy Store) and <strong>ChatSirLax-PlayStore-AAB</strong> (for Google Play Console). Add signing secrets for store-signed release builds.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1.5">
                    <div className="font-black text-stone-900">Option B: Build Signed .APK / .AAB in Android Studio</div>
                    <pre className="bg-stone-900 text-amber-300 p-2 rounded-lg text-[10px] font-mono overflow-x-auto">
{`npm run build:android
cd android && ./gradlew assembleDebug bundleRelease`}
                    </pre>
                    <p className="text-[11px] text-stone-500">
                      Outputs: <code>app-debug.apk</code> (direct install) &amp; <code>app-release.aab</code> (Google Play).
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-sky-200 space-y-1.5">
                    <div className="font-black text-stone-900 flex items-center justify-between">
                      <span>Option C: Published App URL + PWABuilder</span>
                      <ExternalLink size={12} className="text-sky-600" />
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Paste <strong>{typeof window !== 'undefined' ? window.location.origin : 'your published app URL'}</strong> into <strong>pwabuilder.com</strong> and click <strong>Package for Stores &rarr; Android</strong>. Set your store Privacy Policy to <code>{typeof window !== 'undefined' ? `${window.location.origin}/?doc=privacy` : '/?doc=privacy'}</code>.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'ios' && (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <span>Open this website in <strong>Safari</strong> on your iPhone or iPad.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <span>Tap the <strong>Share button (square with arrow pointing up ⬆)</strong> at the bottom bar.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <span>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                    <span>Tap <strong>&ldquo;Add&rdquo;</strong> in the top right. Done!</span>
                  </div>
                </>
              )}

              {activeTab === 'pc' && (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <span>Open in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <span>Look at the right side of the address bar at the top (near the bookmark star).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <span>Click the <strong>Install icon (computer screen with a down arrow)</strong>.</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Feature Highlights for Poor Families & Low-End Phones */}
          <div className="space-y-2 text-xs text-stone-700">
            <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <Smartphone size={16} className="text-amber-600 shrink-0" />
              <span><strong>Ultra Lightweight:</strong> Runs smoothly even on budget Android phones with only 1GB RAM.</span>
            </div>

            <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <WifiOff size={16} className="text-sky-600 shrink-0" />
              <span><strong>Offline Study Engine:</strong> Download study modules once, then study at home without mobile data.</span>
            </div>

            <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <Volume2 size={16} className="text-rose-600 shrink-0" />
              <span><strong>Hands-Free Voice:</strong> Grade 1 pupils can speak homework questions directly into the microphone.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs shrink-0">
          <span className="font-bold text-stone-600">
            &ldquo;EDUCATION IS THE KEY FOR CHANGE!&rdquo; 🇵🇭
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
