# Thiết Kế Kiến Trúc Docker Cho BrewLite

- **Ngày tạo:** 2026-10-06
- **Dự án:** BrewLite (Online Coffee Shop)
- **Mục tiêu:** Đóng gói toàn bộ hệ thống bằng Docker Compose theo đúng sơ đồ kiến trúc 3 thành phần: Frontend (Next.js :3000), Backend (NestJS :3001), và Database (SQL Server :1433).

---

## 1. Sơ Đồ Kiến Trúc Hệ Thống

```
                         Docker Compose
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
   frontend                 backend               sqlserver
   Next.js                  NestJS                 BrewLite
   :3000                    :3001                  :1433
        │                      │
        └──────── HTTP ────────┘
                               │
                             Prisma
                               │
                               ▼
                          SQL Server
```

### Luồng tương tác:
1. **Người dùng (Trình duyệt máy Host):**
   - Truy cập giao diện web tại `http://localhost:3000`.
   - Các thao tác gọi API (xem sản phẩm, giỏ hàng, đăng nhập, đặt hàng) được trình duyệt gửi qua HTTP tới `http://localhost:3001`.
2. **Backend (NestJS) kết nối Database:**
   - Kết nối tới service `sqlserver` qua cổng `1433` trong Docker bridge network nội bộ (`brewlite-network`).
   - Sử dụng Prisma Client với MSSQL adapter để thao tác dữ liệu.
3. **Database (SQL Server):**
   - Chạy trên container `sqlserver`, cổng 1433 được forward ra ngoài máy host để hỗ trợ kết nối từ SSMS nếu quản trị viên cần kiểm tra trực tiếp.
   - Dữ liệu được lưu trữ bền vững qua Docker named volume `sqlserver_data`.

---

## 2. Chi Tiết Các Dịch Vụ Trong `docker-compose.yml`

### 2.1. Dịch Vụ `sqlserver`
- **Base Image:** `mcr.microsoft.com/mssql/server:2022-latest`
- **Cổng:** `1433:1433`
- **Môi trường:**
  - `ACCEPT_EULA="Y"`
  - `MSSQL_SA_PASSWORD="${DB_PASSWORD:-BrewLite@2026!}"`
  - `MSSQL_PID="Express"`
- **Volume:** `sqlserver_data:/var/opt/mssql`
- **Healthcheck:**
  ```yaml
  test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P \"$${MSSQL_SA_PASSWORD}\" -C -Q 'SELECT 1' || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 10
  start_period: 15s
  ```

### 2.2. Dịch Vụ `backend`
- **Build Context:** `./backend`
- **Dockerfile:** `backend/Dockerfile`
- **Cổng:** `3001:3001`
- **Phụ thuộc:**
  ```yaml
  depends_on:
    sqlserver:
      condition: service_healthy
  ```
- **Môi trường:**
  - `DB_SERVER=sqlserver`
  - `DB_PORT=1433`
  - `DB_NAME=BrewLite`
  - `DB_USER=sa`
  - `DB_PASSWORD=${DB_PASSWORD:-BrewLite@2026!}`
  - `DATABASE_URL=sqlserver://sqlserver:1433;database=BrewLite;user=sa;password=${DB_PASSWORD:-BrewLite@2026!};encrypt=true;trustServerCertificate=true`
  - `JWT_SECRET=${JWT_SECRET:-brewlite-super-secret-jwt-key-2026}`
  - `JWT_EXPIRES_IN=1d`
  - `MOCK_PAYMENT_FAIL=false`
  - `PORT=3001`

### 2.3. Dịch Vụ `frontend`
- **Build Context:** `./frontend`
- **Dockerfile:** `frontend/Dockerfile`
- **Cổng:** `3000:3000`
- **Phụ thuộc:**
  ```yaml
  depends_on:
    backend:
      condition: service_started
  ```
- **Build Args & Môi trường:**
  - `NEXT_PUBLIC_API_BASE=http://localhost:3001`
  - `PORT=3000`
  - `HOSTNAME=0.0.0.0`

---

## 3. Cơ Chế Khởi Tạo & Di Cư Dữ Liệu Tự Động (Backend Entrypoint)

Để người dùng chỉ cần chạy 1 lệnh `docker compose up --build` là toàn bộ hệ thống hoạt động ngay mà không gặp lỗi thiếu database hay thiếu dữ liệu, Backend sẽ có một quy trình khởi động tự động gồm:

1. **`backend/init-db.mjs`:**
   - Kết nối vào SQL Server với database mặc định `master`.
   - Kiểm tra database `BrewLite`:
     ```sql
     IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'BrewLite')
     BEGIN
         CREATE DATABASE [BrewLite];
     END
     ```
