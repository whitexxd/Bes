import { useEffect, useState, useCallback } from 'react';
import {
  fetchTournaments,
  fetchMatches,
} from '../lib/tournamentService';
import type { Tournament, Match, Player } from '../lib/supabaseClient';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Loader2, BarChart3, Trophy, Medal } from 'lucide-react';

type Standing = {
  player: Pick<Player, 'id' | 'name' | 'efootball_id'>;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number;
};

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
      const matches = await fetchMatches(selectedId);
      const completed = matches.filter((m) => m.status === 'completed' && m.player1 && m.player2);
      const map = new Map<string, Standing>();

      const ensure = (p: NonNullable<Match['player1']>) => {
        if (!map.has(p.id)) {
          map.set(p.id, { player: p, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 });
        }
        return map.get(p.id)!;
      };

      for (const m of completed) {
        const a = ensure(m.player1!);
        const b = ensure(m.player2!);
        a.played++; b.played++;
        a.gf += m.score1 ?? 0; a.ga += m.score2 ?? 0;
        b.gf += m.score2 ?? 0; b.ga += m.score1 ?? 0;
        if ((m.score1 ?? 0) > (m.score2 ?? 0)) {
          a.wins++; a.points += 3; b.losses++;
        } else if ((m.score1 ?? 0) < (m.score2 ?? 0)) {
          b.wins++; b.points += 3; a.losses++;
        } else {
          a.draws++; b.draws++; a.points++; b.points++;
        }
      }

      const sorted = Array.from(map.values()).sort((x, y) => {
        if (y.points !== x.points) return y.points - x.points;
        const gdY = y.gf - y.ga; const gdX = x.gf - x.ga;
        if (gdY !== gdX) return gdY - gdX;
        return y.gf - x.gf;
      });
      setStandings(sorted);
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
        <p className="text-sm text-gray-500 mt-1">Live league table based on completed matches</p>
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
            <p className="text-gray-400 font-medium">No completed matches yet</p>
            <p className="text-sm text-gray-600 mt-1">Standings will appear once matches are recorded.</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="grid grid-cols-12 gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <span className="col-span-1">#</span>
              <span className="col-span-4">Player</span>
              <span className="col-span-1 text-center">P</span>
              <span className="col-span-1 text-center">W</span>
              <span className="col-span-1 text-center">D</span>
              <span className="col-span-1 text-center">L</span>
              <span className="col-span-1 text-center">GF</span>
              <span className="col-span-1 text-center">GA</span>
              <span className="col-span-1 text-center">PTS</span>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {standings.map((s, i) => (
              <div
                key={s.player.id}
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
                  <p className="font-semibold truncate">{s.player.name}</p>
                  <p className="text-xs text-gray-500 truncate">{s.player.efootball_id || '—'}</p>
                </div>
                <span className="col-span-1 text-center tabular-nums">{s.played}</span>
                <span className="col-span-1 text-center tabular-nums text-emerald-400">{s.wins}</span>
                <span className="col-span-1 text-center tabular-nums text-gray-400">{s.draws}</span>
                <span className="col-span-1 text-center tabular-nums text-red-400">{s.losses}</span>
                <span className="col-span-1 text-center tabular-nums">{s.gf}</span>
                <span className="col-span-1 text-center tabular-nums">{s.ga}</span>
                <span className="col-span-1 text-center tabular-nums font-bold">{s.points}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
