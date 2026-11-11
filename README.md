# HourGlass – HTML/CSS/JS thuần

Không cần build, không cần Node. Mở `index.html` bằng trình duyệt (hoặc dùng Live Server) là chạy.

```
index.html        Trang chủ
auth.html         Đăng nhập / Đăng ký (chọn vai trò Ứng viên-Sinh viên hoặc Nhà tuyển dụng)
jobs.html         Tìm việc (lọc theo từ khóa / remote)
job-detail.html   Chi tiết việc làm
student.html      Dashboard sinh viên
employer.html     Dashboard nhà tuyển dụng (có form đăng tin)
admin.html        Dashboard admin (duyệt tin)
css/              base, layout, components + 1 file riêng cho mỗi nhóm trang
js/mock-data.js   DỮ LIỆU MẪU (users, jobs, applications...) - sửa/thêm dữ liệu test ở đây
js/adapter.js     ghép mock-data thành dữ liệu hiển thị
js/               icons, main (đăng nhập, đăng ký, lưu việc...), 1 file riêng cho mỗi trang
js/modal.js       Component modal dùng chung: HG.modal.open(), HG.confirm() (popup xác nhận đăng xuất), modal ứng tuyển
js/validators.js  Quy tắc kiểm tra form (khai báo bằng data-rules trong HTML)
js/auth.js        Logic trang auth.html
assets/           favicon
```

- Việc làm đã lưu được giữ giữa các trang bằng `localStorage`.
- Font Inter tải từ Google Fonts (cần internet, nếu không sẽ dùng font hệ thống). Thang cỡ chữ / độ đậm / line-height / khoảng cách là biến `--fs-*`, `--fw-*`, `--lh-*`, `--space-*` trong `css/base.css`.

## Test nhanh
Tài khoản (mật khẩu chung `123456`): `student1@gmail.com`, `employer1@gmail.com`, `admin@gmail.com`.
Đăng nhập xong tự chuyển tới dashboard đúng vai trò. Dữ liệu tạo khi test (đơn ứng tuyển, tin đăng, duyệt tin, việc đã lưu)
lưu trong `localStorage`; xóa dữ liệu trình duyệt của trang để reset.

## Đăng ký / Đăng nhập
Tài khoản đăng ký mới lưu trong `localStorage` (khoá `hg_new_accounts`), demo nên mật khẩu chưa mã hoá. Đăng nhập kiểm tra đúng vai trò đã chọn. `auth.html?mode=signup&role=employer` mở thẳng form tương ứng.
