// Speech Synthesis & Recognition Service for Chat Sir Lax

export class SpeechService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static speakToken = 0;

  private static readonly FEMALE_VOICE_PATTERNS = [
    /\bfemale\b/i,
    /\bwoman\b/i,
    /\bgirl\b/i,
    /\bzira\b/i,
    /\bsamantha\b/i,
    /\bvictoria\b/i,
    /\bkaren\b/i,
    /\bmoira\b/i,
    /\btessa\b/i,
    /\bfiona\b/i,
    /\bserena\b/i,
    /\bkate\b/i,
    /\bjenny\b/i,
    /\baria\b/i,
    /\bsara\b/i,
    /\bmichelle\b/i,
    /\bmonica\b/i,
    /\bana\b/i,
    /\bemma\b/i,
    /\blibby\b/i,
    /\bsonia\b/i,
    /\bnatasha\b/i,
    /\bclara\b/i,
    /\bneerja\b/i,
    /\bblessica\b/i,
    /\brosa\b/i,
    /\bava\b/i,
    /\ballison\b/i,
    /\bsusan\b/i,
    /\bhazel\b/i,
    /\bheera\b/i,
    /\bveena\b/i,
    /\bgoogle us english\b/i,
    /\bgoogle uk english female\b/i,
    /\ben-us-x-sfg\b/i,
    /\ben-gb-x-gba\b/i,
  ];

  private static readonly MALE_VOICE_PATTERNS = [
    /\bmale\b/i,
    /\bman\b/i,
    /\bangelo\b/i,
    /\bjames\b/i,
    /\bdavid\b/i,
    /\bmark\b/i,
    /\bguy\b/i,
    /\bdaniel\b/i,
    /\balex\b/i,
    /\bryan\b/i,
    /\bchristopher\b/i,
    /\beric\b/i,
    /\broger\b/i,
    /\bsteffan\b/i,
    /\btony\b/i,
    /\bdavis\b/i,
    /\bjason\b/i,
    /\bbrandon\b/i,
    /\bandrew\b/i,
    /\bbrian\b/i,
    /\bmatthew\b/i,
    /\bbenjamin\b/i,
    /\bgeorge\b/i,
    /\barthur\b/i,
    /\boliver\b/i,
    /\baaron\b/i,
    /\bfred\b/i,
    /\brishi\b/i,
    /\bprabhat\b/i,
    /\bwilliam\b/i,
    /\bcarlos\b/i,
    /\bmiguel\b/i,
    /\bgoogle uk english male\b/i,
    /\ben-us-x-iom\b/i,
    /\ben-us-x-tpd\b/i,
    /\ben-gb-x-gbd\b/i,
    /\ben-gb-x-rjs\b/i,
  ];

  public static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static isSpeechRecognitionSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  private static selectMaleVoice(voices: SpeechSynthesisVoice[]): {
    voice: SpeechSynthesisVoice | null;
    isConfirmedMale: boolean;
  } {
    if (!voices || voices.length === 0) {
      return { voice: null, isConfirmedMale: false };
    }

    let bestVoice: SpeechSynthesisVoice | null = null;
    let bestScore = -Infinity;
    let bestIsConfirmedMale = false;

    for (const v of voices) {
      const name = v.name || '';
      const lang = (v.lang || '').toLowerCase();

      const isEnglishOrFilipino =
        lang.startsWith('en') || lang.startsWith('fil') || lang.startsWith('tl');
      if (!isEnglishOrFilipino) continue;

      const isExplicitFemale = this.FEMALE_VOICE_PATTERNS.some((rx) => rx.test(name));
      const isExplicitMale =
        !isExplicitFemale && this.MALE_VOICE_PATTERNS.some((rx) => rx.test(name));

      let score = 0;
      if (isExplicitMale) score += 200;
      if (isExplicitFemale) score -= 200;

      if (lang.includes('en-ph') || lang.startsWith('fil') || lang.startsWith('tl')) {
        score += 40;
      } else if (lang.includes('en-us')) {
        score += 25;
      } else if (lang.includes('en-gb')) {
        score += 20;
      } else {
        score += 10;
      }

      if (/natural|neural|online|enhanced/i.test(name)) {
        score += 15;
      }

      if (score > bestScore) {
        bestScore = score;
        bestVoice = v;
        bestIsConfirmedMale = isExplicitMale;
      }
    }

    return { voice: bestVoice, isConfirmedMale: bestIsConfirmedMale };
  }

  private static getVoicesAsync(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
    const existing = synth.getVoices();
    if (existing.length > 0) {
      return Promise.resolve(existing);
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        synth.removeEventListener?.('voiceschanged', finish);
        resolve(synth.getVoices());
      };
      synth.addEventListener?.('voiceschanged', finish);
      setTimeout(finish, 180);
    });
  }

  public static speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: () => void
  ): void {
    if (!this.synth) {
      if (onError) onError();
      return;
    }

    // Cancel any ongoing speech and invalidate pending async starts
    this.stopSpeaking();
    const token = ++this.speakToken;

    // Clean markdown, URLs, and emojis for smooth male voice reading
    const cleanText = text
      .replace(/[*#_~`]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const synth = this.synth;
    this.getVoicesAsync(synth).then((voices) => {
      if (!this.synth || token !== this.speakToken) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const { voice, isConfirmedMale } = this.selectMaleVoice(voices);

      if (voice) {
        utterance.voice = voice;
      }

      // Warm, clear male teacher cadence
      utterance.rate = 0.92;
      utterance.pitch = isConfirmedMale ? 0.9 : 0.75;

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        if (onError) onError();
      };

      this.currentUtterance = utterance;
      synth.speak(utterance);
    });
  }

  public static stopSpeaking(): void {
    this.speakToken += 1;
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public static createSpeechRecognition(
    onResult: (transcript: string) => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): any {
    if (!this.isSpeechRecognitionSupported()) return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // Works well with English and simple Tagalog accents

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    recognition.onerror = (event: any) => {
      if (onError) onError(event);
    };

    return recognition;
  }
}
