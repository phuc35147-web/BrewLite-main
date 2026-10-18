'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { apiUrl } from '@/lib/api';
import { mockProducts } from '@/lib/api';

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
    <main className="container page-space">
      <div className="page-title"><div className="eyebrow">GIỎ HÀNG</div><h1>Giỏ hàng của bạn</h1><p>{items.length} món ngon đang chờ bạn xác nhận</p></div>

        {items.length === 0 ? (
          <div className="empty large">
            <p>
              Giỏ hàng đang trống.
            </p>

            <Link
              href="/"
              className="btn btn-primary"
            >
              Xem menu
            </Link>
          </div>
        ) : (
          <div className="cart-layout"><div className="cart-list">
            {items.map((item, index) => (
              <div
                key={`${item.productId}-${item.size}-${index}`}
                className="cart-item"
              >
                <>
                    {mockProducts.find((product) => product.id === item.productId)?.imageUrl ? <img src={mockProducts.find((product) => product.id === item.productId)?.imageUrl ?? ''} alt={item.name} /> : <div className="cart-placeholder">☕</div>}
                    <div className="cart-item-info"><h2>
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

                    </div>

                  <div className="item-end"><strong>{formatPrice(item.price * item.quantity)}</strong><div className="quantity">
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
      aria-label="Giảm số lượng"
    >
      −
    </button>

    <span>
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
      aria-label="Tăng số lượng"
    >
      +
    </button>
  </div>

  <button
    type="button"
    onClick={() =>
      removeItem(
        item.productId,
        item.size,
        item.toppings,
      )
    }
    className="remove-item"
  >
    Xóa
  </button>
 </div>
                </>
              </div>
            ))}

          </div><aside className="summary"><h2>Tóm tắt đơn hàng</h2><div className="summary-row"><span>Tạm tính</span><strong>{formatPrice(totalPrice)}</strong></div><div className="summary-row"><span>Giảm giá</span><strong>0đ</strong></div><div className="summary-note">♧ &nbsp; Nhận tại quầy<br/><small>Không tính phí giao hàng</small></div><div className="summary-total"><span>Tổng cộng</span><strong>{formatPrice(totalPrice)}</strong></div>
              {orderError && (
                <div className="error-note">
                  {orderError}
                </div>
              )}

              <button
  type="button"
  onClick={() => router.push('/checkout')}
  className="btn btn-primary wide"
>
  Tiến hành thanh toán&nbsp; ›
</button>
              <Link className="continue-link" href="/">Tiếp tục mua hàng</Link></aside></div>
        )}
    </main>
  );
}
