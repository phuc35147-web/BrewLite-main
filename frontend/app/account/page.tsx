'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name?: string | null;
  loyaltyPoints?: number;
}

interface Product {
  id: number;
  name: string;
}

interface OrderItem {
  id: number;
  size: string;
  qty: number;
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

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'orders'>(
    'info',
  );
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'orders') {
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        setError('');

        const accessToken =
          localStorage.getItem('accessToken');

        if (!accessToken) {
          setError(
            'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.',
          );
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

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            Array.isArray(data.message)
              ? data.message.join(', ')
              : data.message ||
                  'Không thể tải lịch sử mua hàng',
          );
        }

        setOrders(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải lịch sử mua hàng',
        );
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');

    window.location.href = '/';
  };

  const formatPrice = (price: number) => {
    return (
      new Intl.NumberFormat('vi-VN').format(price) +
      'đ'
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ thanh toán';

      case 'PAID':
        return 'Đã thanh toán';

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

  const formatToppings = (
    toppings: string | null | undefined,
  ) => {
    if (!toppings) {
      return '';
    }

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

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow">
          <h1 className="text-3xl font-bold text-amber-900">
            Tài khoản
          </h1>

          <p className="mt-3 text-gray-600">
            Bạn chưa đăng nhập.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-amber-700 px-5 py-3 font-semibold text-white hover:bg-amber-800"
            >
              Đăng nhập
            </Link>

            <Link
              href="/"
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 hover:bg-gray-100"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">
              Tài khoản
            </h1>

            <p className="mt-1 text-gray-500">
              Quản lý thông tin và lịch sử mua hàng
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-100"
          >
            ← Về trang chủ
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow">
          {/* Header */}
          <div className="border-b bg-amber-50 p-6">
            <h2 className="text-xl font-bold text-amber-900">
              {user.name || user.email}
            </h2>

            <p className="mt-1 text-gray-600">
              {user.email}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'info'
                  ? 'border-b-2 border-amber-700 text-amber-700'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Thông tin tài khoản
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'orders'
                  ? 'border-b-2 border-amber-700 text-amber-700'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Lịch sử mua hàng
            </button>
          </div>

          {/* Tab thông tin */}
          {activeTab === 'info' && (
            <div className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl border p-5">
                  <p className="text-sm text-gray-500">
                    Họ và tên
                  </p>

                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {user.name || 'Chưa cập nhật'}
                  </p>
                </div>

                <div className="rounded-xl border p-5">
                  <p className="text-sm text-gray-500">
                    Email
                  </p>

                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {user.email}
                  </p>
                </div>

                <div className="rounded-xl border p-5">
                  <p className="text-sm text-gray-500">
                    Loyalty
                  </p>

                  <p className="mt-2 text-lg font-semibold text-amber-700">
                    {user.loyaltyPoints ?? 0} điểm
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-red-300 px-5 py-2 font-medium text-red-600 hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          )}

          {/* Tab lịch sử mua hàng */}
          {activeTab === 'orders' && (
            <div className="p-6">
              {loadingOrders && (
                <div className="py-10 text-center text-gray-500">
                  Đang tải lịch sử mua hàng...
                </div>
              )}

              {!loadingOrders && error && (
                <div className="rounded-lg bg-red-100 p-4 text-red-700">
                  {error}
                </div>
              )}

              {!loadingOrders &&
                !error &&
                orders.length === 0 && (
                  <div className="py-10 text-center text-gray-500">
                    Bạn chưa có đơn hàng nào.
                  </div>
                )}

              {!loadingOrders &&
                !error &&
                orders.length > 0 && (
                  <div className="space-y-5">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="overflow-hidden rounded-xl border"
                      >
                        <div className="flex flex-col gap-3 border-b bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900">
                              Đơn hàng #{order.id}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
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
                              className="flex justify-between gap-4 p-4"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.product.name}
                                </p>

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

                              <p className="font-medium text-gray-900">
                                {formatPrice(
                                  item.lineTotal,
                                )}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="border-t bg-gray-50 p-5">
                          {order.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Giảm giá</span>

                              <span>
                                -
                                {formatPrice(
                                  order.discount,
                                )}
                              </span>
                            </div>
                          )}

                          <div className="mt-2 flex justify-between border-t pt-3">
                            <span className="font-bold">
                              Tổng cộng
                            </span>

                            <span className="text-xl font-bold text-amber-700">
                              {formatPrice(order.total)}
                            </span>
                          </div>

                          {order.payments[0] && (
                            <p className="mt-2 text-sm text-gray-500">
                              Thanh toán:{' '}
                              {order.payments[0].method}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}