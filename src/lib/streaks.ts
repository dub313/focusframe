export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 5;
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

export function getStreakLabel(streak: number): string {
  if (streak >= 100) return 'LEGENDARY';
  if (streak >= 30) return 'On Fire';
  if (streak >= 14) return 'Locked In';
  if (streak >= 7) return 'Rolling';
  if (streak >= 3) return 'Building';
  return '';
}

export function checkContinuousGrace(
  history: Record<string, boolean>,
  today: string
): boolean {
  // 2-of-3 rule: look at last 3 days including today
  const dates = getLastNDays(today, 3);
  const completions = dates.filter((d) => history[d] === true).length;
  return completions >= 2;
}

function getLastNDays(fromDate: string, n: number): string[] {
  const dates: string[] = [];
  const d = new Date(fromDate + 'T12:00:00');
  for (let i = 0; i < n; i++) {
    dates.push(formatDate(d));
    d.setDate(d.getDate() - 1);
  }
  return dates;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function getNextMilestone(streak: number): number | null {
  const milestones = [3, 7, 14, 30, 60, 100];
  return milestones.find((m) => m > streak) ?? null;
}
