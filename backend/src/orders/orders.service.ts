import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ORDER_STATUS,
  STAFF_ONLY_STATUSES,
  SYSTEM_ONLY_STATUSES,
  canTransition,
} from './order-status.js';
import { SIZE_EXTRA, TOPPING_PRICE } from './pricing.js';
import { releaseStock, reserveStock } from './stock.js';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

export interface AuthUser {
  userId: number;
  role?: string;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, userId: number) {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng không được để trống');
    }

    const promoCode = createOrderDto.promoCode?.trim().toUpperCase();
    if (promoCode && promoCode !== 'BREW10') {
      throw new BadRequestException('Mã khuyến mãi không hợp lệ');
    }

    // Khóa theo thứ tự productId cố định để tránh deadlock khi nhiều đơn song song.
    const sortedItems = [...createOrderDto.items].sort(
      (a, b) => a.productId - b.productId,
    );

    return this.prisma.$transaction(async (tx) => {
      let total = 0;
      const orderItems: {
        productId: number;
        size: string;
        qty: number;
        unitPrice: number;
        lineTotal: number;
        toppings: string | null;
      }[] = [];

      for (const item of sortedItems) {
        // Giữ chỗ tồn kho (optimistic locking). Thiếu hàng => ném lỗi => rollback cả đơn.
        const product = await reserveStock(tx, item.productId, item.quantity);

        const toppingPrice = item.toppings.reduce(
          (sum, name) => sum + (TOPPING_PRICE[name] ?? 0),
          0,
        );
        const unitPrice =
          product.price + (SIZE_EXTRA[item.size] ?? 0) + toppingPrice;
        const lineTotal = unitPrice * item.quantity;
        total += lineTotal;

        orderItems.push({
          productId: product.id,
          size: item.size,
          qty: item.quantity,
          unitPrice,
          lineTotal,
          toppings:
            item.toppings.length > 0 ? JSON.stringify(item.toppings) : null,
        });
      }

      const discount = promoCode
        ? Math.min(Math.floor(total * 0.1), 20000)
        : 0;

      const order = await tx.order.create({
        data: {
          userId,
          status: ORDER_STATUS.PENDING,
          total: total - discount,
          discount,
          loyaltyEarned: 0,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      return {
        message: 'Tạo đơn hàng thành công',
        orderId: order.id,
        status: order.status,
        subtotal: total,
        discount: order.discount,
        total: order.total,
        promoCode: promoCode ?? null,
        items: order.items,
      };
    });
  }

  async findMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        payments: true,
      },
    });
  }

  /**
   * Chuyển trạng thái đơn thủ công (không qua thanh toán).
   * - PENDING / PAID / PAYMENT_FAILED: chỉ luồng thanh toán được đặt.
   * - PREPARING / READY / COMPLETED: chỉ STAFF.
   * - CANCELLED: chủ đơn hoặc STAFF; hoàn kho và hoàn điểm thưởng.
   */
  async transitionStatus(orderId: number, newStatus: string, user: AuthUser) {
    const isStaff = user.role === 'STAFF';

    if (SYSTEM_ONLY_STATUSES.includes(newStatus)) {
      throw new ForbiddenException(
        `Trạng thái ${newStatus} chỉ được đặt bởi hệ thống thanh toán`,
      );
    }
    if (STAFF_ONLY_STATUSES.includes(newStatus) && !isStaff) {
      throw new ForbiddenException('Chỉ nhân viên mới được đổi trạng thái này');
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }
      if (!isStaff && order.userId !== user.userId) {
        // Không tiết lộ sự tồn tại của đơn người khác.
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }
      if (!canTransition(order.status, newStatus)) {
        throw new BadRequestException(
          `Không thể chuyển trạng thái từ ${order.status} sang ${newStatus}`,
        );
      }

      // Chuyển trạng thái atomic: chỉ thành công nếu trạng thái chưa bị ai đổi.
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: newStatus },
      });
      if (updated.count === 0) {
        throw new ConflictException(
          'Đơn hàng vừa được cập nhật bởi yêu cầu khác, vui lòng tải lại',
        );
      }

      if (newStatus === ORDER_STATUS.CANCELLED) {
        const sorted = [...order.items].sort(
          (a, b) => a.productId - b.productId,
        );
        for (const item of sorted) {
          await releaseStock(tx, item.productId, item.qty);
        }
        if (order.loyaltyEarned > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { loyaltyPoints: { decrement: order.loyaltyEarned } },
          });
        }
      }

      return tx.order.findUnique({ where: { id: orderId } });
    });
  }
}
