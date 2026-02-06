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
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Wallet className="h-6 w-6 text-primary mr-2" />
        <span className="text-lg font-semibold">Email Budget</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Gmail Status + Footer */}
      <div className="border-t border-border">
        <GmailSyncBadge
          isConnected={status?.is_connected ?? false}
          syncStatus={syncStatus}
        />
        <p className="text-xs text-muted-foreground text-center pb-4">
          Email Budget v0.1.0
        </p>
      </div>
    </aside>
  );
}
