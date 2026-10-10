export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus =
  (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [
    ORDER_STATUS.PAID,
    ORDER_STATUS.PAYMENT_FAILED,
    ORDER_STATUS.CANCELLED,
  ],

  PAID: [
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.CANCELLED,
  ],

  PAYMENT_FAILED: [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CANCELLED,
  ],

  PREPARING: [
    ORDER_STATUS.READY,
    ORDER_STATUS.CANCELLED,
  ],

  READY: [
    ORDER_STATUS.COMPLETED,
  ],

  COMPLETED: [],

  CANCELLED: [],
};

export function canTransition(
  from: string,
  to: string,
): boolean {
  const nextStatuses = allowedTransitions[from as OrderStatus];

  if (!nextStatuses) {
    return false;
  }

  return nextStatuses.includes(to as OrderStatus);
}
/** Trạng thái chỉ do luồng thanh toán (PaymentsService) được phép đặt. */
export const SYSTEM_ONLY_STATUSES: readonly string[] = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PAID,
  ORDER_STATUS.PAYMENT_FAILED,
];

/** Trạng thái chỉ nhân viên (STAFF) được chuyển tới. */
export const STAFF_ONLY_STATUSES: readonly string[] = [
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.COMPLETED,
];

export function getAllowedTransitions(from: string): OrderStatus[] {
  return allowedTransitions[from as OrderStatus] ?? [];
}
