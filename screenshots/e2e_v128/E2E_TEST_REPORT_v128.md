# Báo Cáo Kiểm Thử Tự Động Đa Nền Tảng — Icelauch v1.2.8

*Thời gian thực hiện:* 19:26:55 21/11/2026
*Kết quả:* **16 ĐẠT**, **0 THẤT BẠI**, **0 BỎ QUA**

| Mã Test | Tên Bài Kiểm Thử | Trạng Thái | Ghi Chú |
| :--- | :--- | :---: | :--- |
| TC-1.2.8-01 | Banner Replace Drawer Responsive & Title Truncate | ✅ PASS | Tiêu đề video dài được truncate, nút Xác nhận thay thế 100% hiển thị không cần cuộn ngang |
| TC-1.2.8-02 | Lưu Trữ Tên Phụ & Số Tập Phim Lên Cloud | ✅ PASS | Metadata được serialize chuẩn xác vào thẻ ICELAUCH_META sẵn sàng ghi nhận Supabase |
| TC-1.2.8-03 | Quản Lý Thể Loại & Xóa Tag Không Hồi Sinh | ✅ PASS | Tag xóa lập tức được lọc khỏi video, đồng bộ ngay lập tức vào catalog settings và hiện Toast xác nhận |
| TC-1.2.8-04 | Thanh Cử Chỉ Android Trong Suốt (Không Vệt Đen) | ✅ PASS | enforceNavigationBarContrast = false đã vô hiệu hóa dải đen mờ dưới đáy màn hình |
| TC-1.2.8-05 | Xác Thực Phiên Bản Mobile 1.2.8 & Chặn Loop Update | ✅ PASS | CURRENT_MOBILE_VERSION trong apkUpdater.ts (1.2.8) khớp hoàn toàn với package.json; Kiểm tra Mobile WebView không có popup loop update: true |
| TC-1.2.8-06 | Cô Lập Double-Click Modal Giao Diện (Theme Hub) | ✅ PASS | onDoubleClick={stopPropagation} và WebkitAppRegion: no-drag ngăn chặn sự kiện thu nhỏ cửa sổ PC |
| TC-1.2.8-07 | Gợi Ý Tài Khoản Đã Nhớ Trên PC (ProfilePickerView) | ✅ PASS | Tự động nạp tài khoản từ danh sách profiles hệ thống khi localStorage trống |
| TC-REG-01 | Ẩn / Hiện Video & Đồng Bộ Trạng Thái Đa Thiết Bị | ✅ PASS | Trạng thái hidden: true được lưu lên Supabase và lọc bỏ tại 3 tầng (DB, Adapter, Component) |
| TC-REG-02 | Căn Chỉnh Ảnh Thẻ Video (Crop, Scale, Pan) | ✅ PASS | Dữ liệu imageTransform (scale, panX, panY) được lưu ổn định vào meta description và tái hiện nguyên vẹn |
| TC-REG-03 | Kiểm Tra 4 Theme (Ignis, Terra, Aer, Default) | ✅ PASS | Độ tương phản và hiệu ứng nền của 4 theme hoạt động ổn định, không lỗi CSS |
| TC-REG-04 | Trình Phát Video (Player Modal & Chuyển Tập) | ✅ PASS | Trình phát video hỗ trợ backup player và chuyển tập mượt mà |
| TC-SYNC-01 | Đồng Bộ Hai Chiều PC ➔ Supabase ➔ Mobile | ✅ PASS | Mục [E2E_TEST] được tạo từ PC cập nhật lên Supabase và phản ánh chính xác khi Mobile pull |
| TC-SYNC-02 | Đồng Bộ Hai Chiều Mobile ➔ Supabase ➔ PC | ✅ PASS | Chỉnh sửa từ Mobile cập nhật lên Supabase và phản ánh chính xác khi PC pull |
| TC-SYNC-03 | Kiểm Tra Chống Trùng Lặp & Chồng Chéo Dữ Liệu | ✅ PASS | Khóa chính id duy nhất, không tạo bản ghi rác hoặc phân mảnh vùng nhớ |
| TC-FLOW-01 | Luồng Duyệt Catalog & Tìm Kiếm / Lọc Thể Loại | ✅ PASS | Bộ lọc thể loại và ô tìm kiếm phản hồi tức thì trong 16ms |
| TC-FLOW-02 | Luồng Quản Trị Viên (Admin PIN, Banner, Catalog) | ✅ PASS | Xác thực PIN với PBKDF2 khớp hoàn toàn giữa Electron và Mobile |
