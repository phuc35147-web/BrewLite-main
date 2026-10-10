import { describe, expect, it } from 'vitest';
import { OrdersController } from './orders.controller.js';

describe('OrdersController', () => {
  it('should be defined', () => {
    const ordersService = {};

    const controller = new OrdersController(
      ordersService as any,
    );

    expect(controller).toBeDefined();
  });
});