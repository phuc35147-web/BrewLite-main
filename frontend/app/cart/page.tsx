'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { apiUrl } from '@/lib/api';

export default function CartPage() {
  const router = useRouter();

const [isCreatingOrder, setIsCreatingOrder] = useState(false);
const [orderError, setOrderError] = useState('');
  const items = useCartStore((state) => state.items);
const updateQuantity = useCartStore(
  (state) => state.updateQuantity,
);
const removeItem = useCartStore(
  (state) => state.removeItem,
);
const handleCreateOrder = async () => {
  if (items.length === 0) {
    return;
  }

  try {
    setIsCreatingOrder(true);
    setOrderError('');

    const accessToken = localStorage.getItem('accessToken');

if (!accessToken) {
  router.push('/login');
  return;
}

const response = await fetch(
  apiUrl('/orders'),
  {
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
  },
);
    const data = await response.json();
    if (response.status === 401) {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');

  router.push('/login');
  return;
}

    if (!response.ok) {
      throw new Error(
        data.message || 'Không thể tạo đơn hàng',
      );
    }

    console.log('Đơn hàng đã tạo:', data);

    useCartStore.getState().clearCart();

    alert(
      `Đặt hàng thành công!\n\nMã đơn: #${data.orderId}\nTổng tiền: ${formatPrice(data.total)}\nTrạng thái: ${data.status}`,
    );

    router.push('/');
  } catch (error) {
    setOrderError(
      error instanceof Error
        ? error.message
        : 'Không thể tạo đơn hàng',
    );
  } finally {
    setIsCreatingOrder(false);
  }
};

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-amber-900">
            Giỏ hàng
          </h1>

          <Link
            href="/"
            className="text-amber-700 hover:underline"
          >
            ← Tiếp tục mua hàng
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow">
            <p className="text-lg text-gray-500">
              Giỏ hàng đang trống.
            </p>

            <Link
              href="/"
              className="mt-5 inline-block rounded-lg bg-amber-700 px-5 py-3 text-white"
            >
              Xem menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={`${item.productId}-${item.size}-${index}`}
                className="rounded-2xl bg-white p-5 shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {item.name}
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                      Size: {item.size}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Topping:{' '}
                      {item.toppings.length > 0
                        ? item.toppings.join(', ')
                        : 'Không có'}
                    </p>

                    <p className="mt-2 font-medium text-amber-700">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3">
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() =>
        updateQuantity(
          item.productId,
          item.size,
          item.toppings,
          item.quantity - 1,
        )
      }
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-lg hover:bg-gray-100"
    >
      −
    </button>

    <span className="min-w-8 text-center font-semibold">
      {item.quantity}
    </span>

    <button
      type="button"
      onClick={() =>
        updateQuantity(
          item.productId,
          item.size,
          item.toppings,
          item.quantity + 1,
        )
      }
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-lg hover:bg-gray-100"
    >
      +
    </button>
  </div>

  <p className="text-lg font-bold text-gray-800">
    {formatPrice(item.price * item.quantity)}
  </p>

  <button
    type="button"
    onClick={() =>
      removeItem(
        item.productId,
        item.size,
        item.toppings,
      )
    }
    className="text-sm text-red-600 hover:underline"
  >
    Xóa
  </button>
</div>
                </div>
              </div>
            ))}

            <div className="rounded-2xl bg-white p-6 shadow">
              <div className="flex justify-between text-xl font-bold">
                <span>Tổng cộng</span>

                <span className="text-amber-700">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              {orderError && (
                <div className="mt-4 rounded-lg bg-red-100 p-4 text-red-700">
                  {orderError}
                </div>
              )}

              <button
  type="button"
  onClick={() => router.push('/checkout')}
  className="mt-5 w-full rounded-xl bg-amber-700 px-6 py-4 text-lg font-semibold text-white transition hover:bg-amber-800"
>
  Thanh toán
</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}