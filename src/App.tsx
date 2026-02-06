import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { MobileLayout } from './components/mobile/MobileLayout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Import } from './pages/Import';
import { Budgets } from './pages/Budgets';
import { Settings } from './pages/Settings';
import { MobileDashboard } from './pages/mobile/MobileDashboard';
import { MobileTransactions } from './pages/mobile/MobileTransactions';
import { MobileImport } from './pages/mobile/MobileImport';
import { MobileBudgets } from './pages/mobile/MobileBudgets';
import { MobileSettings } from './pages/mobile/MobileSettings';
import { GmailSyncNotification } from './components/gmail/GmailSyncNotification';
import { initializeTheme } from './stores/settingsStore';
import { usePlatform } from './hooks/usePlatform';

function App() {
  const { isMobile } = usePlatform();

  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {isMobile ? (
          <Route path="/" element={<MobileLayout />}>
            <Route index element={<MobileDashboard />} />
            <Route path="transactions" element={<MobileTransactions />} />
            <Route path="import" element={<MobileImport />} />
            <Route path="budgets" element={<MobileBudgets />} />
            <Route path="settings" element={<MobileSettings />} />
          </Route>
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="import" element={<Import />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        )}
      </Routes>
      <GmailSyncNotification />
    </BrowserRouter>
  );
}

export default App;
