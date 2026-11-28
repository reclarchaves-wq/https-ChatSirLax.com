import { GoogleGenAI } from '@google/genai';

export const COURSE_TRACK_LABELS: Record<string, string> = {
  'all-subjects': 'All Educational Subjects (Elementary, Junior High, Senior High & All College Courses)',
  'elementary-core': 'Elementary Core (Reading, Phonics, Math, Science, Araling Panlipunan, Values)',
  'junior-high-core': 'Junior High School Grades 7–10 (Algebra, Geometry, Integrated Science, English, Filipino, Araling Panlipunan, TLE)',
  'senior-high-strands': 'Senior High School Grades 11–12 (Core Subjects, STEM, ABM, HUMSS, GAS & TVL Tracks, Practical Research)',
  'stem-engineering': 'College STEM, Engineering, Architecture, Calculus, Physics & Chemistry',
  'it-computer-science': 'College IT, Computer Science, Programming, Algorithms, Databases & Networking',
  'nursing-health': 'College Nursing, Medicine, Anatomy, Physiology, Pharmacology & Allied Health',
  'business-accountancy': 'College Accountancy, Business Administration, Finance, Economics & Marketing',
  'education-let': 'College Teacher Education, Pedagogy, Curriculum, Lesson Planning & Board Prep',
  'law-humanities': 'College Law, Political Science, Criminology, Humanities, History & Social Sciences',
  'thesis-research': 'Academic Research, Practical Research, Thesis/Capstone Writing, RRL, Methodology & Statistics',
};

export interface StudentMemoryContext {
  displayName?: string;
  gradeLevel?: string;
  courseTrack?: string;
  preferredLanguage?: string;
  schoolName?: string;
  learningGoal?: string;
}

export interface ChatRequestPayload {
  message: string;
  mode?: string;
  gradeLevel?: string;
  courseTrack?: string;
  language?: string;
  history?: Array<{ sender: string; text: string }>;
  studentProfile?: StudentMemoryContext | null;
}

export class TutorApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 502) {
    super(message);
    this.name = 'TutorApiError';
    this.statusCode = statusCode;
  }
}

