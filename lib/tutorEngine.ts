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

export interface ChatRequestPayload {
  message: string;
  mode?: string;
  gradeLevel?: string;
  courseTrack?: string;
  language?: string;
  history?: Array<{ sender: string; text: string }>;
}

export function createGeminiClient(apiKey = process.env.GEMINI_API_KEY || ''): GoogleGenAI | null {
  const trimmed = apiKey.trim();
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

  return `You are "Sir Lax", a beloved, deeply knowledgeable, patient educator and academic mentor ("EDUCATION IS THE KEY FOR CHANGE!").
You help learners from Elementary (Grades 1–6), Junior High School (Grades 7–10), and Senior High School (Grades 11–12: STEM, ABM, HUMSS, TVL) all the way through ALL College & University courses (Mathematics, Calculus, Statistics, Physics, Chemistry, Biology, Engineering, Architecture, Computer Science & Programming, Nursing & Health Sciences, Accountancy & Finance, Business & Economics, Education, Law, Humanities, Social Sciences, and Thesis/Research).

Rules:
1. Scope: Answer ALL legitimate educational, academic, homework, exam-review, coding, lab, and college course questions across every subject and major thoroughly and accurately. If a prompt is unrelated to learning or education, warmly steer the conversation back to study topics.
2. ${levelInstruction}
3. Selected Focus Area: ${courseContext}. (Still answer accurately even if the question spans another academic course!)
4. ${languageInstruction}
5. ${modeInstruction}
6. Formatting & Length: Keep paragraphs concise and well-structured with numbered steps, bullet points, bold key terms, or clean code/formula blocks when appropriate (aim for ~150–450 words depending on complexity).
7. Encouragement: Be supportive and respectful—supportive & playful for elementary kids, respectful & motivating for college youth.`;
}

