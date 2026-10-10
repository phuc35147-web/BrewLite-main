import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn([
    'PENDING',
    'PAID',
    'PAYMENT_FAILED',
    'PREPARING',
    'READY',
    'COMPLETED',
    'CANCELLED',
  ])
  status: string;
}