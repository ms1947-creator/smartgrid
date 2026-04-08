import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

// Configuration
const SOCKET_URL = "https://smartgrid-enfp.onrender.com";
const MAX_DATA_POINTS = 10;
const socket = io(SOCKET_URL);

// --- Reusable Sub-Components ---

const ChartCard = ({ title, icon, data, labels, color }) => {
  const chartData = {
    labels,
    datasets: [{
      label: title,
      data: data,
      borderColor: color,
      backgroundColor: `${color}33`, // 20% opacity for area fill
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: color,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Critical for mobile scaling
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: "#334155" },
        ticks: { color: "#94a3b8", font: { size: 10 } }
      },
      x: { 
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 10 } }
      }
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{icon} {title}</h3>
      <div style={styles.chartWrapper}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

const StatusRow = ({ label, value }) => (
  <div style={styles.statusRow}>
    <span>{label}</span>
    <span style={getStatusStyle(value)}>{value}</span>
  </div>
);

// --- Main Application ---

function App() {
  const [data, setData] = useState({
    labels: [],
    solar: [],
    wind: [],
    battery: [],
    current: [],
    r1: "OFF", r2: "OFF", r3: "OFF",
    on: 0, off: 0
  });

  useEffect(() => {
      const handleData = (payload) => {
    const time = new Date().toLocaleTimeString([], { 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    setData(prev => ({
      ...prev,

      // ✅ convert ALL values to numbers
      labels: [...prev.labels.slice(-(MAX_DATA_POINTS - 1)), time],
      solar: [...prev.solar.slice(-(MAX_DATA_POINTS - 1)), Number(payload.solar)],
      wind: [...prev.wind.slice(-(MAX_DATA_POINTS - 1)), Number(payload.wind)],
      battery: [...prev.battery.slice(-(MAX_DATA_POINTS - 1)), Number(payload.battery)],
      current: [...prev.current.slice(-(MAX_DATA_POINTS - 1)), Number(payload.current)],

      // ✅ keep status values
      r1: payload.r1,
      r2: payload.r2,
      r3: payload.r3,
      on: Number(payload.on),
      off: Number(payload.off)
    }));
  };
    socket.on("data", handleData);
    return () => socket.off("data", handleData);
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Smart Grid</h1>
        <div style={styles.liveIndicator}>
          <span style={styles.dot}></span> LIVE SYSTEM
        </div>
      </header>

      <div style={styles.responsiveGrid}>
        <ChartCard title="Battery" icon="🔋" data={data.battery} labels={data.labels} color="#4cafef" />
        <ChartCard title="Solar" icon="☀️" data={data.solar} labels={data.labels} color="#ff9800" />
        <ChartCard title="Wind" icon="🌬️" data={data.wind} labels={data.labels} color="#00e5ff" />
        <ChartCard title="Current" icon="⚡" data={data.current} labels={data.labels} color="#e91e63" />
      </div>

      <div style={styles.bottomGrid}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>🔌 Load Status</h2>
          <StatusRow label="Fan (L1)" value={data.r1} />
          <StatusRow label="LED Strip (L2)" value={data.r2} />
          <StatusRow label="AC Bulb (L3)" value={data.r3} />
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Total Loads</h2>
          <div style={styles.summaryBox}>
            <div style={styles.summaryItem}>
              <div style={{...styles.sumVal, color: "#4caf50"}}>{data.on}</div>
              <div style={styles.sumLab}>ACTIVE</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={{...styles.sumVal, color: "#f44336"}}>{data.off}</div>
              <div style={styles.sumLab}>INACTIVE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Responsive Styles ---

const getStatusStyle = (val) => ({
  color: val === "ON" ? "#4caf50" : "#f44336",
  fontWeight: "bold",
  background: val === "ON" ? "#4caf5022" : "#f4433622",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "0.85rem"
});

const styles = {
  container: {
    background: "#0f172a",
    minHeight: "100vh",
    padding: "20px 15px",
    color: "#f8fafc",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    boxSizing: "border-box"
  },
  header: { textAlign: "center", marginBottom: "25px" },
  title: { fontSize: "1.8rem", fontWeight: "800", margin: "0", letterSpacing: "-1px" },
  liveIndicator: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.7rem",
    color: "#94a3b8",
    marginTop: "8px",
    background: "#1e293b",
    padding: "4px 12px",
    borderRadius: "20px"
  },
  dot: { width: "8px", height: "8px", background: "#4caf50", borderRadius: "50%", boxShadow: "0 0 8px #4caf50" },
  
  // Grid System
  responsiveGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "16px",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "16px",
    marginTop: "16px",
    maxWidth: "1200px",
    margin: "16px auto 0"
  },

  // Card Styles
  card: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #334155",
    display: "flex",
    flexDirection: "column"
  },
  cardTitle: { margin: "0 0 15px 0", fontSize: "1rem", color: "#94a3b8", fontWeight: "500" },
  chartWrapper: { height: "200px", position: "relative" }, // Fixed height for charts on mobile
  
  // Load Status Styles
  sectionTitle: { fontSize: "1.1rem", marginBottom: "15px", fontWeight: "600" },
  statusRow: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: "10px 0", 
    borderBottom: "1px solid #334155" 
  },

  // Summary Styles
  summaryBox: { display: "flex", justifyContent: "space-around", flex: 1, alignItems: "center" },
  summaryItem: { textAlign: "center" },
  sumVal: { fontSize: "2.5rem", fontWeight: "800", lineHeight: "1" },
  sumLab: { fontSize: "0.7rem", color: "#94a3b8", marginTop: "5px", fontWeight: "bold" }
};

export default App;