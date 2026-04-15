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
  // completion tracking — stores exact values for clean undo
  earnedXP?: number; // exact XP earned including all multipliers
  xpAction?: 'banked' | 'burned'; // what the user chose for this XP
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
  sleepHours?: number; // hours slept last night, anchors battery capacity
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

// Vault deposit tier (how long XP has been banked — unlocks discounts)
export type RewardTier = 'bronze' | 'silver' | 'gold' | 'diamond';

// Reward catalog category (price bracket — used in parent portal + child redemption)
export type RewardCategory = 'minor' | 'medium' | 'major';

// Reward in the shared Firebase catalog
export interface SharedReward {
  id: string;
  name: string;
  description?: string;
  category: RewardCategory;
  xpCost: number;
  active: boolean;
  createdAt: string;
}

// A redemption request from child → parent. Status flips to approved/denied by parent.
export interface Redemption {
  id: string;
  rewardId: string;
  rewardName: string;
  xpCost: number;          // listed cost at time of request
  requestedAt: string;
  status: 'pending' | 'approved' | 'denied';
  approvedAt?: string;
  deniedAt?: string;
  denyReason?: string;
  // Breakdown of how the effective cost was paid (computed at request time)
  burnPaid: number;
  vaultPaid: number;
}

// A custom reward proposal from child. Parent accepts (sets price) or declines (with reason).
export interface RewardRequest {
  id: string;
  name: string;
  description?: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'declined';
  acceptedAt?: string;
  acceptedXpCost?: number;
  acceptedCategory?: RewardCategory;
  declinedAt?: string;
  declineReason?: string;
}

// === Family / Parent Portal ===

// A task assigned by parent from the portal, synced via Firebase.
export interface ParentTask {
  id: string;
  name: string;
  type: 'quick_win' | 'standard' | 'multi_level';
  assignedAt: string;
  completed: boolean;
  completedAt?: string;
  steps?: string[];
  urgent?: boolean;              // auto-pins to Top 3 on the child's Dashboard
  completionMessage?: string;    // shown to child on task complete
}

// Child state pushed to parent portal in real time. NO private data (mood, notes, chat).
export interface ChildProgress {
  lastUpdated: string;
  bootedAt?: string;
  sleepHours?: number;
  batteryMax: number;
  batteryUsed: number;
  recoveryUsed: number;
  topThreeDone: number;
  topThreeTotal: number;
  totalXP: number;
  currentStreak: number;
  daysActive: number;
  totalTasksCompleted: number;
  todayTasksDone: number;
  todayTasksTotal: number;
  todayEnergy: number;
  todayTraining: string;
  todayXP: number;
  surgeActive: boolean;
  vaultBalance: number;
  burnBalance: number;
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