2. **`npx prisma migrate deploy`:**
   - Triển khai toàn bộ migrations chính thức từ `backend/prisma/migrations`.
   - Tự động tạo bảng `User`, `Product`, `Order`, `OrderItem`, `Payment` và ghi nhận trạng thái vào `_prisma_migrations`.
3. **Seed dữ liệu mẫu:**
   - Kiểm tra nếu bảng `Product` chưa có dữ liệu, tự động thêm 4 sản phẩm mặc định:
     - Cà phê sữa (35.000đ)
     - Americano (40.000đ)
     - Cappuccino (45.000đ)
     - Trà đào (39.000đ)
4. **Khởi động ứng dụng:**
   - Chạy `node dist/main.js` trên cổng 3001.

Tất cả các bước trên là **idempotent**: khởi động lần đầu sẽ tạo và nạp dữ liệu, các lần khởi động tiếp theo chỉ kiểm tra và bỏ qua nếu đã tồn tại.

---

## 4. Đặc Tả Dockerfile

### 4.1. `backend/Dockerfile`
- Multi-stage build với `node:22-bookworm-slim`:
  - **Stage 1 (Builder):**
    - Cài đặt dependencies với `npm ci`.
    - Sinh Prisma Client: `npx prisma generate`.
    - Build ứng dụng: `npm run build`.
  - **Stage 2 (Runner):**
    - Cài đặt openssl để Prisma MSSQL adapter kết nối an toàn.
    - Copy các thư mục cần thiết: `dist`, `node_modules`, `prisma`, `package.json`, `docker-entrypoint.sh`, `init-db.mjs`.
    - Phân quyền thực thi cho `docker-entrypoint.sh`.
    - Entrypoint: `/app/docker-entrypoint.sh`.

### 4.2. `frontend/Dockerfile`
- Multi-stage build với `node:22-bookworm-slim` hoặc `node:22-alpine`:
  - **Stage 1 (Deps):** `npm ci`.
  - **Stage 2 (Builder):**
    - Đặt biến `ARG NEXT_PUBLIC_API_BASE=http://localhost:3001`.
    - Build với `output: "standalone"`.
  - **Stage 3 (Runner):**
    - Copy `.next/standalone`, `.next/static`, `public`.
    - Lắng nghe cổng 3000.
    - Chạy `node server.js`.

### 4.3. Cập nhật `frontend/next.config.ts`
- Cấu hình hỗ trợ linh hoạt giữa `standalone` (cho Docker production) và `export` (nếu deploy tĩnh):
  ```typescript
  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {
    output: (process.env.NEXT_OUTPUT as "export" | "standalone") || "standalone",
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  };

  export default nextConfig;
  ```

---

## 5. Danh Sách Tệp Sẽ Tạo / Cập Nhật

| Đường dẫn | Thao tác | Mục đích |
|---|---|---|
| `docker-compose.yml` | Tạo mới | Cấu hình orchestrate 3 dịch vụ: sqlserver, backend, frontend |
| `.dockerignore` | Tạo mới | Loại trừ node_modules, .next, dist cho root build |
| `backend/.dockerignore` | Tạo mới | Loại trừ node_modules, dist, test files cho backend |
| `backend/Dockerfile` | Tạo mới | Multi-stage build cho NestJS |
| `backend/docker-entrypoint.sh` | Tạo mới | Script chờ DB, chạy init-db, migrate, seed, và start app |
| `backend/init-db.mjs` | Tạo mới | Node script kết nối master để tạo DB BrewLite & seed |
| `frontend/.dockerignore` | Tạo mới | Loại trừ node_modules, .next, out cho frontend |
| `frontend/Dockerfile` | Tạo mới | Multi-stage build cho Next.js standalone |
| `frontend/next.config.ts` | Cập nhật | Cho phép build dạng standalone phục vụ qua Docker Node server |
| `.env.example` | Cập nhật | Bổ sung các biến mặc định phù hợp với Docker |

---

## 6. Tiêu Chí Kiểm Thử & Nghiệm Thu (Acceptance Criteria)

1. Lệnh `docker compose build` build thành công không có lỗi ở cả frontend và backend.
2. Lệnh `docker compose up -d` khởi động 3 container:
   - `sqlserver` chuyển sang trạng thái `healthy`.
   - `backend` đợi `sqlserver`, tạo DB `BrewLite`, migrate schema thành công, seed sản phẩm và lắng nghe tại `http://localhost:3001`.
   - `frontend` lắng nghe tại `http://localhost:3000`.
3. Kiểm tra API Backend: `curl http://localhost:3001/products` trả về 4 sản phẩm mẫu định dạng JSON 200 OK.
4. Kiểm tra Frontend: `curl http://localhost:3000` trả về trang chủ BrewLite (mã HTML 200 OK).
5. Stop và restart container không bị trùng dữ liệu hoặc lỗi migration.
