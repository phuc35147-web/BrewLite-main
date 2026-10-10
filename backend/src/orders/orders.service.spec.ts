import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  ORDER_STATUS,
  canTransition,
  getAllowedTransitions,
} from './order-status.js';
import { OrdersService } from './orders.service.js';

const ALL = Object.values(ORDER_STATUS);

const EXPECTED: Record<string, string[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

describe('Order State Machine - toàn bộ cặp (từ, đến)', () => {
  const pairs = ALL.flatMap((from) => ALL.map((to) => [from, to] as const));

  it.each(pairs)('%s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(EXPECTED[from].includes(to));
  });

  it('trạng thái cuối không có đường đi tiếp', () => {
    expect(getAllowedTransitions('COMPLETED')).toEqual([]);
    expect(getAllowedTransitions('CANCELLED')).toEqual([]);
  });

  it('trạng thái lạ bị từ chối', () => {
    expect(canTransition('FOO', 'PAID')).toBe(false);
    expect(canTransition('PENDING', 'FOO')).toBe(false);
  });
});

function makeService(order: any, updateCount = 1) {
  const tx: any = {
    order: {
      findUnique: vi.fn().mockResolvedValue(order),
      updateMany: vi.fn().mockResolvedValue({ count: updateCount }),
    },
    product: { update: vi.fn() },
    user: { update: vi.fn() },
  };
  const prisma: any = { $transaction: (fn: any) => fn(tx) };
  return { service: new OrdersService(prisma), tx };
}

describe('OrdersService.transitionStatus - phân quyền', () => {
  const order = { id: 1, userId: 5, status: 'PENDING', loyaltyEarned: 0, items: [] };

  it('khách không được tự đặt PAID', async () => {
    const { service } = makeService(order);
    await expect(
      service.transitionStatus(1, 'PAID', { userId: 5, role: 'CUSTOMER' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('khách không được chuyển PREPARING', async () => {
    const { service } = makeService({ ...order, status: 'PAID' });
    await expect(
      service.transitionStatus(1, 'PREPARING', { userId: 5, role: 'CUSTOMER' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('khách không thấy đơn của người khác', async () => {
    const { service } = makeService(order);
    await expect(
      service.transitionStatus(1, 'CANCELLED', { userId: 99, role: 'CUSTOMER' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('STAFF chuyển PAID -> PREPARING thành công', async () => {
    const { service, tx } = makeService({ ...order, status: 'PAID' });
    await service.transitionStatus(1, 'PREPARING', { userId: 1, role: 'STAFF' });
    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: 1, status: 'PAID' },
      data: { status: 'PREPARING' },
    });
  });

  it('chuyển trạng thái xung đột (count = 0) => 409', async () => {
    const { service } = makeService({ ...order, status: 'PAID' }, 0);
    await expect(
      service.transitionStatus(1, 'PREPARING', { userId: 1, role: 'STAFF' }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('hủy đơn đã trả tiền: hoàn kho và hoàn điểm', async () => {
    const paid = {
      id: 1,
      userId: 5,
      status: 'PAID',
      loyaltyEarned: 3,
      items: [
        { productId: 2, qty: 2 },
        { productId: 1, qty: 1 },
      ],
    };
    const { service, tx } = makeService(paid);
    await service.transitionStatus(1, 'CANCELLED', { userId: 5, role: 'CUSTOMER' });

    expect(tx.product.update).toHaveBeenCalledTimes(2);
    expect(tx.product.update.mock.calls[0][0].where.id).toBe(1); // thứ tự id tăng dần
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { loyaltyPoints: { decrement: 3 } },
    });
  });
});
