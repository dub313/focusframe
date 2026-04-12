import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useStorage } from '../hooks/useStorage';
import { useDailyState } from '../hooks/useDailyState';
import { useProfile } from '../hooks/useProfile';
import { KEYS } from '../lib/keys';
import { ROUTINE_COMPLETE_XP } from '../lib/xp';
import { getToday } from '../lib/day';
import type { Routines, RoutineItem } from '../types';

const DEFAULT_ROUTINES: Routines = {
  morning: [],
  evening: [],
};

export default function RoutinesScreen() {
  const { data: routines, set: setRoutines } = useStorage<Routines>(KEYS.ROUTINES, DEFAULT_ROUTINES);
  const { addXP: addDailyXP } = useDailyState();
  const { addXP: addProfileXP } = useProfile();
  const today = getToday();

  const [adding, setAdding] = useState<'morning' | 'evening' | null>(null);
  const [newItemName, setNewItemName] = useState('');

  function toggleItem(period: 'morning' | 'evening', itemId: string) {
    setRoutines((prev) => {
      const items = prev[period].map((item) => {
        if (item.id !== itemId) return item;
        const history = { ...item.completionHistory, [today]: !item.completionHistory?.[today] };
        return { ...item, completionHistory: history };
      });
      const updated = { ...prev, [period]: items };

      // Check if all items complete
      const allDone = updated[period].every((item) => item.completionHistory?.[today]);
      if (allDone && updated[period].length > 0) {
        addDailyXP(ROUTINE_COMPLETE_XP);
        addProfileXP(ROUTINE_COMPLETE_XP);
      }
      return updated;
    });
  }

  function addItem(period: 'morning' | 'evening') {
    if (!newItemName.trim()) return;
    const item: RoutineItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      completionHistory: {},
    };
    setRoutines((prev) => ({
      ...prev,
      [period]: [...prev[period], item],
    }));
    setNewItemName('');
    setAdding(null);
  }

  function removeItem(period: 'morning' | 'evening', itemId: string) {
    setRoutines((prev) => ({
      ...prev,
      [period]: prev[period].filter((item) => item.id !== itemId),
    }));
  }

  function renderPeriod(period: 'morning' | 'evening', emoji: string, label: string) {
    const items = routines[period];
    const doneCount = items.filter((item) => item.completionHistory?.[today]).length;
    const allDone = items.length > 0 && doneCount === items.length;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#8888a0] uppercase tracking-wider">
            {emoji} {label} {items.length > 0 && `(${doneCount}/${items.length})`}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setAdding(period)}>+ Add</Button>
        </div>

        {allDone && items.length > 0 && (
          <p className="text-xs text-[#10b981] mb-2 animate-bounce-in">All done! +{ROUTINE_COMPLETE_XP} XP</p>
        )}

        {items.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-[#555570] text-sm">No items yet. Tap + Add to start.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const done = item.completionHistory?.[today] ?? false;
              return (
                <Card
                  key={item.id}
                  className={`flex items-center gap-3 cursor-pointer transition-all
                    ${done ? 'opacity-60' : 'active:scale-[0.98]'}`}
                  onClick={() => toggleItem(period, item.id)}
                >
                  <div
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                      ${done ? 'bg-[#10b981] border-[#10b981]' : 'border-[#2a2a3a]'}`}
                  >
                    {done && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`flex-1 ${done ? 'line-through text-[#555570]' : ''}`}>{item.name}</span>
                  <button
                    className="text-[#555570] hover:text-[#f43f5e] text-sm px-1"
                    onClick={(e) => { e.stopPropagation(); removeItem(period, item.id); }}
                  >
                    ✕
                  </button>
                </Card>
              );
            })}
          </div>
        )}

        {adding === period && (
          <div className="flex gap-2 mt-3 animate-fade-in">
            <input
              type="text"
              placeholder="Item name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addItem(period)}
              className="flex-1 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-3 py-2 text-white placeholder:text-[#555570] focus:outline-none focus:border-[#22d3ee]"
            />
            <Button size="sm" onClick={() => addItem(period)}>Add</Button>
            <Button variant="ghost" size="sm" onClick={() => { setAdding(null); setNewItemName(''); }}>✕</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <h1 className="text-xl font-bold mb-6">Routines</h1>
      {renderPeriod('morning', '🌅', 'Morning')}
      {renderPeriod('evening', '🌙', 'Evening')}
    </div>
  );
}
