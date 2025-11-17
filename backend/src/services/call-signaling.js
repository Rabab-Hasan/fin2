const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

class CallSignalingServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/calls'
    });
    
    this.clients = new Map(); // Map of userId -> WebSocket
    this.activeCalls = new Map(); // Map of callId -> call data
    
    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('📞 Call signaling server initialized');
  }

  handleConnection(ws, req) {
    console.log('📞 New WebSocket connection');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          data: { message: 'Invalid message format' } 
        }));
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  handleMessage(ws, message) {
    const { type, data } = message;
    
    switch (type) {
      case 'auth':
        this.handleAuth(ws, data);
        break;
      case 'call:start':
        this.handleCallStart(ws, data);
        break;
      case 'call:answer':
        this.handleCallAnswer(ws, data);
        break;
      case 'call:decline':
        this.handleCallDecline(ws, data);
        break;
      case 'call:end':
        this.handleCallEnd(ws, data);
        break;
      case 'offer':
      case 'answer':
      case 'ice-candidate':
        this.relaySignalingMessage(ws, message);
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  }

  handleAuth(ws, data) {
    try {
      const { token } = data;
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.userId || decoded._id;
      
      if (userId) {
        ws.userId = userId;
        this.clients.set(userId, ws);
        console.log(`📞 User ${userId} authenticated for calls`);
        
        ws.send(JSON.stringify({
          type: 'auth:success',
          data: { userId }
        }));
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
      ws.send(JSON.stringify({
        type: 'auth:error',
        data: { message: 'Authentication failed' }
      }));
    }
  }

  handleCallStart(ws, data) {
    const { callId, receiverId, type, caller } = data;
    
    console.log(`📞 Call start: ${caller.name} -> ${receiverId} (${type})`);
    
    // Store call data
    this.activeCalls.set(callId, {
      id: callId,
      callerId: ws.userId,
      receiverId,
      type,
      status: 'ringing',
      startTime: new Date()
    });

    // Forward to receiver
    const receiverWs = this.clients.get(receiverId);
    if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
      receiverWs.send(JSON.stringify({
        type: 'call:incoming',
        data: {
          callId,
          caller,
          type
        }
      }));
    } else {
      // Receiver not available
      ws.send(JSON.stringify({
        type: 'call:error',
        data: { message: 'User is not available' }
      }));
      this.activeCalls.delete(callId);
    }
  }

  handleCallAnswer(ws, data) {
    const { callId, accepted } = data;
    const call = this.activeCalls.get(callId);
    
    if (!call) {
      return ws.send(JSON.stringify({
        type: 'call:error',
        data: { message: 'Call not found' }
      }));
    }

    console.log(`📞 Call ${accepted ? 'answered' : 'declined'}:`, callId);

    if (accepted) {
      call.status = 'connecting';
      
      // Notify caller
      const callerWs = this.clients.get(call.callerId);
      if (callerWs && callerWs.readyState === WebSocket.OPEN) {
        callerWs.send(JSON.stringify({
          type: 'call:answer',
          data: { callId, accepted: true }
        }));
      }
    } else {
      this.handleCallDecline(ws, data);
    }
  }

  handleCallDecline(ws, data) {
    const { callId } = data;
    const call = this.activeCalls.get(callId);
    
    if (!call) return;

    console.log('📞 Call declined:', callId);
    
    call.status = 'declined';

    // Notify caller
    const callerWs = this.clients.get(call.callerId);
    if (callerWs && callerWs.readyState === WebSocket.OPEN) {
      callerWs.send(JSON.stringify({
        type: 'call:decline',
        data: { callId }
      }));
    }

    this.activeCalls.delete(callId);
  }

  handleCallEnd(ws, data) {
    const { callId } = data;
    const call = this.activeCalls.get(callId);
    
    if (!call) return;

    console.log('📞 Call ended:', callId);
    
    call.status = 'ended';
    call.endTime = new Date();

    // Notify both parties
    const callerWs = this.clients.get(call.callerId);
    const receiverWs = this.clients.get(call.receiverId);

    [callerWs, receiverWs].forEach(clientWs => {
      if (clientWs && clientWs.readyState === WebSocket.OPEN && clientWs !== ws) {
        clientWs.send(JSON.stringify({
          type: 'call:end',
          data: { callId }
        }));
      }
    });

    this.activeCalls.delete(callId);
  }

  relaySignalingMessage(ws, message) {
    const { data } = message;
    const { callId } = data;
    const call = this.activeCalls.get(callId);
    
    if (!call) {
      console.warn('❌ Call not found for signaling relay:', callId);
      return;
    }

    // Determine target (relay to the other party)
    const targetUserId = ws.userId === call.callerId ? call.receiverId : call.callerId;
    const targetWs = this.clients.get(targetUserId);
    
    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(JSON.stringify(message));
      console.log(`📞 Relayed ${message.type} from ${ws.userId} to ${targetUserId}`);
    } else {
      console.warn('❌ Target user not available for signaling:', targetUserId);
    }
  }

  handleDisconnection(ws) {
    if (ws.userId) {
      console.log(`📞 User ${ws.userId} disconnected from calls`);
      
      // Clean up active calls for this user
      for (const [callId, call] of this.activeCalls.entries()) {
        if (call.callerId === ws.userId || call.receiverId === ws.userId) {
          this.handleCallEnd(ws, { callId });
        }
      }
      
      this.clients.delete(ws.userId);
    }
  }

  // Method to integrate with HTTP server
  static create(server) {
    return new CallSignalingServer(server);
  }
}

module.exports = CallSignalingServer;