import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import moment from 'moment';
import * as qs from 'qs';

@Injectable()
export class PaymentsService {
private vnp_TmnCode = process.env.VNP_TMN_CODE as string;
  private vnp_HashSecret = process.env.VNP_HASH_SECRET as string;
  private vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  private vnp_ReturnUrl = `${process.env.BACKEND_URL}/payments/vnpay_return`;

  createPaymentUrl(orderId: string, amount: number, ip: string) {
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');

    // FIX 1: Lọc IP, nếu là IPv6 (có chứa dấu hai chấm) thì hardcode về IPv4 ảo để tránh lỗi Code 99 của VNPAY
    let cleanIp = ip ? ip.split(',')[0].trim() : '127.0.0.1';
    if (cleanIp.includes(':')) {
      cleanIp = '12.34.56.78';
    }

    let vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.vnp_TmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang ' + orderId; // FIX 2: Bỏ dấu hai chấm (:) để an toàn nhất
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = Math.round(amount * 100); // FIX 3: Đảm bảo tuyệt đối là số nguyên
    vnp_Params['vnp_ReturnUrl'] = this.vnp_ReturnUrl;
    vnp_Params['vnp_IpAddr'] = cleanIp;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sắp xếp và Encode đúng chuẩn
    vnp_Params = this.sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });

    // Băm HMAC-SHA512
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = signed;
    return this.vnp_Url + '?' + qs.stringify(vnp_Params, { encode: false });
  }

  // FIX 4: HÀM QUAN TRỌNG NHẤT - Phải có encodeURIComponent giống hệt tài liệu VNPay
// HÀM ĐÃ ĐƯỢC SỬA LỖI TYPESCRIPT
  private sortObject(obj: any) {
    const sorted: any = {};
    const str: string[] = [];
    let key: string;

    // Vòng lặp 1: Dùng biến key (string)
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }

    str.sort();

    // Vòng lặp 2: Dùng biến i (number) thay vì dùng lại key
    for (let i = 0; i < str.length; i++) {
      sorted[str[i]] = encodeURIComponent(obj[str[i]]).replace(/%20/g, '+');
    }

    return sorted;
  }
  verifyIpn(vnp_Params: any) {
    const secureHash = vnp_Params['vnp_SecureHash'];

    // Xóa để chuẩn bị kiểm tra
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp lại bằng hàm sortObject chuẩn đã sửa ở trên
    const sortedParams = this.sortObject(vnp_Params);

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }
}