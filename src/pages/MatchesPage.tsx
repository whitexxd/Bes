import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchTournaments,
  fetchMatches,
  fetchRegistrations,
  createMatch,
  updateMatchResult,
  deleteMatch,
} from '../lib/tournamentService';
import type { Tournament, Match, Registration, Player } from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Swords, Plus, Loader2, Trash2, Trophy } from 'lucide-react';

export default function MatchesPage() {
  const { player } = useAuth();
  const isAdmin = player?.role === 'admin';

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);

  const loadTournaments = useCallback(async () => {
    const list = await fetchTournaments();
    setTournaments(list);
    if (list.length && !selectedId) setSelectedId(list[0].id);
  }, [selectedId]);

  const loadMatches = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const m = await fetchMatches(selectedId);
      setMatches(m);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const grouped = matches.reduce<Record<number, Match[]>>((acc, m) => {
    (acc[m.round] ||= []).push(m);
    return acc;
  }, {});
  const rounds = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Matches</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? 'Schedule matches and record results' : 'View match fixtures and results'}
          </p>
        </div>
        {isAdmin && selectedId && (
          <Button onClick={() => setShowCreate(true)}>
            <span className="flex items-center gap-2">
              <Plus size={16} /> Schedule
            </span>
          </Button>
        )}
      </div>

      {/* tournament selector */}
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
            <Trophy size={40} className="text-gray-700 mb-4" />
            <p className="text-gray-400 font-medium">No tournaments available</p>
          </CardBody>
        </Card>
      ) : loading ? (
        <div className="flex justify-center py-20 text-gray-500">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center py-16 text-center">
            <Swords size={40} className="text-gray-700 mb-4" />
            <p className="text-gray-400 font-medium">No matches scheduled</p>
            <p className="text-sm text-gray-600 mt-1">
              {isAdmin ? 'Schedule the first match for this tournament.' : 'Matches will appear here once scheduled.'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {rounds.map((round) => (
            <div key={round}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
                Round {round}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {grouped[round].map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    isAdmin={isAdmin}
                    onScore={() => setScoringMatch(m)}
                    onDeleted={loadMatches}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && selectedId && (
        <CreateMatchModal
          tournamentId={selectedId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadMatches();
          }}
        />
      )}

      {scoringMatch && (
        <ScoreModal
          match={scoringMatch}
          onClose={() => setScoringMatch(null)}
          onSaved={() => {
            setScoringMatch(null);
            loadMatches();
          }}
        />
      )}
    </div>
  );
}

function MatchCard({
  match,
  isAdmin,
  onScore,
  onDeleted,
}: {
  match: Match;
  isAdmin: boolean;
  onScore: () => void;
  onDeleted: () => void;
}) {
  const p1 = match.player1;
  const p2 = match.player2;
  const done = match.status === 'completed';

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-3">
          <Badge tone={done ? 'emerald' : 'amber'}>{done ? 'Completed' : 'Pending'}</Badge>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={onScore} className="text-gray-500 hover:text-emerald-400 transition-colors text-xs font-semibold">
                Record
              </button>
              <button
                onClick={async () => {
                  if (confirm('Delete this match?')) {
                    await deleteMatch(match.id);
                    onDeleted();
                  }
                }}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{p1?.name || 'TBD'}</p>
            <p className="text-xs text-gray-500 truncate">{p1?.efootball_id || '—'}</p>
          </div>

          <div className="flex items-center gap-2 px-3">
            {done ? (
              <span className="text-xl font-bold tabular-nums">
                {match.score1} <span className="text-gray-600">:</span> {match.score2}
              </span>
            ) : (
              <span className="text-gray-600 text-sm font-semibold">vs</span>
            )}
          </div>

          <div className="flex-1 min-w-0 text-right">
            <p className="font-semibold truncate">{p2?.name || 'TBD'}</p>
            <p className="text-xs text-gray-500 truncate">{p2?.efootball_id || '—'}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function CreateMatchModal({
  tournamentId,
  onClose,
  onCreated,
}: {
  tournamentId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [round, setRound] = useState(1);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRegistrations(tournamentId).then(setRegs).catch(() => setRegs([]));
  }, [tournamentId]);

  const players = regs.map((r) => r.players).filter(Boolean) as Pick<Player, 'id' | 'name' | 'efootball_id'>[];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1 || !p2 || p1 === p2) {
      setError('Select two different players');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await createMatch({
        tournament_id: tournamentId,
        player1_id: p1,
        player2_id: p2,
        round,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create match');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Schedule Match">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Round</label>
          <input
            type="number"
            min={1}
            value={round}
            onChange={(e) => setRound(Number(e.target.value))}
            className="w-full rounded-xl bg-gray-950/60 border border-gray-700 text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Player 1</label>
          <select value={p1} onChange={(e) => setP1(e.target.value)} className="w-full rounded-xl bg-gray-950/60 border border-gray-700 text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" required>
            <option value="">Select player…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.efootball_id})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Player 2</label>
          <select value={p2} onChange={(e) => setP2(e.target.value)} className="w-full rounded-xl bg-gray-950/60 border border-gray-700 text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" required>
            <option value="">Select player…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.efootball_id})</option>
            ))}
          </select>
        </div>
        {players.length < 2 && (
          <p className="text-sm text-amber-400">At least 2 registered players are needed to schedule a match.</p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={busy || players.length < 2}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : 'Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ScoreModal({ match, onClose, onSaved }: { match: Match; onClose: () => void; onSaved: () => void }) {
  const [s1, setS1] = useState(match.score1 ?? 0);
  const [s2, setS2] = useState(match.score2 ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await updateMatchResult(match.id, s1, s2);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save result');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Record Result">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center flex-1">
            <p className="font-semibold text-sm mb-2 truncate">{match.player1?.name || 'Player 1'}</p>
            <input
              type="number"
              min={0}
              value={s1}
              onChange={(e) => setS1(Number(e.target.value))}
              className="w-20 text-center text-3xl font-bold rounded-xl bg-gray-950/60 border border-gray-700 text-gray-100 px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-2xl text-gray-600 font-bold">:</span>
          <div className="text-center flex-1">
            <p className="font-semibold text-sm mb-2 truncate">{match.player2?.name || 'Player 2'}</p>
            <input
              type="number"
              min={0}
              value={s2}
              onChange={(e) => setS2(Number(e.target.value))}
              className="w-20 text-center text-3xl font-bold rounded-xl bg-gray-950/60 border border-gray-700 text-gray-100 px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : 'Save Result'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
