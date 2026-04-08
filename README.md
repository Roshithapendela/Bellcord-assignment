# ElevatorOS — Smart Building Elevator Request System

A production-ready elevator simulation with real-time control, intelligent SCAN scheduling, and performance analytics.

**Tech Stack**: React 18 + Node.js/Express 5 + SQLite + WebSockets

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Start backend (Terminal 1)
cd server && node index.js

# 3. Start frontend (Terminal 2)
cd client && npm run dev

# 4. Open http://localhost:5173
```

---

## Production Build

```bash
# Build React and copy to server
cd client && npm run build
# Copy dist to server/public (Windows)
xcopy /E /I /Y dist ..\server\public
# Or cross-platform
node -e "const fs=require('fs');const p=require('path');function c(s,d){fs.mkdirSync(d,{recursive:true});fs.readdirSync(s).forEach(f=>{const a=p.join(s,f),b=p.join(d,f);fs.statSync(a).isDirectory()?c(a,b):fs.copyFileSync(a,b)});}c('dist','../server/public')"

# Start production server
cd ../server && node index.js
# App available at http://localhost:5000
```

---

## Deploy to Render (Free)

### Step 1: Push to GitHub
```bash
cd "BellCorp Assignment"
git init
git add .
git commit -m "ElevatorOS - Elevator Request System"
git remote add origin https://github.com/YOUR_USERNAME/elevator-system.git
git push -u origin main
```

### Step 2: Build before pushing
```bash
cd client && npm run build
xcopy /E /I /Y dist ..\server\public
git add server/public
git commit -m "Add production build"
git push
```

### Step 3: Create Render Web Service
1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment**: Node
4. Click **Deploy**

> Note: Remove `server/public/` from `.gitignore` before pushing, since Render needs the built files.

---

## Deploy to Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Connect your repo
3. Set:
   - **Root Directory**: `server`
   - **Start Command**: `node index.js`
4. Railway auto-detects Node.js and deploys

---

## Deploy to Vercel (Alternative - Split Deploy)

Vercel is better suited for the frontend only. For full-stack:
1. Deploy the **server** to Render/Railway
2. Deploy the **client** to Vercel
3. Update `useWebSocket.js` and `MetricsPanel.jsx` to point to your server URL

---

## Deploy to VPS (DigitalOcean, AWS EC2, etc.)

```bash
# SSH into your server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Clone and setup
git clone https://github.com/YOUR_USERNAME/elevator-system.git
cd elevator-system/server
npm install

# Run with PM2 (process manager)
npm install -g pm2
pm2 start index.js --name elevator
pm2 save
pm2 startup

# Your app runs on port 5000
# Setup nginx reverse proxy for domain/SSL
```

---

## Project Structure

```
├── server/
│   ├── index.js          # Express + WebSocket server
│   ├── elevator.js       # SCAN scheduling algorithm
│   ├── database.js       # SQLite setup
│   ├── public/           # React build (generated)
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.jsx       # Main app
│   │   ├── App.css       # Design system
│   │   ├── components/   # React components
│   │   └── hooks/        # Custom hooks
│   └── package.json
├── package.json          # Root scripts
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/status | Current elevator state |
| POST | /api/call | Call elevator `{ floor, direction }` |
| POST | /api/destination | Select destination `{ floor }` |
| GET | /api/logs | Request history |
| GET | /api/metrics | Performance metrics |
| GET | /api/movements | Movement history |

## WebSocket

Connect to `ws://localhost:5000` (or `wss://your-domain.com` in production)

```json
{ "type": "call_elevator", "floor": 5, "direction": "up" }
{ "type": "select_destination", "floor": 8 }
```

## Features

- SCAN elevator scheduling algorithm
- Real-time WebSocket updates
- Animated elevator movement with door effects
- Sound effects (arrival chime, button clicks)
- Dark/Light mode toggle
- Request history + performance metrics
- SQLite persistent logging
- Responsive design (desktop/tablet/mobile)
