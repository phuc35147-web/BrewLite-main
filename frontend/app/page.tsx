'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchJson, mockProducts, type Product } from '@/lib/api';

type Category = 'Tất cả' | 'Cà phê' | 'Trà' | 'Đá xay';
const categories: Category[] = ['Tất cả', 'Cà phê', 'Trà', 'Đá xay'];
const productArt = ['☕', '🧊', '🥛', '🍑', '🍶', '🧂', '☕', '🍵', '🧋', '🍯', '🪷', '🍫'];
const categoryFor = (name: string): Exclude<Category, 'Tất cả'> => {
  if (/trà|matcha|sen/i.test(name)) return 'Trà';
  if (/xay|smoothie|frappe/i.test(name)) return 'Đá xay';
  return 'Cà phê';
};
const money = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

export default function Home() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [category, setCategory] = useState<Category>('Tất cả');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchJson<Product[]>('/products', mockProducts).then(setProducts);
  }, []);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'Tất cả' || categoryFor(product.name) === category;
    const matchesSearch = `${product.name} ${product.description ?? ''}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'));
    return matchesCategory && matchesSearch;
  }), [category, products, search]);

  return (
    <main className="storefront fresh-storefront">
      <section className="fresh-hero" id="about">
        <div className="fresh-hero-copy">
          <span className="fresh-eyebrow"><i /> CÀ PHÊ NGON · ĐẶT MÓN NHANH</span>
          <h1>Một chút cà phê,<br /><em>thêm nhiều cảm hứng.</em></h1>
          <p>Thưởng thức đồ uống yêu thích theo cách nhẹ nhàng hơn. Đặt trước, thanh toán không tiền mặt và nhận tại quầy.</p>
          <div className="fresh-hero-actions"><a href="#menu" className="fresh-primary">Khám phá thực đơn <span>↗</span></a><span className="fresh-rating"><b>★★★★★</b> 4.9 từ khách hàng</span></div>
          <div className="fresh-stats"><div><strong>8+</strong><span>Thức uống tuyển chọn</span></div><i /><div><strong>5 phút</strong><span>Đặt món dễ dàng</span></div></div>
        </div>
        <div className="fresh-hero-image"><img src="https://images.unsplash.com/photo-1702293798770-d258d56e46a7?auto=format&fit=crop&w=1400&q=90" alt="Cà phê BrewLite trong ánh sáng ấm" /><div className="fresh-image-caption"><span>01</span><div><b>Rang mới mỗi ngày</b><small>Hạt tuyển chọn · Pha thủ công</small></div></div><span className="fresh-image-label">BREWLITE · FRESH DAILY</span></div>
      </section>

      <section className="fresh-promise" id="promise" aria-label="Cam kết chất lượng">
        <div><span>✳</span><p><b>Hạt tuyển chọn</b><small>Chất lượng từ nguồn</small></p></div><i /><div><span>◷</span><p><b>Pha tươi mỗi ngày</b><small>Trọn vẹn hương vị</small></p></div><i /><div><span>♧</span><p><b>Nhận tại quầy</b><small>Không chờ đợi lâu</small></p></div><i /><div><span>♡</span><p><b>Đặt hàng dễ dàng</b><small>Chỉ vài thao tác</small></p></div>
      </section>

      <section className="fresh-menu" id="menu">
        <div className="fresh-menu-heading"><div><span className="fresh-eyebrow"><i /> THỰC ĐƠN BREWLITE</span><h2>Chọn vị bạn <em>yêu.</em></h2><p>Từ cà phê đậm đà đến trà thanh mát, luôn có một lựa chọn dành cho bạn.</p></div><label className="fresh-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm đồ uống yêu thích..." aria-label="Tìm đồ uống" /></label></div>
        <div className="fresh-filters" role="group" aria-label="Lọc theo danh mục">{categories.map((item) => <button key={item} type="button" className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
        {filteredProducts.length > 0 ? <div className="fresh-products">{filteredProducts.map((product, index) => <article className="fresh-product" key={product.id}>
          <Link href={`/products/${product.id}`} className={`fresh-product-image image-tone-${index % 4}`} aria-label={`Xem ${product.name}`}>
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span className="fresh-product-art" aria-hidden="true">{productArt[index % productArt.length]}</span>}
            <span className="fresh-product-tag">{index === 0 ? 'BÁN CHẠY' : index === 5 ? 'ĐẶC SẢN' : 'BREWLITE PICK'}</span><span className="fresh-product-label">{categoryFor(product.name)}</span>
          </Link>
          <div className="fresh-product-info"><div><Link href={`/products/${product.id}`}><h3>{product.name}</h3></Link><span className="fresh-product-rating">★ 4.9</span></div><p>{product.description || 'Hương vị cân bằng, thơm ngon vừa đủ.'}</p><div className="fresh-product-buy"><strong>{money(product.price)}</strong><Link href={`/products/${product.id}`} aria-label={`Chọn ${product.name}`} className="fresh-add">+</Link></div></div>
        </article>)}</div> : <div className="fresh-empty"><span>⌕</span><h3>Chưa tìm thấy món phù hợp</h3><p>Thử từ khóa hoặc danh mục khác nhé.</p><button type="button" onClick={() => { setSearch(''); setCategory('Tất cả'); }}>Xem toàn bộ thực đơn</button></div>}
      </section>

    </main>
  );
}
