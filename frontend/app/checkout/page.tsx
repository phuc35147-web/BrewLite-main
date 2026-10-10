'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { apiUrl } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [method, setMethod] = useState<'WALLET' | 'CARD'>(
    'WALLET',
  );

  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState('');

  // Đơn đã tạo nhưng thanh toán lỗi: thử lại trên đơn cũ, tránh tạo đơn mới và trừ kho thêm.
  const pendingOrderId = useRef<number | null>(null);
  // Mỗi lần thử thanh toán dùng một Idempotency-Key riêng; bấm đúp cùng lần thử vẫn dùng chung key.
  const attemptKey = useRef<string | null>(null);

  const handlePayment = async () => {
    if (items.length === 0) {
      router.push('/cart');
      return;
    }

    try {
      setIsPaying(true);
      setError('');

      const accessToken =
        localStorage.getItem('accessToken');

      if (!accessToken) {
        router.push('/login');
        return;
      }

      // BƯỚC 1: TẠO ORDER (bỏ qua nếu đang thử lại đơn cũ)
      let orderId = pendingOrderId.current;

      if (orderId === null) {
        const orderResponse = await fetch(apiUrl('/orders'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.productId,
              size: item.size,
              quantity: item.quantity,
              toppings: item.toppings,
            })),
          }),
        });

        const orderData = await orderResponse.json();

        if (orderResponse.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }

        if (!orderResponse.ok) {
          throw new Error(
            Array.isArray(orderData.message)
              ? orderData.message.join(', ')
              : orderData.message || 'Không thể tạo đơn hàng',
          );
        }

        orderId = orderData.orderId as number;
        pendingOrderId.current = orderId;
      }

      // BƯỚC 2: IDEMPOTENCY KEY cho lần thử hiện tại
      if (!attemptKey.current) {
        attemptKey.current = `BREWLITE-ORDER-${orderId}-${crypto.randomUUID()}`;
      }

      // BƯỚC 3: THANH TOÁN (có JWT)
      const paymentResponse = await fetch(apiUrl('/payments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Idempotency-Key': attemptKey.current,
        },
        body: JSON.stringify({ orderId, method }),
      });

      const paymentData =
        await paymentResponse.json();

      // Thanh toán thất bại
      if (!paymentResponse.ok) {
        throw new Error(
          Array.isArray(paymentData.message)
            ? paymentData.message.join(', ')
            : paymentData.message ||
                'Thanh toán thất bại',
        );
      }

      if (paymentData.status !== 'PAID') {
        // Lỗi nghiệp vụ: lần thử sau dùng key mới, giữ nguyên đơn và giỏ hàng.
        attemptKey.current = null;
        throw new Error(
          'Thanh toán thất bại. Giỏ hàng được giữ nguyên, bạn có thể thử lại.',
        );
      }

      pendingOrderId.current = null;
      attemptKey.current = null;

      // Chỉ xóa giỏ sau khi PAID
      clearCart();

      // Lưu thông tin đơn để trang xác nhận dùng
      sessionStorage.setItem(
        'lastOrder',
        JSON.stringify({
          orderId: paymentData.orderId,
          status: paymentData.status,
          amount: paymentData.amount,
          method: paymentData.method,
          loyaltyEarned: paymentData.loyaltyEarned,
        }),
      );

      router.push('/checkout/success');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Thanh toán thất bại',
      );
    } finally {
      setIsPaying(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow">
          <h1 className="text-2xl font-bold text-gray-800">
            Giỏ hàng đang trống
          </h1>

          <Link
            href="/"
            className="mt-5 inline-block rounded-lg bg-amber-700 px-5 py-3 text-white"
          >
            Về menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/cart"
          className="text-amber-700 hover:underline"
        >
          ← Quay lại giỏ hàng
        </Link>

        <div className="mt-6 rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-amber-900">
            Thanh toán
          </h1>

          <div className="mt-6">
            <h2 className="text-lg font-semibold">
              Tổng tiền
            </h2>

            <p className="mt-2 text-3xl font-bold text-amber-700">
              {formatPrice(totalPrice)}
            </p>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold">
              Phương thức thanh toán
            </h2>

            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="WALLET"
                  checked={method === 'WALLET'}
                  onChange={() => setMethod('WALLET')}
                />

                <span>Ví điện tử</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={method === 'CARD'}
                  onChange={() => setMethod('CARD')}
                />

                <span>Thẻ ngân hàng</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePayment}
            disabled={isPaying}
            className="mt-8 w-full rounded-xl bg-amber-700 px-6 py-4 text-lg font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isPaying
              ? 'Đang xử lý thanh toán...'
              : 'Xác nhận thanh toán'}
          </button>

          {error && (
            <div className="mt-4 rounded-lg bg-red-100 p-4 text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}