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
  const [sugar, setSugar] = useState('70%');
  const [ice, setIce] = useState('70%');
  const [imgOk, setImgOk] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

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

  const artEmojis = ['☕', '🧊', '🥛', '🍑', '🍶', '🧂', '☕', '🍵', '🧋', '🍯', '🪷', '🍫'];
  const artIndex = product ? (product.id - 1) % 4 : 0;
  const art = product ? artEmojis[(product.id - 1) % artEmojis.length] : '☕';

  return (
    <main className="container page-space product-detail-page">
      <Link href="/#menu" className="back-link">‹ &nbsp; Quay lại thực đơn</Link>
      {loading ? <div className="panel">Đang tải sản phẩm...</div> : error || !product ? <div className="panel"><h1>Chưa tìm thấy món này</h1><p>{error || 'Sản phẩm hiện không khả dụng.'}</p><Link href="/" className="btn btn-primary">Quay lại thực đơn</Link></div> : <div className="detail-grid">
        <div className="detail-image">{product.imageUrl && imgOk ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={product.imageUrl} alt={product.name} onError={() => setImgOk(false)} /> : <div className="detail-placeholder">{art}</div>}<span>Được yêu thích</span></div>
        <section className="detail-info"><div className="eyebrow">TÙY CHỈNH THỨC UỐNG</div><h1>{product.name}</h1><p className="lead">{product.description || 'Cân bằng hương vị, pha mới mỗi ngày khi bạn đặt để giữ trọn hương vị.'}</p><div className="base-price"><span>Giá cơ bản</span><strong>{formatPrice(product.price)}</strong></div>
          <div className="option"><div className="option-title"><h3>Chọn kích cỡ</h3><span>Bắt buộc</span></div><div className="option-list">{(['S','M','L'] as const).map((item) => <button key={item} type="button" onClick={() => setSize(item)} className={`choice ${size === item ? 'selected' : ''}`} aria-pressed={size === item}><b>{item}</b><span>{sizeExtra[item] ? `+${formatPrice(sizeExtra[item])}` : '+0đ'}</span></button>)}</div></div>
          <div className="option"><div className="option-title"><h3>Thêm topping</h3><small>Tùy chọn · có thể chọn nhiều</small></div><div className="option-list">{Object.keys(toppingExtra).map((topping) => <button key={topping} type="button" className={`check-choice ${toppings.includes(topping) ? 'selected' : ''}`} aria-pressed={toppings.includes(topping)} onClick={() => toggleTopping(topping)}><span className="fake-check" aria-hidden="true">✓</span><b>{topping}</b><span>+{formatPrice(toppingExtra[topping])}</span></button>)}</div></div>
          <div className="option two-options">{([['Lượng đường', sugar, setSugar], ['Lượng đá', ice, setIce]] as const).map(([title, value, setter]) => <div key={title}><div className="option-title"><h3>{title}</h3></div><div className="option-list">{['30%','50%','70%','100%'].map((level) => <button type="button" key={level} onClick={() => setter(level)} className={`pill ${value === level ? 'selected' : ''}`}>{level}</button>)}</div></div>)}</div>
          <div className="detail-bottom"><div className="quantity"><button type="button" aria-label="Giảm số lượng">−</button><b>1</b><button type="button" aria-label="Tăng số lượng">+</button></div><button type="button" onClick={handleAddToCart} disabled={product.stock <= 0} className="btn btn-primary add-cart">♧ &nbsp; Thêm vào giỏ hàng <strong>{formatPrice(totalPrice)}</strong></button></div>
        </section>
      </div>}
    </main>
  );
}
