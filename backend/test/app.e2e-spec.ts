import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from './../src/app.module.js';

// E2E cần SQL Server thật (docker compose up -d sqlserver) và biến DB_* trong backend/.env.
// Import AppModule ở trên đã nạp dotenv nên DB_SERVER có giá trị nếu .env tồn tại.
const hasDb = Boolean(process.env.DB_SERVER);

describe.skipIf(!hasDb)('BrewLite API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /products trả về mảng sản phẩm', async () => {
    const res = await request(app.getHttpServer()).get('/products').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /orders không có JWT => 401', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ items: [] })
      .expect(401);
  });

  it('POST /payments không có JWT => 401', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .send({ orderId: 1, method: 'CARD' })
      .expect(401);
  });
});
