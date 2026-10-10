export const SIZE_EXTRA: Record<string, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

export const TOPPING_PRICE: Record<string, number> = {
  'Trân châu': 5000,
  Kem: 5000,
};

export const VALID_SIZES = Object.keys(SIZE_EXTRA);
export const VALID_TOPPINGS = Object.keys(TOPPING_PRICE);