export function getConfiguredGeminiApiKey(): string {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.Gemini_Api_key,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_API_KEY,
  ];
  for (const raw of candidates) {
    const trimmed = (raw || '').trim().replace(/^["']|["']$/g, '');
    if (trimmed.length > 10 && !trimmed.startsWith('MY_')) {
      return trimmed;
    }
  }
  return '';
}

export function createGeminiClient(apiKey?: string): GoogleGenAI | null {
  const trimmed = (apiKey ?? getConfiguredGeminiApiKey()).trim().replace(/^["']|["']$/g, '');
  const isValidKey = trimmed.length > 10 && !trimmed.startsWith('MY_');
  if (!isValidKey) return null;

  try {
    return new GoogleGenAI({
      apiKey: trimmed,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

export function buildTutorSystemPrompt(payload: ChatRequestPayload): string {
  const { mode = 'homework', gradeLevel = 'grade-1', courseTrack = 'all-subjects', language = 'simple-english' } = payload;

  const languageInstruction =
    language === 'filipino'
      ? 'Respond in warm, natural Filipino / Taglish while keeping technical academic terms accurate (and clearly explained in parentheses when helpful).'
      : language === 'bilingual'
      ? 'Provide the primary explanation in clear, easy-to-follow English, with helpful Filipino translations or summaries for key terms and takeaways.'
      : 'Respond in clear, easy-to-follow English adapted to the learner’s grade or college level.';

  const levelInstruction =
    gradeLevel === 'college'
      ? 'Audience: College / University student across ANY degree program (Engineering, IT/CS, Nursing/Medicine, Accountancy/Business, Education, Law, Arts, Sciences, or Thesis/Research). Deliver rigorous, accurate academic explanations, formulas, code examples, accounting entries, clinical frameworks, or analytical breakdowns, structured cleanly step-by-step so it is easy to master.'
      : gradeLevel === 'senior-high'
      ? 'Audience: Senior High School student (Grades 11–12 across Core Subjects and STEM, ABM, HUMSS, GAS, or TVL strands, including Pre-Calculus, General Chemistry/Physics/Biology, Organization & Management, Practical Research, and Immersion). Explain concepts thoroughly with clear formulas, strand-aligned examples, and step-by-step solutions.'
      : gradeLevel === 'junior-high'
      ? 'Audience: Junior High School student (Grades 7–10 covering Algebra, Geometry, Trigonometry, Integrated Science, Biology/Chemistry/Physics basics, English, Filipino, Araling Panlipunan, and TLE). Use clear, encouraging explanations with worked step-by-step examples.'
      : gradeLevel === 'grade-4'
      ? 'Audience: Elementary Grade 4–6 pupil. Use simple, friendly words, relatable examples, and numbered steps.'
      : 'Audience: Early Elementary Grade 1–3 pupil. Use ultra-simple everyday words, concrete visual analogies (fruits, coins, toys), and short encouraging sentences.';

  const courseContext =
    courseTrack && COURSE_TRACK_LABELS[courseTrack]
      ? COURSE_TRACK_LABELS[courseTrack]
      : COURSE_TRACK_LABELS['all-subjects'];

  const modeInstruction =
    mode === 'diy'
      ? 'Focus on hands-on DIY school or lab projects. Break into: 1) Goal, 2) Low-cost/recycled materials, 3) Clear numbered steps, 4) Safety note.'
      : mode === 'math'
      ? 'Solve math or quantitative problems step-by-step showing Given, Formula/Rule, each intermediate calculation, and Final Answer clearly.'
      : mode === 'interactive'
      ? 'Explain the concept clearly and end with 1 quick practice check question so the student can test their understanding.'
      : 'Answer the educational question thoroughly, accurately, and step-by-step, explaining WHY the concept works so the student truly learns.';

  const studentMemoryLines: string[] = [];
  const profile = payload.studentProfile;
  if (profile && typeof profile === 'object') {
    const clean = (val?: string, max = 120) =>
      typeof val === 'string' ? val.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : '';
    const name = clean(profile.displayName, 60);
    const school = clean(profile.schoolName, 100);
    const goal = clean(profile.learningGoal, 200);
    if (name) studentMemoryLines.push(`Student Name: ${name}`);
    if (school) studentMemoryLines.push(`School / University: ${school}`);
    if (goal) studentMemoryLines.push(`Learning Goal: ${goal}`);
  }

  const memoryBlock =
    studentMemoryLines.length > 0
      ? `\n8. Registered Student Memory (ALWAYS remember and personalize replies for this returning student):\n   - ${studentMemoryLines.join('\n   - ')}\n   - Greet or encourage them naturally by name when helpful, and tailor examples to their goal.`
      : '';

  return `You are "Sir Lax", a beloved, deeply knowledgeable, patient educator and academic mentor ("EDUCATION IS THE KEY FOR CHANGE!").
You help learners from Elementary (Grades 1–6), Junior High School (Grades 7–10), and Senior High School (Grades 11–12: STEM, ABM, HUMSS, TVL) all the way through ALL College & University courses (Mathematics, Calculus, Statistics, Physics, Chemistry, Biology, Engineering, Architecture, Computer Science & Programming, Nursing & Health Sciences, Accountancy & Finance, Business & Economics, Education, Law, Humanities, Social Sciences, and Thesis/Research).

Rules:
1. Scope: Answer ALL legitimate educational, academic, homework, exam-review, coding, lab, and college course questions across every subject and major thoroughly and accurately. If a prompt is unrelated to learning or education, warmly steer the conversation back to study topics.
2. ${levelInstruction}
3. Selected Focus Area: ${courseContext}. (Still answer accurately even if the question spans another academic course!)
4. ${languageInstruction}
5. ${modeInstruction}
6. Formatting & Length: Keep answers clear, concise, and fast to read (~120–260 words) using numbered steps, short bullet points, bold key terms, and readable math/code symbols (+, −, ×, ÷, =, ^, or code blocks). Do NOT use raw LaTeX syntax like $$...$$ or \\text{}.
7. Encouragement: Be supportive and respectful—supportive & playful for elementary kids, respectful & motivating for college youth.${memoryBlock}`;
}

function formatReadableGeminiError(err: any): { message: string; statusCode: number } {
  if (err instanceof TutorApiError) {
    return { message: err.message, statusCode: err.statusCode };
  }

  const statusCode =
    typeof err?.status === 'number'
      ? err.status
      : typeof err?.statusCode === 'number'
      ? err.statusCode
      : 502;
  const raw = typeof err?.message === 'string' ? err.message : '';

  if (raw.includes('API_KEY_INVALID') || statusCode === 400 || statusCode === 403 || raw.includes('PERMISSION_DENIED')) {
    return {
      message: 'Gemini API key is invalid or missing permissions. Please verify GEMINI_API_KEY in Settings > Secrets or Vercel Environment Variables.',
      statusCode,
    };
  }

  if (statusCode === 503 || raw.includes('UNAVAILABLE') || raw.includes('high demand')) {
    return {
      message: 'Gemini is temporarily busy due to high demand. Please tap Retry in a moment.',
      statusCode: 503,
    };
  }

  if (statusCode === 429 || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      message: 'Gemini rate limit reached briefly. Please wait a few seconds and tap Retry.',
      statusCode: 429,
    };
  }

  // Strip JSON wrapper if SDK serialized an error object
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      const nestedMsg = parsed?.error?.message;
      if (nestedMsg) {
        return { message: nestedMsg, statusCode };
      }
    } catch {
      // fall through
    }
  }

  return {
    message: raw || 'Unable to reach Gemini AI right now. Please tap Retry.',
    statusCode,
  };
}

function isTransientGeminiError(err: any): boolean {
  const status = typeof err?.status === 'number' ? err.status : err?.statusCode;
  const msg = String(err?.message || '');
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 504 ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('timeout')
  );
}

async function callModelWithTimeout(
  genAI: GoogleGenAI,
  model: string,
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  systemInstruction: string,
  timeoutMs: number
): Promise<string> {
  const apiPromise = genAI.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new TutorApiError('Gemini AI took too long to respond. Please try again.', 504)),
      timeoutMs
    )
  );

  const response = await Promise.race([apiPromise, timeoutPromise]);
  const reply = response.text?.trim();
  if (!reply) {
    throw new TutorApiError('Gemini AI returned an empty answer. Please try again.', 502);
  }
  return reply;
}

