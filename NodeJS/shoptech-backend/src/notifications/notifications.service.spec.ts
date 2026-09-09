import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getModelToken } from '@nestjs/mongoose';
import { Notification } from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';
import { Types } from 'mongoose';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotiModel: any;
  let mockGateway: any;

  const mockUserId = new Types.ObjectId().toHexString();
  const mockNotiId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    mockNotiModel = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ _id: mockNotiId }])
      }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: mockNotiId, isRead: true })
    };

    mockGateway = {
      sendToUser: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getModelToken(Notification.name), useValue: mockNotiModel },
        { provide: NotificationsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAndSend', () => {
    it('should create notification and send via gateway', async () => {
      const newNoti = { _id: mockNotiId, title: 'Test' };
      mockNotiModel.create.mockResolvedValueOnce(newNoti);

      const result = await service.createAndSend(mockUserId, 'Test', 'Message', 'order123');

      expect(mockNotiModel.create).toHaveBeenCalledWith({
        user: mockUserId,
        title: 'Test',
        message: 'Message',
        orderId: 'order123'
      });
      expect(mockGateway.sendToUser).toHaveBeenCalledWith(mockUserId, 'notification', newNoti);
      expect(result).toBe(newNoti);
    });
  });

  describe('getMyNotifications', () => {
    it('should return user notifications', async () => {
      const result = await service.getMyNotifications(mockUserId);
      expect(result).toHaveLength(1);
    });
  });

  describe('markAsRead', () => {
    it('should update notification isRead to true', async () => {
      const result = await service.markAsRead(mockNotiId);
      expect(mockNotiModel.findByIdAndUpdate).toHaveBeenCalledWith(mockNotiId, { isRead: true }, { new: true });
      expect(result?.isRead).toBe(true);
    });
  });
});
