import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  SubscribeMessage
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { FlagChangedEvent } from '../interfaces/evaluation.interface';

interface SocketClient {
  socket: Socket;
  tenantId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'api/flags',
})
export class FlagGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients: Map<string, SocketClient> = new Map();
  private readonly logger = new Logger(FlagGateway.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  handleConnection(client: Socket): void {
    const tenantId = client.handshake.query.tenantId as string;
    this.clients.set(client.id, { socket: client, tenantId });
    this.logger.debug(`Client connected: ${client.id}, tenantId: ${tenantId}`);
    
    // Send initial connection acknowledgement
    client.emit('connection', { 
      status: 'connected', 
      clientId: client.id,
      timestamp: Date.now() 
    });
  }

  handleDisconnect(client: Socket): void {
    this.clients.delete(client.id);
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @OnEvent('flag.changed')
  handleFlagChangedEvent(event: FlagChangedEvent): void {
    this.logger.debug(`Flag changed event: ${event.key}, broadcasting to matching clients`);
    
    for (const [clientId, client] of this.clients.entries()) {
      // Only send updates to clients that should receive them
      if (!event.tenantId || !client.tenantId || event.tenantId === client.tenantId) {
        client.socket.emit('flag-changed', {
          key: event.key,
          timestamp: event.timestamp
        });
      }
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { flags: string[] }): void {
    // Allow clients to subscribe to specific flags
    this.logger.debug(`Client ${client.id} subscribing to flags: ${payload.flags.join(', ')}`);
    
    // Store subscription info (could be extended to store in client metadata)
    // This is a stub for future implementation if needed
    client.emit('subscribed', { 
      flags: payload.flags,
      timestamp: Date.now()
    });
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    // Simple ping-pong for connection testing
    client.emit('pong', { timestamp: Date.now() });
  }
} 