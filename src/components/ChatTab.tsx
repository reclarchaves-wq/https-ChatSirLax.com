import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { SIR_LAX_AVATAR } from '../data/mockData';
import {
  ChatMessage,
  EducationCourseTrack,
  GradeLevel,
  LanguageMode,
  ModeType,
  StudentProfile,
} from '../types';
import { sendChatMessage } from '../services/chatService';
import {
  clearStudentMessages,
  saveStudentMessage,
} from '../services/studentProfileService';
import { SpeechService } from '../services/speechService';
import confetti from 'canvas-confetti';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  Lightbulb,
  Copy,
  Check,
  RefreshCw,
  Scissors,
  Calculator,
  GraduationCap,
  BookOpen,
  UserCheck,
  Trash2,
  WifiOff,
} from 'lucide-react';

interface ChatTabProps {
  language: LanguageMode;
  fontSize: 'normal' | 'large' | 'huge';
  onSolveHomework?: () => void;
  authUser: User | null;
  studentProfile: StudentProfile | null;
  savedMessages: ChatMessage[];
  isOffline: boolean;
  geminiReady?: boolean;
  onOpenRegister: () => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  language,
  fontSize,
  onSolveHomework,
  authUser,
  studentProfile,
  savedMessages,
  isOffline,
  geminiReady = true,
  onOpenRegister,
}) => {
  const [guestMessages, setGuestMessages] = useState<ChatMessage[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [confirmClearChat, setConfirmClearChat] = useState(false);

  const [input, setInput] = useState(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const sharedParts = [params.get('q'), params.get('title'), params.get('text'), params.get('url')]
      .map((val) => val?.trim())
      .filter((val): val is string => Boolean(val));
    return sharedParts.join(' — ');
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.has('q') || params.has('title') || params.has('text') || params.has('url')) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ModeType>('homework');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('grade-1');
  const [courseTrack, setCourseTrack] = useState<EducationCourseTrack>('all-subjects');
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync student grade & course track when profile loads or updates
  useEffect(() => {
    if (studentProfile) {
      if (studentProfile.gradeLevel) setGradeLevel(studentProfile.gradeLevel);
      if (studentProfile.courseTrack) setCourseTrack(studentProfile.courseTrack);
    }
  }, [studentProfile]);

  const welcomeMessage = useMemo<ChatMessage>(() => {
    const studentName = studentProfile?.displayName?.trim() || authUser?.displayName?.trim();
    const schoolNote = studentProfile?.schoolName ? ` from **${studentProfile.schoolName}**` : '';
    const goalNote = studentProfile?.learningGoal
      ? `\n\n🎯 I also remember your study goal: **${studentProfile.learningGoal}**.`
      : '';

    const greeting = studentName
      ? `Welcome back, **${studentName}**${schoolNote}! I am **Sir Lax**, and I always remember your study profile! 🌟${goalNote}\n\nWhat homework, project, or exam topic would you like to master today? Type below or tap **🎙️** to speak! ✏️🎓`
      : `Hello! I am **Sir Lax**, your AI teacher for **Elementary (Grade 1–6)**, **Junior High (Grades 7–10)**, **Senior High (Grades 11–12: STEM, ABM, HUMSS, TVL)**, and **ALL College Courses**! 🌟\n\nAsk any education question—from basic reading, math, and DIY projects to Algebra, Physics, Practical Research, **College Calculus, Engineering, Programming/IT, Nursing, Accountancy, Education, Law, or Thesis**. Type below or tap **🎙️** to speak! ✏️🎓`;

    return {
      id: 'welcome-1',
      sender: 'bot',
      text: greeting,
      timestamp: 'Ready',
      suggestedFollowUps: [
        'Elementary (Grade 1–6): How do plants make food? (Simple words)',
        'Junior High (Grades 7–10): Solve a quadratic equation step-by-step',
        'Senior High (STEM/ABM/HUMSS): Explain General Chemistry or Practical Research',
        'College (All Courses): Explain SQL JOINs, Derivatives, ADPIE, or Debit vs Credit',
      ],
    };
  }, [studentProfile, authUser]);

  const hasRegisteredProfile = Boolean(authUser && studentProfile);

  const messages = useMemo<ChatMessage[]>(() => {
    if (hasRegisteredProfile) {
      return [welcomeMessage, ...savedMessages, ...optimisticMessages];
    }
    return [welcomeMessage, ...guestMessages];
  }, [hasRegisteredProfile, welcomeMessage, savedMessages, optimisticMessages, guestMessages]);

  // Auto-scroll inside message list only when conversation grows
  useEffect(() => {
    if ((messages.length > 1 || loading) && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length, loading]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      SpeechService.stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#fbbf24'],
      });
    } catch (_) {}
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    SpeechService.stopSpeaking();
    setActiveSpeechId(null);
    setSpeechNotice(null);

    const timestampLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: timestampLabel,
    };

    const historyBeforeSend = messages.filter((m) => m.id !== 'welcome-1' && !m.isError);

    if (hasRegisteredProfile) {
      setOptimisticMessages((prev) => [...prev.filter((m) => !m.isError), userMsg]);
    } else {
      setGuestMessages((prev) => [...prev, userMsg]);
    }

    setInput('');
    setLoading(true);

    if (hasRegisteredProfile && authUser) {
      try {
        await saveStudentMessage(authUser.uid, {
          sender: 'user',
          text,
          timestampLabel,
        });
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== userMsgId));
      } catch (saveErr) {
        console.warn('Could not save user message to Firestore memory:', saveErr);
      }
    }

    try {
      const response = await sendChatMessage(
        text,
        mode,
        gradeLevel,
        language,
        historyBeforeSend,
        courseTrack,
        studentProfile
      );

      const botTimestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const provider: 'gemini' | 'chatgpt' =
        response.source === 'chatgpt' ? 'chatgpt' : 'gemini';

      if (hasRegisteredProfile && authUser) {
        try {
          await saveStudentMessage(authUser.uid, {
            sender: 'bot',
            text: response.text,
            timestampLabel: botTimestamp,
            provider,
          });
          setOptimisticMessages((prev) => prev.filter((m) => m.id !== userMsgId));
        } catch (saveErr) {
          console.warn('Could not save bot reply to Firestore memory:', saveErr);
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: response.text,
            timestamp: botTimestamp,
            isOffline: false,
            provider,
          };
          setOptimisticMessages((prev) => [...prev, botMsg]);
        }
      } else {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: response.text,
          timestamp: botTimestamp,
          isOffline: false,
          provider,
        };
        setGuestMessages((prev) => [...prev, botMsg]);
      }

      // Count every solved question toward Daily Study Streak and Homework milestones
      if (onSolveHomework) onSolveHomework();

      // Trigger celebration confetti on math, DIY, or explicit homework queries
      if (
        text.includes('+') ||
        text.includes('-') ||
        text.includes('solve') ||
        text.includes('diy') ||
        text.includes('homework')
      ) {
        triggerConfetti();
      }
    } catch (err: any) {
      const errorText =
        err?.message || 'Unable to get an answer from Gemini AI right now. Please try again.';
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: errorText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        retryText: text,
      };
      if (hasRegisteredProfile) {
        setOptimisticMessages((prev) => [...prev.filter((m) => m.id !== userMsgId), errorMsg]);
      } else {
        setGuestMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearMemoryChat = async () => {
    if (authUser) {
      try {
        await clearStudentMessages(authUser.uid);
        setOptimisticMessages([]);
        setConfirmClearChat(false);
      } catch (err) {
        console.warn('Unable to clear saved messages:', err);
      }
    } else {
      setGuestMessages([]);
      setConfirmClearChat(false);
    }
  };

  // Toggle voice recognition
  const toggleListening = () => {
    setSpeechNotice(null);
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!SpeechService.isSpeechRecognitionSupported()) {
      setSpeechNotice('Voice recognition is not supported in this browser. Please type your question below.');
      return;
    }

    try {
      const recognition = SpeechService.createSpeechRecognition(
        (transcript: string) => {
          setInput(transcript);
          setIsListening(false);
          // Automatically send voice query for super easy hands-free operation
          handleSend(transcript);
        },
        () => setIsListening(false),
        (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        }
      );

      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      }
    } catch (err) {
      console.error('Error starting recognition:', err);
      setIsListening(false);
    }
  };

  // Speak bot response aloud
  const handleSpeak = (msgId: string, text: string) => {
    if (activeSpeechId === msgId) {
      SpeechService.stopSpeaking();
      setActiveSpeechId(null);
      return;
    }

    setActiveSpeechId(msgId);
    SpeechService.speak(
      text,
      () => setActiveSpeechId(msgId),
      () => setActiveSpeechId(null),
      () => setActiveSpeechId(null)
    );
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFontSizeClass = () => {
    if (fontSize === 'huge') return 'text-lg sm:text-xl';
    if (fontSize === 'large') return 'text-base sm:text-lg';
    return 'text-sm sm:text-base';
  };

  const studentDisplayName = studentProfile?.displayName?.trim() || authUser?.displayName?.trim();

  return (
    <div className="flex flex-col h-[calc(100dvh-250px)] min-h-[420px] max-h-[700px] max-w-4xl mx-auto bg-stone-50 rounded-2xl shadow-md border-2 border-amber-300 overflow-hidden my-2">
      {/* Always-alert Online & Student Memory Strip */}
      <div
        className={`shrink-0 px-3 py-1.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
          isOffline
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
        }`}
      >
        <div className="flex items-center gap-2 font-bold">
          {isOffline ? (
            <>
              <WifiOff size={14} className="text-rose-600" />
              <span>Offline — waiting for internet connection to reach Gemini AI</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span>
                {geminiReady
                  ? 'Live Alert: Online & Gemini AI Ready at All Times'
                  : 'Online Mode Active — Ready for Questions'}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {authUser ? (
            <>
              <button
                type="button"
                onClick={onOpenRegister}
                className="inline-flex items-center gap-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer"
                title="Edit your registered student memory profile"
              >
                <UserCheck size={12} className="text-emerald-600" />
                <span>
                  {studentProfile
                    ? `Remembering ${studentProfile.displayName}`
                    : 'Complete Registration'}
                </span>
              </button>

              {savedMessages.length > 0 &&
                (confirmClearChat ? (
                  <span className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleClearMemoryChat}
                      className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer"
                    >
                      Clear Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearChat(false)}
                      className="bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearChat(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-rose-700 px-1.5 py-0.5 rounded cursor-pointer"
                    title="Clear saved chat history"
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                ))}
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenRegister}
              className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs transition cursor-pointer"
            >
              <UserCheck size={12} />
              <span>Register so Sir Lax remembers you</span>
            </button>
          )}
        </div>
      </div>

      {/* Control bar: Modes & Grade selector */}
      <div className="shrink-0 bg-amber-100/70 border-b border-amber-200 p-2.5 flex flex-wrap items-center justify-between gap-2">
        {/* Mode pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setMode('homework')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'homework'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-amber-200/50'
            }`}
          >
            <BookOpen size={13} />
            <span>Homework Help</span>
          </button>

          <button
            onClick={() => setMode('diy')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'diy'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-amber-200/50'
            }`}
          >
            <Scissors size={13} />
            <span>DIY School Projects</span>
          </button>

          <button
            onClick={() => setMode('math')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'math'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-amber-200/50'
            }`}
          >
            <Calculator size={13} />
            <span>Step-by-Step Math</span>
          </button>

          <button
            onClick={() => setMode('interactive')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'interactive'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-amber-200/50'
            }`}
          >
            <Sparkles size={13} />
            <span>Interactive Quiz</span>
          </button>
        </div>

        {/* Grade level & college course selector */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-stone-700">
          <GraduationCap size={15} className="text-amber-700" />
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
            aria-label="Education Level"
            className="bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-bold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="grade-1">Elementary (Grade 1–3)</option>
            <option value="grade-4">Elementary (Grade 4–6)</option>
            <option value="junior-high">Junior High School (Grades 7–10)</option>
            <option value="senior-high">Senior High School (Grades 11–12)</option>
            <option value="college">College (All Courses)</option>
          </select>

          <select
            value={courseTrack}
            onChange={(e) => setCourseTrack(e.target.value as EducationCourseTrack)}
            aria-label="Subject or College Course"
            className="bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
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
      </div>

      {/* Chat Messages List */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSpeaking = activeSpeechId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Bot Avatar */}
              {!isUser && (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shrink-0 border-2 border-amber-400 shadow-sm bg-white">
                  <img
                    src={SIR_LAX_AVATAR}
                    alt="Sir Lax"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3 sm:p-4 shadow-xs relative transition-all ${
                  isUser
                    ? 'bg-amber-600 text-white rounded-br-xs'
                    : msg.isError
                    ? 'bg-rose-50 text-rose-950 border border-rose-300 rounded-bl-xs'
                    : 'bg-white text-stone-800 border border-amber-200/80 rounded-bl-xs'
                }`}
              >
                {/* Header label for bot */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-amber-100 text-xs text-amber-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      Sir Lax (Your Teacher)
                      {msg.isError ? (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                          <AlertCircle size={11} /> Connection Issue
                        </span>
                      ) : msg.provider === 'chatgpt' ? (
                        <span className="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                          ✨ ChatGPT AI
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                          ✨ Gemini AI
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">{msg.timestamp}</span>
                  </div>
                )}

                {/* Text Content */}
                <div className={`whitespace-pre-line leading-relaxed ${getFontSizeClass()}`}>
                  {msg.text}
                </div>

                {msg.isError && msg.retryText && (
                  <div className="mt-3 pt-2 border-t border-rose-200 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSend(msg.retryText)}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={12} />
                      <span>Retry with Gemini AI</span>
                    </button>
                  </div>
                )}

                {/* Bot Message Action Buttons: Read aloud, Copy, etc */}
                {!isUser && !msg.isError && (
                  <div className="mt-3 pt-2 border-t border-amber-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isSpeaking
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        }`}
                        title="Read aloud with voice assistant"
                      >
                        {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        <span>{isSpeaking ? 'Pause Voice' : 'Listen to Sir Lax'}</span>
                      </button>

                      <button
                        onClick={() => copyToClipboard(msg.id, msg.text)}
                        className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>

                    <span className="text-[10px] text-amber-800/70 italic">
                      &ldquo;Education is the key for change!&rdquo;
                    </span>
                  </div>
                )}

                {/* Follow-up suggestion buttons */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-amber-100">
                    <p className="text-[11px] font-bold text-amber-900 mb-1.5 flex items-center gap-1">
                      <Lightbulb size={12} className="text-amber-500" /> Quick questions you can tap:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {msg.suggestedFollowUps.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(question)}
                          className="text-left text-xs bg-amber-50 hover:bg-amber-100 text-amber-950 px-2.5 py-1.5 rounded-xl border border-amber-200 transition font-medium cursor-pointer"
                        >
                          👉 {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 border-2 border-amber-400 bg-white">
              <img src={SIR_LAX_AVATAR} alt="Sir Lax" className="w-full h-full object-cover" />
            </div>
            <div className="bg-white border border-amber-200 rounded-2xl p-3 shadow-xs flex items-center gap-2 text-xs font-semibold text-amber-900">
              <RefreshCw size={14} className="animate-spin text-amber-600" />
              <span>
                {studentDisplayName
                  ? `Sir Lax is preparing a personalized explanation for ${studentDisplayName}...`
                  : 'Sir Lax is preparing your easy explanation...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Inline speech notice */}
      {speechNotice && (
        <div className="shrink-0 bg-amber-50 border-t border-amber-200 px-4 py-1.5 flex items-center justify-between text-xs text-amber-900 font-medium">
          <span>{speechNotice}</span>
          <button
            type="button"
            onClick={() => setSpeechNotice(null)}
            className="text-amber-700 font-bold px-1.5 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Voice Listening Overlay */}
      {isListening && (
        <div className="shrink-0 bg-rose-50 border-t-2 border-rose-300 px-4 py-2 flex items-center justify-between text-xs text-rose-900 animate-pulse">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span>Sir Lax is listening to your question... Speak clearly, kiddo!</span>
          </div>
          <button
            onClick={toggleListening}
            className="bg-rose-600 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 bg-white border-t-2 border-amber-300 p-2.5 sm:p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 sm:p-3 rounded-2xl transition cursor-pointer shadow-sm ${
              isListening
                ? 'bg-rose-500 text-white animate-bounce ring-4 ring-rose-200'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
            }`}
            title="Speak to ask homework question"
          >
            {isListening ? <MicOff size={19} /> : <Mic size={19} />}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                studentDisplayName
                  ? `Ask Sir Lax anything, ${studentDisplayName} (Math, Science, IT, Nursing, Thesis)...`
                  : 'Ask any school or college course question (Math, Science, IT, Nursing, Accounting, Thesis)...'
              }
              className="w-full bg-stone-100 hover:bg-stone-50 focus:bg-white text-stone-900 text-xs sm:text-sm rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition"
              disabled={loading}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold p-2.5 sm:p-3 rounded-2xl shadow-sm transition transform hover:scale-105 cursor-pointer disabled:cursor-not-allowed"
            title="Send question"
          >
            <Send size={18} />
          </button>
        </form>

        {/* Quick hint for kids */}
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500 px-1">
          <span>💡 Tap 🎙️ to talk if typing is hard</span>
          <span className="font-semibold text-amber-800">
            {studentProfile ? 'Cloud Memory Active • 100% Free' : '100% Free Educational Support'}
          </span>
        </div>
      </div>
    </div>
  );
};
