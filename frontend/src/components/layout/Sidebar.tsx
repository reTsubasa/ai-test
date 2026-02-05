import {
  LayoutDashboard,
  Network,
  Activity,
  Users,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Network', href: '/network', icon: Network },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      <div className="p-6">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/dashboard'}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
              <ChevronRight
                className={clsx(
                  'ml-auto h-4 w-4 transition-opacity',
                  'opacity-0 group-hover:opacity-100',
                )}
              />
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t p-6">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">System Status</p>
          <p className="mt-1 text-xs text-muted-foreground">All systems operational</p>
        </div>
      </div>
    </aside>
  );
}