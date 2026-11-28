import React, { useEffect, useState } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import {
  clearStudentMessages,
  saveStudentProfile,
} from '../services/studentProfileService';
import {
  EducationCourseTrack,
  GradeLevel,
  LanguageMode,
  StudentProfile,
} from '../types';
import { SIR_LAX_AVATAR } from '../data/mockData';
import {
  BookMarked,
  CheckCircle2,
  GraduationCap,
  LogIn,
  LogOut,
  MessageSquareText,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react';

interface RegisterTabProps {
  authUser: User | null;
  authLoading: boolean;
  studentProfile: StudentProfile | null;
  currentLanguage: LanguageMode;
  savedMessagesCount: number;
  onProfileSaved?: (preferredLanguage: LanguageMode) => void;
  onOpenChat: () => void;
}

export const RegisterTab: React.FC<RegisterTabProps> = ({
  authUser,
  authLoading,
  studentProfile,
  currentLanguage,
  savedMessagesCount,
  onProfileSaved,
  onOpenChat,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('grade-1');
  const [courseTrack, setCourseTrack] = useState<EducationCourseTrack>('all-subjects');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageMode>(currentLanguage);
  const [schoolName, setSchoolName] = useState('');
  const [learningGoal, setLearningGoal] = useState('');

  const [signingIn, setSigningIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (studentProfile) {
      setDisplayName(studentProfile.displayName || authUser?.displayName || '');
      setGradeLevel(studentProfile.gradeLevel || 'grade-1');
      setCourseTrack(studentProfile.courseTrack || 'all-subjects');
      setPreferredLanguage(studentProfile.preferredLanguage || currentLanguage);
      setSchoolName(studentProfile.schoolName || '');
      setLearningGoal(studentProfile.learningGoal || '');
    } else if (authUser) {
      setDisplayName((prev) => prev || authUser.displayName || '');
      setPreferredLanguage((prev) => prev || currentLanguage);
    }
  }, [studentProfile, authUser, currentLanguage]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setStatusMessage(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setStatusMessage({
          type: 'error',
          text: 'Google sign-in popup was closed. Tap the button again whenever you are ready.',
        });
      } else if (code === 'auth/popup-blocked') {
        setStatusMessage({
          type: 'error',
          text: 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.',
        });
      } else if (code === 'auth/unauthorized-domain') {
        setStatusMessage({
          type: 'error',
          text: `This domain (${window.location.hostname}) needs to be added under Firebase Console → Authentication → Settings → Authorized domains.`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: err?.message || 'Unable to sign in with Google right now. Please try again.',
        });
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setStatusMessage(null);
    setConfirmClear(false);
    try {
      await signOut(auth);
      setStatusMessage({
        type: 'success',
        text: 'Signed out safely. Your saved student profile and chat memory stay ready for when you return.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Unable to sign out right now.',
      });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setSaving(true);
    setStatusMessage(null);

    try {
      await saveStudentProfile(authUser, {
        displayName,
        gradeLevel,
        courseTrack,
        preferredLanguage,
        schoolName,
        learningGoal,
      });
      if (onProfileSaved) {
        onProfileSaved(preferredLanguage);
      }
      setStatusMessage({
        type: 'success',
        text: `Saved! Sir Lax will now remember "${displayName.trim()}" and your study preferences every time you chat.`,
      });
    } catch (err: any) {
      let friendly = err?.message || 'Could not save your student registration. Please try again.';
      if (typeof friendly === 'string' && friendly.startsWith('{')) {
        try {
          const parsed = JSON.parse(friendly);
          if (parsed?.error) friendly = parsed.error;
        } catch {
          // keep original
        }
      }
      setStatusMessage({ type: 'error', text: friendly });
    } finally {
      setSaving(false);
    }
  };

  const handleClearSavedHistory = async () => {
    if (!authUser) return;
    setClearing(true);
    setStatusMessage(null);
    try {
      await clearStudentMessages(authUser.uid);
      setConfirmClear(false);
      setStatusMessage({
        type: 'success',
        text: 'Saved chat history cleared. Your student registration profile is still remembered.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Unable to clear chat history right now.',
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-3 space-y-4">
      {/* Intro Hero */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white rounded-2xl p-5 sm:p-6 shadow-md border-2 border-amber-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow bg-white shrink-0">
            <img src={SIR_LAX_AVATAR} alt="Sir Lax" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 bg-white/20 text-amber-50 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1.5">
              <Sparkles size={12} /> Student Memory &amp; Registration
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-['Fredoka',sans-serif]">
              {studentProfile
                ? `Welcome back, ${studentProfile.displayName}!`
                : 'Register so Sir Lax Remembers You'}
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 mt-1">
              Save your name, grade level, course track, school, and learning goal—plus keep your
              chat history remembered across sessions and devices.
            </p>
          </div>
        </div>
      </div>

      {/* Status notification */}
      {statusMessage && (
        <div
          className={`rounded-2xl p-3.5 text-xs sm:text-sm font-semibold border flex items-start justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-start gap-2">
            <CheckCircle2
              size={18}
              className={
                statusMessage.type === 'success'
                  ? 'text-emerald-600 shrink-0 mt-0.5'
                  : 'text-rose-600 shrink-0 mt-0.5'
              }
            />
            <span>{statusMessage.text}</span>
          </div>
          {statusMessage.type === 'success' && authUser && (
            <button
              type="button"
              onClick={onOpenChat}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <MessageSquareText size={14} /> Open Chat
            </button>
          )}
        </div>
      )}

      {/* Auth Loading */}
      {authLoading ? (
        <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center text-sm font-semibold text-stone-600 shadow-xs">
          Checking your student memory account...
        </div>
      ) : !authUser ? (
        /* Sign In Card */
        <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5">
              <UserCheck size={20} className="text-amber-700 mb-1.5" />
              <h3 className="text-sm font-bold text-stone-900">Remembers Your Name</h3>
              <p className="text-xs text-stone-600 mt-1">
                Sir Lax greets you personally and remembers your school and study target.
              </p>
            </div>
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5">
              <GraduationCap size={20} className="text-emerald-700 mb-1.5" />
              <h3 className="text-sm font-bold text-stone-900">Auto Grade &amp; Course</h3>
              <p className="text-xs text-stone-600 mt-1">
                Automatically selects your Elementary, High School, or College track every visit.
              </p>
            </div>
            <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3.5">
              <BookMarked size={20} className="text-sky-700 mb-1.5" />
              <h3 className="text-sm font-bold text-stone-900">Saved Chat Memory</h3>
              <p className="text-xs text-stone-600 mt-1">
                Your past questions and Sir Lax explanations stay saved privately in your account.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="inline-flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-black text-sm sm:text-base px-6 py-3 rounded-2xl shadow-md transition transform hover:scale-[1.02] cursor-pointer"
            >
              <LogIn size={19} />
              <span>
                {signingIn ? 'Opening Google Sign-In...' : 'Sign in with Google to Register'}
              </span>
            </button>
            <p className="text-[11px] text-stone-500 mt-2.5 flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" />
              Private &amp; free — only you and Sir Lax can see your study profile and chat memory.
            </p>
          </div>
        </div>
      ) : (
        /* Signed-in Registration Form */
        <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 sm:p-6 shadow-sm space-y-5">
          {/* Account Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-100">
            <div className="flex items-center gap-3">
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt={displayName || 'Student'}
                  className="w-11 h-11 rounded-full border-2 border-amber-300 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center border-2 border-amber-300">
                  {(displayName || authUser.email || 'S')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900">
                    {studentProfile?.displayName || authUser.displayName || 'New Student'}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <ShieldCheck size={11} /> Verified Account
                  </span>
                </div>
                <p className="text-xs text-stone-500">{authUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-xl">
                {savedMessagesCount} Saved Chat{savedMessagesCount === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-rose-700 bg-stone-100 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-stone-200 transition cursor-pointer"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Your Name or Nickname *
                </label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Juan, Maria, Ate Ana, Kuya Mark"
                  className="w-full bg-stone-50 focus:bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Sir Lax will remember and greet you using this name.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value as LanguageMode)}
                  className="w-full bg-stone-50 focus:bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="simple-english">🌟 Simple English</option>
                  <option value="filipino">🇵🇭 Tagalog / Filipino</option>
                  <option value="bilingual">📖 Bilingual (EN + TL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Grade or College Level
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                  className="w-full bg-stone-50 focus:bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="grade-1">Elementary (Grade 1–3)</option>
                  <option value="grade-4">Elementary (Grade 4–6)</option>
                  <option value="junior-high">Junior High School (Grades 7–10)</option>
                  <option value="senior-high">Senior High School (Grades 11–12)</option>
                  <option value="college">College / University (All Courses)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Subject or Course Track
                </label>
                <select
                  value={courseTrack}
                  onChange={(e) => setCourseTrack(e.target.value as EducationCourseTrack)}
                  className="w-full bg-stone-50 focus:bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="all-subjects">All Subjects &amp; Courses</option>
                  <option value="elementary-core">Elementary Core (Grades 1–6)</option>
                  <option value="junior-high-core">Junior High Core (Grades 7–10)</option>
                  <option value="senior-high-strands">Senior High (STEM / ABM / HUMSS / TVL)</option>
                  <option value="stem-engineering">College STEM / Engineering / Math</option>
                  <option value="it-computer-science">College IT &amp; Computer Science</option>
                  <option value="nursing-health">College Nursing &amp; Health Sciences</option>
                  <option value="business-accountancy">College Accountancy &amp; Business</option>
                  <option value="education-let">College Education &amp; Board Prep</option>
                  <option value="law-humanities">College Law, Humanities &amp; Social Sci</option>
                  <option value="thesis-research">Research &amp; Thesis Writing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  School or University (Optional)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Barangay High School or State University"
                  className="w-full bg-stone-50 focus:bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Study Goal or Dream Course (Optional)
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  placeholder="e.g. Pass Algebra, LET Board Exam, or Nursing NLE"
                  className="w-full bg-stone-50 focus:bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={saving || !displayName.trim()}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-sm px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving Memory...' : 'Save Student Memory'}</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenChat}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <MessageSquareText size={16} />
                  <span>Chat with Sir Lax</span>
                </button>
              </div>

              {savedMessagesCount > 0 && (
                <div>
                  {confirmClear ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-rose-700">Delete saved messages?</span>
                      <button
                        type="button"
                        onClick={handleClearSavedHistory}
                        disabled={clearing}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        {clearing ? 'Clearing...' : 'Yes, Clear'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 size={14} /> Clear Saved Chat History
                    </button>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
