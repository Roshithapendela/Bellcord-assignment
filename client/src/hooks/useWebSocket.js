import { useEffect, useRef, useState, useCallback } from 'react';

const getWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (import.meta.env.DEV) return 'ws://localhost:5000';
  return `${protocol}//${window.location.host}`;
};

export default function useWebSocket() {
  const [elevatorState, setElevatorState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => { setIsConnected(true); reconnectAttemptsRef.current = 0; };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'elevator_state') setElevatorState(message.data);
      } catch (err) {}
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (reconnectAttemptsRef.current < 10) {
        reconnectAttemptsRef.current++;
        reconnectTimerRef.current = setTimeout(connect, 2000);
      }
    };

    ws.onerror = () => {};
  }, []);

  useEffect(() => {
    connect();
    return () => { clearTimeout(reconnectTimerRef.current); wsRef.current?.close(); };
  }, [connect]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(message));
  }, []);

  const callElevator = useCallback((floor, direction) => {
    sendMessage({ type: 'call_elevator', floor, direction });
  }, [sendMessage]);

  const selectDestination = useCallback((floor) => {
    sendMessage({ type: 'select_destination', floor });
  }, [sendMessage]);

  return { elevatorState, isConnected, callElevator, selectDestination };
}
