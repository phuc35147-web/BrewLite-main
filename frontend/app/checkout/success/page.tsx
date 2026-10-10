'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface LastOrder {
  orderId: number;
  status: string;
  paymentId?: number;
  amount?: number;
  method?: string;
}

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
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow">
        <div className="mb-4 text-5xl">✅</div>

        <h1 className="mb-2 text-3xl font-bold text-green-600">
          Thanh toán thành công!
        </h1>

        <p className="mb-6 text-gray-600">
          Đơn hàng của bạn đã được xác nhận.
        </p>

        {order ? (
          <div className="mb-6 rounded-xl bg-gray-100 p-4 text-left">
            <p>
              <strong>Mã đơn hàng:</strong> #{order.orderId}
            </p>

            <p>
              <strong>Trạng thái:</strong> {order.status}
            </p>

            {order.method && (
              <p>
                <strong>Phương thức:</strong> {order.method}
              </p>
            )}

            {order.amount !== undefined && (
              <p>
                <strong>Số tiền:</strong>{' '}
                {order.amount.toLocaleString('vi-VN')}đ
              </p>
            )}
          </div>
        ) : (
          <p className="mb-6 text-gray-500">
            Không tìm thấy thông tin đơn hàng.
          </p>
        )}

        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Về trang chủ
          </Link>

          <Link
            href="/cart"
            className="rounded-lg border border-gray-300 px-5 py-3 hover:bg-gray-100"
          >
            Xem giỏ hàng
          </Link>
        </div>
      </div>
    </main>
  );
}