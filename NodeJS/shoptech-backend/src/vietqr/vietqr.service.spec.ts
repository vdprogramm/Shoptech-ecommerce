import { Test, TestingModule } from '@nestjs/testing';
import { VietqrService } from './vietqr.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from '../orders/schemas/order.schema';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';

// Mock the PayOS library
jest.mock('@payos/node', () => {
  return jest.fn().mockImplementation(() => {
    return {
      paymentRequests: {
        create: jest.fn().mockResolvedValue({
          checkoutUrl: 'http://checkout.url',
          qrCode: 'qr-code-string'
        })
      }
    };
  });
});

describe('VietqrService', () => {
  let service: VietqrService;
  let mockOrderModel: any;

  const validSubOrderId = new Types.ObjectId().toHexString();
  const validOrderId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    process.env.PAYOS_CLIENT_ID = 'test_client_id';
    process.env.PAYOS_API_KEY = 'test_api_key';
    process.env.PAYOS_CHECKSUM_KEY = 'test_checksum';
    process.env.BACKEND_URL = 'http://localhost:3000';

    mockOrderModel = {
      findOne: jest.fn().mockResolvedValue({
        _id: validOrderId,
        paymentStatus: 'Pending',
        subOrders: [
          {
            _id: new Types.ObjectId(validSubOrderId),
            grandTotal: 100000,
            status: 'Pending'
          }
        ],
        save: jest.fn().mockResolvedValue(true)
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VietqrService,
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
      ],
    }).compile();

    service = module.get<VietqrService>(VietqrService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayosPaymentLink', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockOrderModel.findOne.mockResolvedValueOnce(null);
      await expect(service.createPayosPaymentLink(validSubOrderId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if subOrder not found in order', async () => {
      mockOrderModel.findOne.mockResolvedValueOnce({
        _id: validOrderId,
        subOrders: [
          { _id: new Types.ObjectId() } // Different ID
        ]
      });
      await expect(service.createPayosPaymentLink(validSubOrderId)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if SDK is invalid', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      // Force SDK invalid
      (service as any).payos = null;
      await expect(service.createPayosPaymentLink(validSubOrderId)).rejects.toThrow(InternalServerErrorException);
      jest.restoreAllMocks();
    });

    it('should create payment link successfully', async () => {
      // Restore valid SDK mock if it was modified
      const payosLib = require('@payos/node');
      (service as any).payos = new payosLib();

      const result = await service.createPayosPaymentLink(validSubOrderId);
      expect(result).toBeDefined();
      expect(result.checkoutUrl).toBe('http://checkout.url');
      expect(result.qrCode).toBe('qr-code-string');
    });

    it('should throw InternalServerErrorException if payos throws error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const payosLib = require('@payos/node');
      (service as any).payos = new payosLib();
      (service as any).payos.paymentRequests.create.mockRejectedValueOnce(new Error('API error'));

      await expect(service.createPayosPaymentLink(validSubOrderId)).rejects.toThrow(InternalServerErrorException);
      jest.restoreAllMocks();
    });
  });

  describe('processPaymentSuccess', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockOrderModel.findOne.mockResolvedValueOnce(null);
      await expect(service.processPaymentSuccess(validSubOrderId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if subOrder not found in list', async () => {
      mockOrderModel.findOne.mockResolvedValueOnce({
        _id: validOrderId,
        subOrders: [
          { _id: new Types.ObjectId() } // Different ID
        ]
      });
      await expect(service.processPaymentSuccess(validSubOrderId)).rejects.toThrow(NotFoundException);
    });

    it('should update subOrder status and order paymentStatus if all paid', async () => {
      const order = {
        _id: validOrderId,
        paymentStatus: 'Pending',
        subOrders: [
          {
            _id: new Types.ObjectId(validSubOrderId),
            status: 'Pending'
          }
        ],
        save: jest.fn().mockResolvedValue(true)
      };
      mockOrderModel.findOne.mockResolvedValueOnce(order);

      const result = await service.processPaymentSuccess(validSubOrderId);
      
      expect(order.subOrders[0].status).toBe('Paid');
      expect(order.paymentStatus).toBe('Paid');
      expect(order.save).toHaveBeenCalled();
      expect(result).toBe('Paid');
    });

    it('should update only subOrder status if not all paid', async () => {
      const order = {
        _id: validOrderId,
        paymentStatus: 'Pending',
        subOrders: [
          {
            _id: new Types.ObjectId(validSubOrderId),
            status: 'Pending'
          },
          {
            _id: new Types.ObjectId(),
            status: 'Pending'
          }
        ],
        save: jest.fn().mockResolvedValue(true)
      };
      mockOrderModel.findOne.mockResolvedValueOnce(order);

      const result = await service.processPaymentSuccess(validSubOrderId);
      
      expect(order.subOrders[0].status).toBe('Paid');
      expect(order.paymentStatus).toBe('Pending'); // Not all paid
      expect(order.save).toHaveBeenCalled();
    });
  });
});
