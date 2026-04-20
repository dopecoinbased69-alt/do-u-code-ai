import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Code, Eye, Database, LogOut, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ide', icon: Code, label: 'IDE' },
  { to: '/preview', icon: Eye, label: 'Preview' },
  { to: '/vault', icon: Database, label: 'Vault' },
];

export default function AppSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="w-16 lg:w-56 h-screen glass border-r border-white/10 flex flex-col shrink-0">
      <div className="p-3 lg:p-4 flex items-center gap-2 border-b border-white/10">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <span className="hidden lg:block font-bold text-gradient text-lg">CodeForge</span>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/30 glow-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="hidden lg:block">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
