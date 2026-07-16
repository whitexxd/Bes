import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchTournaments, fetchMatches } from '../lib/tournamentService';
import type { Tournament, Match } from '../lib/supabaseClient';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Calendar, Swords, Trophy, Loader as Loader2, TrendingUp, CircleCheck as CheckCircle } from 'lucide-react';
import type { DashTab } from '../components/DashboardLayout';

const statusTone: Record<Tournament['status'], 'amber' | 'emerald' | 'slate'> = {
  upcoming: 'amber',
  ongoing: 'emerald',
  completed: 'slate',
};

export default function OverviewPage({ onNavigate }: { onNavigate: (tab: DashTab) => void }) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tours = await fetchTournaments();
      setTournaments(tours);

      const active = tours.find((t) => t.status === 'ongoing') || tours[0];
      if (active) {
        const matches = await fetchMatches(active.id);
        setRecentMatches(matches.filter((m) => m.status === 'finished').slice(-5).reverse());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-gray-500">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  const activeCount = tournaments.filter((t) => t.status === 'ongoing').length;
  const upcomingCount = tournaments.filter((t) => t.status === 'upcoming').length;
  const completedCount = tournaments.filter((t) => t.status === 'completed').length;

  const stats = [
    { label: 'Total Tournaments', value: tournaments.length, icon: Trophy, tone: 'text-emerald-400' },
    { label: 'Ongoing', value: activeCount, icon: TrendingUp, tone: 'text-sky-400' },
    { label: 'Upcoming', value: upcomingCount, icon: Calendar, tone: 'text-amber-400' },
    { label: 'Completed', value: completedCount, icon: CheckCircle, tone: 'text-gray-300' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Welcome, {profile?.username || profile?.full_name || 'User'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin ? 'Admin dashboard — manage the league' : 'Your tournament hub'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardBody className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gray-800/60 flex items-center justify-center ${s.tone}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Calendar size={18} className="text-emerald-400" />
              Tournaments
            </h2>
            <button onClick={() => onNavigate('tournaments')} className="text-xs text-emerald-400 hover:underline">
              View all
            </button>
          </div>
          <Card>
            <CardBody className="p-0">
              {tournaments.length === 0 ? (
                <p className="text-sm text-gray-500 px-6 py-8 text-center">No tournaments created yet.</p>
              ) : (
                tournaments.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-6 py-3 border-t border-gray-800/50 first:border-t-0">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{t.name}</p>
                      {t.start_date && <p className="text-xs text-gray-500">{t.start_date}</p>}
                    </div>
                    <Badge tone={statusTone[t.status]}>{t.status}</Badge>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Swords size={18} className="text-sky-400" />
              Recent Results
            </h2>
            <button onClick={() => onNavigate('matches')} className="text-xs text-emerald-400 hover:underline">
              View all
            </button>
          </div>
          <Card>
            <CardBody className="p-0">
              {recentMatches.length === 0 ? (
                <p className="text-sm text-gray-500 px-6 py-8 text-center">No completed matches yet.</p>
              ) : (
                recentMatches.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-6 py-3 border-t border-gray-800/50 first:border-t-0">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <span className="font-semibold truncate">{m.team1_name}</span>
                      <span className="text-gray-600 text-xs">vs</span>
                      <span className="font-semibold truncate">{m.team2_name}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums">
                      {m.team1_score} : {m.team2_score}
                    </span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
