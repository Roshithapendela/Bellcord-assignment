export default function BuildingPanel({ elevatorState, callElevator, playClick }) {
  if (!elevatorState) return null;

  const { currentFloor, state, totalFloors, upQueue, downQueue } = elevatorState;
  const floors = Array.from({ length: totalFloors }, (_, i) => totalFloors - i);

  const handleCall = (floor, direction) => { playClick(); callElevator(floor, direction); };

  const getStateLabel = () => {
    switch (state) {
      case 'idle': return 'IDLE';
      case 'moving_up': return '▲ GOING UP';
      case 'moving_down': return '▼ GOING DOWN';
      case 'doors_open': return '◆ DOORS OPEN';
      default: return state;
    }
  };

  const getStateClass = () => {
    switch (state) {
      case 'idle': return 'state-idle';
      case 'moving_up': return 'state-up';
      case 'moving_down': return 'state-down';
      case 'doors_open': return 'state-open';
      default: return '';
    }
  };

  return (
    <div className="building-panel">
      <div className="panel-header">
        <h2>🏢 Building</h2>
        <div className={`elevator-status ${getStateClass()}`}>
          <span className="status-dot"></span>
          {getStateLabel()}
        </div>
      </div>
      <div className="building-shaft">
        <div className="shaft-track">
          <div className={`elevator-car ${state === 'doors_open' ? 'doors-open' : ''}`}
            style={{ bottom: `calc(${((currentFloor - 0.5) / totalFloors) * 100}% - 20px)` }}>
            <div className="car-body">
              <span className="car-floor-num">{currentFloor === 1 ? 'G' : currentFloor - 1}</span>
              {state === 'doors_open' && (
                <div className="car-doors"><div className="door-left"></div><div className="door-right"></div></div>
              )}
            </div>
          </div>
        </div>
        <div className="floors-container">
          {floors.map(floor => {
            const isCurrentFloor = floor === currentFloor;
            const hasUpRequest = upQueue.includes(floor);
            const hasDownRequest = downQueue.includes(floor);
            return (
              <div key={floor} className={`floor-row ${isCurrentFloor ? 'current-floor' : ''} ${state === 'doors_open' && isCurrentFloor ? 'floor-arrived' : ''}`}>
                <div className="floor-number">
                  <span className="floor-label">{floor === 1 ? 'G' : floor - 1}</span>
                  {isCurrentFloor && <div className="floor-indicator"><div className="indicator-pulse"></div></div>}
                </div>
                <div className="floor-line"><div className={`floor-dash ${isCurrentFloor ? 'active' : ''}`}></div></div>
                <div className="call-buttons">
                  {floor < totalFloors && (
                    <button className={`call-btn call-up ${hasUpRequest ? 'active' : ''}`}
                      onClick={() => handleCall(floor, 'up')} title={`Call Up from Floor ${floor === 1 ? 'G' : floor - 1}`} id={`call-up-${floor}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </button>
                  )}
                  {floor > 1 && (
                    <button className={`call-btn call-down ${hasDownRequest ? 'active' : ''}`}
                      onClick={() => handleCall(floor, 'down')} title={`Call Down from Floor ${floor === 1 ? 'G' : floor - 1}`} id={`call-down-${floor}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
