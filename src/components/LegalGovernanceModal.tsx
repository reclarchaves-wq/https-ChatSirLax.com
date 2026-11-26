import React, { useState, useEffect } from 'react';
import { OFFICIAL_OWNER } from '../config/ownerConfig';
import {
  ShieldCheck,
  UserCheck,
  Mail,
  Scale,
  FileText,
  Lock,
  HeartHandshake,
  X,
  CheckCircle2,
  Building2,
} from 'lucide-react';

export type GovernanceDocTab = 'owner' | 'privacy' | 'donations' | 'terms';

interface LegalGovernanceModalProps {
  isOpen: boolean;
  initialTab?: GovernanceDocTab;
  onClose: () => void;
}

export const LegalGovernanceModal: React.FC<LegalGovernanceModalProps> = ({
  isOpen,
  initialTab = 'owner',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<GovernanceDocTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-900 via-amber-900 to-stone-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shadow shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg font-['Fredoka',sans-serif]">
                Official Ownership, Privacy &amp; Fund Governance
              </h3>
              <p className="text-xs text-amber-200">
                Rightful Owner: <strong>{OFFICIAL_OWNER.fullName}</strong> &bull; {OFFICIAL_OWNER.country}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition shrink-0"
            aria-label="Close legal governance modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-stone-100 p-2 border-b border-stone-200 shrink-0">
          <button
            onClick={() => setActiveTab('owner')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'owner'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-white'
            }`}
          >
            <UserCheck size={14} />
            <span>Official Owner</span>
          </button>

          <button
            onClick={() => setActiveTab('donations')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'donations'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:bg-white'
            }`}
          >
            <HeartHandshake size={14} />
            <span>Donations</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-white'
            }`}
          >
            <Lock size={14} />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-white'
            }`}
          >
            <FileText size={14} />
            <span>Terms</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
          {activeTab === 'owner' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-950 font-black text-base font-['Fredoka',sans-serif]">
                  <UserCheck size={18} className="text-amber-700" />
                  <span>Rightful Owner &amp; Operator Declaration</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700">
                  <strong>{OFFICIAL_OWNER.appName}</strong> (Android Package ID:{' '}
                  <code>{OFFICIAL_OWNER.packageId}</code>) is created, owned, and governed by:
                </p>
                <div className="bg-white rounded-xl p-3 border border-amber-200 space-y-1 text-xs">
                  <div>
                    <strong className="text-stone-900">Official Owner:</strong> {OFFICIAL_OWNER.fullName}
                  </div>
                  <div>
                    <strong className="text-stone-900">Designation:</strong> {OFFICIAL_OWNER.role}
                  </div>
                  <div>
                    <strong className="text-stone-900">Official Contact:</strong>{' '}
                    <a
                      href={`mailto:${OFFICIAL_OWNER.email}?subject=Chat%20Sir%20Lax%20-%20Official%20Inquiry`}
                      className="text-amber-700 font-bold underline"
                    >
                      {OFFICIAL_OWNER.email}
                    </a>
                  </div>
                  <div>
                    <strong className="text-stone-900">Jurisdiction:</strong> {OFFICIAL_OWNER.country}
                  </div>
                  <div>
                    <strong className="text-stone-900">Effective Date:</strong> {OFFICIAL_OWNER.effectiveDate}
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-black text-stone-900 flex items-center gap-1.5">
                  <Building2 size={16} className="text-amber-600" />
                  Intellectual Property &amp; Brand Stewardship
                </h4>
                <p className="text-xs text-stone-600">
                  All rights, brand stewardship, educational curriculum, outreach coordination, and official APK / Play
                  Store publishing rights belong exclusively to <strong>{OFFICIAL_OWNER.fullName}</strong>. No external
                  party, reseller, or unverified third party is authorized to collect donations or charge fees for Chat
                  Sir Lax without written authorization from {OFFICIAL_OWNER.fullName}.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'donations' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-black text-rose-950 flex items-center gap-1.5">
                  <Scale size={16} className="text-rose-600" />
                  Conflict-of-Interest &amp; Segregated Funds Policy
                </h4>
                <p className="text-xs text-stone-700">{OFFICIAL_OWNER.policies.conflictOfInterest}</p>
                <p className="text-xs text-stone-600 font-semibold">
                  {OFFICIAL_OWNER.fundAllocation.ownerAdminCapNote}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-black text-stone-900 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  How Donations &amp; Student Aid Are Controlled
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-700">
                  <li>
                    <strong>Verified Channel Only:</strong> Sponsorships and partner support are coordinated directly
                    with the rightful owner (
                    <a
                      href={`mailto:${OFFICIAL_OWNER.email}?subject=Chat%20Sir%20Lax%20-%20Meal%20Sponsorship`}
                      className="text-amber-800 font-bold underline"
                    >
                      {OFFICIAL_OWNER.email}
                    </a>
                    ) or an authorized, segregated community feeding account under {OFFICIAL_OWNER.fullName}.
                  </li>
                  <li>
                    <strong>Fixed Allocation Pledge:</strong> {OFFICIAL_OWNER.fundAllocation.freshFoodPercent}% for fresh
                    hot meals, {OFFICIAL_OWNER.fundAllocation.collegePantryPercent}% for college youth emergency pantries,
                    and {OFFICIAL_OWNER.fundAllocation.schoolSuppliesPercent}% for free school supplies &amp; DIY kits.
                  </li>
                  <li>
                    <strong>Student Verification:</strong> Meal assistance requests are reviewed confidentially with local
                    schools, barangays, or verified community coordinators before voucher fulfillment.
                  </li>
                </ul>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-xs text-stone-600">
                <strong>Transparency Notice:</strong> {OFFICIAL_OWNER.policies.verificationNotice}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3 text-xs text-stone-700">
              <h4 className="font-black text-base text-stone-900 font-['Fredoka',sans-serif]">
                Privacy Policy — {OFFICIAL_OWNER.appName}
              </h4>
              <p className="text-stone-500">
                Owner &amp; Data Controller: <strong>{OFFICIAL_OWNER.fullName}</strong> ({OFFICIAL_OWNER.email}) &bull;
                Updated {OFFICIAL_OWNER.effectiveDate}
              </p>

              <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <p>
                  <strong>1. Student &amp; Child Safety First:</strong> Chat Sir Lax is built for Grade 1–6 pupils and
                  college youth. We do not require account sign-ups or sell student personal data to third parties.
                </p>
                <p>
                  <strong>2. Local Storage &amp; Offline Mode:</strong> Homework chat history, Daily Study Streaks,
                  badges, downloaded study packs, and accessibility settings are stored locally on your own device so the
                  app works offline with zero mobile data.
                </p>
                <p>
                  <strong>3. Voice &amp; AI Questions:</strong> When online, typed or spoken homework questions are sent
                  to our server solely to generate a simple educational explanation. Voice recognition runs via your
                  device browser speech engine and audio recordings are not permanently stored.
                </p>
                <p>
                  <strong>4. Meal Assistance Requests:</strong> Any details voluntarily entered into the confidential food
                  assistance form are used solely to coordinate student meal support. Parents or students may request
                  deletion or help anytime at{' '}
                  <a
                    href={`mailto:${OFFICIAL_OWNER.email}?subject=Chat%20Sir%20Lax%20-%20Privacy%20Request`}
                    className="text-amber-700 font-bold underline"
                  >
                    {OFFICIAL_OWNER.email}
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3 text-xs text-stone-700">
              <h4 className="font-black text-base text-stone-900 font-['Fredoka',sans-serif]">
                Terms of Use &amp; Educational Stewardship
              </h4>
              <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <p>
                  <strong>1. Free Educational Access:</strong> Core tutoring, voice assistance, DIY guides, and offline
                  study modules are provided free of charge by <strong>{OFFICIAL_OWNER.fullName}</strong> to empower
                  underprivileged learners.
                </p>
                <p>
                  <strong>2. Responsible AI Guidance:</strong> Explanations are designed for learning and study support.
                  Parents and teachers are encouraged to supervise young pupils, especially during hands-on DIY school
                  crafts.
                </p>
                <p>
                  <strong>3. Authorized Outreach &amp; Monetization:</strong> Only the rightful owner (
                  {OFFICIAL_OWNER.fullName}) may configure official sponsor keys, ad units, or external payment
                  channels for verified community feeding drives.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <a
            href={`mailto:${OFFICIAL_OWNER.email}?subject=Chat%20Sir%20Lax%20-%20Message%20for%20Reclar%20D.%20Chaves`}
            className="inline-flex items-center gap-1.5 text-amber-800 hover:text-amber-900 font-bold"
          >
            <Mail size={14} />
            <span>Contact {OFFICIAL_OWNER.fullName}</span>
          </a>

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
