'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { fetchJson, mockProducts, type Product } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name?: string | null;
  loyaltyPoints?: number;
}

const productArt = ['☕', '🧊', '🥛', '🍑'];

export default function Home() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [user, setUser] = useState<User | null>(null);
  const cartItems = useCartStore((state) => state.items);
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    fetchJson<Product[]>('/products', mockProducts).then(setProducts);
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

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  return (
    <main className="storefront">
      <header className="site-header">
        <div className="nav-wrap">
          <Link href="/" className="brand" aria-label="BrewLite trang chủ">
            <span className="brand-mark">b</span><span>Brew<span className="brand-light">Lite</span><small>COFFEE HOUSE</small></span>
          </Link>
          <nav className="main-nav" aria-label="Điều hướng chính">
            <a href="#menu" className="nav-active">Thực đơn</a>
            <a href="#about">Về BrewLite</a>
            <a href="#promise">Chất lượng</a>
          </nav>
          <div className="nav-actions">
            {user ? <Link href="/account" className="account-link"><span className="avatar">{(user.name || user.email).charAt(0).toUpperCase()}</span><span>{user.name || 'Tài khoản'}</span></Link> : <Link href="/login" className="login-link">Đăng nhập</Link>}
            <Link href="/cart" className="cart-link"><span aria-hidden="true">▱</span><span>Giỏ hàng</span>{cartItemCount > 0 && <b className="cart-count">{cartItemCount}</b>}</Link>
          </div>
        </div>
      </header>

      <section className="hero" id="about">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-line" /> CÀ PHÊ MỖI NGÀY, NIỀM VUI MỖI NGÀY</span>
          <h1>Một chút <em>đậm đà,</em><br />cả ngày <em>thăng hoa.</em></h1>
          <p>Từ những hạt cà phê được tuyển chọn đến ly cà phê pha bằng cả sự tận tâm — dành riêng cho nhịp sống của bạn.</p>
          <div className="hero-actions"><a className="primary-cta" href="#menu">Khám phá thực đơn <span>↗</span></a><span className="hero-note"><span className="fresh-mark">✳</span> Được pha tươi mỗi ngày</span></div>
          <div className="hero-stats"><div><strong>100%</strong><span>Hạt cà phê tuyển chọn</span></div><i /><div><strong>5 phút</strong><span>Giao tận tay nhanh chóng</span></div></div>
        </div>
        <div className="hero-art" aria-label="Ly cà phê BrewLite">
          <div className="art-sun" /><span className="art-leaf leaf-one">✳</span><span className="art-leaf leaf-two">✳</span>
          <div className="coffee-cup"><div className="cup-steam">∿</div><div className="cup-lid" /><div className="cup-body"><span className="cup-logo">b<span>.</span></span><small>BREWLITE</small></div><div className="cup-shadow" /></div>
          <div className="art-caption"><span>01 / 04</span><i /><span>OUR SIGNATURE</span></div>
          <div className="floating-note"><span>✦</span><div><b>Đậm vị nguyên bản</b><small>Chắt lọc trong từng giọt</small></div></div>
        </div>
        <div className="hero-bottom"><span>SCROLL TO DISCOVER</span><span className="scroll-mark">↓</span><span className="hero-index">01 — 04</span></div>
      </section>

      <section className="promise-strip" id="promise"><div><span>✳</span><p><b>Hạt tuyển chọn</b><small>Chất lượng từ nguồn</small></p></div><i /><div><span>◷</span><p><b>Pha tươi mỗi ngày</b><small>Trọn vẹn hương vị</small></p></div><i /><div><span>♧</span><p><b>Giao nhanh tận nơi</b><small>Tiện lợi cho bạn</small></p></div><i /><div><span>♡</span><p><b>Chạm là có cà phê</b><small>Đặt hàng thật dễ dàng</small></p></div></section>

      <section className="menu-section" id="menu">
        <div className="section-heading"><div><span className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> ĐƯỢC YÊU THÍCH</span><h2>Chọn vị bạn <em>thương.</em></h2><p>Mỗi ly là một khoảnh khắc nhỏ đáng yêu trong ngày.</p></div><a className="text-link" href="#menu">Xem toàn bộ thực đơn <span>↗</span></a></div>
        {products.length === 0 ? <div className="empty-menu">Hiện chưa có sản phẩm. BrewLite sẽ sớm trở lại với bạn!</div> : <div className="product-grid">{products.map((product, index) => <article className="product-card" key={product.id}>
          <Link href={`/products/${product.id}`} className={`product-art product-art-${index % 4}`} aria-label={`Xem ${product.name}`}>
            <span className="product-tag">{index === 0 ? 'BÁN CHẠY' : index === 2 ? 'ĐƯỢC YÊU THÍCH' : 'BREWLITE PICK'}</span><span className="product-illustration">{productArt[index % productArt.length]}</span><span className="product-art-label">BREWLITE <b>·</b> FRESH DAILY</span>
          </Link>
          <div className="product-info"><div className="product-title-row"><Link href={`/products/${product.id}`}><h3>{product.name}</h3></Link></div><p>{product.description || 'Hương vị cân bằng, thơm ngon vừa đủ.'}</p><div className="product-buy"><strong>{formatPrice(product.price)}</strong><Link href={`/products/${product.id}`} className="add-button" aria-label={`Chọn ${product.name}`}>+</Link></div></div>
        </article>)}</div>}
      </section>

      <footer className="site-footer"><Link href="/" className="brand footer-brand"><span className="brand-mark">b</span><span>Brew<span className="brand-light">Lite</span><small>COFFEE HOUSE</small></span></Link><span>Cà phê ngon, ngày thêm vui.</span><span>© 2025 BrewLite Coffee House</span></footer>
    </main>
  );
}
