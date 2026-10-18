'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface LastOrder {
  orderId: number;
  status: string;
  paymentId?: number;
  amount?: number;
  method?: string;
  subtotal?: number;
  discount?: number;
  loyaltyEarned?: number;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + 'đ';

const METHOD_LABEL: Record<string, string> = {
  WALLET: 'Ví điện tử',
  CARD: 'Thẻ ngân hàng',
};

export default function CheckoutSuccessPage() {
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('lastOrder');

    if (data) {
      try {
        setOrder(JSON.parse(data));
      } catch {
        setOrder(null);
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow">
        <div className="mb-4 text-5xl">✅</div>

        <h1 className="mb-2 text-3xl font-bold text-amber-900">
          Đặt hàng thành công!
        </h1>

        <p className="mb-6 text-gray-600">
          Đơn hàng của bạn đã được thanh toán. Mời bạn tới quầy lấy nước.
        </p>

        {order ? (
          <div className="mb-6 space-y-1 rounded-xl bg-amber-50 p-4 text-left">
            <p>
              <strong>Mã đơn hàng:</strong> #{order.orderId}
            </p>

            <p>
              <strong>Trạng thái:</strong> {order.status}
            </p>

            {order.method && (
              <p>
                <strong>Phương thức:</strong>{' '}
                {METHOD_LABEL[order.method] ?? order.method}
              </p>
            )}

            {order.subtotal !== undefined && (
              <p>
                <strong>Tạm tính:</strong> {formatPrice(order.subtotal)}
              </p>
            )}

            {order.discount !== undefined && order.discount > 0 && (
              <p className="text-green-700">
                <strong>Khuyến mãi:</strong> -{formatPrice(order.discount)}
              </p>
            )}

            {order.amount !== undefined && (
              <p>
                <strong>Đã thanh toán:</strong> {formatPrice(order.amount)}
              </p>
            )}

            {order.loyaltyEarned !== undefined && order.loyaltyEarned > 0 && (
              <p>
                <strong>Điểm thưởng nhận được:</strong> +{order.loyaltyEarned}
              </p>
            )}
          </div>
        ) : (
          <p className="mb-6 text-gray-500">
            Không tìm thấy thông tin đơn hàng.
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-amber-700 px-5 py-3 text-white hover:bg-amber-800"
          >
            Về trang chủ
          </Link>

          <Link
            href="/orders"
            className="rounded-lg border border-gray-300 px-5 py-3 hover:bg-gray-100"
          >
            Lịch sử đơn hàng
          </Link>
        </div>
      </div>
    </main>
  );
}
