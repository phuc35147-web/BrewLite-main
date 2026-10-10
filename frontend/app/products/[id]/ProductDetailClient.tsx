'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { fetchJson, mockProducts, type Product } from '@/lib/api';

const sizeExtra: Record<string, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

const toppingExtra: Record<string, number> = {
  'Trân châu': 5000,
  Kem: 5000,
};

export default function ProductDetailClient({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [size, setSize] = useState('M');
  const [toppings, setToppings] = useState<string[]>([]);
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    let cancelled = false;

    fetchJson<Product | null>(`/products/${id}`, null)
      .then((data) => {
        if (cancelled) {
          return;
        }

        if (!data) {
          setProduct(mockProducts.find((item) => String(item.id) === id) ?? null);
          setError(
            mockProducts.find((item) => String(item.id) === id)
              ? ''
              : 'Không tìm thấy sản phẩm',
          );
          return;
        }

        setProduct(data);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const totalPrice = product
    ? product.price +
      sizeExtra[size] +
      toppings.reduce(
        (total, topping) => total + (toppingExtra[topping] ?? 0),
        0,
      )
    : 0;

  const toggleTopping = (topping: string) => {
    setToppings((current) =>
      current.includes(topping)
        ? current.filter((item) => item !== topping)
        : [...current, topping],
    );
  };

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: totalPrice,
      size,
      toppings,
      quantity: 1,
    });

    alert(
      `Đã thêm vào giỏ hàng!\n\n` +
        `Tên: ${product.name}\n` +
        `Size: ${size}\n` +
        `Topping: ${toppings.length > 0 ? toppings.join(', ') : 'Không có'}\n` +
        `Giá: ${formatPrice(totalPrice)}`,
    );
  };

  const artIndex = product ? (product.id - 1) % 4 : 0;
  const art = ['☕', '🧊', '🥛', '🍑'][artIndex];

  return (
    <main className="storefront product-page">
      <header className="site-header">
        <div className="nav-wrap">
          <Link href="/" className="brand" aria-label="BrewLite trang chủ"><span className="brand-mark">b</span><span>Brew<span className="brand-light">Lite</span><small>COFFEE HOUSE</small></span></Link>
          <nav className="main-nav" aria-label="Điều hướng chính"><Link href="/#menu" className="nav-active">Thực đơn</Link><Link href="/#about">Về BrewLite</Link><Link href="/#promise">Chất lượng</Link></nav>
          <div className="nav-actions"><Link href="/login" className="login-link">Đăng nhập</Link><Link href="/cart" className="cart-link"><span aria-hidden="true">▱</span><span>Giỏ hàng</span>{cartItemCount > 0 && <b className="cart-count">{cartItemCount}</b>}</Link></div>
        </div>
      </header>

      <div className="detail-wrap">
        <div className="breadcrumbs"><Link href="/">Trang chủ</Link><span>›</span><Link href="/#menu">Thực đơn</Link><span>›</span><span>{loading ? 'Đang tải...' : product?.name || 'Sản phẩm'}</span></div>
        {loading ? <div className="detail-loading"><span className="loading-cup">☕</span><p>Đang chuẩn bị sản phẩm cho bạn...</p></div> : error || !product ? <div className="detail-error"><span>☕</span><h1>Chưa tìm thấy món này</h1><p>{error || 'Sản phẩm hiện không khả dụng.'}</p><Link href="/" className="primary-cta">Quay lại thực đơn <span>↗</span></Link></div> : <>
          <div className="detail-layout">
            <section className={`detail-visual product-art-${artIndex}`} aria-label={`Hình minh họa ${product.name}`}>
              <span className="detail-badge">BREWLITE SIGNATURE</span><span className="detail-orbit" /><span className="detail-drink">{art}</span><span className="detail-visual-name">BrewLite <b>·</b> fresh daily</span><span className="detail-visual-spark">✳</span>
            </section>
            <section className="detail-content">
              <span className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> PHA TƯƠI MỖI NGÀY</span>
              <h1>{product.name}</h1>
              <p className="detail-description">{product.description || 'Hương vị cân bằng, thơm ngon vừa đủ. Được pha mới mỗi ngày từ những nguyên liệu tuyển chọn.'}</p>
              <div className="detail-price">{formatPrice(totalPrice)}<small>Đã bao gồm tùy chọn bạn chọn</small></div>
              <div className="option-block"><div className="option-heading"><b>Chọn kích cỡ</b><span>Chọn 1</span></div><div className="size-options">{(['S', 'M', 'L'] as const).map((item) => <button key={item} type="button" onClick={() => setSize(item)} className={`size-option ${size === item ? 'selected' : ''}`} aria-pressed={size === item}><span className="size-name">{item}</span><span className="size-price">{sizeExtra[item] === 0 ? 'Tiêu chuẩn' : `+${formatPrice(sizeExtra[item])}`}</span>{size === item && <span className="size-check">✓</span>}</button>)}</div></div>
              <div className="option-block toppings-block"><div className="option-heading"><b>Thêm topping</b><span>Tùy chọn</span></div><div className="topping-options">{Object.keys(toppingExtra).map((topping, index) => <label key={topping} className={`topping-option ${toppings.includes(topping) ? 'selected' : ''}`}><input type="checkbox" checked={toppings.includes(topping)} onChange={() => toggleTopping(topping)} /><span className="topping-icon">{index === 0 ? '◉' : '✧'}</span><span className="topping-name">{topping}<small>{index === 0 ? 'Dai mềm, ngọt dịu' : 'Béo mịn, thơm nhẹ'}</small></span><b>+{formatPrice(toppingExtra[topping])}</b></label>)}</div></div>
              <div className="stock-note"><span className={product.stock > 0 ? 'stock-dot' : 'stock-dot sold-out'} />{product.stock > 0 ? `Còn ${product.stock} phần hôm nay` : 'Tạm hết hàng hôm nay'}</div>
              <button type="button" onClick={handleAddToCart} disabled={product.stock <= 0} className="detail-add-button"><span>Thêm vào giỏ hàng</span><b>{formatPrice(totalPrice)}</b><span aria-hidden="true">↗</span></button>
              <p className="fresh-note">✦ &nbsp; Pha mới sau khi bạn đặt — ngon nhất khi thưởng thức ngay.</p>
            </section>
          </div>
          <section className="detail-perks"><div><span>✳</span><p><b>Nguyên liệu chọn lọc</b><small>Chỉ chọn điều tốt nhất</small></p></div><i /><div><span>♨</span><p><b>Pha mới theo đơn</b><small>Trọn vẹn hương vị</small></p></div><i /><div><span>♡</span><p><b>Chăm chút từng ly</b><small>Niềm vui trong từng ngụm</small></p></div></section>
        </>}
      </div>
      <footer className="site-footer"><Link href="/" className="brand footer-brand"><span className="brand-mark">b</span><span>Brew<span className="brand-light">Lite</span><small>COFFEE HOUSE</small></span></Link><span>Cà phê ngon, ngày thêm vui.</span><span>© 2026 BrewLite Coffee House</span></footer>
    </main>
  );
}
