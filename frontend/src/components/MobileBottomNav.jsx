import { Link, useLocation } from 'react-router-dom';
import { Home, Sprout, Calendar, User } from 'lucide-react';

const tabs = [
  { to: '/dashboard',   icon: Home },
  { to: '/monitoring',  icon: Sprout },
  { to: '/crop-status', icon: Calendar },
  { to: '/settings',    icon: User },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const active = (to) => pathname === to || pathname.startsWith(to);

  return (
    <div className="mob-nav-wrap">
      <nav className="mob-nav-pill">
        {tabs.map(({ to, icon: Icon }) => (
          <Link key={to} to={to} className={`mob-nav-tab ${active(to) ? 'active' : ''}`}>
            <Icon size={26} strokeWidth={active(to) ? 2.5 : 2} />
          </Link>
        ))}
      </nav>
    </div>
  );
}
