import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  PiggyBank,
  Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useHaptics } from '../../hooks/useHaptics';

const tabs = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/import', icon: PlusCircle, label: 'Import', isPrimary: true },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function TabBar() {
  const { selectionChanged } = useHaptics();
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      selectionChanged();
      prevPath.current = location.pathname;
    }
  }, [location.pathname, selectionChanged]);

  return (
    <nav className="bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                tab.isPrimary
                  ? isActive
                    ? 'text-primary'
                    : 'text-primary/70'
                  : isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                {tab.isPrimary ? (
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center -mt-4',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/90 text-primary-foreground'
                    )}
                  >
                    <tab.icon className="h-5 w-5" />
                  </div>
                ) : (
                  <tab.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                )}
                <span className="text-[10px] font-medium">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
