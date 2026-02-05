import React from 'react';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import VyOSMonitoringDashboard from '../components/Monitoring/VyOSMonitoringDashboard';

const MonitoringPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="VyOS Web UI" subtitle="Monitoring & Analytics" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <VyOSMonitoringDashboard />
        </main>
      </div>
    </div>
  );
};

export default MonitoringPage;