# BrewLite - Tài liệu quy trình Scrum

> Các ô đánh dấu **(điền)** là số liệu thật của nhóm. Hãy cập nhật theo thực tế trước khi nộp, không để mẫu.

## 1. Product Vision
BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy.

## 2. Product Backlog và Sprint

| Sprint | Sprint Goal | Task | Trạng thái | Bằng chứng trong repo |
|---|---|---|---|---|
| 1 | Nền tảng và hiển thị menu | 1. Khởi tạo dự án | Xong | `frontend/`, `backend/`, `.env.example` |
| 1 | | 2. API danh sách sản phẩm | Xong | `backend/src/products` |
| 1 | | 3. Trang Menu | Xong | `frontend/app/page.tsx` |
| 1 | | 4. Chi tiết và tùy chọn | Xong | `frontend/app/products/[id]` |
| 2 | Giỏ hàng, đặt đơn, đăng nhập | 5. Giỏ hàng | Xong | `frontend/store/cartStore.ts`, `app/cart` |
| 2 | | 6. API tạo đơn | Xong | `backend/src/orders` |
| 2 | | 7. Đăng ký / đăng nhập JWT | Xong | `backend/src/auth`, `app/login` |
| 3 | Thanh toán, bàn giao, nghiệp vụ nâng cao | 8. Thanh toán không tiền mặt | Xong | `backend/src/payments`, `app/checkout` |
| 3 | | 9. Xác nhận, lịch sử, bàn giao | Xong | `app/checkout/success`, `app/orders`, `docker-compose.yml` |
| 3 | | 10. Nghiệp vụ backend | Xong | State machine, idempotency, tồn kho, khuyến mãi, loyalty |

## 3. Burndown (điền số liệu thật mỗi ngày)

| Ngày | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lý tưởng | 20 | 18 | 16 | 14 | 12 | 10 | 8 | 6 | 4 | 2 | 0 |
| Thực tế (điền) | | | | | | | | | | | |

## 4. Definition of Done - checklist tự kiểm tra
- [ ] Build không lỗi (`npx tsc --noEmit` ở cả backend và frontend)
- [ ] `npm test` ở backend pass; test tích hợp chạy với SQL Server (không bị skip)
- [ ] Commit rõ ràng, có review trong nhóm (Pull Request)
- [ ] API có validate đầu vào; UI có trạng thái loading/lỗi
- [ ] README có hướng dẫn chạy

## 5. Sprint Review / Demo
Luồng demo end-to-end: Menu -> Chi tiết (size, topping) -> Giỏ hàng -> Đăng nhập -> Checkout (nhập mã `BREW10`) -> Thanh toán -> Xác nhận -> Lịch sử đơn.
Kịch bản bổ sung: đặt `MOCK_PAYMENT_FAIL=true` để demo thanh toán lỗi và thử lại; chạy test đồng thời và idempotency.

## 6. Sprint Retrospective (điền)
- **Làm tốt:** (điền)
- **Cần cải thiện:** (điền)
- **Hành động cho lần sau:** (điền)

## 7. Backlog cho phiên bản sau
- Giao diện cho Barista/Staff cập nhật trạng thái PREPARING / READY / COMPLETED.
- Thêm nhiều mã khuyến mãi và lưu mã trong CSDL thay vì hard-code `BREW10`.
- Tích hợp cổng thanh toán thật (Momo / VNPay / Stripe).
