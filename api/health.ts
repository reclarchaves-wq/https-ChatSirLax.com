export default function handler(req: any, res: any) {
  const origin = req.headers?.origin;
  if (
    origin &&
    (origin === 'https://localhost' ||
      origin === 'http://localhost' ||
      origin === 'capacitor://localhost' ||
      origin.startsWith('http://localhost:'))
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json({
    status: 'ok',
    geminiConfigured: Boolean(
      process.env.GEMINI_API_KEY &&
        !process.env.GEMINI_API_KEY.startsWith('MY_') &&
        process.env.GEMINI_API_KEY.trim().length > 10
    ),
    time: new Date().toISOString(),
  });
}
