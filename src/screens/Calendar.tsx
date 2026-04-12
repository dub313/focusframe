import { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useStorage } from '../hooks/useStorage';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  endTime?: string;
  description?: string;
  color: string;
  repeat: 'none' | 'daily' | 'weekly';
  seriesId?: string; // groups repeated events
}

const EVENT_COLORS = [
  { color: '#22d3ee', label: 'Cyan' },
  { color: '#a78bfa', label: 'Purple' },
  { color: '#f97316', label: 'Orange' },
  { color: '#10b981', label: 'Green' },
  { color: '#f43f5e', label: 'Red' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#f59e0b', label: 'Gold' },
];

function getToday(): string {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function getDayName(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

function getMonthDay(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function CalendarScreen() {
  const { data: events, set: setEvents } = useStorage<CalendarEvent[]>('focusframe:calendar', []);

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showAdd, setShowAdd] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  // Add form state
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#22d3ee');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
  const [repeatWeeks, setRepeatWeeks] = useState('4');

  // Build week view
  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (weekOffset * 7));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    });
  }, [weekOffset]);

  // Events for selected date
  const dayEvents = useMemo(() => {
    return events
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [events, selectedDate]);

  // Count events per day for dots
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      counts[e.date] = (counts[e.date] || 0) + 1;
    });
    return counts;
  }, [events]);

  function resetForm() {
    setTitle('');
    setTime('');
    setEndTime('');
    setDescription('');
    setColor('#22d3ee');
    setRepeat('none');
    setRepeatWeeks('4');
  }

  function handleAdd() {
    if (!title.trim()) return;

    const seriesId = repeat !== 'none' ? crypto.randomUUID() : undefined;
    const newEvents: CalendarEvent[] = [];

    if (repeat === 'none') {
      newEvents.push({
        id: crypto.randomUUID(),
        title: title.trim(),
        date: selectedDate,
        time: time || undefined,
        endTime: endTime || undefined,
        description: description.trim() || undefined,
        color,
        repeat: 'none',
      });
    } else if (repeat === 'daily') {
      const count = parseInt(repeatWeeks) || 7;
      for (let i = 0; i < count; i++) {
        newEvents.push({
          id: crypto.randomUUID(),
          title: title.trim(),
          date: addDays(selectedDate, i),
          time: time || undefined,
          endTime: endTime || undefined,
          description: description.trim() || undefined,
          color,
          repeat: 'daily',
          seriesId,
        });
      }
    } else if (repeat === 'weekly') {
      const weeks = parseInt(repeatWeeks) || 4;
      for (let i = 0; i < weeks; i++) {
        newEvents.push({
          id: crypto.randomUUID(),
          title: title.trim(),
          date: addDays(selectedDate, i * 7),
          time: time || undefined,
          endTime: endTime || undefined,
          description: description.trim() || undefined,
          color,
          repeat: 'weekly',
          seriesId,
        });
      }
    }

    setEvents((prev) => [...prev, ...newEvents]);
    setShowAdd(false);
    resetForm();
  }

  function deleteEvent(eventId: string) {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  function deleteSeries(seriesId: string) {
    setEvents((prev) => prev.filter((e) => e.seriesId !== seriesId));
  }

  const today = getToday();

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Calendar</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>+ Event</Button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          className="text-[#8888a0] px-3 py-1 hover:text-white"
          onClick={() => setWeekOffset(weekOffset - 1)}
        >
          ‹
        </button>
        <button
          className="text-xs text-[#22d3ee]"
          onClick={() => { setWeekOffset(0); setSelectedDate(today); }}
        >
          Today
        </button>
        <button
          className="text-[#8888a0] px-3 py-1 hover:text-white"
          onClick={() => setWeekOffset(weekOffset + 1)}
        >
          ›
        </button>
      </div>

      {/* Week Strip */}
      <div className="flex gap-1 mb-6">
        {weekDays.map((date) => {
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const hasEvents = (eventCounts[date] || 0) > 0;

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all
                ${isSelected
                  ? 'bg-[#22d3ee]/15 border border-[#22d3ee]'
                  : isToday
                    ? 'bg-[#1a1a24] border border-[#2a2a3a]'
                    : 'border border-transparent'}`}
            >
              <span className="text-[10px] text-[#8888a0]">{getDayName(date)}</span>
              <span className={`text-sm font-bold ${isSelected ? 'text-[#22d3ee]' : isToday ? 'text-white' : 'text-[#8888a0]'}`}>
                {new Date(date + 'T12:00:00').getDate()}
              </span>
              {hasEvents && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Label */}
      <p className="text-sm text-[#8888a0] mb-3">
        {getMonthDay(selectedDate)}
        {selectedDate === today && <span className="text-[#22d3ee] ml-1">(Today)</span>}
      </p>

      {/* Day Events */}
      {dayEvents.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-[#555570]">Nothing scheduled</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAdd(true)}>
            + Add event
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {dayEvents.map((event) => (
            <Card key={event.id} className="flex items-start gap-3">
              <div
                className="w-1 h-full min-h-[40px] rounded-full mt-1"
                style={{ background: event.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{event.title}</p>
                {event.time && (
                  <p className="text-xs text-[#8888a0]">
                    {formatTime(event.time)}
                    {event.endTime && ` – ${formatTime(event.endTime)}`}
                  </p>
                )}
                {event.description && (
                  <p className="text-xs text-[#555570] mt-1">{event.description}</p>
                )}
                {event.repeat !== 'none' && (
                  <span className="text-[10px] text-[#f59e0b]">
                    {event.repeat === 'weekly' ? 'Weekly' : 'Daily'}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  className="text-[10px] text-[#555570] hover:text-[#f43f5e]"
                  onClick={() => deleteEvent(event.id)}
                >
                  Remove
                </button>
                {event.seriesId && (
                  <button
                    className="text-[10px] text-[#555570] hover:text-[#f43f5e]"
                    onClick={() => deleteSeries(event.seriesId!)}
                  >
                    All in series
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upcoming (next 7 days) */}
      {selectedDate === today && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-[#8888a0] mb-3 uppercase tracking-wider">Coming Up</h2>
          {(() => {
            const upcoming = events
              .filter((e) => e.date > today && e.date <= addDays(today, 7))
              .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

            if (upcoming.length === 0) {
              return <p className="text-xs text-[#555570]">Nothing in the next 7 days</p>;
            }

            return (
              <div className="space-y-2">
                {upcoming.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a1a24]/50 cursor-pointer"
                    onClick={() => setSelectedDate(event.date)}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: event.color }} />
                    <span className="text-xs text-[#8888a0] w-16">{getMonthDay(event.date)}</span>
                    <span className="text-sm flex-1 truncate">{event.title}</span>
                    {event.time && <span className="text-xs text-[#555570]">{formatTime(event.time)}</span>}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Add Event Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); resetForm(); }}>
        <h2 className="text-lg font-bold mb-4">New Event</h2>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Event name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white
              placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none"
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-[#555570]">Start time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-white mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-[#555570]">End time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-white mt-1"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-white
              placeholder:text-[#555570] focus:outline-none"
          />

          {/* Color */}
          <div>
            <label className="text-xs text-[#555570]">Color</label>
            <div className="flex gap-2 mt-1">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.color}
                  className={`w-8 h-8 rounded-full transition-all
                    ${color === c.color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#111118]' : ''}`}
                  style={{ background: c.color }}
                  onClick={() => setColor(c.color)}
                />
              ))}
            </div>
          </div>

          {/* Repeat */}
          <div>
            <label className="text-xs text-[#555570]">Repeat</label>
            <div className="flex gap-2 mt-1">
              {([['none', 'Once'], ['daily', 'Daily'], ['weekly', 'Weekly']] as const).map(([val, label]) => (
                <button
                  key={val}
                  className={`flex-1 py-2 rounded-lg border text-sm transition-all
                    ${repeat === val
                      ? 'border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]'
                      : 'border-[#2a2a3a] text-[#8888a0]'}`}
                  onClick={() => setRepeat(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Repeat count */}
          {repeat !== 'none' && (
            <div className="animate-fade-in">
              <label className="text-xs text-[#555570]">
                {repeat === 'weekly' ? 'How many weeks?' : 'How many days?'}
              </label>
              <div className="flex gap-2 mt-1">
                {(repeat === 'weekly' ? ['2', '4', '6', '8', '12'] : ['3', '5', '7', '14', '30']).map((n) => (
                  <button
                    key={n}
                    className={`flex-1 py-2 rounded-lg border text-sm font-mono transition-all
                      ${repeatWeeks === n
                        ? 'border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]'
                        : 'border-[#2a2a3a] text-[#8888a0]'}`}
                    onClick={() => setRepeatWeeks(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#555570] mt-1">
                Starting {getMonthDay(selectedDate)} — creates {repeat === 'weekly' ? repeatWeeks : repeatWeeks} events
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => { setShowAdd(false); resetForm(); }}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={!title.trim()} onClick={handleAdd}>
            {repeat !== 'none'
              ? `Create ${repeatWeeks} events`
              : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
