import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/DashboardLayout';
import type { DashTab } from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import TournamentsPage from './pages/TournamentsPage';
import MatchesPage from './pages/MatchesPage';
import StandingsPage from './pages/StandingsPage';
import { Trophy } from 'lucide-react';

function AppContent() {
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<DashTab>('overview');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
            <Trophy size={28} className="text-gray-950" />
          </div>
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <LoginPage />;
  }

  return (
    <DashboardLayout active={tab} onNavigate={setTab}>
      {tab === 'overview' && <OverviewPage onNavigate={setTab} />}
      {tab === 'tournaments' && <TournamentsPage />}
      {tab === 'matches' && <MatchesPage />}
      {tab === 'standings' && <StandingsPage />}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
