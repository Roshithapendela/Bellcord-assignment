import { useEffect, useRef } from 'react';
import Header from './components/Header';
import BuildingPanel from './components/BuildingPanel';
import ElevatorPanel from './components/ElevatorPanel';
import RequestQueue from './components/RequestQueue';
import MetricsPanel from './components/MetricsPanel';
import useWebSocket from './hooks/useWebSocket';
import useTheme from './hooks/useTheme';
import useSound from './hooks/useSound';
import './App.css';

function App() {
  const { elevatorState, isConnected, callElevator, selectDestination } = useWebSocket();
  const { theme, toggleTheme } = useTheme();
  const { playArrivalChime, playClick } = useSound();
  const prevStateRef = useRef(null);

  useEffect(() => {
    if (!elevatorState) return;
    const prev = prevStateRef.current;
    if (prev && prev.state !== 'doors_open' && elevatorState.state === 'doors_open') playArrivalChime();
    prevStateRef.current = elevatorState;
  }, [elevatorState, playArrivalChime]);

  return (
    <div className="app" data-theme={theme}>
      <Header isConnected={isConnected} theme={theme} toggleTheme={toggleTheme} />
      <main className="main-content">
        {!isConnected && (
          <div className="connection-banner">
            <span>⚠️ Connecting to elevator server...</span>
            <span className="banner-hint">Make sure the server is running on port 5000</span>
          </div>
        )}
        <div className="dashboard-grid">
          <BuildingPanel elevatorState={elevatorState} callElevator={callElevator} playClick={playClick} />
          <ElevatorPanel elevatorState={elevatorState} selectDestination={selectDestination} playClick={playClick} />
          <div className="right-panel">
            <RequestQueue elevatorState={elevatorState} />
            <MetricsPanel />
          </div>
        </div>
      </main>
      <footer className="app-footer">
        <span>ElevatorOS v1.0 — Smart Building Control System</span>
        <span>Built with React + Node.js + SQLite + WebSockets</span>
      </footer>
    </div>
  );
}

export default App;
