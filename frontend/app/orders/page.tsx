'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

interface Product {
  id: number;
  name: string;
  imageUrl?: string | null;
}

interface OrderItem {
  id: number;
  productId: number;
  size: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  toppings?: string | null;
  product: Product;
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
}

interface Order {
  id: number;
  status: string;
  total: number;
  discount: number;
  loyaltyEarned: number;
  createdAt: string;
  items: OrderItem[];
  payments: Payment[];
}

interface LoginUser {
  id: number;
  email: string;
  name?: string | null;
  loyaltyPoints?: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<LoginUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }

    const fetchOrders = async () => {
      try {
        const accessToken =
          localStorage.getItem('accessToken');

        if (!accessToken) {
          setError(
            'Bạn chưa đăng nhập. Hãy đăng nhập để xem lịch sử đơn hàng.',
          );
          setLoading(false);
          return;
        }

        const response = await fetch(
          apiUrl('/orders/me'),
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');

            throw new Error(
              'Phiên đăng nhập đã hết hạn.',
            );
          }

          throw new Error(
            'Không thể tải lịch sử đơn hàng.',
          );
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi khi tải đơn hàng.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    setOrders([]);
    setError(
      'Bạn đã đăng xuất. Hãy đăng nhập để xem lịch sử đơn hàng.',
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Đã thanh toán';
      case 'PENDING':
        return 'Chờ thanh toán';
      case 'PAYMENT_FAILED':
        return 'Thanh toán thất bại';
      case 'PREPARING':
        return 'Đang chuẩn bị';
      case 'READY':
        return 'Đã sẵn sàng';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';

      case 'PENDING':
      case 'PREPARING':
        return 'bg-yellow-100 text-yellow-700';

      case 'READY':
        return 'bg-blue-100 text-blue-700';

      case 'PAYMENT_FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const formatToppings = (
    toppings: string | null | undefined,
  ) => {
    if (!toppings) return '';

    try {
      const parsed = JSON.parse(toppings);

      if (
        Array.isArray(parsed) &&
        parsed.length > 0
      ) {
        return parsed.join(', ');
      }

      return '';
    } catch {
      return toppings;
    }
  };

  return (
    <main className="container page-space">
      <div className="page-title"><div className="eyebrow">BREWLITE</div><h1>Lịch sử đơn hàng</h1><p>Xem lại các đơn hàng của bạn</p></div><div className="orders-content">
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="orders-heading">Đơn hàng gần đây</h2>
            </div>

            <Link
              href="/"
              className="btn btn-secondary"
            >
              Về trang chủ
            </Link>
          </div>

          {user ? (
            <div className="panel">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-amber-900">
                    Xin chào, {user.name || user.email}
                  </p>

                  <p className="text-sm text-gray-600">
                    Email: {user.email}
                  </p>

                  <p className="mt-1 text-sm text-amber-700">
                    Điểm loyalty:{' '}
                    {user.loyaltyPoints ?? 0}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-fit rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-gray-700">
                Bạn chưa đăng nhập.
              </p>

              <Link
                href="/login"
                className="mt-3 inline-block rounded-lg bg-amber-700 px-5 py-2 text-white hover:bg-amber-800"
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </div>

        {loading && (
          <div className="empty large">
            <p className="text-gray-500">
              Đang tải lịch sử đơn hàng...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="empty large">
            <p className="mb-4 text-red-600">
              {error}
            </p>

            {!user && (
              <Link
                href="/login"
                className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        )}

        {!loading &&
          !error &&
          orders.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow">
              <p className="mb-4 text-gray-500">
                Bạn chưa có đơn hàng nào.
              </p>

              <Link
                href="/"
                className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
              >
                Xem menu
              </Link>
            </div>
          )}

        {!loading &&
          !error &&
          orders.length > 0 && (
            <div className="space-y-6">
              {orders.map((order) => {
                const payment = order.payments[0];

                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-2xl bg-white shadow"
                  >
                    <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          Đơn hàng #{order.id}
                        </h2>

                        <p className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${getStatusClass(
                          order.status,
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    <div className="divide-y">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 p-5"
                        >
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {item.product.name}
                            </h3>

                            <p className="text-sm text-gray-500">
                              Size {item.size} ×{' '}
                              {item.qty}
                            </p>

                            {formatToppings(
                              item.toppings,
                            ) && (
                              <p className="text-sm text-gray-500">
                                Topping:{' '}
                                {formatToppings(
                                  item.toppings,
                                )}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatPrice(
                                item.lineTotal,
                              )}
                            </p>

                            <p className="text-sm text-gray-500">
                              {formatPrice(
                                item.unitPrice,
                              )}
                              /ly
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t bg-gray-50 p-5">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Tạm tính</span>
                        <span>
                          {formatPrice(
                            order.total +
                              order.discount,
                          )}
                        </span>
                      </div>

                      {order.discount > 0 && (
                        <div className="mt-1 flex justify-between text-sm text-green-600">
                          <span>Giảm giá</span>
                          <span>
                            -
                            {formatPrice(
                              order.discount,
                            )}
                          </span>
                        </div>
                      )}

                      {payment && (
                        <div className="mt-1 flex justify-between text-sm text-gray-600">
                          <span>Thanh toán</span>
                          <span>
                            {payment.method}
                          </span>
                        </div>
                      )}

                      <div className="mt-3 flex justify-between border-t pt-3">
                        <span className="font-bold text-gray-900">
                          Tổng cộng
                        </span>

                        <span className="text-xl font-bold text-blue-600">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </main>
  );
}
