import { useEffect, useState, useCallback } from 'react';
import { fetchTournaments, fetchStandings } from '../lib/tournamentService';
import type { Tournament, Standing } from '../lib/supabaseClient';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Loader as Loader2, BarChart3, Trophy, Medal } from 'lucide-react';

export default function StandingsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTournaments = useCallback(async () => {
    const list = await fetchTournaments();
    setTournaments(list);
    if (list.length && !selectedId) setSelectedId(list[0].id);
  }, [selectedId]);

  const loadStandings = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const list = await fetchStandings(selectedId);
      setStandings(list);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Standings</h1>
        <p className="text-sm text-gray-500 mt-1">League tables for each tournament</p>
      </div>

      {tournaments.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedId === t.id
                  ? 'bg-emerald-500 text-gray-950'
                  : 'bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {!selectedId ? (
        <Card>
          <CardBody className="flex flex-col items-center py-16 text-center">
            <BarChart3 size={40} className="text-gray-700 mb-4" />
            <p className="text-gray-400 font-medium">No tournaments available</p>
          </CardBody>
        </Card>
      ) : loading ? (
        <div className="flex justify-center py-20 text-gray-500">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : standings.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center py-16 text-center">
            <Trophy size={40} className="text-gray-700 mb-4" />
            <p className="text-gray-400 font-medium">No standings data yet</p>
            <p className="text-sm text-gray-600 mt-1">Standings will appear once matches are recorded.</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="grid grid-cols-12 gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <span className="col-span-1">#</span>
              <span className="col-span-4">Team</span>
              <span className="col-span-1 text-center">P</span>
              <span className="col-span-1 text-center">W</span>
              <span className="col-span-1 text-center">D</span>
              <span className="col-span-1 text-center">L</span>
              <span className="col-span-1 text-center">GD</span>
              <span className="col-span-2 text-center">PTS</span>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {standings.map((s, i) => (
              <div
                key={s.id}
                className={`grid grid-cols-12 gap-2 items-center px-6 py-3 text-sm border-t border-gray-800/50 ${
                  i === 0 ? 'bg-emerald-500/5' : ''
                }`}
              >
                <span className="col-span-1 flex items-center">
                  {i === 0 ? (
                    <Trophy size={16} className="text-emerald-400" />
                  ) : i === 1 ? (
                    <Medal size={16} className="text-gray-400" />
                  ) : i === 2 ? (
                    <Medal size={16} className="text-amber-600" />
                  ) : (
                    <span className="text-gray-500 font-semibold">{i + 1}</span>
                  )}
                </span>
                <div className="col-span-4 min-w-0">
                  <p className="font-semibold truncate">{s.team_name}</p>
                </div>
                <span className="col-span-1 text-center tabular-nums">{s.played}</span>
                <span className="col-span-1 text-center tabular-nums text-emerald-400">{s.won}</span>
                <span className="col-span-1 text-center tabular-nums text-gray-400">{s.drawn}</span>
                <span className="col-span-1 text-center tabular-nums text-red-400">{s.lost}</span>
                <span className="col-span-1 text-center tabular-nums">
                  {s.goal_difference > 0 ? '+' : ''}{s.goal_difference}
                </span>
                <span className="col-span-2 text-center tabular-nums font-bold text-base">{s.points}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
