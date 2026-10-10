import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  size: string;
  toppings: string[];
  quantity: number;
}

interface CartState {
  items: CartItem[];

  addItem: (item: CartItem) => void;
  removeItem: (
    productId: number,
    size: string,
    toppings: string[],
  ) => void;
  updateQuantity: (
    productId: number,
    size: string,
    toppings: string[],
    quantity: number,
  ) => void;
  clearCart: () => void;

  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const sameToppings = (
  toppings1: string[],
  toppings2: string[],
) => {
  if (toppings1.length !== toppings2.length) {
    return false;
  }

  return toppings1.every((item) =>
    toppings2.includes(item),
  );
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (cartItem) =>
              cartItem.productId === item.productId &&
              cartItem.size === item.size &&
              sameToppings(
                cartItem.toppings,
                item.toppings,
              ),
          );

          if (existingItemIndex !== -1) {
            const updatedItems = [...state.items];

            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity:
                updatedItems[existingItemIndex].quantity +
                item.quantity,
            };

            return {
              items: updatedItems,
            };
          }

          return {
            items: [...state.items, item],
          };
        });
      },

      removeItem: (productId, size, toppings) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.productId === productId &&
                item.size === size &&
                sameToppings(
                  item.toppings,
                  toppings,
                )
              ),
          ),
        }));
      },

      updateQuantity: (
        productId,
        size,
        toppings,
        quantity,
      ) => {
        if (quantity <= 0) {
          get().removeItem(
            productId,
            size,
            toppings,
          );
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (
              item.productId === productId &&
              item.size === size &&
              sameToppings(
                item.toppings,
                toppings,
              )
            ) {
              return {
                ...item,
                quantity,
              };
            }

            return item;
          }),
        }));
      },

      clearCart: () => {
        set({
          items: [],
        });
      },

      getTotalItems: () => {
        return get().items.reduce(
          (total, item) => total + item.quantity,
          0,
        );
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) =>
            total + item.price * item.quantity,
          0,
        );
      },
    }),
    {
      name: 'brewlite-cart',
    },
  ),
);