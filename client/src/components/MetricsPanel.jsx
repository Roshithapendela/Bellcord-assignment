import { useState, useEffect, useCallback } from 'react';

const getApiUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return `${import.meta.env.VITE_BACKEND_URL}/api`;
  }
  if (import.meta.env.DEV) return 'http://localhost:5000/api';
  return '/api';
};

export default function MetricsPanel() {
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const API_URL = getApiUrl();

  const fetchMetrics = useCallback(async () => {
    try { const res = await fetch(`${API_URL}/metrics`); setMetrics(await res.json()); } catch (err) {}
  }, [API_URL]);

  const fetchLogs = useCallback(async () => {
    try { const res = await fetch(`${API_URL}/logs?limit=20`); setLogs(await res.json()); } catch (err) {}
  }, [API_URL]);

  useEffect(() => {
    fetchMetrics(); fetchLogs();
    const interval = setInterval(() => { fetchMetrics(); fetchLogs(); }, 3000);
    return () => clearInterval(interval);
  }, [fetchMetrics, fetchLogs]);

  const avgWaitTime = metrics && metrics.total_completed > 0 ? (metrics.total_wait_time_ms / metrics.total_completed / 1000).toFixed(1) : '0.0';
  const completionRate = metrics && metrics.total_requests > 0 ? ((metrics.total_completed / metrics.total_requests) * 100).toFixed(0) : '0';

  return (
    <div className="metrics-panel">
      <div className="panel-header"><h2>📊 Performance</h2></div>
      <div className="metrics-grid">
        <div className="metric-card"><div className="metric-icon">📨</div><div className="metric-info"><span className="metric-value">{metrics?.total_requests || 0}</span><span className="metric-label">Total Requests</span></div></div>
        <div className="metric-card"><div className="metric-icon">✅</div><div className="metric-info"><span className="metric-value">{metrics?.total_completed || 0}</span><span className="metric-label">Completed</span></div></div>
        <div className="metric-card"><div className="metric-icon">⏱️</div><div className="metric-info"><span className="metric-value">{avgWaitTime}s</span><span className="metric-label">Avg Wait</span></div></div>
        <div className="metric-card"><div className="metric-icon">🎯</div><div className="metric-info"><span className="metric-value">{completionRate}%</span><span className="metric-label">Completion</span></div></div>
      </div>
      <button className="logs-toggle" onClick={() => setShowLogs(!showLogs)} id="toggle-logs">
        {showLogs ? '▼ Hide' : '▶ Show'} Request History
      </button>
      {showLogs && (
        <div className="logs-list">
          {logs.length === 0 ? (
            <div className="logs-empty">No request history yet</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className={`log-item ${log.status}`}>
                <span className="log-type">{log.type === 'call' ? '📞' : '🎯'}</span>
                <span className="log-floor">F{log.floor === 1 ? 'G' : log.floor - 1}</span>
                <span className="log-dir">{log.direction ? (log.direction === 'up' ? '▲' : '▼') : '–'}</span>
                <span className={`log-status ${log.status}`}>{log.status}</span>
                <span className="log-time">{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
