import { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useProfile } from '../hooks/useProfile';
import { useStorage } from '../hooks/useStorage';
import { KEYS } from '../lib/keys';
import { generateInsights } from '../lib/adaptive';
import type { DailySummary } from '../types';

export default function GrowthMap() {
  const { profile } = useProfile();
  const { data: history } = useStorage<DailySummary[]>(KEYS.HISTORY, []);

  const last7 = history.slice(-7);
  const last30 = history.slice(-30);
  const maxXP = Math.max(1, ...last7.map((d) => d.xpEarned));
  const maxTasks = Math.max(1, ...last30.map((d) => d.tasksCompleted));

  const insights = useMemo(() => generateInsights(history), [history]);

  // Mood SVG line chart data
  const moodPoints = last30.map((d, i) => ({
    x: (i / Math.max(1, last30.length - 1)) * 280 + 10,
    y: 80 - ((d.mood - 1) / 4) * 70,
    training: d.training !== 'rest',
  }));
  const moodPath = moodPoints.length > 1
    ? `M${moodPoints.map((p) => `${p.x},${p.y}`).join(' L')}`
    : '';

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

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-6 space-y-2">
          <h2 className="text-sm font-semibold text-[#8888a0] uppercase tracking-wider">Insights</h2>
          {insights.slice(0, 4).map((insight) => (
            <Card key={insight.id} className="flex items-start gap-3">
              <span className="text-lg mt-0.5">💡</span>
              <div className="flex-1">
                <p className="text-sm">{insight.text}</p>
                <Badge color="#22d3ee" className="mt-1">
                  {Math.round(insight.confidence * 100)}% confidence
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

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
                  {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Mood Trend (SVG line chart) */}
      {last30.length >= 3 && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold text-[#8888a0] mb-4">Mood Trend ({last30.length} days)</h2>
          <svg viewBox="0 0 300 90" className="w-full" preserveAspectRatio="none">
            {/* Grid lines */}
            {[1, 2, 3, 4, 5].map((level) => (
              <line
                key={level}
                x1="10" y1={80 - ((level - 1) / 4) * 70}
                x2="290" y2={80 - ((level - 1) / 4) * 70}
                stroke="#2a2a3a" strokeWidth="0.5"
              />
            ))}
            {/* Line */}
            {moodPath && (
              <path d={moodPath} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            )}
            {/* Training day dots */}
            {moodPoints.map((p, i) => (
              <circle
                key={i}
                cx={p.x} cy={p.y} r={p.training ? 4 : 2.5}
                fill={p.training ? '#f59e0b' : '#a78bfa'}
              />
            ))}
          </svg>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[#555570]">
              {new Date(last30[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <div className="flex gap-3">
              <span className="text-[10px] text-[#a78bfa]">-- Mood</span>
              <span className="text-[10px] text-[#f59e0b]">* Training</span>
            </div>
            <span className="text-[10px] text-[#555570]">
              {new Date(last30[last30.length - 1].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </Card>
      )}

      {/* Tasks per Day (last 30 as bar chart) */}
      {last30.length >= 7 && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold text-[#8888a0] mb-4">Tasks Per Day</h2>
          <div className="flex items-end gap-px h-24">
            {last30.map((day, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${(day.tasksCompleted / maxTasks) * 100}%`,
                  background: day.surgeActivated ? '#f97316' : '#10b981',
                  minHeight: 2,
                }}
                title={`${day.date}: ${day.tasksCompleted} tasks${day.surgeActivated ? ' (Surge)' : ''}`}
              />
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            <span className="text-[10px] text-[#10b981]">-- Normal</span>
            <span className="text-[10px] text-[#f97316]">-- Surge</span>
          </div>
        </Card>
      )}

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
          <div className="flex justify-between">
            <span className="text-[#8888a0]">Days Active</span>
            <span className="font-mono font-bold">{profile.daysActive}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
