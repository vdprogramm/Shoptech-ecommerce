import { describe, it, expect } from 'vitest';

describe('Thử nghiệm cơ bản (Basic Test)', () => {
  it('toán học cơ bản phải đúng', () => {
    // Đây là một bài test siêu đơn giản
    // Nó kiểm tra xem 1 + 1 có bằng 2 không
    expect(1 + 1).toBe(2);
  });

  it('xử lý chuỗi phải đúng', () => {
    // Kiểm tra xem chữ 'Hello' + ' World' có ra đúng không
    const greeting = 'Hello' + ' World';
    expect(greeting).toBe('Hello World');
  });
});
