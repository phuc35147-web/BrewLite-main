import ProductDetailClient from './ProductDetailClient';
import { mockProducts } from '@/lib/api';

export const dynamicParams = false;

export function generateStaticParams() {
  return mockProducts.map((product) => ({ id: String(product.id) }));
}

export default async function ProductDetailPage({
  params,
}: PageProps<'/products/[id]'>) {
  const { id } = await params;

  return <ProductDetailClient id={id} />;
}