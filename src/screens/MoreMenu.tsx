import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';

const MENU_ITEMS = [
  { path: '/vault', emoji: '🏦', label: 'The Vault', desc: 'XP economy & rewards' },
  { path: '/chat', emoji: '🤖', label: 'Vega Jr.', desc: 'AI coach — get unstuck' },
  { path: '/focus', emoji: '⏱️', label: 'Focus Mode', desc: 'Pomodoro timer' },
  { path: '/mood', emoji: '😊', label: 'Mood Check', desc: 'Track how you feel' },
  { path: '/routines', emoji: '📝', label: 'Routines', desc: 'Morning & evening' },
  { path: '/guide', emoji: '📖', label: 'How It Works', desc: 'App walkthrough guide' },
  { path: '/parent', emoji: '🔐', label: 'Parent Config', desc: 'Rewards & settings (PIN)' },
  { path: '/settings', emoji: '⚙️', label: 'Settings', desc: 'App preferences' },
];

export default function MoreMenu() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <h1 className="text-xl font-bold mb-6">More</h1>
      <div className="space-y-3">
        {MENU_ITEMS.map((item) => (
          <Card
            key={item.path}
            className="flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => navigate(item.path)}
          >
            <span className="text-2xl">{item.emoji}</span>
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-[#555570]">{item.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
