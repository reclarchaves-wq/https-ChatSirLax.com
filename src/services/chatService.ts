import { ChatMessage, EducationCourseTrack, GradeLevel, LanguageMode, ModeType, StudentProfile } from '../types';

const PRODUCTION_API_URL = 'https://https-chat-sir-lax-com.vercel.app';

function normalizeApiBaseUrl(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim().replace(/\/+$/, '').replace(/\/api(?:\/chat)?$/i, '');
  // Ignore Vercel dashboard URLs accidentally pasted as VITE_API_BASE_URL
  if (trimmed.includes('vercel.com/')) return '';
  if (!/^https?:\/\//i.test(trimmed)) return '';
  return trimmed;
}

export function getApiBaseUrl(): string {
  const configured = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (configured) return configured;

  if (typeof window !== 'undefined') {
    const isCapacitor =
      window.location.protocol === 'capacitor:' ||
      !!(window as any).Capacitor?.isNativePlatform?.();
    if (isCapacitor) {
      return PRODUCTION_API_URL;
    }
  }
  return '';
}

export interface ServerHealthStatus {
  online: boolean;
  geminiConfigured: boolean;
  openaiConfigured: boolean;
  checkedAt: string;
}

export async function checkServerHealth(timeoutMs: number = 4000): Promise<ServerHealthStatus> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller?.signal,
    });
    if (!res.ok) {
      return {
        online: false,
        geminiConfigured: false,
        openaiConfigured: false,
        checkedAt: new Date().toISOString(),
      };
    }
    const data = await res.json().catch(() => ({}));
    return {
      online: true,
      geminiConfigured: Boolean(data?.geminiConfigured),
      openaiConfigured: Boolean(data?.openaiConfigured),
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      online: false,
      geminiConfigured: false,
      openaiConfigured: false,
      checkedAt: new Date().toISOString(),
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function checkServerOnline(timeoutMs: number = 4000): Promise<boolean> {
  const health = await checkServerHealth(timeoutMs);
  return health.online;
}

export async function sendChatMessage(
  message: string,
  mode: ModeType,
  gradeLevel: GradeLevel,
  language: LanguageMode,
  history: ChatMessage[],
  courseTrack: EducationCourseTrack = 'all-subjects',
  studentProfile?: Partial<StudentProfile> | null
): Promise<{ text: string; source: 'ai' | 'chatgpt' }> {
  const primaryBase = getApiBaseUrl();
  const endpoints = [`${primaryBase}/api/chat`];

  // If a custom VITE_API_BASE_URL points to a broken route on web, also try same-origin /api/chat
  if (primaryBase !== '' && typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    endpoints.push('/api/chat');
  }
  // If same-origin /api/chat returns 404 (e.g. static-only hosting), fall back to production backend
  if (
    typeof window !== 'undefined' &&
    window.location.origin !== PRODUCTION_API_URL &&
    !endpoints.includes(`${PRODUCTION_API_URL}/api/chat`)
  ) {
    endpoints.push(`${PRODUCTION_API_URL}/api/chat`);
  }

  const cleanStudentProfile = studentProfile
    ? {
        displayName: studentProfile.displayName,
        gradeLevel: studentProfile.gradeLevel,
        courseTrack: studentProfile.courseTrack,
        preferredLanguage: studentProfile.preferredLanguage,
        schoolName: studentProfile.schoolName,
        learningGoal: studentProfile.learningGoal,
      }
    : undefined;

  const payloadBody = JSON.stringify({
    message,
    mode,
    gradeLevel,
    courseTrack,
    language,
    studentProfile: cleanStudentProfile,
    history: history
      .filter((m) => !m.isError)
      .slice(-6)
      .map((m) => ({ sender: m.sender, text: m.text })),
  });

  let lastError: Error | null = null;

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 60000) : null;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller?.signal,
        body: payloadBody,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // If this endpoint returned 404 (route not mounted here) and another endpoint exists, try next
        if (res.status === 404 && !data?.error && i < endpoints.length - 1) {
          lastError = new Error(`Chat API route not found at ${endpoint} (404).`);
          continue;
        }
        throw new Error(
          data?.error || `Gemini server returned status ${res.status}. Please try again.`
        );
      }

      if (!data?.reply) {
        throw new Error('Gemini did not return an answer. Please try again.');
      }

      return {
        text: data.reply,
        source: data.source === 'chatgpt' ? 'chatgpt' : 'ai',
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        lastError = new Error('Request timed out waiting for Gemini AI. Please tap Retry.');
      } else {
        lastError = new Error(
          err?.message ||
            'Unable to connect to Gemini AI right now. Please check your internet connection and tap Retry.'
        );
      }
      // Only fall through to next endpoint on network error if there is another candidate
      if (i < endpoints.length - 1 && !err?.message?.includes('Gemini')) {
        continue;
      }
      throw lastError;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error('Unable to reach Gemini AI right now. Please tap Retry.');
}
