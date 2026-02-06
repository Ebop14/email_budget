import { Outlet, useLocation } from 'react-router-dom';
import { SafeArea } from './SafeArea';
import { TabBar } from './TabBar';

export function MobileLayout() {
  const location = useLocation();

  return (
    <SafeArea className="bg-background">
      <main key={location.pathname} className="flex-1 flex flex-col overflow-hidden animate-page-enter">
        <Outlet />
      </main>
      <TabBar />
    </SafeArea>
  );
}
