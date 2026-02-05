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

const VyOSMetricsChart: React.FC = () => {
  const { metrics } = useMonitoring();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy previous chart instance if exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Prepare data for charts
    const metricData = {
      labels: ['CPU', 'Memory', 'Disk'],
      datasets: [{
        label: 'Usage (%)',
        data: [
          metrics?.cpuUsage || 0,
          metrics?.memoryUsage || 0,
          metrics?.diskUsage || 0
        ],
        backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'],
        borderColor: ['#1d4ed8', '#047857', '#6d28d9'],
        borderWidth: 1
      }]
    };

    // Create charts
    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: metricData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Percentage (%)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Resource Utilization'
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [metrics]);

  // Update chart with new metrics data
  useEffect(() => {
    if (chartInstance.current && metrics) {
      chartInstance.current.data.datasets[0].data = [
        metrics.cpuUsage,
        metrics.memoryUsage,
        metrics.diskUsage
      ];
      chartInstance.current.update();
    }
  }, [metrics]);

  return (
    <div className="h-64">
      <canvas ref={chartRef} />
    </div>
  );
};

export default VyOSMetricsChart;