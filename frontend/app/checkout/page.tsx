'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
  const [customer, setCustomer] = useState<{ name?: string; email?: string } | null>(null);
  useEffect(() => {
    try { setCustomer(JSON.parse(localStorage.getItem('user') || 'null')); } catch { setCustomer(null); }
  }, []);

  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState('');

  // Mã khuyến mãi (backend hiện hỗ trợ BREW10: giảm 10%, tối đa 20.000đ).
  const [promoCode, setPromoCode] = useState('');
  // Sau khi đơn đã được tạo thì khóa ô mã, vì giảm giá đã được tính vào đơn.
  const [orderLocked, setOrderLocked] = useState(false);
  type OrderInfo = { subtotal: number; discount: number; total: number };
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  // Bản sao trong ref để hàm thanh toán (kể cả lần thử lại) đọc được giá trị mới nhất.
  const orderInfoRef = useRef<OrderInfo | null>(null);

  const promo = promoCode.trim().toUpperCase();
  const promoValid = promo === 'BREW10';
  const discountPreview = promoValid
    ? Math.min(Math.floor(totalPrice * 0.1), 20000)
    : 0;
  const discount = orderInfo?.discount ?? discountPreview;
  const payableTotal = orderInfo?.total ?? totalPrice - discountPreview;

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
            ...(promo ? { promoCode: promo } : {}),
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
        const info: OrderInfo = {
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          total: orderData.total,
        };
        orderInfoRef.current = info;
        setOrderInfo(info);
        setOrderLocked(true);
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

      const summary = orderInfoRef.current;
      pendingOrderId.current = null;
      attemptKey.current = null;
      orderInfoRef.current = null;

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
          subtotal: summary?.subtotal,
          discount: summary?.discount ?? 0,
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
    <main className="container page-space checkout-page">
      <div className="page-title"><div className="eyebrow">THANH TOÁN</div><h1>Hoàn tất đơn hàng</h1><p>Kiểm tra thông tin trước khi hoàn tất thanh toán mô phỏng.</p></div>
      <div className="checkout-grid"><div className="checkout-main">
        <section className="panel"><div className="panel-heading"><span className="step-number">1</span><h2>Thông tin khách hàng</h2><Link href="/account">Chỉnh sửa</Link></div><strong>{customer?.name || customer?.email || 'Khách BrewLite'}</strong><p>{customer?.email || 'Thông tin tài khoản sẽ được sử dụng cho đơn hàng.'}</p></section>
        <section className="panel"><div className="panel-heading"><span className="step-number">2</span><h2>Nhận món</h2></div><div className="pickup"><strong>♧ &nbsp; Nhận tại quầy BrewLite</strong><p>12 Nguyễn Văn Bảo, Gò Vấp, TP.HCM</p><small>Dự kiến sẵn sàng trong 10–15 phút</small><span className="badge">ĐÃ CHỌN</span></div></section>
        <section className="panel"><div className="panel-heading"><span className="step-number">3</span><h2>Phương thức thanh toán</h2></div><div className="payment-options"><button type="button" className={method === 'WALLET' ? 'selected' : ''} onClick={() => setMethod('WALLET')}><span>▣</span><b>Ví điện tử<small>MoMo, ZaloPay (mô phỏng)</small></b><i>{method === 'WALLET' ? '●' : '○'}</i></button><button type="button" className={method === 'CARD' ? 'selected' : ''} onClick={() => setMethod('CARD')}><span>▤</span><b>Thẻ ngân hàng<small>Visa, Mastercard, NAPAS</small></b><i>{method === 'CARD' ? '●' : '○'}</i></button></div><div className="simulate-note">Thanh toán trong đồ án chỉ là mô phỏng, không phát sinh giao dịch thật.</div></section>
        <section className="panel"><label className="field"><b>Mã khuyến mãi</b><input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} disabled={orderLocked || isPaying} placeholder="Nhập mã, ví dụ BREW10" />{orderLocked && <small>Đơn hàng đã được tạo, không thể đổi mã.</small>}{!orderLocked && promo && !promoValid && <small className="error-text">Mã khuyến mãi không hợp lệ.</small>}{!orderLocked && promoValid && <small className="success-text">Đã áp dụng BREW10: giảm 10%, tối đa 20.000đ.</small>}</label></section>
        <section className="panel"><label className="field"><b>Ghi chú cho quán <small>(không bắt buộc)</small></b><textarea placeholder="Ví dụ: Ít ngọt hơn, mang đi..." /></label></section>
      </div><aside className="summary checkout-summary"><h2>Đơn hàng của bạn</h2>{items.map((item, index) => <div className="checkout-item" key={`${item.productId}-${item.size}-${index}`}><div className="cart-placeholder">☕</div><span><b>{item.quantity} × {item.name}</b><small>Size {item.size}</small></span><strong>{formatPrice(item.price * item.quantity)}</strong></div>)}<div className="summary-row"><span>Tạm tính</span><strong>{formatPrice(orderInfo?.subtotal ?? totalPrice)}</strong></div>{discount > 0 && <div className="summary-row"><span>Giảm giá {promo}</span><strong>-{formatPrice(discount)}</strong></div>}<div className="summary-row"><span>Phí dịch vụ</span><strong>0đ</strong></div><div className="summary-total"><span>Tổng thanh toán</span><strong>{formatPrice(payableTotal)}</strong></div><button type="button" onClick={handlePayment} disabled={isPaying || (!orderLocked && promo !== '' && !promoValid)} className="btn btn-primary wide">{isPaying ? 'Đang xử lý...' : `Xác nhận thanh toán · ${formatPrice(payableTotal)}`}</button><Link className="continue-link" href="/cart">‹ &nbsp; Quay lại giỏ hàng</Link>{error && <div className="error-note">{error}</div>}</aside></div>
    </main>
  );
}

