export type MoodType = 'great' | 'neutral' | 'sad' | 'stressed';

export interface MoodInfo {
  type: MoodType;
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export type UserProfile = {
  email: string;
  nickname: string;
  targetGroup: 'student' | 'general_labor' | 'unemployed' | 'merchant' | 'civil_servant' | 'teenager' | 'worker' | '';
  gender?: 'male' | 'female' | '';
  ageRange?: '18-25' | '26-34' | '35+' | '';
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface DecisionNode {
  id: string;
  text: string;
  children?: DecisionNode[];
  advice?: string;
  isLeaf?: boolean;
}

export interface MentalHealthLog {
  id: string;
  email: string;
  nickname: string;
  targetGroup: string;
  gender?: string;
  ageRange?: string;
  date: string; // YYYY-MM-DD
  mood: MoodType;
  assessmentResult?: {
    screening: string; // "2Q" | "9Q" | "8Q" | "ST-5"
    score: number;
    status: string;
    advice: string;
  };
  journal?: string;
  problemTreePath?: string[]; // Education -> Workload -> Procrastination
  problemTreeCategory?: string;
  problemTreeProblem?: string;
  problemTreeReason?: string;
  problemTreeHelpingFactors?: string[];
  timestamp: string; // ISO string
}

export interface SoundScape {
  id: string;
  title: string;
  category: 'al-quran' | 'nature' | 'cafe' | 'music' | 'prayer' | 'art' | 'exercise';
  audioUrl?: string;
  description: string;
  iconName: string;
  instruction?: string;
}

export interface HealQuote {
  text: string;
  source?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'alarm';
  duration?: number;
}

export function showToast(message: string, type: ToastItem['type'] = 'success', description?: string, duration = 4000) {
  const event = new CustomEvent('healjai_toast', {
    detail: { message, type, description, duration }
  });
  window.dispatchEvent(event);
}
