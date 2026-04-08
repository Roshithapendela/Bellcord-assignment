const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const { initDatabase, getRequestLogs, getMetrics, getMovementLogs } = require('./database');
const { Elevator } = require('./elevator');

const db = initDatabase();
const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Set();

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) client.send(data);
  }
}

const elevator = new Elevator(broadcast);

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'elevator_state', data: elevator.getState() }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'call_elevator') elevator.callElevator(parsed.floor, parsed.direction);
      else if (parsed.type === 'select_destination') elevator.selectDestination(parsed.floor);
    } catch (err) {}
  });

  ws.on('close', () => clients.delete(ws));
});

app.get('/api/status', (req, res) => res.json(elevator.getState()));

app.post('/api/call', (req, res) => {
  try {
    const { floor, direction } = req.body;
    if (!floor || !direction) return res.status(400).json({ error: 'floor and direction required' });
    if (!['up', 'down'].includes(direction)) return res.status(400).json({ error: 'direction must be up or down' });
    res.json({ success: true, requestId: elevator.callElevator(floor, direction) });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/destination', (req, res) => {
  try {
    const { floor } = req.body;
    if (!floor) return res.status(400).json({ error: 'floor required' });
    res.json({ success: true, requestId: elevator.selectDestination(floor) });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/logs', (req, res) => {
  res.json(getRequestLogs(parseInt(req.query.limit) || 50, parseInt(req.query.offset) || 0));
});

app.get('/api/metrics', (req, res) => res.json(getMetrics()));

app.get('/api/movements', (req, res) => {
  res.json(getMovementLogs(parseInt(req.query.limit) || 50));
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