async function callOpenAiFailover(
  systemInstruction: string,
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  apiKey = process.env.OPENAI_API_KEY || ''
): Promise<string | null> {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 10 || trimmed.startsWith('MY_')) {
    return null;
  }

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemInstruction },
    ...contents.map((c) => ({
      role: (c.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: c.parts.map((p) => p.text).join('\n'),
    })),
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 22000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trimmed}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 700,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.warn(`OpenAI failover error (${res.status}):`, errBody);
      return null;
    }

    const data: any = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    return reply || null;
  } catch (err: any) {
    console.warn('OpenAI failover failed:', err?.message || err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateTutorReply(
  genAI: GoogleGenAI | null,
  payload: ChatRequestPayload
): Promise<{ reply: string; source: 'ai' | 'chatgpt' }> {
  const { message, history } = payload;

  const systemPrompt = buildTutorSystemPrompt(payload);
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(history) && history.length > 0) {
    for (const item of history.slice(-6)) {
      if (!item || typeof item.text !== 'string' || !item.text.trim()) continue;
      const role: 'user' | 'model' = item.sender === 'user' ? 'user' : 'model';
      if (contents.length === 0 && role === 'model') continue;
      const last = contents[contents.length - 1];
      if (last && last.role === role) {
        last.parts[0].text += `\n\n${item.text}`;
      } else {
        contents.push({ role, parts: [{ text: item.text }] });
      }
    }
  }

  const lastTurn = contents[contents.length - 1];
  if (lastTurn && lastTurn.role === 'user') {
    if (lastTurn.parts[0].text.trim() !== message.trim()) {
      lastTurn.parts[0].text += `\n\n${message}`;
    }
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });
  }

  let lastError: any = null;

  if (genAI) {
    const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        const reply = await callModelWithTimeout(genAI, model, contents, systemPrompt, 18000);
        return { reply, source: 'ai' };
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini attempt ${i + 1} (${model}) failed:`, err?.message || err);
        const isSecondaryModel = model !== 'gemini-4-hydrogen';
        if (!isTransientGeminiError(err) && !isSecondaryModel) {
          break;
        }
        if (i < modelsToTry.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }
  } else {
    lastError = new TutorApiError(
      'Gemini AI is not configured on this server (missing GEMINI_API_KEY).',
      503
    );
  }

  // Optional automatic failover to ChatGPT (OpenAI) if OPENAI_API_KEY is configured
  const openAiReply = await callOpenAiFailover(systemPrompt, contents);
  if (openAiReply) {
    return { reply: openAiReply, source: 'chatgpt' };
  }

  const formatted = formatReadableGeminiError(lastError);
  throw new TutorApiError(formatted.message, formatted.statusCode);
}
