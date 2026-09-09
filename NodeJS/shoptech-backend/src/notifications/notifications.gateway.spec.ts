import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway';
import { JwtService } from '@nestjs/jwt';
import { Socket, Server } from 'socket.io';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    jwtService = module.get<JwtService>(JwtService);
    
    // Mock the WebSocketServer
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('sẽ ngắt kết nối nếu không có token', async () => {
      const mockClient = {
        handshake: { auth: {} },
        disconnect: jest.fn(),
      } as unknown as Socket;

      await gateway.handleConnection(mockClient);
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it('sẽ kết nối thành công nếu token hợp lệ', async () => {
      const mockClient = {
        id: 'socket-id-1',
        handshake: { auth: { token: 'valid_token' } },
        join: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-id-1',
        roles: ['SHIPPER'],
      });

      await gateway.handleConnection(mockClient);

      expect(mockClient.join).toHaveBeenCalledWith('shippers_room');
      expect(mockClient.disconnect).not.toHaveBeenCalled();
    });

    it('sẽ ngắt kết nối nếu token sai', async () => {
      const mockClient = {
        handshake: { auth: { token: 'invalid_token' } },
        disconnect: jest.fn(),
      } as unknown as Socket;

      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(mockClient);

      expect(mockClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('xóa thông tin socket khi ngắt kết nối', async () => {
      const mockClient = {
        id: 'socket-id-2',
        handshake: { auth: { token: 'valid_token' } },
        join: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-id-2',
      });

      await gateway.handleConnection(mockClient);
      gateway.handleDisconnect(mockClient);
      
      // Should handle disconnect properly
      // We can test the map states using sendToUser
      gateway.sendToUser('user-id-2', 'event', {});
      expect(gateway.server.to).not.toHaveBeenCalled();
    });
  });

  describe('sendToUser', () => {
    it('gửi event tới đúng user', async () => {
      const mockClient = {
        id: 'socket-id-3',
        handshake: { auth: { token: 'valid_token' } },
        join: jest.fn(),
      } as unknown as Socket;

      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-id-3',
      });

      await gateway.handleConnection(mockClient);
      
      gateway.sendToUser('user-id-3', 'test_event', { data: 1 });
      
      expect(gateway.server.to).toHaveBeenCalledWith('socket-id-3');
      expect(gateway.server.to('socket-id-3').emit).toHaveBeenCalledWith('test_event', { data: 1 });
    });
  });

  describe('broadcastToShippers', () => {
    it('gửi event tới phòng shippers_room', () => {
      gateway.broadcastToShippers('test_broadcast', { msg: 'hello' });
      expect(gateway.server.to).toHaveBeenCalledWith('shippers_room');
      expect(gateway.server.to('shippers_room').emit).toHaveBeenCalledWith('test_broadcast', { msg: 'hello' });
    });
  });
});
