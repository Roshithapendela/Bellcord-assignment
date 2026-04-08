import { useState, useEffect } from 'react';

export default function RequestQueue({ elevatorState }) {
  const [, setTick] = useState(0);
  useEffect(() => { const interval = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(interval); }, []);

  if (!elevatorState) return null;
  const { pendingRequests, upQueue, downQueue, destinationQueue } = elevatorState;

  return (
    <div className="request-queue">
      <div className="panel-header">
        <h2>📋 Request Queue</h2>
        <span className="queue-count">{pendingRequests.length} pending</span>
      </div>
      <div className="queue-summary">
        <div className="queue-stat"><span className="stat-icon up">▲</span><span className="stat-label">Up Calls</span><span className="stat-value">{upQueue.length}</span></div>
        <div className="queue-stat"><span className="stat-icon down">▼</span><span className="stat-label">Down Calls</span><span className="stat-value">{downQueue.length}</span></div>
        <div className="queue-stat"><span className="stat-icon dest">◆</span><span className="stat-label">Destinations</span><span className="stat-value">{destinationQueue.length}</span></div>
      </div>
      <div className="queue-list">
        {pendingRequests.length === 0 ? (
          <div className="queue-empty"><div className="empty-icon">🛗</div><p>No pending requests</p><span>Elevator is waiting for passengers</span></div>
        ) : (
          pendingRequests.map((req, index) => (
            <div key={req.id} className={`queue-item ${req.type}`}>
              <div className="queue-item-priority"><span className="priority-num">#{index + 1}</span></div>
              <div className="queue-item-info">
                <span className="queue-item-type">{req.type === 'call' ? '📞 Call' : '🎯 Dest'}</span>
                <span className="queue-item-floor">Floor {req.floor === 1 ? 'G' : req.floor - 1}</span>
              </div>
              {req.direction && <span className={`queue-item-dir ${req.direction}`}>{req.direction === 'up' ? '▲' : '▼'}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
