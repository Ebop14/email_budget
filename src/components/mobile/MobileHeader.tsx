interface MobileHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function MobileHeader({ title, actions }: MobileHeaderProps) {
  return (
    <header className="h-12 px-4 flex items-center justify-between bg-card border-b border-border shrink-0">
      <h1 className="text-lg font-semibold truncate">{title}</h1>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </header>
  );
}
