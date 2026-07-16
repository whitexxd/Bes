import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Label, Textarea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Calendar, Plus, Trash2, Play, CircleCheck as CheckCircle, Loader as Loader2, Trophy, CircleAlert as AlertCircle } from 'lucide-react';
import {
  fetchTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
} from '../lib/tournamentService';
import type { Tournament } from '../lib/supabaseClient';
import { useEffect, useCallback } from 'react';

const statusTone: Record<Tournament['status'], 'amber' | 'emerald' | 'slate'> = {
  upcoming: 'amber',
  ongoing: 'emerald',
  completed: 'slate',
};

const statusFlow: Record<Tournament['status'], Tournament['status'] | null> = {
  upcoming: 'ongoing',
  ongoing: 'completed',
  completed: null,
};

const statusActionLabel: Record<Tournament['status'], string> = {
  upcoming: 'Set Ongoing',
  ongoing: 'Set Completed',
  completed: 'Completed',
};

export default function TournamentsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchTournaments();
      setTournaments(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (t: Tournament) => {
    const next = statusFlow[t.status];
    if (!next) return;
    setBusyId(t.id);
    try {
      await updateTournament(t.id, { status: next });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tournament');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteTournament(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tournament');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tournaments</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage tournament events</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="md">
          <span className="flex items-center gap-2">
            <Plus size={18} /> Create
          </span>
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400">×</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : tournaments.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center py-16 text-center">
            <Trophy size={40} className="text-gray-700 mb-4" />
            <p className="text-gray-400 font-medium">No tournaments yet</p>
            <p className="text-sm text-gray-600 mt-1">Click "Create" to add your first tournament.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments.map((t) => {
            const next = statusFlow[t.status];
            return (
              <Card key={t.id}>
                <CardHeader className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">{t.name}</h3>
                    {t.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>}
                  </div>
                  <Badge tone={statusTone[t.status]}>{t.status}</Badge>
                </CardHeader>
                <CardBody>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    {t.start_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} /> {t.start_date}
                      </span>
                    )}
                    {t.end_date && <span className="text-gray-600">→ {t.end_date}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {next && (
                      <Button
                        size="sm"
                        variant={next === 'ongoing' ? 'primary' : 'outline'}
                        onClick={() => handleStatusChange(t)}
                        disabled={busyId === t.id}
                      >
                        <span className="flex items-center gap-1.5">
                          {next === 'ongoing' ? <Play size={14} /> : <CheckCircle size={14} />}
                          {statusActionLabel[t.status]}
                        </span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(t.id)}
                      disabled={busyId === t.id}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                    {busyId === t.id && <Loader2 size={14} className="animate-spin text-gray-500" />}
                  </div>
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

function CreateTournamentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tournament name is required');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await createTournament({
        name: name.trim(),
        description: description.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
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
    <Modal open onClose={onClose} title="Create Tournament">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer Cup 2026" required />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tournament description"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
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
            {busy ? <Loader2 size={18} className="animate-spin" /> : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
