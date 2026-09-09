import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    // Set environment variables for testing
    process.env.VNP_TMN_CODE = 'TESTCODE';
    process.env.VNP_HASH_SECRET = 'TESTSECRET1234567890';
    process.env.BACKEND_URL = 'http://localhost:3000';

    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsService],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentUrl', () => {
    it('should generate a valid vnpay url', () => {
      const url = service.createPaymentUrl('order123', 100000, '127.0.0.1');
      expect(url).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
      expect(url).toContain('vnp_Amount=10000000'); // 100000 * 100
      expect(url).toContain('vnp_Command=pay');
      expect(url).toContain('vnp_TxnRef=order123');
    });

    it('should handle ipv6 correctly', () => {
      const url = service.createPaymentUrl('order123', 100000, '::1');
      expect(url).toContain('vnp_IpAddr=12.34.56.78');
    });
  });

  describe('verifyIpn', () => {
    it('should verify signature correctly', () => {
      // Create a mock URL and extract params
      const url = service.createPaymentUrl('order123', 100000, '127.0.0.1');
      const queryString = url.split('?')[1];
      const params = new URLSearchParams(queryString);
      
      const vnpParams: any = {};
      params.forEach((value, key) => {
        vnpParams[key] = value;
      });

      const isValid = service.verifyIpn(vnpParams);
      expect(isValid).toBe(true);
    });

    it('should fail verification if signature is altered', () => {
      const url = service.createPaymentUrl('order123', 100000, '127.0.0.1');
      const queryString = url.split('?')[1];
      const params = new URLSearchParams(queryString);
      
      const vnpParams: any = {};
      params.forEach((value, key) => {
        vnpParams[key] = value;
      });

      vnpParams['vnp_SecureHash'] = 'invalidhash';

      const isValid = service.verifyIpn(vnpParams);
      expect(isValid).toBe(false);
    });
  });
});
