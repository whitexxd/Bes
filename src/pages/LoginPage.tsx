import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Trophy, User, Gamepad2, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { join } = useAuth();
  const [name, setName] = useState('');
  const [efootballId, setEfootballId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await join(name.trim(), efootballId.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
            <Trophy size={32} className="text-gray-950" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">PES Tournament Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your details to join</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/70 backdrop-blur-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Player Name</Label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>eFootball ID</Label>
              <div className="relative">
                <Gamepad2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input
                  type="text"
                  value={efootballId}
                  onChange={(e) => setEfootballId(e.target.value)}
                  placeholder="Your eFootball ID"
                  required
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Enter <span className="text-emerald-400 font-semibold">admin</span> as your eFootball ID for admin access.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Joining…
                </span>
              ) : (
                'Join'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          PES Tournament Manager · Built for the community
        </p>
      </div>
    </div>
  );
}
