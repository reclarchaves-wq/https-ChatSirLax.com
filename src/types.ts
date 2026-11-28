export type LanguageMode = 'simple-english' | 'filipino' | 'bilingual';
export type GradeLevel = 'grade-1' | 'grade-4' | 'junior-high' | 'senior-high' | 'college';
export type ModeType = 'general' | 'homework' | 'diy' | 'math' | 'interactive';
export type EducationCourseTrack =
  | 'all-subjects'
  | 'elementary-core'
  | 'junior-high-core'
  | 'senior-high-strands'
  | 'stem-engineering'
  | 'it-computer-science'
  | 'nursing-health'
  | 'business-accountancy'
  | 'education-let'
  | 'law-humanities'
  | 'thesis-research';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isOffline?: boolean;
  isError?: boolean;
  retryText?: string;
  provider?: 'gemini' | 'chatgpt';
  gradeLevel?: GradeLevel;
  language?: LanguageMode;
  suggestedFollowUps?: string[];
  audioPlaying?: boolean;
}

export interface StudentProfile {
  uid: string;
  displayName: string;
  email: string;
  gradeLevel: GradeLevel;
  courseTrack: EducationCourseTrack;
  preferredLanguage: LanguageMode;
  schoolName?: string;
  learningGoal?: string;
}

export interface OfflineStudyPack {
  id: string;
  title: string;
  grade: string;
  category: 'math' | 'science' | 'english' | 'diy' | 'college';
  description: string;
  fileSize: string;
  downloaded: boolean;
  lessonsCount: number;
  content: {
    title: string;
    simpleExplanation: string;
    filipinoHint?: string;
    steps?: string[];
    example?: string;
    quizQuestion?: string;
    quizAnswer?: string;
  }[];
}

export interface FeedingProgramDrive {
  id: string;
  title: string;
  targetGroup: 'Children & Pupils' | 'College Youth' | 'All Students';
  date: string;
  location: string;
  mealsServed: number;
  highlight: string;
  status: 'Completed' | 'Upcoming This Saturday' | 'Daily Ongoing';
  image: string;
}

export interface MediaItem {
  id: string;
  type: 'video' | 'picture';
  title: string;
  category: 'Feeding Program' | 'Classroom Tutoring' | 'DIY Workshop' | 'College Scholars';
  thumbnail: string;
  mediaUrl?: string;
  duration?: string;
  date: string;
  location: string;
  description: string;
  impactQuote?: string;
}

export interface CommunityStats {
  mealsServed: number;
  collegeYouthSupported: number;
  homeworkSolved: number;
  communitiesReached: number;
  offlinePacksDownloaded: number;
  adSponsoredMeals: number;
}

export interface UserActivityStats {
  homeworksSolved: number;
  mealsSponsored: number;
  packsDownloaded: number;
  voiceListens: number;
  diyProjectsViewed: number;
}

export interface StudyStreakState {
  currentStreak: number;
  longestStreak: number;
  lastSolvedDate: string | null; // YYYY-MM-DD local date
  lastOpenedDate: string | null; // YYYY-MM-DD local date
  solvedDates: string[]; // Recent YYYY-MM-DD dates with >= 1 solved problem
  todaySolvedCount: number;
}

export interface AchievementBadge {
  id: string;
  title: string;
  category: 'homework' | 'feeding' | 'offline' | 'voice' | 'community' | 'streak';
  description: string;
  icon: string;
  target: number;
  current: number;
  unlocked: boolean;
  unlockedAt?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  rewardMotto: string;
  tag: string;
}

