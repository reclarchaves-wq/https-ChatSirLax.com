import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Allow Capacitor APK WebView origins (https://localhost, capacitor://localhost)
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (
    origin &&
    (origin === 'https://localhost' ||
      origin === 'http://localhost' ||
      origin === 'capacitor://localhost' ||
      origin.startsWith('http://localhost:'))
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Initialize Google GenAI if real key is present
const rawApiKey = process.env.GEMINI_API_KEY || '';
const isValidKey = rawApiKey && !rawApiKey.startsWith('MY_') && rawApiKey.trim().length > 10;
let genAI: GoogleGenAI | null = null;
if (isValidKey) {
  try {
    genAI = new GoogleGenAI({
      apiKey: rawApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// In-memory community impact data with persistent increments
let communityStats = {
  mealsServed: 14890,
  collegeYouthSupported: 342,
  homeworkSolved: 52180,
  communitiesReached: 31,
  offlinePacksDownloaded: 8460,
  adSponsoredMeals: 2150,
};

const COURSE_TRACK_LABELS: Record<string, string> = {
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

// API route for chat with Sir Lax
app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, gradeLevel, courseTrack, language, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Increment solved questions counter
    communityStats.homeworkSolved += 1;

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

    const systemPrompt = `You are "Sir Lax", a beloved, deeply knowledgeable, patient educator and academic mentor ("EDUCATION IS THE KEY FOR CHANGE!").
You help learners from Elementary (Grades 1–6), Junior High School (Grades 7–10), and Senior High School (Grades 11–12: STEM, ABM, HUMSS, TVL) all the way through ALL College & University courses (Mathematics, Calculus, Statistics, Physics, Chemistry, Biology, Engineering, Architecture, Computer Science & Programming, Nursing & Health Sciences, Accountancy & Finance, Business & Economics, Education, Law, Humanities, Social Sciences, and Thesis/Research).

Rules:
1. Scope: Answer ALL legitimate educational, academic, homework, exam-review, coding, lab, and college course questions across every subject and major thoroughly and accurately. If a prompt is unrelated to learning or education, warmly steer the conversation back to study topics.
2. ${levelInstruction}
3. Selected Focus Area: ${courseContext}. (Still answer accurately even if the question spans another academic course!)
4. ${languageInstruction}
5. ${modeInstruction}
6. Formatting & Length: Keep paragraphs concise and well-structured with numbered steps, bullet points, bold key terms, or clean code/formula blocks when appropriate (aim for ~150–450 words depending on complexity).
7. Encouragement: Be supportive and respectful—supportive & playful for elementary kids, respectful & motivating for college youth.`;

    if (genAI) {
      try {
        const contents: any[] = [];
        if (Array.isArray(history) && history.length > 0) {
          const recent = history.slice(-6);
          for (const item of recent) {
            contents.push({
              role: item.sender === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }],
            });
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        const apiPromise = genAI.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: contents,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 20000)
        );

        const response: any = await Promise.race([apiPromise, timeoutPromise]);
        const reply = response.text || 'I hear you, my student! Let us break this topic down step-by-step.';
        return res.json({ reply, source: 'ai' });
      } catch (geminiError: any) {
        console.warn('Gemini API fallback to local tutor:', geminiError?.message || geminiError);
      }
    }

    const fallbackReply = generateSmartFallbackReply(message, mode, gradeLevel, language);
    return res.json({ reply: fallbackReply, source: 'offline-engine' });
  } catch (error: any) {
    console.error('Error handling /api/chat:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Community impact API
app.get('/api/impact', (_req, res) => {
  res.json({
    success: true,
    stats: communityStats,
    recentDrives: [
      {
        id: '1',
        title: 'Barangay San Roque Children & Youth Feeding Drive',
        date: 'Recent Outreach',
        meals: 350,
        collegeYouthAssisted: 45,
        location: 'Community Covered Court',
        highlight: 'Hot chicken arroz caldo with eggs, free school notebooks, and 2-hour free math tutoring.',
      },
      {
        id: '2',
        title: 'College Dreamers Study Pantry & Midnight Snacks',
        date: 'Last Weekend',
        meals: 180,
        collegeYouthAssisted: 85,
        location: 'State University Dormitory Hub',
        highlight: 'Nutritious meals & printable formula sheets for working students during midterm exams.',
      },
      {
        id: '3',
        title: 'Riverside Elementary DIY Science & Recycled Art Workshop',
        date: 'Two Weeks Ago',
        meals: 220,
        collegeYouthAssisted: 30,
        location: 'Sitio Riverside Chapel Hall',
        highlight: 'Built 80 homemade bottle-sprinklers and solar oven prototypes using recycled cardboard boxes.',
      },
    ],
  });
});

// Sponsor meal or watch ad unit to feed a student
app.post('/api/support-meal', (req, res) => {
  const { type, count = 1, donorName } = req.body;
  communityStats.mealsServed += Number(count) || 1;
  if (type === 'ad-watch') {
    communityStats.adSponsoredMeals += 1;
  }
  res.json({
    success: true,
    message: `Salamat! You provided ${count} hot, healthy meal(s) for a student!`,
    stats: communityStats,
    donor: donorName || 'Kind Community Supporter',
  });
});

// Smart rules-based fallback when AI key is absent or upstream times out
function generateSmartFallbackReply(query: string, mode: string, gradeLevel: string, language: string): string {
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
  return `🌟 **Hi! Kuya Sir Lax is here to help you!** *(${levelBadge})*\n\nI received your study question: "*${query}*".\n\nHere is how to tackle it step-by-step:\n1. 📖 **Core Concept:** Identify the main definition, law, or principle in your subject.\n2. 💡 **Method / Formula:** List the given facts and what you need to solve or explain.\n3. ✏️ **Apply & Check:** Work one step at a time and verify your reasoning.\n\n*(Note: Live AI answers require a configured GEMINI_API_KEY on the server—until then, share math equations, Calculus, IT, Accounting, Nursing, or DIY keywords for instant built-in guides!)* 🇵🇭💪`;
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve W3C Web Application Manifest with standard application/manifest+json MIME type
const serveManifest = (_req: express.Request, res: express.Response) => {
  const distManifest = path.resolve(__dirname, 'dist', 'manifest.json');
  const publicManifest = path.resolve(__dirname, 'public', 'manifest.json');
  const manifestPath = process.env.NODE_ENV === 'production' ? distManifest : publicManifest;
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(manifestPath, (err) => {
    if (err && manifestPath !== publicManifest) {
      res.sendFile(publicManifest);
    }
  });
};

app.get('/manifest.json', serveManifest);
app.get('/manifest.webmanifest', serveManifest);

app.get('/sw.js', (_req, res) => {
  const distSw = path.resolve(__dirname, 'dist', 'sw.js');
  const publicSw = path.resolve(__dirname, 'public', 'sw.js');
  const swPath = process.env.NODE_ENV === 'production' ? distSw : publicSw;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(swPath, (err) => {
    if (err && swPath !== publicSw) {
      res.sendFile(publicSw);
    }
  });
});

// Development or Production static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} is in use, retrying connection in 1 second...`);
      setTimeout(() => {
        try {
          httpServer.close();
        } catch (_) {}
        httpServer.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.error('Server listen error:', err);
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Chat Sir Lax server running on http://0.0.0.0:${PORT}`);
  });

  process.on('SIGTERM', () => {
    try {
      httpServer.close();
    } catch (_) {}
  });
}

startServer();
