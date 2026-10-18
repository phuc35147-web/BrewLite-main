import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PaymentsService } from './payments.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Test tích hợp (tiêu chí chấm b): gửi lặp cùng Idempotency-Key chỉ tạo 1 thanh toán.
// Cần SQL Server thật và biến DB_* trong backend/.env; thiếu thì tự bỏ qua.
const hasDb = Boolean(process.env.DB_SERVER);

if (!hasDb) {
  console.warn(
    '[payments.idempotency.spec] Bỏ qua: không có DB_SERVER. Chạy "docker compose up -d sqlserver" và tạo backend/.env để chạy test này.',
  );
}

describe.skipIf(!hasDb)('PaymentsService - Idempotency-Key (DB thật)', () => {
  let prisma: PrismaService;
  let orders: OrdersService;
  let payments: PaymentsService;
  let userId: number;
  let productId: number;
  const PRICE = 40000; // size S, không topping => đơn 40.000đ => +4 điểm
  const EXPECTED_POINTS = 4;
  const oldMockFlag = process.env.MOCK_PAYMENT_FAIL;

  async function newOrder() {
    const res = await orders.create(
      { items: [{ productId, size: 'S', quantity: 1, toppings: [] }] },
      userId,
    );
    return res.orderId;
  }

  beforeAll(async () => {
    process.env.MOCK_PAYMENT_FAIL = 'false';
    prisma = new PrismaService();
    await prisma.$connect();
    orders = new OrdersService(prisma);
    payments = new PaymentsService(prisma);

    const user = await prisma.user.create({
      data: { email: `idem-${Date.now()}@test.local`, passwordHash: 'x' },
    });
    userId = user.id;
    const product = await prisma.product.create({
      data: { name: 'TEST idempotency', price: PRICE, stock: 50 },
    });
    productId = product.id;
  });

  afterAll(async () => {
    if (oldMockFlag === undefined) delete process.env.MOCK_PAYMENT_FAIL;
    else process.env.MOCK_PAYMENT_FAIL = oldMockFlag;

    const found = await prisma.order.findMany({ where: { userId } });
    const ids = found.map((o) => o.id);
    await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('gửi 2 lần cùng key (tuần tự): chỉ 1 Payment, điểm thưởng cộng 1 lần', async () => {
    const orderId = await newOrder();
    const key = `IDEM-SEQ-${Date.now()}`;
    const dto = { orderId, method: 'CARD' as const };

    const first = await payments.create(dto, key, userId);
    const second = await payments.create(dto, key, userId);

    expect(first.status).toBe('PAID');
    expect(second.paymentId).toBe(first.paymentId);

    const rows = await prisma.payment.findMany({ where: { idempotencyKey: key } });
    expect(rows).toHaveLength(1);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe('PAID');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.loyaltyPoints).toBe(EXPECTED_POINTS);
  });

  it('5 request song song cùng key: chỉ 1 Payment, đơn PAID, điểm cộng đúng 1 lần', async () => {
    const before = (await prisma.user.findUnique({ where: { id: userId } }))!
      .loyaltyPoints;
    const orderId = await newOrder();
    const key = `IDEM-PAR-${Date.now()}`;
    const dto = { orderId, method: 'WALLET' as const };

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => payments.create(dto, key, userId)),
    );

    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled',
    );
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    // Mọi request thành công đều trả về cùng một payment.
    expect(new Set(fulfilled.map((r) => r.value.paymentId)).size).toBe(1);

    const rows = await prisma.payment.findMany({ where: { idempotencyKey: key } });
    expect(rows).toHaveLength(1);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe('PAID');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user!.loyaltyPoints - before).toBe(EXPECTED_POINTS);
  });
});