export function generateSmartFallbackReply(
  query: string,
  mode = 'homework',
  gradeLevel = 'grade-1',
  language = 'simple-english'
): string {
  const q = query.toLowerCase();
  const isTagalog = language === 'filipino';

  if (q.includes('photo') || q.includes('photosynthesis') || q.includes('plant')) {
    if (isTagalog) {
      return `🌟 **Hello anak! Sagutin natin ito nang napakadali!**\n\nAng **Photosynthesis** ay kung paano nagluluto ng sariling pagkain ang mga halaman (plants)!\n\n1. ☀️ **Araw (Sunlight):** Pinagkukunan ng enerhiya.\n2. 💧 **Tubig (Water):** Hinihigop ng ugat mula sa lupa.\n3. 🌬️ **Carbon Dioxide (CO2):** Hinihinga ng mga dahon.\n\n✨ **Resulta:** Nakakagawa sila ng glucose (pagkain) at naglalabas ng **Oxygen**! 🌿`;
    }
    return `🌟 **Photosynthesis Explained Clearly!**\n\n**Photosynthesis** is how plants convert light energy into chemical food (glucose): **6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂**.\n\n1. ☀️ **Sunlight:** Captured by chlorophyll inside chloroplasts.\n2. 💧 **Water:** Absorbed by roots.\n3. 🌬️ **Carbon Dioxide:** Taken in through leaf stomata.\n\n✨ **Result:** Plants produce sugar for growth and release **Oxygen**! 👏`;
  }

  if (q.includes('calculus') || q.includes('derivative') || q.includes('integral') || q.includes('limit')) {
    return `📐 **College Calculus Quick Breakdown:**\n\n1. **Derivatives (Rate of Change):**\n   - Power Rule: d/dx [x^n] = n·x^(n−1)\n   - Product Rule: (fg)' = f'g + fg'\n   - Chain Rule: d/dx [f(g(x))] = f'(g(x)) · g'(x)\n2. **Integrals (Area / Accumulation):**\n   - ∫ x^n dx = x^(n+1)/(n+1) + C\n\nShare your exact function and let us walk through every step together!`;
  }

  if (q.includes('accounting') || q.includes('debit') || q.includes('credit') || q.includes('journal') || q.includes('balance sheet')) {
    return `📊 **Accountancy & Finance Quick Guide:**\n\n- **Core Equation:** Assets = Liabilities + Owner's Equity\n- **Debits increase:** Assets, Expenses, Drawings\n- **Credits increase:** Liabilities, Equity, Revenue\n\nShare your exact transaction or trial balance numbers and we can prepare the full journal entries step-by-step!`;
  }

  if (q.includes('nursing') || q.includes('anatomy') || q.includes('pharmacology') || q.includes('adpie')) {
    return `🩺 **Nursing & Allied Health Study Guide:**\n\nUse **ADPIE** (**A**ssessment → **D**iagnosis → **P**lanning → **I**mplementation → **E**valuation) and prioritize **Airway, Breathing, Circulation (ABCs)**.\n\nTell me your specific organ system, medication class, or patient scenario to review together!`;
  }

  if (q.includes('python') || q.includes('java') || q.includes('sql') || q.includes('algorithm') || q.includes('code') || q.includes('programming')) {
    return `💻 **Computer Science & IT Study Guide:**\n\nBreak every programming problem into: **1) Inputs & Constraints → 2) Core Data Structure/Algorithm → 3) Edge Cases → 4) Time/Space Complexity**.\n\nPaste your code snippet or topic (OOP, SQL joins, recursion, data structures) and let us work through it!`;
  }

  if (q.includes('add') || q.includes('plus') || q.includes('+') || q.includes('math') || mode === 'math') {
    return `🍎 **Math Step-by-Step with Sir Lax!**\n\nWrite down your **Given**, choose the **Operation / Formula**, and solve one step at a time—for example: 3 + 2 = **5**!\n\nType your exact math equation (from basic arithmetic to algebra or calculus) so we can solve it together! 🌟`;
  }

  if (mode === 'diy' || q.includes('project') || q.includes('diy') || q.includes('experiment')) {
    return `🛠️ **DIY School Project Guide:**\n\n1. Define what you are building.\n2. Gather safe, low-cost or recycled materials.\n3. Follow numbered assembly steps carefully and record observations.\n\nTell me your grade level and subject to get a full custom project plan!`;
  }

  const levelBadge =
    gradeLevel === 'college'
      ? 'College Course Support'
      : gradeLevel === 'senior-high'
      ? 'Senior High School Support (Grades 11–12)'
      : gradeLevel === 'junior-high'
      ? 'Junior High School Support (Grades 7–10)'
      : 'Elementary Support (Grades 1–6)';

  return `🌟 **Hi! Kuya Sir Lax is here to help you!** *(${levelBadge})*\n\nI received your study question: "*${query}*".\n\nHere is how to tackle it step-by-step:\n1. 📖 **Core Concept:** Identify the main definition, law, or principle in your subject.\n2. 💡 **Method / Formula:** List the given facts and what you need to solve or explain.\n3. ✏️ **Apply & Check:** Work one step at a time and verify your reasoning.\n\n*(Note: Live AI answers activate automatically once GEMINI_API_KEY is configured on the server—until then, share math equations, Calculus, IT, Accounting, Nursing, or DIY keywords for instant built-in guides!)* 🇵🇭💪`;
}

export async function generateTutorReply(
  genAI: GoogleGenAI | null,
  payload: ChatRequestPayload
): Promise<{ reply: string; source: 'ai' | 'offline-engine' }> {
  const { message, mode = 'homework', gradeLevel = 'grade-1', language = 'simple-english', history } = payload;

  if (genAI) {
    try {
      const systemPrompt = buildTutorSystemPrompt(payload);
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-6)) {
          if (item && typeof item.text === 'string' && item.text.trim()) {
            contents.push({
              role: item.sender === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }],
            });
          }
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const apiPromise = genAI.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 20000)
      );

      const response = await Promise.race([apiPromise, timeoutPromise]);
      const reply = response.text || 'I hear you, my student! Let us break this topic down step-by-step.';
      return { reply, source: 'ai' };
    } catch (geminiError: any) {
      console.warn('Gemini API fallback to local tutor:', geminiError?.message || geminiError);
    }
  }

  return {
    reply: generateSmartFallbackReply(message, mode, gradeLevel, language),
    source: 'offline-engine',
  };
}
