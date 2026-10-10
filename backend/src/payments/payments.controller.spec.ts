import { describe, expect, it } from 'vitest';
import { PaymentsController } from './payments.controller.js';

describe('PaymentsController', () => {
  it('should be defined', () => {
    const paymentsService = {};

    const controller = new PaymentsController(
      paymentsService as any,
    );

    expect(controller).toBeDefined();
  });
});