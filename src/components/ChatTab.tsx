import React, { useState, useEffect, useRef } from 'react';
import { SIR_LAX_AVATAR } from '../data/mockData';
import { ChatMessage, GradeLevel, LanguageMode, ModeType } from '../types';
import { sendChatMessage } from '../services/chatService';
import { SpeechService } from '../services/speechService';
import confetti from 'canvas-confetti';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  WifiOff,
  Lightbulb,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  Share2,
  Scissors,
  Calculator,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

interface ChatTabProps {
  language: LanguageMode;
  fontSize: 'normal' | 'large' | 'huge';
  isForceOffline: boolean;
  onSolveHomework?: () => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  language,
  fontSize,
  isForceOffline,
  onSolveHomework,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: `Hello anak! I am **Sir Lax**, your community teacher and kuya! 🌟\n\nRemember our golden motto: **"EDUCATION IS THE KEY FOR CHANGE!"** 🇵🇭\n\nStruggling with homework? Need an easy DIY science project? Or having trouble understanding English words? \n\nDon't worry! Ask me anything, or tap the **microphone 🎙️** to speak. I will explain it in basic, super easy words that even a Grade 1 learner can understand! Let's learn together! ✏️🍎`,
      timestamp: 'Just now',
      suggestedFollowUps: [
        'How do plants make food? (Photosynthesis in baby words)',
        'Teach me how to add 25 + 18 easily',
        'DIY Volcano project using zero money',
        'College advice: How do I survive exams on a budget?',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ModeType>('homework');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('grade-1');
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(
        text,
        mode,
        gradeLevel,
        language,
        [...messages, userMsg],
        isForceOffline
      );

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOffline: response.isOffline,
      };

      setMessages((prev) => [...prev, botMsg]);

      // If user asked a math problem or completed homework, reward them!
      if (
        text.includes('+') ||
        text.includes('-') ||
        text.includes('solve') ||
        text.includes('diy') ||
        text.includes('homework')
      ) {
        triggerConfetti();
        if (onSolveHomework) onSolveHomework();
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle voice recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!SpeechService.isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
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

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] max-w-4xl mx-auto bg-stone-50 rounded-2xl shadow-sm border border-amber-200 overflow-hidden my-3">
      {/* Control bar: Modes & Grade selector */}
      <div className="bg-amber-100/70 border-b border-amber-200 p-2.5 flex flex-wrap items-center justify-between gap-2">
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

        {/* Grade level dropdown */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
          <GraduationCap size={15} className="text-amber-700" />
          <span>Level:</span>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
            className="bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-bold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="grade-1">Grade 1 - 3 (Ultra Simple)</option>
            <option value="grade-4">Grade 4 - 6 (Elementary)</option>
            <option value="high-school">Junior / Senior High</option>
            <option value="college">College Youth (Scholars)</option>
          </select>
        </div>
      </div>

      {/* Offline Mode Alert banner if offline */}
      {isForceOffline && (
        <div className="bg-amber-500 text-amber-950 px-3 py-1.5 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <WifiOff size={14} />
            <span>Offline Study Mode: Instant answers from downloaded local pack. No mobile data needed!</span>
          </div>
          <span className="text-[11px] bg-white/40 px-2 py-0.5 rounded-full">100% Free &amp; Offline</span>
        </div>
      )}

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    : 'bg-white text-stone-800 border border-amber-200/80 rounded-bl-xs'
                }`}
              >
                {/* Header label for bot */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-amber-100 text-xs text-amber-900 font-bold">
                    <span className="flex items-center gap-1">
                      Sir Lax (Your Teacher)
                      {msg.isOffline && (
                        <span className="bg-sky-100 text-sky-800 text-[10px] px-1.5 py-0.2 rounded-full font-semibold">
                          Offline Pack
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

                {/* Bot Message Action Buttons: Read aloud, Copy, etc */}
                {!isUser && (
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
              <span>Sir Lax is preparing your easy explanation...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Listening Overlay */}
      {isListening && (
        <div className="bg-rose-50 border-t-2 border-rose-300 px-4 py-2 flex items-center justify-between text-xs text-rose-900 animate-pulse">
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
      <div className="bg-white border-t border-amber-200 p-2.5 sm:p-3">
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
              placeholder="Ask Sir Lax: homework question, DIY project, or math..."
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
          <span className="font-semibold text-amber-800">100% Free Educational Support</span>
        </div>
      </div>
    </div>
  );
};
