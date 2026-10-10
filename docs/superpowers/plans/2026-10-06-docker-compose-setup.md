# Kế Hoạch Triển Khai Docker Compose Cho BrewLite

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đóng gói và điều phối toàn bộ hệ thống BrewLite (Frontend Next.js :3000, Backend NestJS :3001, Database SQL Server :1433) bằng Docker Compose, kèm theo quy trình tự động hóa khởi tạo database, di cư schema Prisma và nạp dữ liệu mẫu ban đầu.

**Architecture:** Sử dụng Docker Compose với bridge network `brewlite-network` kết nối 3 service: `sqlserver` (Microsoft SQL Server 2022 image chính thức), `backend` (NestJS multi-stage build với script entrypoint tự động tạo DB, chạy Prisma migrate và seed), và `frontend` (Next.js standalone multi-stage build phục vụ trên port 3000).

**Tech Stack:** Docker, Docker Compose, Next.js 16, NestJS 12, Prisma 7, Microsoft SQL Server 2022, Node.js 22.

**Spec:** `docs/superpowers/specs/2026-10-06-docker-compose-setup-design.md`

## Global Constraints

- Cổng public máy Host: Frontend `:3000`, Backend `:3001`, SQL Server `:1433`.
- Tên Database SQL Server: `BrewLite`, người dùng: `sa`.
- Base image Node: `node:22-bookworm-slim` cho backend (đảm bảo tương thích bcrypt và tedious/Prisma) và `node:22-bookworm-slim` hoặc `node:22-alpine` cho frontend.
- Cấu hình Next.js hỗ trợ chế độ `standalone` tối ưu kích thước container.
- Cơ chế khởi tạo DB phải là idempotent (an toàn tuyệt đối khi restart container).

## Review Focus

- **SQL Server khởi động trễ:** Backend entrypoint cần có cơ chế thử lại (retry loop) với timeout hợp lý để không bị crash khi SQL Server chưa kịp mở socket.
- **Database `BrewLite` chưa tồn tại:** Prisma migrate không tự tạo database mới trong SQL Server; script khởi tạo phải kết nối `master` để `CREATE DATABASE [BrewLite]` trước khi gọi `prisma migrate deploy`.
- **Trùng lặp dữ liệu seed khi khởi động lại:** Seed script phải kiểm tra `Product` table, chỉ insert khi bảng chưa có dữ liệu.
- **Frontend gọi API:** Client component chạy trên trình duyệt host phải kết nối tới `http://localhost:3001`.
- **Cấp quyền file thực thi trên Linux:** File `docker-entrypoint.sh` cần có định dạng line-ending LF và quyền thực thi `chmod +x`.

---

### Task 1: Thiết Lập Docker & Tự Động Khởi Tạo Database Cho Backend

**Files:**
- Create: `backend/init-db.mjs`
- Create: `backend/seed.mjs`
- Create: `backend/docker-entrypoint.sh`
- Create: `backend/.dockerignore`
- Create: `backend/Dockerfile`

**Interfaces:**
- Consumes: `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DATABASE_URL` từ biến môi trường.
- Produces: Image `brewlite-backend` sẵn sàng phục vụ HTTP API trên cổng 3001.

- [ ] **Step 1: Viết script `backend/init-db.mjs` để kiểm tra và tạo database `BrewLite`**

Script dùng thư viện `tedious` (đã có sẵn trong `node_modules`):
- Kết nối tới SQL Server (`database: 'master'`) với retry loop tối đa 30 lần (mỗi lần cách nhau 2 giây).
- Kiểm tra và thực thi:
  ```sql
  IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${dbName}')
  BEGIN
      CREATE DATABASE [${dbName}];
  END
  ```

- [ ] **Step 2: Viết script `backend/seed.mjs` để nạp dữ liệu mẫu ban đầu**

Script kết nối tới database `BrewLite`:
- Kiểm tra số lượng bản ghi trong `[dbo].[Product]`.
- Nếu bằng 0, chèn 4 sản phẩm mặc định (`Cà phê sữa`, `Americano`, `Cappuccino`, `Trà đào`).
- Ghi log thông báo seed thành công hoặc bỏ qua nếu đã có dữ liệu.

- [ ] **Step 3: Viết script `backend/docker-entrypoint.sh`**

Script shell tự động tuần tự:
```bash
#!/bin/sh
set -e

echo "==> [Backend] Ensuring database exists..."
node init-db.mjs

echo "==> [Backend] Running Prisma migrations..."
npx prisma migrate deploy

echo "==> [Backend] Seeding initial data if needed..."
node seed.mjs

echo "==> [Backend] Starting NestJS application..."
exec node dist/main.js
```

- [ ] **Step 4: Tạo `backend/.dockerignore` và `backend/Dockerfile`**

- `backend/.dockerignore`: Bỏ qua `node_modules`, `dist`, `.env`, `test`, `coverage`.
- `backend/Dockerfile`:
  - Multi-stage:
    - Stage 1 `builder`: Base `node:22-bookworm-slim`, copy package files, `npm ci`, copy prisma schema, `npx prisma generate`, copy code, `npm run build`.
    - Stage 2 `runner`: Base `node:22-bookworm-slim`, cài đặt `openssl`, copy node_modules, dist, prisma, package.json, init-db.mjs, seed.mjs, docker-entrypoint.sh từ builder. Cấp quyền `chmod +x docker-entrypoint.sh`.
    - EXPOSE 3001.
    - ENTRYPOINT `["./docker-entrypoint.sh"]`.

- [ ] **Step 5: Kiểm tra cú pháp script và commit Task 1**

