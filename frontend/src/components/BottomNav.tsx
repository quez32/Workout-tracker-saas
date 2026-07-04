import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/workouts', label: 'Workouts', icon: '💪' },
  { to: '/plans', label: 'Plans', icon: '🎯' },
  { to: '/profile', label: 'Profile', icon: '👤' },
] as const;

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}