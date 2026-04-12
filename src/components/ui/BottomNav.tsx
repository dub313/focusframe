import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/add-task', label: 'Add', icon: '➕' },
  { path: '/calendar', label: 'Calendar', icon: '📅' },
  { path: '/growth', label: 'Growth', icon: '📊' },
  { path: '/more', label: 'More', icon: '⚙️' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-md border-t border-[#2a2a3a] safe-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto h-16">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all
                ${active ? 'text-[#22d3ee]' : 'text-[#555570] hover:text-[#8888a0]'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
