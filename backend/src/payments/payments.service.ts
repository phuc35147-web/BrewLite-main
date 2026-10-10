import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { ORDER_STATUS } from '../orders/order-status.js';

const PAYABLE_STATUSES: string[] = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PAYMENT_FAILED, // cho phép thử lại với Idempotency-Key mới
];

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createPaymentDto: CreatePaymentDto,
    idempotencyKey: string | undefined,
    userId: number,
  ) {
    if (!idempotencyKey || !idempotencyKey.trim()) {
      throw new BadRequestException('Thiếu Idempotency-Key');
    }

    // 1. Key đã dùng => trả lại đúng kết quả cũ, không xử lý lại.
    const existing = await this.findByKey(idempotencyKey);
    if (existing) {
      return this.replay(existing, createPaymentDto, userId);
    }

    // 2. Kiểm tra đơn hàng.
    const order = await this.prisma.order.findUnique({
      where: { id: createPaymentDto.orderId },
    });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thanh toán đơn hàng này');
    }
    if (!PAYABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Đơn hàng hiện ở trạng thái ${order.status} và không thể thanh toán`,
      );
    }

    // 3. Gọi cổng thanh toán mock (một lần duy nhất cho mỗi key).
    const paymentSuccess = process.env.MOCK_PAYMENT_FAIL !== 'true';
    const loyaltyEarned = paymentSuccess ? Math.floor(order.total / 10000) : 0;

    try {
      const payment = await this.prisma.$transaction(async (tx) => {
        // Tạo Payment trước: ràng buộc UNIQUE(idempotencyKey) chặn request trùng đồng thời.
        const created = await tx.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey,
            amount: order.total,
            method: createPaymentDto.method,
            status: paymentSuccess ? 'PAID' : 'FAILED',
          },
        });

        // Chuyển trạng thái atomic: chỉ thành công nếu đơn vẫn ở trạng thái đã đọc.
        const claimed = await tx.order.updateMany({
          where: { id: order.id, status: order.status },
          data: paymentSuccess
            ? { status: ORDER_STATUS.PAID, loyaltyEarned }
            : { status: ORDER_STATUS.PAYMENT_FAILED },
        });
        if (claimed.count === 0) {
          throw new ConflictException(
            'Đơn hàng vừa được cập nhật bởi yêu cầu khác, vui lòng tải lại',
          );
        }

        if (paymentSuccess && loyaltyEarned > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { loyaltyPoints: { increment: loyaltyEarned } },
          });
        }

        return created;
      });

      return this.buildResponse(payment, order.id, loyaltyEarned);
    } catch (error: any) {
      // Hai request cùng key chạy đồng thời: request thua đọc lại kết quả của request thắng.
      if (error?.code === 'P2002') {
        const winner = await this.findByKey(idempotencyKey);
        if (winner) {
          return this.replay(winner, createPaymentDto, userId);
        }
      }
      throw error;
    }
  }

  private findByKey(idempotencyKey: string) {
    return this.prisma.payment.findUnique({
      where: { idempotencyKey },
      include: { order: true },
    });
  }

  private replay(
    existing: any,
    dto: CreatePaymentDto,
    userId: number,
  ) {
    if (existing.order?.userId !== undefined && existing.order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập thanh toán này');
    }
    if (existing.orderId !== dto.orderId) {
      throw new BadRequestException(
        'Idempotency-Key đã được sử dụng cho đơn hàng khác',
      );
    }
    if (existing.method !== dto.method) {
      throw new BadRequestException(
        'Idempotency-Key đã được sử dụng với phương thức thanh toán khác',
      );
    }

    return this.buildResponse(
      existing,
      existing.orderId,
      existing.status === 'PAID' ? (existing.order?.loyaltyEarned ?? 0) : 0,
    );
  }

  private buildResponse(payment: any, orderId: number, loyaltyEarned: number) {
    if (payment.status === 'PAID') {
      return {
        message: 'Thanh toán thành công',
        orderId,
        status: ORDER_STATUS.PAID,
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method,
        loyaltyEarned,
      };
    }

    return {
      message: 'Thanh toán thất bại',
      orderId,
      status: ORDER_STATUS.PAYMENT_FAILED,
      paymentId: payment.id,
      amount: payment.amount,
      method: payment.method,
    };
  }
}
