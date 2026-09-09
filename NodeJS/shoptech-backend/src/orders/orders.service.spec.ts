import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { CartsService } from '../carts/carts.service';
import { ProductVariantsService } from '../product-variants/product-variants.service';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { ShippingMethodsService } from '../shipping-methods/shipping-methods.service';
import { VouchersService } from '../vouchers/vouchers.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PointsService } from '../points/points.service';
import { MailService } from '../mail/mail.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import mongoose from 'mongoose';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockOrderModel: any;
  let mockOrderConstructor: any;
  let cartsService: jest.Mocked<Partial<CartsService>>;
  let productVariantsService: jest.Mocked<Partial<ProductVariantsService>>;
  let stockMovementsService: jest.Mocked<Partial<StockMovementsService>>;
  let shippingMethodsService: jest.Mocked<Partial<ShippingMethodsService>>;
  let vouchersService: jest.Mocked<Partial<VouchersService>>;
  let notificationsService: jest.Mocked<Partial<NotificationsService>>;
  let pointsService: jest.Mocked<Partial<PointsService>>;
  let mailService: jest.Mocked<Partial<MailService>>;

  beforeEach(async () => {
    mockOrderModel = {
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      create: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      updateOne: jest.fn(),
      db: {
        model: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnThis(),
          findOne: jest.fn().mockReturnThis(),
          findById: jest.fn().mockResolvedValue({ email: 'test@example.com', fullName: 'Test' }),
          updateOne: jest.fn(),
          exec: jest.fn(),
          lean: jest.fn(),
        }),
      },
    };

    mockOrderConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: 'orderId' }),
    }));
    Object.assign(mockOrderConstructor, mockOrderModel);

    cartsService = {
      getCart: jest.fn(),
    };
    productVariantsService = {
      findById: jest.fn(),
    };
    stockMovementsService = {
      recordMovement: jest.fn(),
    };
    shippingMethodsService = {
      getActiveMethods: jest.fn().mockResolvedValue([]),
    };
    vouchersService = {
      validateVoucher: jest.fn(),
    };
    notificationsService = {
      createAndSend: jest.fn().mockResolvedValue(true),
    };
    pointsService = {
      getUserPoints: jest.fn(),
      rewardPointsForOrder: jest.fn(),
      redeemPoints: jest.fn(),
    };
    mailService = {
      sendOrderSuccessMail: jest.fn().mockResolvedValue(true),
      sendDeliverySuccessMail: jest.fn().mockResolvedValue(true),
      sendOrderCancelledMail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getModelToken(Order.name), useValue: mockOrderConstructor },
        { provide: CartsService, useValue: cartsService },
        { provide: ProductVariantsService, useValue: productVariantsService },
        { provide: StockMovementsService, useValue: stockMovementsService },
        { provide: ShippingMethodsService, useValue: shippingMethodsService },
        { provide: VouchersService, useValue: vouchersService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: PointsService, useValue: pointsService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create order successfully without voucher', async () => {
      (cartsService.getCart as jest.Mock).mockResolvedValue({
        items: [{ variant: 'var1', quantity: 2 }]
      });

      (productVariantsService.findById as jest.Mock).mockResolvedValue({
        _id: 'var1',
        stock: 10,
        price: 100,
        product: { _id: 'prod1', store: '64a1b2c3d4e5f6a7b8c9d0e2', flashSalePrice: null },
        save: jest.fn().mockResolvedValue(true),
      });

      mockOrderModel.db.model.mockReturnValueOnce({
        find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
      });

      (pointsService.getUserPoints as jest.Mock).mockResolvedValue({ availablePoints: 0 });

      mockOrderModel.create.mockResolvedValue([{ _id: 'suborder1' }]);


      const result = await service.create('64a1b2c3d4e5f6a7b8c9d0e3', { shippingMethod: '64a1b2c3d4e5f6a7b8c9d0e5' } as any);

      expect(mockOrderModel.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if stock is insufficient', async () => {
      (cartsService.getCart as jest.Mock).mockResolvedValue({
        items: [{ variant: 'var1', quantity: 20 }]
      });

      (productVariantsService.findById as jest.Mock).mockResolvedValue({
        _id: 'var1',
        stock: 10,
        product: { _id: 'prod1', store: '64a1b2c3d4e5f6a7b8c9d0e2' }
      });

      mockOrderModel.db.model.mockReturnValueOnce({
        find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
      });

      await expect(service.create('64a1b2c3d4e5f6a7b8c9d0e3', { shippingMethod: '64a1b2c3d4e5f6a7b8c9d0e5' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByUser (as admin)', () => {
    it('should return paginated orders', async () => {
      mockOrderModel.exec.mockResolvedValue([{ _id: '1' }]);
      mockOrderModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAllForAdmin();

      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return an order', async () => {
      mockOrderModel.exec.mockResolvedValue({ _id: '1', subOrders: [] });
      const result = await service.findOne('1');
      expect(result?._id).toBe('1');
    });

    it('should return null if order not found', async () => {
      mockOrderModel.exec.mockResolvedValue(null);
      const result = await service.findOne('1');
      expect(result).toBeNull();
    });
  });

  describe('findAllByUser', () => {
    it('should return user orders', async () => {
      mockOrderModel.exec.mockResolvedValue([{ _id: '64a1b2c3d4e5f6a7b8c9d0e1', subOrders: [] }]);
      const result = await service.findAllByUser('64a1b2c3d4e5f6a7b8c9d0e1', 'Pending');
      expect(result).toHaveLength(1);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update subOrder status', async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
        user: { _id: new mongoose.Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e3') },
        subOrders: [
          { _id: new mongoose.Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e4'), store: new mongoose.Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e2'), status: 'Pending', items: [] }
        ],
        paymentMethod: 'COD',
        save: jest.fn().mockResolvedValue(true)
      };
      
      mockOrderModel.findOne.mockResolvedValue(mockOrder);

      const result = await service.updateOrderStatus('64a1b2c3d4e5f6a7b8c9d0e4', '64a1b2c3d4e5f6a7b8c9d0e2', 'Processing');
      expect(mockOrder.subOrders[0].status).toBe('Processing');
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should throw error if status invalid', async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
        user: { _id: new mongoose.Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e3') },
        subOrders: [
          { _id: new mongoose.Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e4'), store: new mongoose.Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e2'), status: 'Pending', items: [] }
        ],
        paymentMethod: 'COD',
        save: jest.fn().mockResolvedValue(true)
      };
      mockOrderModel.findOne.mockResolvedValue(mockOrder);
      await expect(service.updateOrderStatus('64a1b2c3d4e5f6a7b8c9d0e4', '64a1b2c3d4e5f6a7b8c9d0e2', 'Invalid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOrdersByStore', () => {
    it('should return merchant orders', async () => {
      mockOrderModel.exec.mockResolvedValue([{ subOrders: [{ store: 'store1' }] }]);
      const result = await service.findOrdersByStore('store1');
      expect(result).toHaveLength(1);
    });
  });
});
