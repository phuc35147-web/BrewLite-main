# BrewLite ☕

BrewLite là ứng dụng đặt cà phê trực tuyến được xây dựng cho bài tập Software Engineering.

Hệ thống hỗ trợ:

- Xem menu sản phẩm
- Xem chi tiết sản phẩm
- Chọn size S/M/L
- Chọn topping
- Giỏ hàng
- Đăng ký / đăng nhập
- Xác thực JWT
- Tạo đơn hàng
- Thanh toán không tiền mặt dạng mock: WALLET / CARD
- Idempotency-Key cho thanh toán
- Quản lý trạng thái đơn hàng
- Promotion `BREW10`
- Loyalty Point
- Kiểm soát tồn kho khi có request đồng thời
- Lịch sử mua hàng
- Unit / integration tests bằng Vitest

---

# 🚀 Khởi chạy nhanh bằng Docker (Khuyến nghị)

Chỉ cần một lệnh duy nhất để build và khởi động toàn bộ hệ thống gồm Frontend, Backend và SQL Server:

```bash
docker compose up -d --build
```

Sau khi các container khởi động hoàn tất:
- **Frontend (Next.js):** [http://localhost:3000](http://localhost:3000)
- **Backend API (NestJS):** [http://localhost:3001](http://localhost:3001)
- **Database (SQL Server):** `localhost:1433` (Database: `BrewLite`, User: `sa`, Password: `BrewLite@2026!`)

Quy trình tự động hóa tích hợp:
1. Đợi SQL Server sẵn sàng nhận kết nối (`healthcheck`).
2. Tự động kiểm tra và tạo cơ sở dữ liệu `BrewLite` nếu chưa tồn tại.
3. Chạy di cư dữ liệu (`npx prisma migrate deploy`).
4. Tự động nạp (seed) 4 sản phẩm cà phê mặc định nếu bảng còn trống.

Dừng các dịch vụ:
```bash
docker compose down
```

Dừng và xóa toàn bộ dữ liệu volume database (để reset về ban đầu):
```bash
docker compose down -v
```

---

# 1. Công nghệ sử dụng

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Zustand

## Backend

- NestJS
- TypeScript
- Prisma ORM
- JWT
- bcrypt
- class-validator
- class-transformer
- Vitest
- Supertest

## Database

- Microsoft SQL Server

---

# 2. Yêu cầu môi trường

Máy mới cần cài các phần mềm sau trước khi clone và chạy project.

## 2.1. Git

Cài Git:

https://git-scm.com/

Kiểm tra:

```cmd
git --version
```

---

## 2.2. Node.js và npm

Cài Node.js:

https://nodejs.org/

Project đã được kiểm thử trên môi trường:

```text
Node.js: 24.21.0
npm:     11.19.0
```

Kiểm tra trên máy mới:

```cmd
node -v
npm -v
```

Nên dùng phiên bản Node.js tương thích với project hiện tại.

---

## 2.3. Microsoft SQL Server

Cài Microsoft SQL Server.

Project hiện tại sử dụng SQL Server với:

```text
Server:   localhost
Port:     1433
Database: BrewLite
User:     sa
```

SQL Server phải cho phép kết nối TCP/IP trên port `1433`.

Trong SQL Server Configuration Manager, kiểm tra:

```text
SQL Server Network Configuration
→ Protocols for MSSQLSERVER
→ TCP/IP
→ Enabled
```

Trong `TCP/IP → IP Addresses`, phần `IPAll` nên cấu hình:

```text
TCP Dynamic Ports: để trống
TCP Port:          1433
```

Sau khi thay đổi cấu hình TCP/IP, khởi động lại dịch vụ SQL Server.

---

## 2.4. SQL Server Management Studio (SSMS)

Khuyến nghị cài SSMS để tạo database, kiểm tra dữ liệu và chạy các script SQL.

https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms

---

# 3. Clone project từ GitHub

Ví dụ repository GitHub của project là:

```text
https://github.com/<username>/BrewLite.git
```

Trên máy mới mở CMD:

```cmd
cd C:\
git clone https://github.com/<username>/BrewLite.git BrewLite
```

Sau khi clone:

```cmd
cd C:\BrewLite
```

Kiểm tra:

```cmd
dir
```

Cấu trúc cơ bản phải có:

```text
C:\BrewLite
├── backend
├── frontend
└── README.md
```

> Thay `<username>` và URL repository bằng repository GitHub thật của project.

---

# 4. Cài đặt Backend

Mở CMD:

```cmd
cd C:\BrewLite\backend
npm install
```

Kiểm tra Prisma:

```cmd
npx prisma -v
```

Kiểm tra NestJS:

```cmd
npx nest --version
```

---

# 5. Cài đặt Frontend

Mở CMD mới:

```cmd
cd C:\BrewLite\frontend
npm install
```

---

# 6. Tạo database SQL Server

Mở SSMS và kết nối SQL Server.

Tạo database:

```sql
CREATE DATABASE BrewLite;
GO
```

Nếu database `BrewLite` đã tồn tại thì bỏ qua bước này.

---

# 7. Cấu hình `.env` trên máy mới

File `.env` **không được lấy từ máy của người phát triển ban đầu**. Mỗi máy clone project phải tự tạo `.env` với thông tin SQL Server và JWT secret của chính máy đó.

## 7.1. Tạo file `.env`

Sau khi clone project, mở CMD:

```cmd
cd C:\BrewLite\backend
notepad .env
```

Nếu Notepad hỏi tạo file mới thì chọn **Yes**.

Dán mẫu sau vào file:

```env
DATABASE_URL="sqlserver://localhost:1433;database=BrewLite;user=sa;password=YOUR_SQL_PASSWORD;encrypt=true;trustServerCertificate=true"

DB_SERVER="localhost"
DB_PORT="1433"
DB_NAME="BrewLite"
DB_USER="sa"
DB_PASSWORD="YOUR_SQL_PASSWORD"

JWT_SECRET="YOUR_JWT_SECRET"
JWT_EXPIRES_IN="1d"

MOCK_PAYMENT_FAIL="false"
```

## 7.2. Thay thông tin SQL Server bằng thông tin của máy đó

### Trường hợp dùng SQL Server local và port 1433

Giữ nguyên:

```env
DB_SERVER="localhost"
DB_PORT="1433"
DB_NAME="BrewLite"
DB_USER="sa"
```

Chỉ thay:

```env
YOUR_SQL_PASSWORD
```

bằng **mật khẩu tài khoản `sa` được tạo trên máy mới**. Mật khẩu này không cần và không nên giống mật khẩu của máy người phát triển ban đầu.

Đồng thời thay cùng mật khẩu đó trong `DATABASE_URL`:

```env
DATABASE_URL="sqlserver://localhost:1433;database=BrewLite;user=sa;password=MAT_KHAU_SA_CUA_MAY_NAY;encrypt=true;trustServerCertificate=true"
```

### Trường hợp máy mới dùng SQL Server Express / instance khác

Không tự động đổi theo máy cũ. Người cài đặt phải kiểm tra **Server name, tài khoản đăng nhập và port** trên chính máy đó. Khuyến nghị cấu hình SQL Server TCP/IP dùng port `1433` để khớp với cấu hình mẫu ở trên.

Nếu server không phải `localhost`, thay phần tương ứng, ví dụ:

```env
DB_SERVER="TEN-MAY-HOAC-SERVER"
```

và cập nhật `DATABASE_URL` theo server/port thực tế.

## 7.3. Tạo JWT secret riêng

`JWT_SECRET` là khóa dùng để ký JWT. Không dùng khóa của máy người phát triển ban đầu. Có thể tự đặt một chuỗi dài, ví dụ:

```env
JWT_SECRET="brewLite-local-secret-change-this"
```

Tốt hơn nên dùng một chuỗi ngẫu nhiên dài hơn cho máy dùng thật.

## 7.4. Kiểm tra file `.env`

File cuối cùng trên **máy mới** sẽ có dạng:

```env
DATABASE_URL="sqlserver://localhost:1433;database=BrewLite;user=sa;password=MAT_KHAU_CUA_MAY_NAY;encrypt=true;trustServerCertificate=true"
DB_SERVER="localhost"
DB_PORT="1433"
DB_NAME="BrewLite"
DB_USER="sa"
DB_PASSWORD="MAT_KHAU_CUA_MAY_NAY"
JWT_SECRET="CHUOI_BI_MAT_RIENG_CUA_MAY_NAY"
JWT_EXPIRES_IN="1d"
MOCK_PAYMENT_FAIL="false"
```

> **Quan trọng:** Không commit `.env` lên GitHub. Không chép `.env` từ máy khác vào project. Mỗi máy phải tự tạo file `.env` theo cấu hình SQL Server của máy đó.

---

# 8. Khởi tạo database bằng Prisma

Trong backend:

```cmd
cd C:\BrewLite\backend
```

Triển khai migration:

```cmd
npx prisma migrate deploy
```

Sinh Prisma Client:

```cmd
npx prisma generate
```

Database sau migration sẽ có các bảng chính:

```text
_prisma_migrations
User
Product
Order
OrderItem
Payment
```

---

# 9. Dữ liệu mẫu sản phẩm

`prisma migrate deploy` tạo cấu trúc database nhưng không tự tạo dữ liệu sản phẩm nếu project không có seed script.

Nếu database mới chưa có sản phẩm, mở SSMS và chạy:

```sql
USE BrewLite;
GO

INSERT INTO [dbo].[Product]
([name], [description], [price], [imageUrl], [stock], [isActive], [createdAt], [updatedAt])
VALUES
(N'Cà phê sữa', N'Cà phê sữa truyền thống', 35000, N'/images/ca-phe-sua.jpg', 50, 1, GETDATE(), GETDATE()),
(N'Americano', N'Americano đậm vị', 40000, N'/images/americano.jpg', 50, 1, GETDATE(), GETDATE()),
(N'Cappuccino', N'Cappuccino thơm béo', 45000, N'/images/cappuccino.jpg', 30, 1, GETDATE(), GETDATE()),
(N'Trà đào', N'Trà đào thanh mát', 39000, N'/images/tra-dao.jpg', 40, 1, GETDATE(), GETDATE());
GO
```

Sau đó kiểm tra:

```sql
SELECT id, name, price, stock, isActive
FROM [dbo].[Product]
ORDER BY id;
GO
```

---

# 10. Kiểm tra thư mục ảnh Frontend

Frontend sử dụng các đường dẫn ảnh:

```text
/images/ca-phe-sua.jpg
/images/americano.jpg
/images/cappuccino.jpg
/images/tra-dao.jpg
```

Nếu repository có thư mục ảnh trong `frontend/public/images`, giữ nguyên cấu trúc đó:

```text
frontend/
└── public/
    └── images/
        ├── ca-phe-sua.jpg
        ├── americano.jpg
        ├── cappuccino.jpg
        └── tra-dao.jpg
```

Nếu chưa có ảnh, giao diện vẫn có thể chạy nhưng có thể không hiển thị ảnh sản phẩm tùy implementation hiện tại.

---

# 11. Chạy Backend

Mở CMD:

```cmd
cd C:\BrewLite\backend
npm run start:dev
```

Backend chạy tại:

```text
http://localhost:3001
```

Kiểm tra API sản phẩm:

```text
http://localhost:3001/products
```

Nếu API trả về danh sách sản phẩm thì Backend đã kết nối thành công với SQL Server.

---

# 12. Chạy Frontend

Mở CMD mới:

```cmd
cd C:\BrewLite\frontend
npm run dev
```

Frontend chạy tại:

```text
http://localhost:3000
```

Mở trình duyệt:

```text
http://localhost:3000
```

---

# 13. Luồng sử dụng chính

```text
Trang chủ
   ↓
Chọn sản phẩm
   ↓
Chi tiết sản phẩm
   ↓
Chọn size + topping
   ↓
Thêm vào giỏ hàng
   ↓
Giỏ hàng
   ↓
Checkout
   ↓
Nếu chưa đăng nhập → Login
   ↓
Tạo Order
   ↓
Chọn WALLET / CARD
   ↓
Thanh toán
   ↓
PAID
   ↓
Checkout Success
   ↓
Tài khoản
   ↓
Lịch sử mua hàng
```

---

# 14. Các route chính

## Frontend

```text
/                       Menu sản phẩm
/products/:id           Chi tiết sản phẩm
/cart                   Giỏ hàng
/login                  Đăng nhập
/checkout               Thanh toán
/checkout/success       Xác nhận thanh toán
/account                Tài khoản
/orders                 Lịch sử đơn hàng
```

## Backend

```text
GET  /products
GET  /products/:id

POST /auth/register
POST /auth/login

POST /orders
GET  /orders/me
PATCH /orders/:id/status

POST /payments
```

---

# 15. Đăng ký và đăng nhập

Người dùng có thể đăng ký tài khoản mới từ Frontend.

Sau khi đăng nhập:

```text
accessToken
user
```

được lưu ở `localStorage` của trình duyệt.

Trang chủ sẽ hiển thị:

```text
Đăng nhập
```

khi chưa đăng nhập.

Khi đã đăng nhập sẽ hiển thị tên người dùng.

Nhấn vào tên người dùng để mở:

```text
/account
```

Tại đây có:

```text
Thông tin tài khoản
Lịch sử mua hàng
Đăng xuất
Về trang chủ
```

---

# 16. Thanh toán

Payment hỗ trợ:

```text
WALLET
CARD
```

Frontend gửi `Idempotency-Key` khi thanh toán.

Ví dụ:

```text
Idempotency-Key: BREWLITE-ORDER-123
```

Backend dùng key này để tránh xử lý trùng cùng một yêu cầu thanh toán.

---

# 17. Mock Payment

Trong:

```text
C:\BrewLite\backend\.env
```

Thanh toán thành công:

```env
MOCK_PAYMENT_FAIL="false"
```

Kiểm thử thanh toán thất bại:

```env
MOCK_PAYMENT_FAIL="true"
```

Sau khi thay đổi `.env`, cần khởi động lại Backend.

Sau khi kiểm thử thất bại, trả lại:

```env
MOCK_PAYMENT_FAIL="false"
```

---

# 18. Order State Machine

Các trạng thái:

```text
PENDING
PAID
PAYMENT_FAILED
PREPARING
READY
COMPLETED
CANCELLED
```

Luồng hợp lệ:

```text
PENDING
 ├──→ PAID
 ├──→ PAYMENT_FAILED
 └──→ CANCELLED

PAYMENT_FAILED
 ├──→ PENDING
 └──→ CANCELLED

PAID
 ├──→ PREPARING
 └──→ CANCELLED

PREPARING
 ├──→ READY
 └──→ CANCELLED

READY
 └──→ COMPLETED
```

Ví dụ không hợp lệ:

```text
PREPARING → COMPLETED
```

---

# 19. Promotion

Mã khuyến mãi đang hỗ trợ:

```text
BREW10
```

Quy tắc:

```text
Giảm 10%
Tối đa 20.000đ
```

Ví dụ:

```text
45.000đ
→ giảm 4.500đ
→ thanh toán 40.500đ
```

Ví dụ đơn lớn:

```text
225.000đ
→ 10% = 22.500đ
→ giới hạn 20.000đ
→ thanh toán 205.000đ
```

---

# 20. Loyalty

Quy tắc:

```text
Mỗi 10.000đ thanh toán thành công
→ +1 loyalty point
```

Loyalty được tính trên số tiền thực tế sau giảm giá.

Ví dụ:

```text
40.500đ
→ floor(40.500 / 10.000)
→ +4 điểm
```

Request thanh toán duplicate với cùng `Idempotency-Key` không cộng loyalty lần thứ hai.

---

# 21. Concurrent Stock

Khi nhiều request cùng mua sản phẩm còn rất ít tồn kho, backend dùng cập nhật có điều kiện:

```text
stock >= quantity
```

Chỉ request phù hợp với tồn kho mới được cập nhật thành công.

Ví dụ:

```text
Stock = 1

Request A mua 1 → thành công
Request B mua 1 → thất bại

Stock cuối = 0
```

---

# 22. Chạy kiểm tra TypeScript

## Backend

```cmd
cd C:\BrewLite\backend
npx tsc --noEmit
```

## Frontend

```cmd
cd C:\BrewLite\frontend
npx tsc --noEmit
```

---

# 23. Chạy toàn bộ test

Backend đang sử dụng Vitest.

Chạy:

```cmd
cd C:\BrewLite\backend
npm test
```

Kết quả kiểm thử của phiên bản hiện tại:

```text
Test Files  10 passed (10)
Tests       13 passed (13)
```

Các nhóm test quan trọng:

```text
Invalid transition
Duplicate Idempotency-Key
Concurrent Stock
Auth
Products
Orders
Payments
Controllers
```

---

# 24. Test Concurrent Stock riêng

Có thể chạy:

```cmd
cd C:\BrewLite\backend
npx vitest run src/orders/orders.concurrent.spec.ts
```

---

# 25. Kiểm tra State Machine riêng

```cmd
cd C:\BrewLite\backend
npx vitest run src/orders/orders.service.spec.ts
```

---

# 26. Kiểm tra Idempotency riêng

```cmd
cd C:\BrewLite\backend
npx vitest run src/payments/payments.service.spec.ts
```

---

# 27. Các file cấu hình quan trọng

```text
C:\BrewLite\backend\.env
C:\BrewLite\backend\prisma\schema.prisma
C:\BrewLite\backend\prisma.config.ts
C:\BrewLite\backend\src\main.ts
C:\BrewLite\frontend\app\page.tsx
```

---

# 28. Không commit file nhạy cảm

Không commit:

```text
backend/.env
frontend/.env.local
access token
password SQL Server
JWT secret
```

`.gitignore` nên có tối thiểu:

```gitignore
.env
.env.local
node_modules/
.next/
coverage/
```

---

# 29. Khi người khác clone project và bị lỗi

## Lỗi: `npm` không nhận diện

Kiểm tra:

```cmd
node -v
npm -v
```

Nếu không có, cài Node.js.

---

## Lỗi: không kết nối được SQL Server

Kiểm tra:

```text
SQL Server service đang chạy
TCP/IP đã bật
Port = 1433
Database BrewLite tồn tại
DB_USER / DB_PASSWORD đúng
```

---

## Lỗi: `Cannot connect to database`

Kiểm tra file:

```text
C:\BrewLite\backend\.env
```

và đặc biệt:

```text
DB_SERVER
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

---

## Lỗi: không có sản phẩm

Chạy phần SQL trong mục:

```text
Dữ liệu mẫu sản phẩm
```

---

## Lỗi: `401 Unauthorized`

Nguyên nhân thường là:

```text
JWT không tồn tại
JWT hết hạn
chưa đăng nhập
```

Đăng nhập lại từ:

```text
http://localhost:3000/login
```

---

## Lỗi: `Thiếu Idempotency-Key`

Kiểm tra Frontend `/checkout` có gửi header:

```text
Idempotency-Key
```

Ví dụ:

```text
Idempotency-Key: BREWLITE-ORDER-123
```

---

# 30. Khởi động lại toàn bộ project

Nếu cần chạy lại từ đầu:

## Terminal 1 - Backend

```cmd
cd C:\BrewLite\backend
npm run start:dev
```

## Terminal 2 - Frontend

```cmd
cd C:\BrewLite\frontend
npm run dev
```

Sau đó mở:

```text
http://localhost:3000
```

---

# 31. Quy trình cài đặt nhanh trên máy mới

Nếu tất cả công cụ đã được cài sẵn, các bước chính là:

```cmd
cd C:\
git clone <LINK-GITHUB-CUA-BAN> BrewLite

cd C:\BrewLite\backend
npm install

cd C:\BrewLite\frontend
npm install
```

Sau đó:

```text
1. Cài / kiểm tra SQL Server
2. Tạo database BrewLite
3. Tạo backend/.env
4. Chạy prisma migrate deploy
5. Chạy prisma generate
6. Tạo dữ liệu Product nếu database mới
7. Chạy Backend
8. Chạy Frontend
9. Mở http://localhost:3000
```

---

# 32. Tài khoản

Không lưu mật khẩu thật trong README.

Trên máy mới, cách an toàn nhất là đăng ký tài khoản mới bằng giao diện:

```text
http://localhost:3000/login
```

và sử dụng tài khoản đó để kiểm thử.

---

# 33. Tác giả

```text
BrewLite - Software Engineering Project
```

---

# 34. Ghi chú quan trọng

README này mô tả môi trường và luồng chạy của phiên bản BrewLite hiện tại.

Nếu repository được thay đổi về:

- cấu trúc database
- biến môi trường
- port
- công nghệ
- scripts npm
- route API

thì cần cập nhật README tương ứng.

---

# Ghi chú cập nhật: bảo mật, tồn kho, thanh toán

- `POST /payments` yêu cầu JWT và chỉ chủ đơn mới thanh toán được.
- `PATCH /orders/:id/status`: `PENDING/PAID/PAYMENT_FAILED` chỉ do luồng thanh toán đặt; `PREPARING/READY/COMPLETED` chỉ vai trò `STAFF`; `CANCELLED` do chủ đơn hoặc `STAFF`, kèm hoàn kho và hoàn điểm.
- Tạo tài khoản nhân viên: đăng ký bình thường rồi chạy `UPDATE [User] SET role = 'STAFF' WHERE email = '...'`, sau đó đăng nhập lại để lấy token mới.
- Tồn kho giữ chỗ khi tạo đơn bằng optimistic locking (cột `Product.version`). Đơn `PAYMENT_FAILED` vẫn giữ chỗ để thử lại; hủy đơn thì hoàn kho.
- Idempotency: kết quả thanh toán (cả thất bại) được lưu và trả lại khi gửi lại cùng key. Thử lại đơn lỗi phải dùng key mới.
- Migration mới: `20261010000000_add_version_and_role` (chạy `npx prisma migrate deploy`).
- Test tích hợp đồng thời (`orders.concurrent.spec.ts`) cần SQL Server đang chạy và biến `DB_*`; thiếu thì tự bỏ qua.


---

# Ghi chú cập nhật: khuyến mãi trên giao diện, ảnh sản phẩm, test

- Trang `/checkout` có ô nhập mã khuyến mãi (`BREW10`). Giá giảm hiển thị trước khi thanh toán; trang xác nhận hiển thị tạm tính, khuyến mãi và điểm thưởng nhận được.
- Ảnh sản phẩm nằm ở `frontend/public/images/` (4 ảnh mẫu). Nếu ảnh lỗi, giao diện tự quay về hình minh họa emoji.
- `tedious` đã được khai báo trong `backend/package.json` (dùng bởi `init-db.mjs` và `seed.mjs`).
- Test mới: `src/payments/payments.idempotency.spec.ts` (gửi lặp cùng Idempotency-Key trên DB thật) và `test/app.e2e-spec.ts` (e2e thật, thay cho test mẫu). Cả hai cùng `orders.concurrent.spec.ts` **chỉ chạy khi có SQL Server** (`DB_SERVER` được đặt); thiếu DB thì bị bỏ qua.
- Tài liệu quy trình Scrum: `docs/SCRUM.md`.