Run: `node --check backend/init-db.mjs; node --check backend/seed.mjs`
Expected: Cú pháp JS hợp lệ, không có lỗi.
Commit:
```bash
git add backend/init-db.mjs backend/seed.mjs backend/docker-entrypoint.sh backend/.dockerignore backend/Dockerfile
git commit -m "feat(backend): add dockerfile and automated db init scripts"
```

---

### Task 2: Thiết Lập Docker Chế Độ Standalone Cho Frontend

**Files:**
- Modify: `frontend/next.config.ts`
- Create: `frontend/.dockerignore`
- Create: `frontend/Dockerfile`

**Interfaces:**
- Consumes: Build arg `NEXT_PUBLIC_API_BASE=http://localhost:3001`.
- Produces: Image `brewlite-frontend` phục vụ web Next.js trên cổng 3000.

- [ ] **Step 1: Cập nhật `frontend/next.config.ts` để hỗ trợ chế độ standalone**

Sửa đổi:
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

- [ ] **Step 2: Tạo `frontend/.dockerignore`**

Bỏ qua: `node_modules`, `.next`, `out`, `.git`, `.env*.local`.

- [ ] **Step 3: Tạo `frontend/Dockerfile` tối ưu multi-stage standalone**

- Stage 1 `deps`: `node:22-bookworm-slim`, copy `package*.json`, chạy `npm ci`.
- Stage 2 `builder`: Copy mã nguồn từ deps, nhận build arg `ARG NEXT_PUBLIC_API_BASE=http://localhost:3001`, chạy `npm run build`.
- Stage 3 `runner`: `node:22-bookworm-slim`, copy `.next/standalone`, copy `.next/static` vào `.next/static`, copy `public` vào `public`.
- Thiết lập:
  - `ENV PORT=3000`
  - `ENV HOSTNAME="0.0.0.0"`
  - `EXPOSE 3000`
  - `CMD ["node", "server.js"]`

- [ ] **Step 4: Kiểm tra build thử nghiệm và commit Task 2**

Run: `npm --prefix frontend run build`
Expected: Build thành công sinh ra `.next/standalone`.
Commit:
```bash
git add frontend/next.config.ts frontend/.dockerignore frontend/Dockerfile
git commit -m "feat(frontend): add standalone dockerfile for nextjs"
```

---

### Task 3: Thiết Lập Docker Compose Và Cấu Hình Môi Trường

**Files:**
- Create: `docker-compose.yml`
- Create: `.dockerignore`
- Modify: `.env.example`

**Interfaces:**
- Consumes: Dockerfiles từ Task 1 và Task 2, image `mcr.microsoft.com/mssql/server:2022-latest`.
- Produces: File điều phối `docker-compose.yml` toàn diện cho cả 3 services.

- [ ] **Step 1: Cập nhật `.env.example` với các biến chuẩn cho Docker**

Bổ sung các giá trị mặc định rõ ràng cho môi trường container (`DB_SERVER=sqlserver`, `DB_PASSWORD=BrewLite@2026!`).

- [ ] **Step 2: Tạo `.dockerignore` ở thư mục gốc**

Bỏ qua: `.git`, `node_modules`, `.next`, `dist`, `out`.

- [ ] **Step 3: Tạo `docker-compose.yml` kết nối 3 service**

Bao gồm:
- Service `sqlserver` với image `mcr.microsoft.com/mssql/server:2022-latest`, port `1433:1433`, volume `sqlserver_data`, healthcheck `sqlcmd`.
- Service `backend` với build context `./backend`, port `3001:3001`, `depends_on: { sqlserver: { condition: service_healthy } }`.
- Service `frontend` với build context `./frontend`, port `3000:3000`, `depends_on: [backend]`.
- Network: `brewlite-network` (driver: bridge).
- Volume: `sqlserver_data`.

- [ ] **Step 4: Kiểm tra tính hợp lệ của cấu hình compose và commit Task 3**

Run: `docker compose config`
Expected: Cú pháp yaml hợp lệ, in ra cấu hình compose hoàn chỉnh.
Commit:
```bash
git add docker-compose.yml .dockerignore .env.example
git commit -m "feat(infra): add docker-compose orchestrating frontend, backend, and sqlserver"
```

---

### Task 4: Kiểm Thử Toàn Diện (End-to-End Stack Verification)

**Files:**
- Modify: `README.md` (bổ sung hướng dẫn chạy bằng Docker)

- [ ] **Step 1: Khởi động toàn bộ stack bằng Docker Compose**

Run: `docker compose up -d --build`
Expected: Cả 3 container `brewlite-sqlserver-1`, `brewlite-backend-1`, `brewlite-frontend-1` khởi động thành công.

- [ ] **Step 2: Xác minh trạng thái và log của các container**

Run: `docker compose ps`
Expected:
- `sqlserver`: Up (healthy)
- `backend`: Up (lắng nghe trên 3001)
- `frontend`: Up (lắng nghe trên 3000)

- [ ] **Step 3: Kiểm tra API Backend và Dữ liệu Seed**

Run: `curl -s http://localhost:3001/products`
Expected: Trả về mã HTTP 200 kèm mảng JSON chứa ít nhất 4 sản phẩm mẫu (`Cà phê sữa`, `Americano`, `Cappuccino`, `Trà đào`).

- [ ] **Step 4: Kiểm tra Giao diện Frontend**

Run: `curl -sI http://localhost:3000`
Expected: Trả về mã HTTP 200 OK.

- [ ] **Step 5: Bổ sung mục Hướng dẫn chạy Docker vào `README.md` và commit Task 4**

Thêm phần hướng dẫn ngắn gọn:
```bash
docker compose up -d --build
```
Commit:
```bash
git add README.md
git commit -m "docs: add docker compose usage instructions to readme"
```
