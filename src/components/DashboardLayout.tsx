import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, LayoutDashboard, Calendar, Swords, BarChart3, LogOut, Menu, X, Shield, CircleUser as UserCircle } from 'lucide-react';

export type DashTab = 'overview' | 'tournaments' | 'matches' | 'standings';

const navItems: { key: DashTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'tournaments', label: 'Tournaments', icon: Calendar },
  { key: 'matches', label: 'Matches', icon: Swords },
  { key: 'standings', label: 'Standings', icon: BarChart3 },
];

export function DashboardLayout({
  active,
  onNavigate,
  children,
}: {
  active: DashTab;
  onNavigate: (tab: DashTab) => void;
  children: ReactNode;
}) {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = profile?.role === 'admin';
  const displayName = profile?.username || profile?.full_name || 'User';

  const NavList = () => (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => {
              onNavigate(item.key);
              setMobileOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 border border-transparent'
            }`}
          >
            <Icon size={18} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-gray-800 bg-gray-900/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Trophy size={22} className="text-gray-950" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Tournament Manager</p>
            <p className="text-xs text-gray-500">League HQ</p>
          </div>
        </div>
        <div className="px-4 mt-2 flex-1">
          <NavList />
        </div>
        <div className="px-4 pb-6">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-950/50 border border-gray-800">
            {isAdmin ? (
              <Shield size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <UserCircle size={18} className="text-gray-400 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{profile?.role || 'user'}</p>
            </div>
            <button
              onClick={signOut}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Trophy size={18} className="text-gray-950" />
          </div>
          <span className="font-bold text-sm">Tournament Manager</span>
        </div>
        <button onClick={() => setMobileOpen((v) => !v)} className="text-gray-300">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-16 left-0 right-0 bg-gray-900 border-b border-gray-800 p-4 shadow-xl">
            <NavList />
            <button
              onClick={() => {
                signOut();
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2.5 mt-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 w-full"
            >
              <LogOut size={18} /> Sign out
            </button>
          </div>
        </div>
      )}

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}
