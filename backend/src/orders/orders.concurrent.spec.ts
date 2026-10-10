import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Test tích hợp: cần SQL Server thật (docker compose up sqlserver) và biến DB_* trong .env.
// Tự tạo dữ liệu riêng, không phụ thuộc ID có sẵn.
const hasDb = Boolean(process.env.DB_SERVER);

describe.skipIf(!hasDb)('OrdersService - đặt hàng đồng thời', () => {
  let prisma: PrismaService;
  let service: OrdersService;
  let userId: number;
  let productId: number;

  const STOCK = 3;
  const REQUESTS = 12;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    service = new OrdersService(prisma);

    const user = await prisma.user.create({
      data: { email: `concurrent-${Date.now()}@test.local`, passwordHash: 'x' },
    });
    userId = user.id;

    const product = await prisma.product.create({
      data: { name: 'TEST concurrent', price: 10000, stock: STOCK },
    });
    productId = product.id;
  });

  afterAll(async () => {
    const orders = await prisma.order.findMany({ where: { userId } });
    const ids = orders.map((o) => o.id);
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it(`chỉ ${STOCK} trong ${REQUESTS} request song song thành công, kho cuối = 0`, async () => {
    const dto = {
      items: [{ productId, size: 'S', quantity: 1, toppings: [] }],
    };

    const results = await Promise.allSettled(
      Array.from({ length: REQUESTS }, () => service.create(dto, userId)),
    );

    const ok = results.filter((r) => r.status === 'fulfilled');
    expect(ok).toHaveLength(STOCK);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(0);
    expect(product!.version).toBeGreaterThanOrEqual(STOCK);
  });

  it('đơn nhiều dòng thiếu hàng ở một dòng => rollback, kho dòng kia không đổi', async () => {
    const other = await prisma.product.create({
      data: { name: 'TEST other', price: 10000, stock: 5 },
    });
    try {
      await expect(
        service.create(
          {
            items: [
              { productId: other.id, size: 'S', quantity: 2, toppings: [] },
              { productId, size: 'S', quantity: 1, toppings: [] }, // đã hết
            ],
          },
          userId,
        ),
      ).rejects.toBeDefined();

      const after = await prisma.product.findUnique({ where: { id: other.id } });
      expect(after?.stock).toBe(5);
    } finally {
      await prisma.product.delete({ where: { id: other.id } });
    }
  });
});
