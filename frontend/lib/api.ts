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
    description: 'Cà phê sữa truyền thống đậm đà chuẩn vị',
    price: 35000,
    imageUrl: '/images/ca-phe-sua.jpg',
    stock: 50,
    isActive: true,
  },
  {
    id: 2,
    name: 'Americano',
    description: 'Americano đá thanh nhẹ, đậm vị cà phê mộc',
    price: 40000,
    imageUrl: '/images/americano.jpg',
    stock: 50,
    isActive: true,
  },
  {
    id: 3,
    name: 'Cappuccino',
    description: 'Cappuccino bọt sữa mịn màng, thơm béo',
    price: 45000,
    imageUrl: '/images/cappuccino.jpg',
    stock: 35,
    isActive: true,
  },
  {
    id: 4,
    name: 'Trà đào cam sả',
    description: 'Trà đào thanh mát quyện cùng cam sả thơm lừng',
    price: 39000,
    imageUrl: '/images/tra-dao.jpg',
    stock: 40,
    isActive: true,
  },
  {
    id: 5,
    name: 'Bạc xỉu ba tầng',
    description: 'Nhiều sữa ít cà phê, ngọt béo dịu dàng thơm ngậy',
    price: 35000,
    imageUrl: null,
    stock: 45,
    isActive: true,
  },
  {
    id: 6,
    name: 'Cà phê muối xứ Huế',
    description: 'Lớp kem béo mặn hòa cùng cà phê đậm đặc biệt',
    price: 42000,
    imageUrl: null,
    stock: 40,
    isActive: true,
  },
  {
    id: 7,
    name: 'Cà phê đen đá',
    description: 'Cà phê Robusta nguyên chất đậm vị truyền thống',
    price: 30000,
    imageUrl: null,
    stock: 55,
    isActive: true,
  },
  {
    id: 8,
    name: 'Matcha Latte',
    description: 'Trà xanh Nhật Bản thượng hạng kết hợp sữa tươi thanh trùng',
    price: 49000,
    imageUrl: null,
    stock: 30,
    isActive: true,
  },
  {
    id: 9,
    name: 'Trà sữa ô long nướng',
    description: 'Hương ô long nướng đậm đà, vị béo ngọt êm dịu',
    price: 45000,
    imageUrl: null,
    stock: 35,
    isActive: true,
  },
  {
    id: 10,
    name: 'Caramel Macchiato',
    description: 'Espresso thơm nồng quyện cùng sốt caramel béo ngậy',
    price: 49000,
    imageUrl: null,
    stock: 25,
    isActive: true,
  },
  {
    id: 11,
    name: 'Trà sen vàng hạt sen',
    description: 'Trà sen thanh khiết điểm xuyết hạt sen bùi bùi giòn ngọt',
    price: 45000,
    imageUrl: null,
    stock: 30,
    isActive: true,
  },
  {
    id: 12,
    name: 'Cacao dừa đá xay',
    description: 'Cacao nguyên chất béo thơm vị sữa dừa tươi mát',
    price: 42000,
    imageUrl: null,
    stock: 30,
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