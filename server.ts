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

// Initialize Google GenAI if real key is present
const rawApiKey = process.env.GEMINI_API_KEY || '';
const isValidKey = rawApiKey && !rawApiKey.startsWith('MY_') && rawApiKey.trim().length > 10;
let genAI: GoogleGenAI | null = null;
if (isValidKey) {
  try {
    genAI = new GoogleGenAI({ apiKey: rawApiKey });
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

// API route for chat with Sir Lax
app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, gradeLevel, language, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Increment solved questions counter
    communityStats.homeworkSolved += 1;

    const languageInstruction =
      language === 'filipino'
        ? 'Speak in warm, encouraging Filipino / Taglish that is super friendly and very easy to follow.'
        : language === 'bilingual'
        ? 'Provide the primary explanation in very simple English, with helpful Filipino translations in parentheses or bullets for key words.'
        : 'Speak in ultra-simple, basic English suitable for young learners or Grade 1 non-English speakers.';

    const modeInstruction =
      mode === 'diy'
        ? 'Focus on DIY home or school projects. Break into: 1) What we are making, 2) Safe recycled/cheap materials you can find at home, 3) Step-by-step easy numbered instructions with emojis, 4) Safety tip.'
        : mode === 'math'
        ? 'Teach math step-by-step with real-life visual analogies like counting mangoes, apples, candies, or coins. Avoid scary jargon.'
        : mode === 'interactive'
        ? 'Ask an engaging mini-question or game at the end to check their understanding! Keep it fun and rewarding.'
        : 'Help directly with their homework assignment in clear, bite-sized steps. Explain WHY the answer works so they learn.';

    const systemPrompt = `You are "Sir Lax", a beloved, joyful, patient Filipino public school teacher, community mentor, and champion for education equality.
Your motto is: "EDUCATION IS THE KEY FOR CHANGE!"
You teach students from underprivileged communities who face heavy language barriers and economic struggles, from Grade 1 pupils to working college youth.

Guiding Rules:
1. Tone: Deeply caring, enthusiastic, fatherly/older brother ("Kuya Sir"), encouraging. Use praises like "Ang galing mo!", "Super proud of you!", "Great try!".
2. Reading Level: Ultra-simple words. Grade Level context: ${gradeLevel || 'Grade 1-3'}.
3. ${languageInstruction}
4. ${modeInstruction}
5. Keep paragraphs short (1-3 sentences max). Use bullet points, bold keywords, and friendly emojis (🌟, ✏️, 🍎, 💡, 👏, 🇵🇭).
6. Never make the student feel slow or ashamed. Treat every question as smart and valuable.
7. If the question is about food or hunger, acknowledge it warmly with hope and remind them about the community feeding centers.`;

    if (genAI) {
      try {
        // Format previous turns if any
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
          model: 'gemini-3.8-flash',
          contents: contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 7000)
        );

        const response: any = await Promise.race([apiPromise, timeoutPromise]);
        const reply = response.text || 'I hear you, my student! Let us take it one step at a time.';
        return res.json({ reply, source: 'ai' });
      } catch (geminiError: any) {
        console.warn('Gemini API fallback to smart local tutor:', geminiError?.message || geminiError);
      }
    }

    // Fallback smart offline-style response if API key is absent or offline
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

// Smart rules-based fallback for 100% offline and low-bandwidth resilience
function generateSmartFallbackReply(query: string, mode: string, _gradeLevel: string, language: string): string {
  const q = query.toLowerCase();
  const isTagalog = language === 'filipino';

  if (q.includes('photo') || q.includes('photosynthesis') || q.includes('plant')) {
    if (isTagalog) {
      return `🌟 **Hello anak! Sagutin natin ito nang napakadali!**\n\nAng **Photosynthesis** ay kung paano nagluluto ng sariling pagkain ang mga halaman (plants)!\n\n1. ☀️ **Araw (Sunlight):** Ito ang apoy o init.\n2. 💧 **Tubig (Water):** Iniinom ng ugat sa lupa.\n3. 🌬️ **Hangin (Air / CO2):** Hinihinga ng mga dahon.\n\n✨ **Resulta:** Nakakagawa sila ng matamis na pagkain (asukal) at naglalabas ng sariwang **Oxygen** na hinihinga natin! Ang galing, 'di ba? 🌿`;
    }
    return `🌟 **Hello my dear student! Let us learn this easily!**\n\n**Photosynthesis** is simply how plants make their own food! 🌿\n\nThink of it like a plant cooking in its kitchen:\n1. ☀️ **Sunlight:** Like the stove heat.\n2. 💧 **Water:** Sucked up by roots from the soil.\n3. 🌬️ **Air:** Leaves breathe in fresh air.\n\n✨ **Result:** The plant makes sweet food (sugar) to grow big, and gives us fresh **Oxygen** to breathe! High five! 👏`;
  }

  if (q.includes('add') || q.includes('plus') || q.includes('+') || q.includes('math') || mode === 'math') {
    return `🍎 **Math is Fun and Easy with Sir Lax!**\n\nLet's count together step-by-step:\n- Imagine you have **3 juicy red apples** in your left hand 🍎🍎🍎.\n- Your classmate gives you **2 more sweet apples** in your right hand 🍎🍎.\n\n👉 Let us count all together: 1, 2, 3... 4, 5!\n✨ **Answer:** 3 + 2 = **5 apples!**\n\nRemember: You are doing great! Kaya mo yan! 🌟`;
  }

  if (mode === 'diy' || q.includes('project') || q.includes('diy') || q.includes('experiment')) {
    return `🛠️ **DIY School Project by Sir Lax: Recycled Bottle Desk Organizer!**\n\n*Zero cost, made from recycled trash!*\n\n📦 **Materials:**\n- 1 empty clean plastic soda or juice bottle\n- Safety scissors (ask an adult for help!)\n- Colored paper, wrappers, or crayons to decorate\n\n📝 **Easy Steps:**\n1. Wash and dry your plastic bottle.\n2. Carefully cut off the top neck (keep the bottom half as a tall cup).\n3. Wrap the edge with tape or paper so it is smooth and safe.\n4. Draw your favorite cartoon or write **"Study Hard!"** on it!\n\n✨ Now you have a wonderful holder for your pens and pencils! Proud of your creativity! ✏️🎨`;
  }

  return `🌟 **Hi! Kuya Sir Lax is here to help you!**\n\nI read your question: "*${query}*".\n\nHere is how we understand it easily:\n1. 📖 **Step 1:** Read the question slowly, one word at a time.\n2. 💡 **Step 2:** Find the main idea or clue.\n3. ✏️ **Step 3:** Write your idea in simple words.\n\nNever be afraid to make mistakes—that is how we learn! Tell me: which part feels tricky, and let us solve it together! 🇵🇭💪`;
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
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
