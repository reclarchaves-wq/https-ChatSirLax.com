import { ChatMessage, EducationCourseTrack, GradeLevel, LanguageMode, ModeType } from '../types';

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const isCapacitor =
      window.location.protocol === 'capacitor:' ||
      !!(window as any).Capacitor?.isNativePlatform?.();
    if (isCapacitor) {
      return 'https://https-chat-sir-lax-com.vercel.app';
    }
  }
  return '';
}

export async function sendChatMessage(
  message: string,
  mode: ModeType,
  gradeLevel: GradeLevel,
  language: LanguageMode,
  history: ChatMessage[],
  forceOffline: boolean = false,
  courseTrack: EducationCourseTrack = 'all-subjects'
): Promise<{ text: string; isOffline: boolean; source: string }> {
  const isActuallyOffline = forceOffline || (typeof navigator !== 'undefined' && !navigator.onLine);

  if (isActuallyOffline) {
    const offlineReply = getOfflineTutorResponse(message, mode, gradeLevel, language, courseTrack);
    return {
      text: offlineReply,
      isOffline: true,
      source: 'offline-cached-pack',
    };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 22000) : null;

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller?.signal,
      body: JSON.stringify({
        message,
        mode,
        gradeLevel,
        courseTrack,
        language,
        history: history.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return {
      text: data.reply || 'Let us solve this step-by-step together!',
      isOffline: data.source === 'offline-engine',
      source: data.source || 'gemini',
    };
  } catch (err) {
    console.warn('Network call failed, switching to Sir Lax offline tutor:', err);
    const fallbackText = getOfflineTutorResponse(message, mode, gradeLevel, language, courseTrack);
    return {
      text: fallbackText,
      isOffline: true,
      source: 'offline-emergency-engine',
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// Comprehensive offline response engine covering Elementary through College Courses
function getOfflineTutorResponse(
  query: string,
  mode: ModeType,
  gradeLevel: GradeLevel,
  language: LanguageMode,
  courseTrack: EducationCourseTrack
): string {
  const q = query.toLowerCase().trim();
  const isTagalog = language === 'filipino';
  const isBilingual = language === 'bilingual';

  // Basic arithmetic
  const mathMatch = q.match(/(\d+)\s*([\+\-\*\/x])\s*(\d+)/);
  if (mathMatch && !q.includes('derivative') && !q.includes('integral') && !q.includes('calculus')) {
    const n1 = parseInt(mathMatch[1], 10);
    const op = mathMatch[2];
    const n2 = parseInt(mathMatch[3], 10);
    let result = 0;
    let explanation = '';

    if (op === '+') {
      result = n1 + n2;
      explanation = `Let us count with mangoes 🥭:\n- First basket: **${n1}**\n- Second basket: **${n2}**\n👉 Combined together: **${result}**\n\n✨ **Final Answer: ${n1} + ${n2} = ${result}**`;
    } else if (op === '-') {
      result = n1 - n2;
      explanation = `Let us count step-by-step:\n- Start with **${n1}**\n- Take away **${n2}**\n👉 Remaining: **${result}**\n\n✨ **Final Answer: ${n1} - ${n2} = ${result}**`;
    } else if (op === '*' || op === 'x') {
      result = n1 * n2;
      explanation = `Multiplication is repeated addition:\n- **${n1} groups** with **${n2} items** each = **${result}**\n\n✨ **Final Answer: ${n1} × ${n2} = ${result}**`;
    } else {
      result = Math.floor(n1 / (n2 || 1));
      explanation = `Division means sharing equally:\n- **${n1} items** shared among **${n2} groups** = **${result}** each\n\n✨ **Final Answer: ${n1} ÷ ${n2} = ${result}**`;
    }

    if (isTagalog) {
      return `🌟 **Offline Math Helper ni Sir Lax!**\n\n${explanation}\n\n👏 Ang galing mo! Subukan pa natin ang ibang tanong!`;
    }
    return `🌟 **Sir Lax Offline Math Helper!** *(Saved on your device)*\n\n${explanation}\n\n👏 Great job! Ask another problem anytime!`;
  }

  // College STEM: Calculus / Engineering / Physics
  if (
    courseTrack === 'stem-engineering' ||
    q.includes('calculus') ||
    q.includes('derivative') ||
    q.includes('integral') ||
    q.includes('ohm') ||
    q.includes('force') ||
    q.includes('thermodynamics') ||
    q.includes('statics')
  ) {
    return `📐 **College STEM & Engineering Study Guide (Offline Reference):**\n\n1. **Calculus Quick Rules:**\n   - Power Rule (Derivative): d/dx [x^n] = n·x^(n−1)\n   - Power Rule (Integral): ∫ x^n dx = x^(n+1)/(n+1) + C (n ≠ −1)\n   - Chain Rule: d/dx [f(g(x))] = f'(g(x)) · g'(x)\n2. **Physics & Circuits Core Laws:**\n   - Newton's 2nd Law: F = m · a\n   - Ohm's Law: V = I · R (Power P = V · I)\n\n💡 **Study Strategy:** List your **Given**, **Required**, and **Formula** first before plugging in numbers with matching SI units! Reconnect online for Sir Lax to solve your exact equation step-by-step.`;
  }

  // College IT / Computer Science
  if (
    courseTrack === 'it-computer-science' ||
    q.includes('python') ||
    q.includes('java') ||
    q.includes('sql') ||
    q.includes('algorithm') ||
    q.includes('big o') ||
    q.includes('database') ||
    q.includes('programming') ||
    q.includes('html') ||
    q.includes('react')
  ) {
    return `💻 **IT & Computer Science Study Guide (Offline Reference):**\n\n1. **Core Big-O Time Complexities:**\n   - **O(1):** Hash map / array index lookup\n   - **O(log n):** Binary search on a sorted array\n   - **O(n):** Single loop traversal\n   - **O(n log n):** Merge Sort / Quick Sort (avg)\n2. **SQL Quick Pattern:** \`SELECT cols FROM table WHERE condition GROUP BY col ORDER BY col;\`\n3. **Debugging Checklist:** Trace input → state change → output on a small 3-item example by hand.\n\n💡 Connect online anytime for Sir Lax to review your exact code or trace your algorithm!`;
  }

  // College Accountancy & Business
  if (
    courseTrack === 'business-accountancy' ||
    q.includes('accounting') ||
    q.includes('debit') ||
    q.includes('credit') ||
    q.includes('balance sheet') ||
    q.includes('income statement') ||
    q.includes('journal entry') ||
    q.includes('roi') ||
    q.includes('economics')
  ) {
    return `📊 **Accountancy & Business Study Guide (Offline Reference):**\n\n1. **Fundamental Accounting Equation:** **Assets = Liabilities + Owner's Equity**\n2. **Normal Balances (DEAD CLIC):**\n   - **Debit increases:** Expenses, Assets, Dividends/Drawings\n   - **Credit increases:** Liabilities, Income/Revenue, Capital\n3. **Core Statements Order:** Income Statement → Statement of Equity → Balance Sheet → Cash Flows.\n\n💡 Reconnect online and paste your transaction details so Sir Lax can prepare the exact journal entries with you!`;
  }

  // College Nursing & Health Sciences
  if (
    courseTrack === 'nursing-health' ||
    q.includes('nursing') ||
    q.includes('anatomy') ||
    q.includes('pathophysiology') ||
    q.includes('adpie') ||
    q.includes('pharmacology') ||
    q.includes('vital signs') ||
    q.includes('patient')
  ) {
    return `🩺 **Nursing & Health Sciences Guide (Offline Reference):**\n\n1. **Nursing Process (ADPIE):**\n   - **A**ssessment (subjective + objective data)\n   - **D**iagnosis (NANDA problem + etiology + signs)\n   - **P**lanning (SMART patient goals)\n   - **I**mplementation (independent & dependent interventions)\n   - **E**valuation (goal met / partially met / unmet)\n2. **Priority Rule:** Always check **ABCs** (Airway, Breathing, Circulation) and Maslow's physiological needs first.\n\n💡 Go online anytime to walk through your exact case study, drug classification, or pathophysiology map with Sir Lax!`;
  }

  // Thesis / Research
  if (
    courseTrack === 'thesis-research' ||
    q.includes('thesis') ||
    q.includes('research') ||
    q.includes('rrl') ||
    q.includes('methodology') ||
    q.includes('hypothesis') ||
    q.includes('anova') ||
    q.includes('apa')
  ) {
    return `📝 **College Research & Thesis Guide (Offline Reference):**\n\n1. **Chapter Structure:**\n   - **Ch 1:** Background, Statement of the Problem (SOP), Conceptual Framework, Scope\n   - **Ch 2 (RRL):** Synthesize themes & gaps (do not just copy-paste summaries)\n   - **Ch 3 (Methodology):** Design, Respondents/Sampling, Instrument Validity, Statistical Treatment\n2. **Quick Stat Choice:** Use *t-test* for 2 group means, *ANOVA* for 3+ groups, *Pearson r* for linear correlation.\n\n💡 Reconnect online so Sir Lax can help refine your SOP, RRL outline, or APA citations!`;
  }

  // Elementary Science
  if (q.includes('water cycle') || q.includes('rain') || q.includes('ulan')) {
    if (isTagalog || isBilingual) {
      return `🌧️ **Paano Bumabagsak ang Ulan? (Water Cycle in Simple Words)**\n\n1. ☀️ **Evaporation:** Naiinitan ng araw ang tubig sa ilog o dagat at nagiging usok.\n2. ☁️ **Condensation:** Nagsasama-sama ang usok bilang ulap.\n3. 🌧️ **Precipitation:** Kapag mabigat na ang ulap, bumabagsak ito bilang ulan!\n\n💧 Babalik sa lupa at uulit muli. Ang galing ng kalikasan! 🌿`;
    }
    return `🌧️ **The Water Cycle Explained Easily!**\n\n1. ☀️ **Evaporation:** The sun warms water in rivers and oceans into vapor.\n2. ☁️ **Condensation:** High in the cool sky, vapor droplets form clouds.\n3. 🌧️ **Precipitation:** Heavy clouds release water back down as rain!\n\n✨ High five! 👏`;
  }

  // DIY projects
  if (mode === 'diy' || q.includes('diy') || q.includes('project') || q.includes('craft') || q.includes('recycled')) {
    return `🛠️ **Sir Lax Free DIY Guide: Recycled Cardboard Pencil Holder!**\n\n*Cost: ₱0.00 (Free recycled materials at home)*\n\n📦 **Materials:** Empty roll/bottle, scrap cardboard base, old magazines/wrappers, tape or cooked rice paste.\n📝 **Steps:** Clean & dry → glue/tape container upright onto cardboard base → decorate with your dream career label → dry completely!\n\n✨ *"Creativity does not need expensive store-bought supplies!"* 🇵🇭`;
  }

  const levelHint =
    gradeLevel === 'college'
      ? 'College Study Mode (All Courses)'
      : gradeLevel === 'senior-high'
      ? 'Senior High School Mode (Grades 11–12 • STEM/ABM/HUMSS/TVL)'
      : gradeLevel === 'junior-high'
      ? 'Junior High School Mode (Grades 7–10)'
      : 'Elementary Study Mode (Grades 1–6)';

  if (isTagalog) {
    return `🌟 **Kumusta anak! Kuya Sir Lax dito!** *(${levelHint} • Offline)*\n\nNabasa ko ang tanong mo tungkol sa: "*${query}*".\n\n1. 📖 Tukuyin ang pangunahing konsepto o formula sa iyong subject.\n2. 💡 Hatiin ang problema sa maliliit na hakbang.\n3. 🌐 Kapag online ka na, muling i-send ito para mabigyan kita ng kumpletong step-by-step na sagot mula Elementary, Junior High, Senior High, hanggang College! 🇵🇭`;
  }

  return `🌟 **Sir Lax is here!** *(${levelHint} • Offline Mode)*\n\nI saved your study question: "*${query}*".\n\nWhile offline, break the topic down into:\n1. 📖 **Core Concept / Definition:** What rule or formula applies?\n2. 💡 **Given & Goal:** What information do you already know?\n3. 🌐 **Full Lesson Solution:** Connect to Wi-Fi or data anytime and resend this question so I can give you a complete worked explanation for any Elementary, Junior High, Senior High, or College course! 🌟`;
}
