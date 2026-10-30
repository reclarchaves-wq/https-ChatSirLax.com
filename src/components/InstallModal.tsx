import React from 'react';
import { SIR_LAX_AVATAR } from '../data/mockData';
import { Download, Check, ShieldCheck, Smartphone, WifiOff, Volume2, X } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownloadApk = () => {
    // Generate simulated APK download file
    const element = document.createElement('a');
    const file = new Blob(
      [
        'Chat Sir Lax Android APK Package - Educational Access & Offline Knowledge Engine (Ver 2.4.0)'
      ],
      { type: 'application/vnd.android.package-archive' }
    );
    element.href = URL.createObjectURL(file);
    element.download = 'ChatSirLax_v2.4.apk';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-amber-500 to-yellow-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow bg-white">
              <img src={SIR_LAX_AVATAR} alt="Chat Sir Lax Icon" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-black text-lg font-['Fredoka',sans-serif]">Chat Sir Lax APK</h3>
              <p className="text-xs text-amber-100">Play Store &bull; Android v2.4.0 &bull; Free</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2 text-xs text-stone-700">
            <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <Smartphone size={16} className="text-amber-600 shrink-0" />
              <span><strong>Lightweight (4.8 MB):</strong> Runs smoothly even on budget Android phones with only 1GB RAM.</span>
            </div>

            <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <WifiOff size={16} className="text-sky-600 shrink-0" />
              <span><strong>100% Offline Compatible:</strong> Download study packs once, study forever without mobile data.</span>
            </div>

            <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <Volume2 size={16} className="text-rose-600 shrink-0" />
              <span><strong>Voice Assistant:</strong> Grade 1 kids who cannot write yet can speak their homework questions!</span>
            </div>

            <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span><strong>Zero Cost to Students:</strong> Supported responsibly through optional sponsor units.</span>
            </div>
          </div>

          <button
            onClick={handleDownloadApk}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-stone-900 font-black rounded-2xl text-sm transition transform hover:scale-102 flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Download size={18} />
            <span>Download Chat Sir Lax APK (4.8 MB)</span>
          </button>

          <p className="text-[11px] text-center text-stone-400">
            Also works as an instant Web Progressive App (PWA) in your browser!
          </p>
        </div>
      </div>
    </div>
  );
};
