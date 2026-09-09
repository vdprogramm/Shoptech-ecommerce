import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementsService } from './stock-movements.service';
import { getModelToken } from '@nestjs/mongoose';
import { StockMovement, MovementType } from './schemas/stock-movement.schema';

describe('StockMovementsService', () => {
  let service: StockMovementsService;
  let mockMovementModel: any;
  let movementModelConstructor: any;

  beforeEach(async () => {
    mockMovementModel = {
      find: jest.fn(),
    };

    movementModelConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: 'mov1' }),
    }));
    movementModelConstructor.find = mockMovementModel.find;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockMovementsService,
        {
          provide: getModelToken(StockMovement.name),
          useValue: movementModelConstructor,
        },
      ],
    }).compile();

    service = module.get<StockMovementsService>(StockMovementsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordMovement', () => {
    it('should create and save a new movement', async () => {
      const result = await service.recordMovement('vid', MovementType.IN, 10, 'reason', 'uid');
      expect(result.variant).toEqual('vid');
      expect(result.type).toEqual(MovementType.IN);
      expect(result.quantity).toEqual(10);
      expect(result.reason).toEqual('reason');
      expect(result.performedBy).toEqual('uid');
    });
  });

  describe('getHistoryByVariant', () => {
    it('should return history for a variant', async () => {
      mockMovementModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([{ _id: 'mov1' }]),
          }),
        }),
      });

      const result = await service.getHistoryByVariant('vid');
      expect(mockMovementModel.find).toHaveBeenCalledWith({ variant: 'vid' });
      expect(result).toHaveLength(1);
    });
  });

  describe('getAllHistory', () => {
    it('should return all history', async () => {
      mockMovementModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([{ _id: 'mov1' }]),
            }),
          }),
        }),
      });

      const result = await service.getAllHistory();
      expect(mockMovementModel.find).toHaveBeenCalledWith();
      expect(result).toHaveLength(1);
    });
  });
});
