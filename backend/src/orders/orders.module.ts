import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // <--- Thêm dòng này
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}