export default function handler(req: any, res: any) {
  const origin = req.headers?.origin;
  if (
    origin &&
    (origin === 'https://localhost' ||
      origin === 'http://localhost' ||
      origin === 'capacitor://localhost' ||
      origin.startsWith('http://localhost:') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.run.app'))
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const geminiKey = [
    process.env.GEMINI_API_KEY,
    process.env.Gemini_Api_key,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_API_KEY,
  ]
    .map((v) => (v || '').trim().replace(/^["']|["']$/g, ''))
    .find((v) => v.length > 10 && !v.startsWith('MY_'));

  const openAiKey = (process.env.OPENAI_API_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '');

  return res.status(200).json({
    status: 'ok',
    geminiConfigured: Boolean(geminiKey),
    openaiConfigured: Boolean(openAiKey.length > 10 && !openAiKey.startsWith('MY_')),
    time: new Date().toISOString(),
  });
}
