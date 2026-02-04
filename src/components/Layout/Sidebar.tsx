import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
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
          <li>
            <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-700">
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-700">
              <span>Network Configuration</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-700">
              <span>Firewall Rules</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-700">
              <span>Monitoring</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-700">
              <span>System Settings</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;