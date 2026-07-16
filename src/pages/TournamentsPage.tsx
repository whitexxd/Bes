import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  fetchRegistrations,
  registerForTournament,
  withdrawFromTournament,
} from '../lib/tournamentService';
import type { Tournament, Registration } from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Input, Textarea, Label } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Calendar, Users, Plus, Trash2, CheckCircle2, LogIn, Loader2, Trophy } from 'lucide-react';

const statusTone = (s: Tournament['status']) =>
  s === 'active' ? 'emerald' : s === 'completed' ? 'slate' : 'amber';

export default function TournamentsPage() {
  const { player } = useAuth();
  const isAdmin = player?.role === 'admin';

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [regMap, setRegMap] = useState<Record<string, Registration[]>>({});
  const [myRegs, setMyRegs] = useState<Record<string, Registration | undefined>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchTournaments();
      setTournaments(list);
      const allRegs: Record<string, Registration[]> = {};
      const mine: Record<string, Registration | undefined> = {};
      await Promise.all(
        list.map(async (t) => {
          const regs = await fetchRegistrations(t.id);
          allRegs[t.id] = regs;
          mine[t.id] = regs.find((r) => r.player_id === player?.id);
        }),
      );
      setRegMap(allRegs);
      setMyRegs(mine);
    } finally {
      setLoading(false);
    }
  }, [player?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRegister = async (tournamentId: string) => {
    if (!player) return;
    setBusyId(tournamentId);
    try {
      await registerForTournament(tournamentId, player.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setBusyId(null);
    }
  };

  const handleWithdraw = async (registrationId: string, tournamentId: string) => {
    setBusyId(tournamentId);
    try {
      await withdrawFromTournament(registrationId);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to withdraw');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tournament? This cannot be undone.')) return;
    try {
      await deleteTournament(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tournaments</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? 'Create and manage tournaments' : 'Browse and register for tournaments'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)}>
            <span className="flex items-center gap-2">
              <Plus size={16} /> New
            </span>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : tournaments.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center py-16 text-center">
            <Trophy size={40} className="text-gray-700 mb-4" />
            <p className="text-gray-400 font-medium">No tournaments yet</p>
            <p className="text-sm text-gray-600 mt-1">
              {isAdmin ? 'Create the first tournament to get started.' : 'Check back soon for new tournaments.'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments.map((t) => {
            const regs = regMap[t.id] || [];
            const myReg = myRegs[t.id];
            const isFull = regs.length >= t.max_players;
            return (
              <Card key={t.id} className="hover:border-gray-700 transition-colors">
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{t.name}</h3>
                      <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {t.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{t.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Users size={14} /> {regs.length}/{t.max_players}
                    </span>
                    {t.start_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} /> {new Date(t.start_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {isAdmin ? (
                    <AdminTournamentControls tournament={t} regCount={regs.length} onUpdated={load} />
                  ) : myReg ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <CheckCircle2 size={16} /> Registered
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={busyId === t.id}
                        onClick={() => handleWithdraw(myReg.id, t.id)}
                      >
                        {busyId === t.id ? <Loader2 size={14} className="animate-spin" /> : 'Withdraw'}
                      </Button>
                    </div>
                  ) : isFull ? (
                    <Button variant="secondary" size="sm" className="w-full" disabled>
                      Tournament Full
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={busyId === t.id}
                      onClick={() => handleRegister(t.id)}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {busyId === t.id ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                        Register
                      </span>
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateTournamentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AdminTournamentControls({
  tournament,
  regCount,
  onUpdated,
}: {
  tournament: Tournament;
  regCount: number;
  onUpdated: () => void;
}) {
  const nextStatus: Tournament['status'] =
    tournament.status === 'upcoming' ? 'active' : tournament.status === 'active' ? 'completed' : 'upcoming';

  const cycle = async () => {
    try {
      await updateTournament(tournament.id, { status: nextStatus });
      onUpdated();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{regCount} registered</span>
      <Button variant="outline" size="sm" className="ml-auto" onClick={cycle}>
        Set {nextStatus}
      </Button>
    </div>
  );
}

function CreateTournamentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [startDate, setStartDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await createTournament({
        name: name.trim(),
        description: description.trim(),
        max_players: maxPlayers,
        start_date: startDate || null,
      });
      onCreated();
    } catch (err) {
      console.error('Failed to create tournament:', err);
      setError(err instanceof Error ? err.message : 'Failed to create tournament');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="New Tournament">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Tournament Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer Showdown" required />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Details about the tournament…"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Max Players</Label>
            <Input
              type="number"
              min={2}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
