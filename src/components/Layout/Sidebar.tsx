import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { hasRole } = useAuth();

  // Define navigation items with role requirements
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', roles: ['user'] },
    { name: 'Network Configuration', path: '/network-config', roles: ['user'] },
    { name: 'Firewall Rules', path: '/firewall', roles: ['user', 'admin'] },
    { name: 'Monitoring', path: '/monitoring', roles: ['user', 'admin'] },
    { name: 'System Settings', path: '/settings', roles: ['admin'] },
    { name: 'User Management', path: '/users', roles: ['admin'] }
  ];

  return (
    <aside className={`bg-gray-800 text-white w-64 min-h-screen transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:relative md:translate-x-0 z-10`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">VyOS Web UI</h2>
        <button
          onClick={toggleSidebar}
          className="md:hidden text-gray-300 hover:text-white"
        >
          ✕
        </button>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            // Check if user has required roles for this item
            const canAccess = item.roles.length === 0 || hasRole(item.roles);

            return canAccess ? (
              <li key={item.name}>
                <a
                  href={item.path}
                  className="flex items-center p-2 rounded-md hover:bg-gray-700"
                >
                  <span>{item.name}</span>
                </a>
              </li>
            ) : null;
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;