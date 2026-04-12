import type { DailySummary, Profile } from '../types';

// Feature unlock schedule
const UNLOCK_SCHEDULE: { feature: string; condition: (p: Profile, h: DailySummary[]) => boolean; label: string }[] = [
  // Day 1: boot, dashboard, quick_win, standard, battery (default unlocked)
  {
    feature: 'surge',
    condition: (p) => p.currentStreak >= 3,
    label: 'Surge Mode',
  },
  {
    feature: 'vault',
    condition: (p) => p.totalXP >= 500,
    label: 'The Vault',
  },
  {
    feature: 'multi_level',
    condition: (_, h) => h.length >= 3,
    label: 'Multi-Level Tasks',
  },
  {
    feature: 'multi_day',
    condition: (_, h) => h.length >= 7,
    label: 'Multi-Day Tasks',
  },
  {
    feature: 'continuous',
    condition: (_, h) => h.length >= 5,
    label: 'Continuous Tasks',
  },
  {
    feature: 'mood_trends',
    condition: (_, h) => h.filter((d) => d.mood > 0).length >= 7,
    label: 'Mood Trends',
  },
  {
    feature: 'insights',
    condition: (_, h) => h.length >= 14,
    label: 'Insights Engine',
  },
  {
    feature: 'full_growth',
    condition: (_, h) => h.length >= 30,
    label: 'Full Growth Map',
  },
  {
    feature: 'vega_jr',
    condition: (_, h) => h.length >= 3,
    label: 'Vega Jr. AI',
  },
];

export function checkUnlocks(profile: Profile, history: DailySummary[]): string[] {
  return UNLOCK_SCHEDULE
    .filter((u) => !profile.unlockedFeatures.includes(u.feature) && u.condition(profile, history))
    .map((u) => u.feature);
}

export function getUnlockLabel(feature: string): string {
  return UNLOCK_SCHEDULE.find((u) => u.feature === feature)?.label ?? feature;
}

export function getNextUnlock(profile: Profile, history: DailySummary[]): { feature: string; label: string } | null {
  const next = UNLOCK_SCHEDULE.find(
    (u) => !profile.unlockedFeatures.includes(u.feature) && !u.condition(profile, history)
  );
  return next ? { feature: next.feature, label: next.label } : null;
}

// Insights engine — generates correlation insights from history
export interface Insight {
  id: string;
  text: string;
  confidence: number; // 0-1
}

export function generateInsights(history: DailySummary[]): Insight[] {
  const insights: Insight[] = [];
  if (history.length < 7) return insights;

  // Training days vs non-training days
  const trainingDays = history.filter((d) => d.training !== 'rest');
  const restDays = history.filter((d) => d.training === 'rest');

  if (trainingDays.length >= 3 && restDays.length >= 3) {
    const trainingAvgTasks = avg(trainingDays.map((d) => d.tasksCompleted));
    const restAvgTasks = avg(restDays.map((d) => d.tasksCompleted));
    const diff = Math.round(((trainingAvgTasks - restAvgTasks) / Math.max(1, restAvgTasks)) * 100);

    if (Math.abs(diff) > 10) {
      insights.push({
        id: 'training_productivity',
        text: diff > 0
          ? `You complete ${diff}% more tasks on training days`
          : `You complete ${Math.abs(diff)}% fewer tasks on training days`,
        confidence: Math.min(1, trainingDays.length / 10),
      });
    }
  }

  // Mood on training days
  if (trainingDays.length >= 3 && restDays.length >= 3) {
    const trainingAvgMood = avg(trainingDays.map((d) => d.mood));
    const restAvgMood = avg(restDays.map((d) => d.mood));
    const diff = +(trainingAvgMood - restAvgMood).toFixed(1);

    if (Math.abs(diff) >= 0.3) {
      insights.push({
        id: 'training_mood',
        text: diff > 0
          ? `Your mood averages ${diff} points higher on training days`
          : `Your mood averages ${Math.abs(diff)} points lower on training days`,
        confidence: Math.min(1, trainingDays.length / 10),
      });
    }
  }

  // Surge frequency
  const surgeDays = history.filter((d) => d.surgeActivated);
  if (surgeDays.length >= 2) {
    const surgeRate = Math.round((surgeDays.length / history.length) * 100);
    insights.push({
      id: 'surge_rate',
      text: `You activate Surge Mode on ${surgeRate}% of your days`,
      confidence: Math.min(1, history.length / 14),
    });
  }

  // Surge days have higher mood
  if (surgeDays.length >= 3) {
    const nonSurgeDays = history.filter((d) => !d.surgeActivated);
    if (nonSurgeDays.length >= 3) {
      const surgeMood = avg(surgeDays.map((d) => d.mood));
      const nonSurgeMood = avg(nonSurgeDays.map((d) => d.mood));
      const diff = +(surgeMood - nonSurgeMood).toFixed(1);
      if (diff > 0.3) {
        insights.push({
          id: 'surge_mood',
          text: `Mood averages ${diff} points higher after Surge days`,
          confidence: Math.min(1, surgeDays.length / 7),
        });
      }
    }
  }

  // Energy trend
  if (history.length >= 14) {
    const firstWeek = history.slice(0, 7);
    const lastWeek = history.slice(-7);
    const firstAvg = avg(firstWeek.map((d) => d.energy));
    const lastAvg = avg(lastWeek.map((d) => d.energy));
    const diff = +(lastAvg - firstAvg).toFixed(1);

    if (Math.abs(diff) >= 0.3) {
      insights.push({
        id: 'energy_trend',
        text: diff > 0
          ? `Your energy has improved by ${diff} points since you started`
          : `Your energy has dipped ${Math.abs(diff)} points — might be time for a recovery day`,
        confidence: 0.7,
      });
    }
  }

  return insights.sort((a, b) => b.confidence - a.confidence);
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

// Season detection
export function detectSeasonShift(history: DailySummary[]): string | null {
  if (history.length < 7) return null;

  const lastWeek = history.slice(-7);
  const hasSchoolTasks = false; // Would check task names for school-related keywords
  const avgEnergy = avg(lastWeek.map((d) => d.energy));
  const trainingRate = lastWeek.filter((d) => d.training !== 'rest').length / 7;

  // High training rate + high energy + no school = likely summer
  if (trainingRate > 0.6 && avgEnergy > 3.5 && !hasSchoolTasks) {
    return 'summer';
  }

  return null;
}
