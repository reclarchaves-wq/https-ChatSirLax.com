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
    success: true,
    stats: {
      mealsServed: 14890,
      collegeYouthSupported: 342,
      homeworkSolved: 52180,
      communitiesReached: 31,
      offlinePacksDownloaded: 8460,
      adSponsoredMeals: 2150,
    },
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
}
