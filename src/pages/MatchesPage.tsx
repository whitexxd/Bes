import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchTournaments, fetchMatches, createMatch, updateMatch, deleteMatch } from '../lib/tournamentService';
import type { Tournament, Match } from '../lib/supabaseClient';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Swords, Plus, Trash2, Loader2, AlertCircle, CheckCircle, Play } from 'lucide-react';

const stageTone: Record<Match['stage'], 'slate' | 'sky' | 'amber' | 'emerald'> = {
  group: 'slate',
  quarter: 'sky',
  semi: 'amber',
  final: 'emerald',
};

const statusTone: Record<Match['status'], 'amber' | 'emerald' | 'slate'> = {
  scheduled: 'amber',
  ongoing: 'emerald',
  finished: 'slate',
};

const stageLabels: Record<Match['stage'], string> = {
  group: 'Group Stage',
  quarter: 'Quarter-Final',
  semi: 'Semi-Final',
  final: 'Final',
};

export default function MatchesPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadTournaments = useCallback(async () => {
    try {
      const list = await fetchTournaments();
      setTournaments(list);
      if (list.length && !selectedId) setSelectedId(list[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournaments');
    }
  }, [selectedId]);

  const loadMatches = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const list = await fetchMatches(selectedId);
      setMatches(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
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

  const handleScoreSave = async (m: Match, s1: number, s2: number) => {
    setBusyId(m.id);
    try {
      await updateMatch(m.id, { team1_score: s1, team2_score: s2, status: 'finished' });
      await loadMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update match');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusCycle = async (m: Match) => {
    const next: Match['status'] = m.status === 'scheduled' ? 'ongoing' : m.status === 'ongoing' ? 'finished' : 'scheduled';
    setBusyId(m.id);
    try {
      await updateMatch(m.id, { status: next });
      await loadMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update match');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteMatch(id);
      await loadMatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete match');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Matches</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule and record match results</p>
        </div>
        {selectedId && (
          <Button onClick={() => setShowCreate(true)} size="md">
            <span className="flex items-center gap-2">
              <Plus size={18} /> Add Match
            </span>
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400">×</button>
        </div>
      )}

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
            <Swords size={40} className="text-gray-700 mb-4" />
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
            <p className="text-gray-400 font-medium">No matches scheduled yet</p>
            <p className="text-sm text-gray-600 mt-1">Click "Add Match" to create one.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <MatchRow
              key={m.id}
              match={m}
              busy={busyId === m.id}
              onScoreSave={handleScoreSave}
              onStatusCycle={handleStatusCycle}
              onDelete={handleDelete}
            />
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
    </div>
  );
}

function MatchRow({
  match: m,
  busy,
  onScoreSave,
  onStatusCycle,
  onDelete,
}: {
  match: Match;
  busy: boolean;
  onScoreSave: (m: Match, s1: number, s2: number) => void;
  onStatusCycle: (m: Match) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [s1, setS1] = useState(String(m.team1_score));
  const [s2, setS2] = useState(String(m.team2_score));

  useEffect(() => {
    setS1(String(m.team1_score));
    setS2(String(m.team2_score));
  }, [m.team1_score, m.team2_score]);

  return (
    <Card>
      <CardBody className="flex items-center gap-4 flex-wrap">
        <Badge tone={stageTone[m.stage]}>{stageLabels[m.stage]}</Badge>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-semibold truncate flex-1 text-right">{m.team1_name}</span>
          {editing ? (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                value={s1}
                onChange={(e) => setS1(e.target.value)}
                className="w-14 text-center px-2 py-1.5"
              />
              <span className="text-gray-600 text-xs">:</span>
              <Input
                type="number"
                min={0}
                value={s2}
                onChange={(e) => setS2(e.target.value)}
                className="w-14 text-center px-2 py-1.5"
              />
            </div>
          ) : (
            <span className="text-lg font-bold tabular-nums px-3">
              {m.status === 'finished' ? `${m.team1_score} : ${m.team2_score}` : 'vs'}
            </span>
          )}
          <span className="font-semibold truncate flex-1">{m.team2_name}</span>
        </div>

        <Badge tone={statusTone[m.status]}>{m.status}</Badge>

        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <Button
                size="sm"
                onClick={() => {
                  onScoreSave(m, parseInt(s1) || 0, parseInt(s2) || 0);
                  setEditing(false);
                }}
                disabled={busy}
              >
                <CheckCircle size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={busy}>
                Score
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onStatusCycle(m)}
                disabled={busy}
                title="Cycle status"
              >
                <Play size={14} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(m.id)}
                disabled={busy}
                className="text-red-400 hover:bg-red-500/10"
              >
                <Trash2 size={14} />
              </Button>
            </>
          )}
          {busy && <Loader2 size={14} className="animate-spin text-gray-500" />}
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
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [stage, setStage] = useState<Match['stage']>('group');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1.trim() || !team2.trim()) {
      setError('Both team names are required');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await createMatch({
        tournament_id: tournamentId,
        team1_name: team1.trim(),
        team2_name: team2.trim(),
        stage,
      });
      onCreated();
    } catch (err) {
      console.error('Failed to create match:', err);
      setError(err instanceof Error ? err.message : 'Failed to create match');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Add Match">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Team 1</Label>
            <Input value={team1} onChange={(e) => setTeam1(e.target.value)} placeholder="Team A" required />
          </div>
          <div>
            <Label>Team 2</Label>
            <Input value={team2} onChange={(e) => setTeam2(e.target.value)} placeholder="Team B" required />
          </div>
        </div>
        <div>
          <Label>Stage</Label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as Match['stage'])}
            className="w-full rounded-xl bg-gray-950/60 border border-gray-700 text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="group">Group Stage</option>
            <option value="quarter">Quarter-Final</option>
            <option value="semi">Semi-Final</option>
            <option value="final">Final</option>
          </select>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : 'Add Match'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
