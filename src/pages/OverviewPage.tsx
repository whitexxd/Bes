import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchTournaments,
  fetchMyRegistrations,
  fetchMatches,
} from '../lib/tournamentService';
import type { Tournament, Registration, Match } from '../lib/supabaseClient';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Calendar, Users, Swords, Trophy, Loader2, TrendingUp } from 'lucide-react';
import type { DashTab } from '../components/DashboardLayout';

const statusTone = (s: Tournament['status']) =>
  s === 'active' ? 'emerald' : s === 'completed' ? 'slate' : 'amber';

export default function OverviewPage({ onNavigate }: { onNavigate: (tab: DashTab) => void }) {
  const { player } = useAuth();
  const isAdmin = player?.role === 'admin';

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myRegs, setMyRegs] = useState<Registration[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tours, regs] = await Promise.all([
        fetchTournaments(),
        player ? fetchMyRegistrations(player.id) : Promise.resolve([]),
      ]);
      setTournaments(tours);
      setMyRegs(regs as Registration[]);

      const active = tours.find((t) => t.status === 'active') || tours[0];
      if (active) {
        const m = await fetchMatches(active.id);
        setRecentMatches(m.filter((x) => x.status === 'completed').slice(-5).reverse());
      }
    } finally {
      setLoading(false);
    }
  }, [player]);

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

  const activeCount = tournaments.filter((t) => t.status === 'active').length;
  const upcomingCount = tournaments.filter((t) => t.status === 'upcoming').length;

  const stats = [
    { label: 'Total Tournaments', value: tournaments.length, icon: Trophy, tone: 'text-emerald-400' },
    { label: 'Active Now', value: activeCount, icon: TrendingUp, tone: 'text-sky-400' },
    { label: 'Upcoming', value: upcomingCount, icon: Calendar, tone: 'text-amber-400' },
    {
      label: isAdmin ? 'Players Managed' : 'My Registrations',
      value: isAdmin ? tournaments.length : myRegs.length,
      icon: Users,
      tone: 'text-gray-300',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Welcome, {player?.name || 'Player'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin ? 'Admin dashboard — manage the league' : 'Your tournament hub'}
        </p>
      </div>

      {/* stat cards */}
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
        {/* my registrations / recent tournaments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Calendar size={18} className="text-emerald-400" />
              {isAdmin ? 'Recent Tournaments' : 'My Registrations'}
            </h2>
            <button onClick={() => onNavigate('tournaments')} className="text-xs text-emerald-400 hover:underline">
              View all
            </button>
          </div>
          <Card>
            <CardBody className="p-0">
              {isAdmin ? (
                tournaments.length === 0 ? (
                  <p className="text-sm text-gray-500 px-6 py-8 text-center">No tournaments created yet.</p>
                ) : (
                  tournaments.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-6 py-3 border-t border-gray-800/50 first:border-t-0">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.max_players} max players</p>
                      </div>
                      <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                    </div>
                  ))
                )
              ) : myRegs.length === 0 ? (
                <p className="text-sm text-gray-500 px-6 py-8 text-center">You haven't registered for any tournaments.</p>
              ) : (
                (myRegs as (Registration & { tournaments?: { name: string; status: string } })[]).slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-6 py-3 border-t border-gray-800/50 first:border-t-0">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{r.tournaments?.name || 'Tournament'}</p>
                      <p className="text-xs text-gray-500 capitalize">{r.status}</p>
                    </div>
                    <Badge tone={statusTone(r.tournaments?.status as Tournament['status'] || 'upcoming')}>
                      {r.tournaments?.status || 'upcoming'}
                    </Badge>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        {/* recent results */}
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
                      <span className="font-semibold truncate">{m.player1?.name || 'TBD'}</span>
                      <span className="text-gray-600 text-xs">vs</span>
                      <span className="font-semibold truncate">{m.player2?.name || 'TBD'}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums">
                      {m.score1} : {m.score2}
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
