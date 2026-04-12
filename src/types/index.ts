// === Task Types ===

export type TaskType = 'quick_win' | 'standard' | 'multi_level' | 'multi_day' | 'continuous';

export interface SubTask {
  id: string;
  name: string;
  completed: boolean;
}

export interface Task {
  id: string;
  type: TaskType;
  name: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  energyCost: number;
  baseXP: number;
  // multi_level
  subtasks?: SubTask[];
  // multi_day
  targetDate?: string;
  milestones?: SubTask[];
  // continuous
  frequency?: 'daily' | 'weekdays' | 'weekly' | string[]; // string[] = specific days like ['Mon','Wed','Fri']
  continuousHistory?: Record<string, boolean>; // date -> completed
  // general
  priority?: 'high' | 'medium' | 'low';
  isTopThree?: boolean;
  surgeIndex?: number; // which surge task (4, 5, 6...)
}

// === Mood ===

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  timestamp: string;
  level: MoodLevel;
  note?: string;
}

// === Training ===

export type TrainingType = 'boxing' | 'baseball' | 'both' | 'rest';

export interface TrainingInfo {
  type: TrainingType;
  time?: string; // HH:MM
  logged?: boolean;
}

// === Daily State ===

export interface DailyState {
  date: string; // YYYY-MM-DD
  bootDone: boolean;
  energy: number; // 1-5
  training: TrainingInfo;
  mood: MoodEntry;
  tasks: Task[];
  batteryMax: number;
  batteryUsed: number;
  recoveryUsed: number; // count of recovery actions today (max 3)
  surgeActive: boolean;
  surgeTaskCount: number;
  xpEarnedToday: number;
  topThreeComplete: boolean;
}

// === Vault ===

export interface VaultDeposit {
  id: string;
  amount: number;
  depositedAt: string; // ISO date
  daysHeld: number;
  currentValue: number;
}

export interface VaultState {
  deposits: VaultDeposit[];
  totalDeposited: number;
  burnBalance: number;
}

// === Profile (persistent across days) ===

export interface PersonalRecords {
  bestStreak: number;
  bestStreakDate?: string;
  bestSurgeDay: number;
  bestSurgeDayDate?: string;
  mostTasksInDay: number;
  mostTasksDate?: string;
  longestFocusMinutes: number;
  longestFocusDate?: string;
  highestDailyXP: number;
  highestDailyXPDate?: string;
  longestVaultHold: number;
}

export interface Profile {
  userName?: string;
  appName?: string; // custom app name, defaults to "FocusFrame"
  totalXP: number;
  currentStreak: number;
  lastStreakDate?: string;
  firstUseDate: string;
  daysActive: number;
  totalTasksCompleted: number;
  totalFocusMinutes: number;
  personalRecords: PersonalRecords;
  unlockedFeatures: string[];
}

// === History ===

export interface DailySummary {
  date: string;
  tasksCompleted: number;
  tasksTotal: number;
  mood: MoodLevel;
  energy: number;
  training: TrainingType;
  surgeActivated: boolean;
  surgeTaskCount: number;
  xpEarned: number;
  focusMinutes: number;
  streakDay: number;
}

// === Routines ===

export interface RoutineItem {
  id: string;
  name: string;
  estimatedMinutes?: number;
  days?: string[]; // ['Mon','Tue',...] or empty for daily
  completionHistory?: Record<string, boolean>;
}

export interface Routines {
  morning: RoutineItem[];
  evening: RoutineItem[];
}

// === Settings ===

export interface AppSettings {
  parentPIN?: string;
  timerWorkMinutes: number;
  timerBreakMinutes: number;
  apiKey?: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  seasonMode: 'school' | 'summer' | 'competition' | 'auto';
}

// === Rewards ===

export type RewardTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Reward {
  id: string;
  name: string;
  description: string;
  tier: RewardTier;
  xpCost: number;
  active: boolean;
}

// === Chat ===

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// === Animation ===

export type AnimationType =
  | 'task_complete'
  | 'xp_burst'
  | 'streak_milestone'
  | 'surge_activate'
  | 'surge_complete'
  | 'confetti'
  | 'level_up'
  | 'vault_deposit'
  | 'routine_complete';

export interface AnimationEvent {
  id: string;
  type: AnimationType;
  data?: Record<string, unknown>;
}
