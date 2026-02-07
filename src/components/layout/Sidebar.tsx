import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Upload,
  PiggyBank,
  Settings,
  Wallet,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { GmailSyncBadge } from '../gmail/GmailSyncBadge';
import { useGmailStore } from '../../stores/gmailStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/import', icon: Upload, label: 'Import' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const status = useGmailStore((s) => s.status);
  const syncStatus = useGmailStore((s) => s.syncStatus);

  return (
    <aside className="w-64 glass-strong flex flex-col border-r-0">
      {/* Logo */}
      <div className="h-18 flex items-center px-6 py-5">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mr-3">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <span className="text-lg font-bold tracking-tight">Email Budget</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pt-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Gmail Status + Footer */}
      <div className="px-4 pb-4">
        <GmailSyncBadge
          isConnected={status?.is_connected ?? false}
          syncStatus={syncStatus}
        />
        <p className="text-[11px] text-muted-foreground/60 text-center mt-3">
          Email Budget v0.1.0
        </p>
      </div>
    </aside>
  );
}
