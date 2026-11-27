import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createGeminiClient, generateTutorReply } from './lib/tutorEngine';

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
const genAI = createGeminiClient();

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
    const { message, mode, gradeLevel, courseTrack, language, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    communityStats.homeworkSolved += 1;

    const result = await generateTutorReply(genAI, {
      message,
      mode,
      gradeLevel,
      courseTrack,
      language,
      history,
    });

    return res.json(result);
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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(genAI),
    time: new Date().toISOString(),
  });
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

app.get('/.well-known/assetlinks.json', (_req, res) => {
  const distAssetLinks = path.resolve(__dirname, 'dist', '.well-known', 'assetlinks.json');
  const publicAssetLinks = path.resolve(__dirname, 'public', '.well-known', 'assetlinks.json');
  const assetLinksPath = process.env.NODE_ENV === 'production' ? distAssetLinks : publicAssetLinks;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(assetLinksPath, (err) => {
    if (err && assetLinksPath !== publicAssetLinks) {
      res.sendFile(publicAssetLinks, (fallbackErr) => {
        if (fallbackErr) {
          res.status(404).json({ error: 'assetlinks.json not configured yet' });
        }
      });
    } else if (err) {
      res.status(404).json({ error: 'assetlinks.json not configured yet' });
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
    app.use(express.static(path.resolve(__dirname, 'dist'), { dotfiles: 'allow' }));
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
