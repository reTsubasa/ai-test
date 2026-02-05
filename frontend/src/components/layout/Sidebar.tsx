import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Network Config', href: '/network-config', icon: '🌐' },
  { name: 'Monitoring', href: '/monitoring', icon: '📈' },
  { name: 'Users', href: '/users', icon: '👥' },
  { name: 'System', href: '/system', icon: '⚙️' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-indigo-600">VyOS Web UI</h1>
          </div>
          <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  location.pathname === item.href
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <a href="#" className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div>
                <img
                  className="inline-block h-9 w-9 rounded-full"
                  src="https://via.placeholder.com/40x40"
                  alt=""
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Admin User</p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">admin@example.com</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;