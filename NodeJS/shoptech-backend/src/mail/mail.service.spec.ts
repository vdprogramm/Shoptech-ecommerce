import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let mockSendMail: jest.Mock;

  beforeEach(async () => {
    mockSendMail = jest.fn().mockResolvedValue(true);
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send verification OTP', async () => {
    await service.sendVerificationOtp('test@test.com', '123456');
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('should send reset password email', async () => {
    await service.sendResetPasswordEmail('test@test.com', 'User', 'http://link');
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('should send order success mail', async () => {
    await service.sendOrderSuccessMail('test@test.com', 'User', 'ORD123', 10000);
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('should send delivery success mail', async () => {
    await service.sendDeliverySuccessMail('test@test.com', 'User', 'ORD123');
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('should send order cancelled mail', async () => {
    await service.sendOrderCancelledMail('test@test.com', 'User', 'ORD123', 'Out of stock');
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('should send review thank you mail', async () => {
    await service.sendReviewThankYouMail('test@test.com', 'User', 'Product 1');
    expect(mockSendMail).toHaveBeenCalled();
  });
});
