import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Bell, Users, User } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/circle', icon: Users, label: 'My Circle' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on room/verification pages
  const hidePaths = ['/join', '/live', '/verify'];
  if (hidePaths.some((p) => location.pathname.includes(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-lg flex items-center justify-around py-2">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors duration-300 ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-body">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
