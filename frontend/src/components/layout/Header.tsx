import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm z-10 border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-900">VyOS Network Management</h1>
          </div>
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-right hidden md:block">
                  <p className="text-gray-900 font-medium">{user?.username || 'Guest'}</p>
                  <p className="text-gray-500 text-xs">Administrator</p>
                </div>
                <button
                  onClick={logout}
                  className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Logout"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-800 font-medium text-sm">
                      {user?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;