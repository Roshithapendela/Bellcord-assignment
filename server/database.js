const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'elevator.db');
let db;

function initDatabase() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS request_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('call', 'destination')),
      floor INTEGER NOT NULL,
      direction TEXT CHECK(direction IN ('up', 'down', NULL)),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS movement_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_floor INTEGER NOT NULL,
      to_floor INTEGER NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('up', 'down')),
      duration_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_requests INTEGER DEFAULT 0,
      total_completed INTEGER DEFAULT 0,
      total_wait_time_ms INTEGER DEFAULT 0,
      total_travel_time_ms INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const metricsCount = db.prepare('SELECT COUNT(*) as count FROM metrics').get();
  if (metricsCount.count === 0) {
    db.prepare('INSERT INTO metrics (total_requests, total_completed, total_wait_time_ms, total_travel_time_ms) VALUES (0, 0, 0, 0)').run();
  }

  return db;
}

function logRequest(type, floor, direction = null) {
  const stmt = db.prepare('INSERT INTO request_logs (type, floor, direction) VALUES (?, ?, ?)');
  const result = stmt.run(type, floor, direction);
  db.prepare('UPDATE metrics SET total_requests = total_requests + 1, updated_at = CURRENT_TIMESTAMP').run();
  return result.lastInsertRowid;
}

function completeRequest(id) {
  db.prepare('UPDATE request_logs SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', id);
  db.prepare('UPDATE metrics SET total_completed = total_completed + 1, updated_at = CURRENT_TIMESTAMP').run();
}

function logMovement(fromFloor, toFloor, durationMs) {
  const direction = toFloor > fromFloor ? 'up' : 'down';
  db.prepare('INSERT INTO movement_logs (from_floor, to_floor, direction, duration_ms) VALUES (?, ?, ?, ?)').run(fromFloor, toFloor, direction, durationMs);
  db.prepare('UPDATE metrics SET total_travel_time_ms = total_travel_time_ms + ?, updated_at = CURRENT_TIMESTAMP').run(durationMs);
}

function addWaitTime(waitTimeMs) {
  db.prepare('UPDATE metrics SET total_wait_time_ms = total_wait_time_ms + ?, updated_at = CURRENT_TIMESTAMP').run(waitTimeMs);
}

function getRequestLogs(limit = 50, offset = 0) {
  return db.prepare('SELECT * FROM request_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
}

function getMetrics() {
  return db.prepare('SELECT * FROM metrics WHERE id = 1').get();
}

function getMovementLogs(limit = 50) {
  return db.prepare('SELECT * FROM movement_logs ORDER BY created_at DESC LIMIT ?').all(limit);
}

module.exports = { initDatabase, logRequest, completeRequest, logMovement, addWaitTime, getRequestLogs, getMetrics, getMovementLogs };
