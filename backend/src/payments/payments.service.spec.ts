import { PaymentsService } from './payments.service.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let tx: any;
  let prismaMock: any;

  const order = { id: 6, userId: 1, status: 'PENDING', total: 40000 };

  beforeEach(() => {
    vi.clearAllMocks();
    tx = {
      payment: {
        create: vi.fn().mockImplementation(async ({ data }) => ({ id: 7, ...data })),
      },
      order: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: { update: vi.fn() },
    };
    prismaMock = {
      payment: { findUnique: vi.fn().mockResolvedValue(null) },
      order: { findUnique: vi.fn().mockResolvedValue(order) },
      $transaction: vi.fn((fn: any) => fn(tx)),
    };
    service = new PaymentsService(prismaMock);
  });

  afterEach(() => {
    delete process.env.MOCK_PAYMENT_FAIL;
  });

  it('thiếu Idempotency-Key => 400', async () => {
    await expect(
      service.create({ orderId: 6, method: 'CARD' }, undefined, 1),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('key trùng => trả kết quả cũ, không tạo Payment mới', async () => {
    prismaMock.payment.findUnique.mockResolvedValue({
      id: 7, orderId: 6, amount: 40000, method: 'CARD', status: 'PAID',
      order: { id: 6, userId: 1, loyaltyEarned: 4 },
    });
    const result = await service.create({ orderId: 6, method: 'CARD' }, 'K1', 1);

    expect(result).toMatchObject({ status: 'PAID', paymentId: 7, loyaltyEarned: 4 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('key trùng nhưng khác đơn / khác phương thức => 400', async () => {
    prismaMock.payment.findUnique.mockResolvedValue({
      id: 7, orderId: 6, amount: 40000, method: 'CARD', status: 'PAID',
      order: { id: 6, userId: 1 },
    });
    await expect(
      service.create({ orderId: 9, method: 'CARD' }, 'K1', 1),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.create({ orderId: 6, method: 'WALLET' }, 'K1', 1),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('không được thanh toán đơn của người khác', async () => {
    await expect(
      service.create({ orderId: 6, method: 'CARD' }, 'K2', 99),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('thanh toán thành công: PAID + cộng điểm trong cùng transaction', async () => {
    const result = await service.create({ orderId: 6, method: 'CARD' }, 'K3', 1);

    expect(result).toMatchObject({ status: 'PAID', loyaltyEarned: 4 });
    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: 6, status: 'PENDING' },
      data: { status: 'PAID', loyaltyEarned: 4 },
    });
    expect(tx.user.update).toHaveBeenCalledTimes(1);
  });

  it('thanh toán lỗi: lưu Payment FAILED, đơn PAYMENT_FAILED, không cộng điểm', async () => {
    process.env.MOCK_PAYMENT_FAIL = 'true';
    const result = await service.create({ orderId: 6, method: 'CARD' }, 'K4', 1);

    expect(result).toMatchObject({ status: 'PAYMENT_FAILED' });
    expect(tx.payment.create.mock.calls[0][0].data.status).toBe('FAILED');
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('cho phép thử lại đơn PAYMENT_FAILED bằng key mới', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ ...order, status: 'PAYMENT_FAILED' });
    const result = await service.create({ orderId: 6, method: 'CARD' }, 'K5', 1);
    expect(result).toMatchObject({ status: 'PAID' });
    expect(tx.order.updateMany.mock.calls[0][0].where.status).toBe('PAYMENT_FAILED');
  });

  it('đơn đã PAID không thanh toán lại với key mới', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ ...order, status: 'PAID' });
    await expect(
      service.create({ orderId: 6, method: 'CARD' }, 'K6', 1),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('hai request cùng key đồng thời: request thua đọc lại kết quả của request thắng', async () => {
    prismaMock.$transaction.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    prismaMock.payment.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 8, orderId: 6, amount: 40000, method: 'CARD', status: 'PAID',
        order: { id: 6, userId: 1, loyaltyEarned: 4 },
      });

    const result = await service.create({ orderId: 6, method: 'CARD' }, 'K7', 1);
    expect(result).toMatchObject({ status: 'PAID', paymentId: 8 });
  });

  it('chuyển trạng thái đơn xung đột (count = 0) => 409 và rollback', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.create({ orderId: 6, method: 'CARD' }, 'K8', 1),
    ).rejects.toMatchObject({ status: 409 });
  });
});
