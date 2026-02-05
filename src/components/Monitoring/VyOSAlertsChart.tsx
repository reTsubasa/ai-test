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

interface AlertData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

const VyOSAlertsChart: React.FC = () => {
  const { alerts } = useMonitoring();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy previous chart instance if exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Count alerts by severity
    const alertCounts: Record<string, number> = { 'error': 0, 'warning': 0, 'info': 0 };

    alerts?.forEach(alert => {
      if (alert.type in alertCounts) {
        alertCounts[alert.type]++;
      }
    });

    // Prepare data for charts
    const alertData: AlertData = {
      labels: ['Error', 'Warning', 'Info'],
      datasets: [{
        label: 'Alert Count',
        data: [alertCounts.error, alertCounts.warning, alertCounts.info],
        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
        borderColor: ['#dc2626', '#d97706', '#2563eb'],
        borderWidth: 1
      }]
    };

    // Create charts
    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: alertData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Alerts'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Alert Distribution by Severity'
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [alerts]);

  // Update chart with new alerts data
  useEffect(() => {
    if (chartInstance.current && alerts) {
      const alertCounts: Record<string, number> = { 'error': 0, 'warning': 0, 'info': 0 };

      alerts.forEach(alert => {
        if (alert.type in alertCounts) {
          alertCounts[alert.type]++;
        }
      });

      chartInstance.current.data.datasets[0].data = [alertCounts.error, alertCounts.warning, alertCounts.info];
      chartInstance.current.update();
    }
  }, [alerts]);

  return (
    <div className="h-64">
      <canvas ref={chartRef} />
    </div>
  );
};

export default VyOSAlertsChart;