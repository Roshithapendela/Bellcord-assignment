const { logRequest, completeRequest, logMovement, addWaitTime } = require('./database');

const TOTAL_FLOORS = 10;
const FLOOR_TRAVEL_TIME = 1000;
const DOOR_OPEN_DURATION = 2000;

class Elevator {
  constructor(broadcastFn) {
    this.currentFloor = 1;
    this.state = 'idle';
    this.direction = null;
    this.upQueue = new Set();
    this.downQueue = new Set();
    this.pendingRequests = [];
    this.destinationQueue = new Set();
    this.isProcessing = false;
    this.broadcast = broadcastFn || (() => {});
    this.justArrived = false;
  }

  callElevator(floor, direction) {
    if (floor < 1 || floor > TOTAL_FLOORS) throw new Error(`Invalid floor: ${floor}`);

    const requestId = logRequest('call', floor, direction);
    this.pendingRequests.push({ id: requestId, type: 'call', floor, direction, timestamp: Date.now() });

    if (direction === 'up') this.upQueue.add(floor);
    else this.downQueue.add(floor);

    if (this.state === 'idle') {
      this._determineInitialDirection();
      this._processNextMove();
    }

    this._broadcastState();
    return requestId;
  }

  selectDestination(floor) {
    if (floor < 1 || floor > TOTAL_FLOORS) throw new Error(`Invalid floor: ${floor}`);
    if (floor === this.currentFloor) return null;

    const requestId = logRequest('destination', floor);
    this.pendingRequests.push({
      id: requestId, type: 'destination', floor,
      direction: floor > this.currentFloor ? 'up' : 'down',
      timestamp: Date.now()
    });
    this.destinationQueue.add(floor);

    if (floor > this.currentFloor) this.upQueue.add(floor);
    else this.downQueue.add(floor);

    if (this.state === 'idle') {
      this._determineInitialDirection();
      this._processNextMove();
    }

    this._broadcastState();
    return requestId;
  }

  _determineInitialDirection() {
    const allFloors = [...this.upQueue, ...this.downQueue];
    if (allFloors.length === 0) return;

    let nearest = allFloors[0];
    let minDistance = Math.abs(allFloors[0] - this.currentFloor);

    for (const floor of allFloors) {
      const dist = Math.abs(floor - this.currentFloor);
      if (dist < minDistance) { minDistance = dist; nearest = floor; }
    }

    if (nearest > this.currentFloor) {
      this.direction = 'up';
      this.state = 'moving_up';
    } else if (nearest < this.currentFloor) {
      this.direction = 'down';
      this.state = 'moving_down';
    } else {
      this.direction = this.upQueue.size > 0 ? 'up' : 'down';
      this.state = this.direction === 'up' ? 'moving_up' : 'moving_down';
    }
  }

  _processNextMove() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    if (this._shouldStopAtCurrentFloor()) { this._arriveAtFloor(); return; }

    const nextFloor = this._getNextFloor();
    if (nextFloor !== null) { this._moveToFloor(nextFloor); return; }

    this._reverseDirection();
    const reversedNext = this._getNextFloor();
    if (reversedNext !== null) { this._moveToFloor(reversedNext); return; }

    this.state = 'idle';
    this.direction = null;
    this.isProcessing = false;
    this._broadcastState();
  }

  _shouldStopAtCurrentFloor() {
    const floor = this.currentFloor;
    if (this.destinationQueue.has(floor)) return true;
    if (this.direction === 'up' && this.upQueue.has(floor)) return true;
    if (this.direction === 'down' && this.downQueue.has(floor)) return true;
    return false;
  }

  _getNextFloor() {
    const currentQueue = this.direction === 'up' ? this.upQueue : this.downQueue;
    let bestFloor = null;
    let bestDistance = Infinity;

    for (const floor of currentQueue) {
      if (this.direction === 'up' && floor >= this.currentFloor) {
        const dist = floor - this.currentFloor;
        if (dist < bestDistance) { bestDistance = dist; bestFloor = floor; }
      } else if (this.direction === 'down' && floor <= this.currentFloor) {
        const dist = this.currentFloor - floor;
        if (dist < bestDistance) { bestDistance = dist; bestFloor = floor; }
      }
    }

    for (const floor of this.destinationQueue) {
      if (this.direction === 'up' && floor > this.currentFloor) {
        const dist = floor - this.currentFloor;
        if (dist < bestDistance) { bestDistance = dist; bestFloor = floor; }
      } else if (this.direction === 'down' && floor < this.currentFloor) {
        const dist = this.currentFloor - floor;
        if (dist < bestDistance) { bestDistance = dist; bestFloor = floor; }
      }
    }

    return bestFloor;
  }

  _reverseDirection() {
    if (this.direction === 'up') { this.direction = 'down'; this.state = 'moving_down'; }
    else { this.direction = 'up'; this.state = 'moving_up'; }
  }

  _moveToFloor(targetFloor) {
    const step = targetFloor > this.currentFloor ? 1 : -1;
    this.state = step > 0 ? 'moving_up' : 'moving_down';

    const moveOneFloor = () => {
      const previousFloor = this.currentFloor;
      this.currentFloor += step;
      this._broadcastState();

      if (this._shouldStopAtCurrentFloor()) {
        logMovement(previousFloor, this.currentFloor, FLOOR_TRAVEL_TIME);
        this._arriveAtFloor();
        return;
      }

      if (this.currentFloor !== targetFloor) {
        logMovement(previousFloor, this.currentFloor, FLOOR_TRAVEL_TIME);
        setTimeout(moveOneFloor, FLOOR_TRAVEL_TIME);
      } else {
        logMovement(previousFloor, this.currentFloor, FLOOR_TRAVEL_TIME);
        this._arriveAtFloor();
      }
    };

    setTimeout(moveOneFloor, FLOOR_TRAVEL_TIME);
  }

  _arriveAtFloor() {
    this.state = 'doors_open';
    this.justArrived = true;
    this._completeRequestsAtFloor(this.currentFloor);
    this._broadcastState();

    setTimeout(() => {
      this.justArrived = false;
      this.state = this.direction === 'up' ? 'moving_up' : 'moving_down';
      this.isProcessing = false;
      this._processNextMove();
    }, DOOR_OPEN_DURATION);
  }

  _completeRequestsAtFloor(floor) {
    this.upQueue.delete(floor);
    this.downQueue.delete(floor);
    this.destinationQueue.delete(floor);

    const now = Date.now();
    this.pendingRequests = this.pendingRequests.filter(req => {
      if (req.floor === floor) {
        completeRequest(req.id);
        addWaitTime(now - req.timestamp);
        return false;
      }
      return true;
    });
  }

  getState() {
    return {
      currentFloor: this.currentFloor,
      state: this.state,
      direction: this.direction,
      upQueue: [...this.upQueue].sort((a, b) => a - b),
      downQueue: [...this.downQueue].sort((a, b) => b - a),
      destinationQueue: [...this.destinationQueue].sort((a, b) => a - b),
      pendingRequests: this.pendingRequests.map(r => ({ id: r.id, type: r.type, floor: r.floor, direction: r.direction })),
      totalFloors: TOTAL_FLOORS,
      justArrived: this.justArrived
    };
  }

  _broadcastState() {
    this.broadcast({ type: 'elevator_state', data: this.getState() });
  }
}

module.exports = { Elevator, TOTAL_FLOORS, FLOOR_TRAVEL_TIME, DOOR_OPEN_DURATION };
