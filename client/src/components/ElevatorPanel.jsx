export default function ElevatorPanel({ elevatorState, selectDestination, playClick }) {
  if (!elevatorState) return null;

  const { currentFloor, state, direction, totalFloors, destinationQueue } = elevatorState;
  const handleSelectFloor = (floor) => { if (floor === currentFloor && state === 'doors_open') return; playClick(); selectDestination(floor); };
  const floorButtons = Array.from({ length: totalFloors }, (_, i) => i + 1).reverse();
  const getDirectionArrow = () => { if (direction === 'up') return '▲'; if (direction === 'down') return '▼'; return '●'; };

  return (
    <div className="elevator-panel">
      <div className="panel-header">
        <h2>🛗 Elevator Panel</h2>
        <span className="panel-subtitle">Interior Controls</span>
      </div>
      <div className="floor-display">
        <div className="display-screen">
          <div className="display-direction">
            <span className={`direction-arrow ${direction || 'idle'}`}>{getDirectionArrow()}</span>
          </div>
          <div className="display-floor">
            <span className="floor-number-large">{currentFloor === 1 ? 'G' : currentFloor - 1}</span>
          </div>
          <div className="display-state">
            {state === 'doors_open' ? 'DOORS OPEN' : state === 'idle' ? 'READY' : direction === 'up' ? 'GOING UP' : 'GOING DOWN'}
          </div>
        </div>
      </div>
      <div className={`door-indicator ${state === 'doors_open' ? 'open' : 'closed'}`}>
        <div className="door-visual"><div className="door-panel left"></div><div className="door-panel right"></div></div>
        <span className="door-label">{state === 'doors_open' ? '◇ Doors Open' : '◈ Doors Closed'}</span>
      </div>
      <div className="floor-buttons-label">Select Destination</div>
      <div className="floor-buttons-grid">
        {floorButtons.map(floor => {
          const isActive = destinationQueue.includes(floor);
          const isCurrent = floor === currentFloor;
          return (
            <button key={floor} className={`floor-btn ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
              onClick={() => handleSelectFloor(floor)} disabled={isCurrent && state !== 'doors_open'} id={`dest-floor-${floor}`}>
              <span className="btn-number">{floor === 1 ? 'G' : floor - 1}</span>
              {isActive && <span className="btn-indicator"></span>}
            </button>
          );
        })}
      </div>
      <div className="emergency-section">
        <button className="emergency-btn" id="emergency-btn"><span>🔔</span><span>ALARM</span></button>
        <button className="emergency-btn door-btn" id="door-open-btn"><span>◁▷</span><span>OPEN</span></button>
        <button className="emergency-btn door-btn" id="door-close-btn"><span>▷◁</span><span>CLOSE</span></button>
      </div>
    </div>
  );
}
