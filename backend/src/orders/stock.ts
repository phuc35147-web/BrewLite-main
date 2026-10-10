import { ConflictException, BadRequestException } from '@nestjs/common';

const MAX_RETRIES = 5;

/**
 * Giữ chỗ tồn kho bằng optimistic locking.
 * Đọc (stock, version) rồi UPDATE ... WHERE version = :v AND stock >= :qty.
 * Nếu có người sửa trước (count = 0) thì đọc lại và thử tối đa MAX_RETRIES lần.
 */
export async function reserveStock(tx: any, productId: number, qty: number) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const product = await tx.product.findUnique({ where: { id: productId } });

    if (!product) {
      throw new BadRequestException(`Không tìm thấy sản phẩm ID ${productId}`);
    }
    if (!product.isActive) {
      throw new BadRequestException(
        `Sản phẩm "${product.name}" hiện không hoạt động`,
      );
    }
    if (product.stock < qty) {
      throw new BadRequestException(
        `Sản phẩm "${product.name}" không đủ tồn kho`,
      );
    }

    const result = await tx.product.updateMany({
      where: {
        id: productId,
        version: product.version,
        stock: { gte: qty },
      },
      data: {
        stock: { decrement: qty },
        version: { increment: 1 },
      },
    });

    if (result.count === 1) {
      return product;
    }
  }

  throw new ConflictException(
    'Hệ thống đang bận, vui lòng thử đặt hàng lại',
  );
}

/** Hoàn kho (khi hủy đơn). */
export async function releaseStock(tx: any, productId: number, qty: number) {
  await tx.product.update({
    where: { id: productId },
    data: {
      stock: { increment: qty },
      version: { increment: 1 },
    },
  });
}
