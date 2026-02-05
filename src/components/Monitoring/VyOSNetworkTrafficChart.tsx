import React, { useEffect, useRef } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useMonitoring } from '../../hooks/useMonitoring';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const VyOSNetworkTrafficChart: React.FC = () => {
  const { traffic } = useMonitoring();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy previous chart instance if exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Prepare data for charts
    const trafficData = {
      labels: ['Incoming', 'Outgoing'],
      datasets: [{
        label: 'Traffic (Mbps)',
        data: [traffic?.incoming || 0, traffic?.outgoing || 0],
        backgroundColor: ['#3b82f6', '#10b981'],
        borderColor: ['#1d4ed8', '#047857'],
        borderWidth: 1
      }]
    };

    // Create charts
    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: trafficData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Mbps'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Network Traffic'
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [traffic]);

  // Update chart with new traffic data
  useEffect(() => {
    if (chartInstance.current && traffic) {
      chartInstance.current.data.datasets[0].data = [traffic.incoming, traffic.outgoing];
      chartInstance.current.update();
    }
  }, [traffic]);

  return (
    <div className="h-64">
      <canvas ref={chartRef} />
    </div>
  );
};

export default VyOSNetworkTrafficChart;