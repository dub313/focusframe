import { Card } from '../components/ui/Card';
import { useProfile } from '../hooks/useProfile';
import { useStorage } from '../hooks/useStorage';
import { KEYS } from '../lib/keys';
import type { DailySummary } from '../types';

export default function GrowthMap() {
  const { profile } = useProfile();
  const { data: history } = useStorage<DailySummary[]>(KEYS.HISTORY, []);

  const last7 = history.slice(-7);
  const maxXP = Math.max(1, ...last7.map((d) => d.xpEarned));

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <h1 className="text-xl font-bold mb-6">Growth Map</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center py-3">
          <p className="font-mono text-lg font-bold text-[#f59e0b]">{profile.totalXP}</p>
          <p className="text-[10px] text-[#8888a0]">Total XP</p>
        </Card>
        <Card className="text-center py-3">
          <p className="font-mono text-lg font-bold text-[#22d3ee]">{profile.currentStreak}</p>
          <p className="text-[10px] text-[#8888a0]">Streak</p>
        </Card>
        <Card className="text-center py-3">
          <p className="font-mono text-lg font-bold text-[#10b981]">{profile.totalTasksCompleted}</p>
          <p className="text-[10px] text-[#8888a0]">Tasks Done</p>
        </Card>
      </div>

      {/* XP Chart (last 7 days) */}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-4">XP (Last 7 Days)</h2>
        {last7.length === 0 ? (
          <p className="text-center text-[#555570] py-8">Complete some days to see trends</p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {last7.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-[#8888a0]">{day.xpEarned}</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${(day.xpEarned / maxXP) * 100}%`,
                    background: '#22d3ee',
                    minHeight: 4,
                  }}
                />
                <span className="text-[10px] text-[#555570]">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Personal Records */}
      <Card>
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Personal Records</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-[#8888a0]">Best Streak</span>
            <span className="font-mono font-bold">{profile.personalRecords.bestStreak} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8888a0]">Best Surge Day</span>
            <span className="font-mono font-bold">{profile.personalRecords.bestSurgeDay} tasks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8888a0]">Most Tasks</span>
            <span className="font-mono font-bold">{profile.personalRecords.mostTasksInDay}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8888a0]">Highest Daily XP</span>
            <span className="font-mono font-bold text-[#f59e0b]">{profile.personalRecords.highestDailyXP}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8888a0]">Focus Minutes</span>
            <span className="font-mono font-bold">{profile.totalFocusMinutes}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
