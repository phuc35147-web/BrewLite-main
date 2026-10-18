'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';

interface User {
  email: string;
  name?: string | null;
}

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    try {
      setUser(JSON.parse(stored) as User);
    } catch {
      localStorage.removeItem('user');
    }
  }, [pathname]);

  return (
    <div className="app fresh-route-shell">
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo" aria-label="BrewLite - Trang chủ"><span className="logo-mark">☕</span><span>Brew<span>Lite</span><small>COFFEE HOUSE</small></span></Link>
          <nav aria-label="Điều hướng chính">
            <Link className={pathname === '/' ? 'active' : ''} href="/">Trang chủ</Link>
            <Link className={pathname.startsWith('/products') ? 'active' : ''} href="/#menu">Thực đơn</Link>
            <Link className={pathname === '/orders' ? 'active' : ''} href={user ? '/orders' : '/login'}>Đơn hàng của tôi</Link>
          </nav>
          <div className="header-actions">
            <Link href="/cart" className="btn btn-ghost cart-btn icon-btn" aria-label={`Giỏ hàng, ${itemCount} món`}><span aria-hidden="true">♧</span>{itemCount > 0 && <b>{itemCount}</b>}</Link>
            {user ? <Link href="/account" className="btn btn-secondary account-btn"><span aria-hidden="true">♙</span>{user.name || 'Tài khoản'}</Link> : <Link href="/login" className="btn btn-secondary">♙ &nbsp; Đăng nhập</Link>}
          </div>
        </div>
      </header>
      <div className={`app-route ${pathname === '/' ? 'home-route' : pathname.slice(1).replaceAll('/', '-')}`}>{children}</div>
      <footer><div className="footer-inner"><div><Link href="/" className="logo"><span className="logo-mark">☕</span><span>Brew<span>Lite</span></span></Link><p>Mỗi ly cà phê, một khoảnh khắc đáng nhớ.</p></div><div><h4>Ghé BrewLite</h4><p>273 An Dương Vương, Gò Vấp, TP.HCM</p><p>07:00 — 22:00, mỗi ngày</p></div><div><h4>Liên hệ</h4><p>công nghệ phần mềm khoa it đại học sài gòn · hello@brewlite.vn</p><p>Hỗ trợ đơn hàng trực tuyến</p></div></div><div className="copyright">© 2025 BrewLite. Dự án Software Engineering — Thanh toán chỉ được mô phỏng.</div></footer>
    </div>
  );
}
