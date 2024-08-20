import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register Chart.js components and the zoom plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  zoomPlugin,
);

const LineChart = ({
  data, // The new structure with timestampsUS, xG, yG, zG
  showX,
  showY,
  showZ,
  zoomLevel,
  resetGraph,
}: any) => {
  const chartRef = useRef(null);

  // Flatten the arrays
  const flattenedTimestamps = data?.timestampsUS?.flat() || [];
  const flattenedXG = data?.xG?.flat();
  const flattenedYG = data?.yG?.flat();
  const flattenedZG = data?.zG?.flat();

  // Find the maximum timestamp
  const maxTimestamp = Math.max(...flattenedTimestamps);

  // Calculate tick intervals based on the max value
  const calculateTickInterval = (maxValue) => {
    if (maxValue <= 10) return 1;
    if (maxValue <= 20) return 2;
    if (maxValue <= 50) return 10;
    if (maxValue <= 100) return 20;
    if (maxValue <= 200) return 50;
    if (maxValue <= 500) return 100;
    if (maxValue <= 1000) return 200;
    if (maxValue <= 5000) return 500;
    return 1000; // Default to 1000 for very large values
  };

  const tickInterval = calculateTickInterval(maxTimestamp);

  // Chart Data
  const chartData = {
    labels: flattenedTimestamps,
    datasets: [
      {
        label: 'x',
        data: flattenedXG,
        borderColor: '#6ec5ff',
        backgroundColor: 'rgba(110, 197, 255, 0.2)',
        fill: false,
        pointRadius: 0, // Remove points
        hidden: !showX, // Control visibility using the hidden property
      },
      {
        label: 'y',
        data: flattenedYG,
        borderColor: '#ff9c9c',
        backgroundColor: 'rgba(255, 156, 156, 0.2)',
        fill: false,
        pointRadius: 0, // Remove points
        hidden: !showY, // Control visibility using the hidden property
      },
      {
        label: 'z',
        data: flattenedZG,
        borderColor: '#ffd297',
        backgroundColor: 'rgba(255, 210, 151, 0.2)',
        fill: false,
        pointRadius: 0, // Remove points
        hidden: !showZ, // Control visibility using the hidden property
      },
    ], // Filter out false entries
  };

  const options = {
    responsive: true,
    plugins: {
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          drag: {
            enabled: true,
          },
          mode: 'x',
          limits: {
            x: { min: 0.5, max: 10 }, // Set your desired min and max zoom levels
          },
        },
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: 'ctrl', // Optional: use Ctrl key to enable panning
        },
      },
      legend: {
        display: false, // Disable the legend
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        position: 'top', // Show the X-axis on top
        display: true, // Show the X-axis line and ticks
        ticks: {
          stepSize: tickInterval,
          callback: function (value: any, index: any, values: any) {
            return `${Math.round(value / 100) * 100} ms`; // Round to the nearest hundred, Show milliseconds on the X-axis
          },
          maxTicksLimit: 5, // Limit the number of ticks to 5
        },
        grid: {
          display: false, // Hide the grid lines for X-axis if needed
        },
      },
      y: {
        title: {
          display: false,
          text: 'Value',
        },
      },
    },
  };

  const handleZoom = (zoomValue: any) => {
    const chart = ChartJS.getChart('myChart');
    if (chart) {
      chart.resetZoom();
      const zoomScale = 1 + zoomValue;
      chart.zoom(zoomScale);
    }
  };

  useEffect(() => {
    handleZoom(zoomLevel);
  }, [zoomLevel]);

  useEffect(() => {
    const resetZoom = () => {
      const chart = ChartJS.getChart(chartRef.current);
      if (chart) {
        chart.resetZoom();
      }
    };
    resetZoom();
  }, [resetGraph]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <Line ref={chartRef} id="myChart" data={chartData} options={options} />
    </div>
  );
};

export default LineChart;
