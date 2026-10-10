export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  stock: number;
  isActive: boolean;
}

export const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Cà phê sữa',
    description: 'Cà phê sữa truyền thống',
    price: 35000,
    imageUrl: '/images/ca-phe-sua.jpg',
    stock: 39,
    isActive: true,
  },
  {
    id: 2,
    name: 'Americano',
    description: 'Americano đậm vị',
    price: 40000,
    imageUrl: '/images/americano.jpg',
    stock: 47,
    isActive: true,
  },
  {
    id: 3,
    name: 'Cappuccino',
    description: 'Cappuccino thơm béo',
    price: 45000,
    imageUrl: '/images/cappuccino.jpg',
    stock: 30,
    isActive: true,
  },
  {
    id: 4,
    name: 'Trà đào',
    description: 'Trà đào thanh mát',
    price: 39000,
    imageUrl: '/images/tra-dao.jpg',
    stock: 40,
    isActive: true,
  },
];

export async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(apiUrl(path), { cache: 'no-store' });

    if (!res.ok) {
      return fallback;
    }

    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}