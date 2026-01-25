import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(token) {
    if (this.socket) {
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts:  5
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Join session room
  joinSession(sessionId) {
    if (this.socket) {
      this.socket.emit('join-session', sessionId);
    }
  }

  // Join monitoring room (faculty)
  joinMonitor(examId) {
    if (this.socket) {
      this.socket. emit('join-monitor', examId);
    }
  }

  // Emit violation
  emitViolation(data) {
    if (this.socket) {
      this.socket.emit('violation-detected', data);
    }
  }

  // Listen for events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emit generic event
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new SocketService();