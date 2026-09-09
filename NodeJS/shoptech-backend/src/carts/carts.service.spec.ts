import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import { getModelToken } from '@nestjs/mongoose';
import { Cart } from './schemas/cart.schema';
import { NotFoundException } from '@nestjs/common';
import mongoose from 'mongoose';

describe('CartsService', () => {
  let service: CartsService;

  const mockCartModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
  };

  const mockFlashSaleCampaignModel = {
    find: jest.fn(),
  };

  const mockCartConstructor = Object.assign(
    jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn(),
    })),
    mockCartModel,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        {
          provide: getModelToken(Cart.name),
          useValue: mockCartConstructor,
        },
        {
          provide: getModelToken('FlashSaleCampaign'),
          useValue: mockFlashSaleCampaignModel,
        },
      ],
    }).compile();

    service = module.get<CartsService>(CartsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart', () => {
    it('should create a new cart if not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      mockCartConstructor.findOne.mockReturnValue(mockQuery);
      mockCartConstructor.create.mockResolvedValue({
        toObject: jest.fn().mockReturnValue({ user: 'userId', items: [] }),
      });

      const result = await service.getCart('userId');
      expect(result).toEqual({ user: 'userId', items: [] });
      expect(mockCartConstructor.create).toHaveBeenCalledWith({ user: 'userId', items: [] });
    });

    it('should remove invalid items (garbage collection) from cart', async () => {
      const mockCart = {
        _id: 'cartId',
        user: 'userId',
        items: [
          { variant: { _id: 'var1', price: 100 }, quantity: 1 },
          { variant: null, quantity: 2 }, // Invalid item
        ],
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockCart),
      };
      mockCartConstructor.findOne.mockReturnValue(mockQuery);
      mockFlashSaleCampaignModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      const result = await service.getCart('userId');
      
      expect(mockCartConstructor.updateOne).toHaveBeenCalledWith(
        { _id: 'cartId' },
        { $set: { items: [{ variant: 'var1', quantity: 1 }] } }
      );
      expect(result.items).toHaveLength(1);
    });

    it('should apply flash sale prices if active campaigns are found', async () => {
      const mockCart = {
        _id: 'cartId',
        user: 'userId',
        items: [
          { variant: { _id: new mongoose.Types.ObjectId(), price: 1000 }, quantity: 1 },
        ],
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockCart),
      };
      mockCartConstructor.findOne.mockReturnValue(mockQuery);

      const activeCampaigns = [
        {
          items: [
            { variant: mockCart.items[0].variant._id, salePrice: 800 }
          ]
        }
      ];
      mockFlashSaleCampaignModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(activeCampaigns) });

      const result = await service.getCart('userId');
      
      expect(result.items[0].variant.originalPrice).toEqual(1000);
      expect(result.items[0].variant.price).toEqual(800);
      expect(result.items[0].variant.isFlashSale).toEqual(true);
    });
  });

  describe('addToCart', () => {
    it('should add new item if variant does not exist in cart', async () => {
      const mockCart = {
        user: 'userId',
        items: [],
        save: jest.fn(),
      };
      mockCartConstructor.findOne.mockResolvedValueOnce(mockCart);
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockCart, items: [{ variant: 'var1', quantity: 2 }] }),
      };
      mockCartConstructor.findOne.mockReturnValueOnce(mockQuery); // For getCart
      mockFlashSaleCampaignModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      await service.addToCart('userId', { variantId: 'var1', quantity: 2 });
      
      expect(mockCart.items).toHaveLength(1);
      expect(mockCart.items[0]).toEqual({ variant: 'var1', quantity: 2 });
      expect(mockCart.save).toHaveBeenCalled();
    });

    it('should increment quantity if variant already exists in cart', async () => {
      const mockCart = {
        user: 'userId',
        items: [{ variant: 'var1', quantity: 1 }],
        save: jest.fn(),
      };
      mockCartConstructor.findOne.mockResolvedValueOnce(mockCart);
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockCart, items: [{ variant: 'var1', quantity: 3 }] }),
      };
      mockCartConstructor.findOne.mockReturnValueOnce(mockQuery); // For getCart
      mockFlashSaleCampaignModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      await service.addToCart('userId', { variantId: 'var1', quantity: 2 });
      
      expect(mockCart.items[0].quantity).toEqual(3);
      expect(mockCart.save).toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('should throw NotFoundException if cart not found', async () => {
      mockCartConstructor.findOne.mockResolvedValue(null);
      await expect(service.removeItem('userId', 'variantId')).rejects.toThrow(NotFoundException);
    });

    it('should remove item and return updated cart', async () => {
      const mockCart = {
        user: 'userId',
        items: [{ variant: 'variantId' }, { variant: 'otherVariantId' }],
        save: jest.fn(),
      };
      mockCartConstructor.findOne.mockResolvedValueOnce(mockCart);
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockCart, items: [{ variant: 'otherVariantId' }] }),
      };
      mockCartConstructor.findOne.mockReturnValueOnce(mockQuery); // For getCart
      mockFlashSaleCampaignModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      await service.removeItem('userId', 'variantId');
      expect(mockCart.items).toHaveLength(1);
      expect(mockCart.items[0].variant).toEqual('otherVariantId');
      expect(mockCart.save).toHaveBeenCalled();
    });
  });

  describe('updateQuantity', () => {
    it('should remove item if quantity is <= 0', async () => {
      jest.spyOn(service, 'removeItem').mockResolvedValue('removed' as any);
      const result = await service.updateQuantity('userId', 'variantId', 0);
      expect(service.removeItem).toHaveBeenCalledWith('userId', 'variantId');
      expect(result).toEqual('removed');
    });

    it('should throw NotFoundException if cart not found', async () => {
      mockCartConstructor.findOne.mockResolvedValue(null);
      await expect(service.updateQuantity('userId', 'variantId', 2)).rejects.toThrow(NotFoundException);
    });

    it('should update quantity of existing item', async () => {
      const mockCart = {
        user: 'userId',
        items: [{ variant: 'variantId', quantity: 1 }],
        save: jest.fn(),
      };
      mockCartConstructor.findOne.mockResolvedValueOnce(mockCart);
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...mockCart, items: [{ variant: 'variantId', quantity: 5 }] }),
      };
      mockCartConstructor.findOne.mockReturnValueOnce(mockQuery); // For getCart
      mockFlashSaleCampaignModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      await service.updateQuantity('userId', 'variantId', 5);
      
      expect(mockCart.items[0].quantity).toEqual(5);
      expect(mockCart.save).toHaveBeenCalled();
    });
  });
});
