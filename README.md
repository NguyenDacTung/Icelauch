# Icelauch - Trình Quản Lý Game & Rạp Giải Trí Đa Nền Tảng (Windows, Mobile & Android TV)

**Phiên bản phát hành:** 
- 🖥️ **Windows PC:** `v1.2.9`
- 📱 **Android Điện Thoại:** `v1.2.9` (Mã phiên bản build: `versionCode 25`)
- 📺 **Android TV Edition:** `v1.0.0` (Bản chuyên biệt điều khiển 100% bằng Remote)

**Hệ điều hành hỗ trợ:** 
- 🖥️ **Windows 10 / 11 (64-bit)** (Bản Cài Đặt NSIS Setup & Bản Di Động Portable)
- 📱 **Android Smartphone & Tablet** (Bản APK tối ưu tràn viền Edge-to-Edge)
- 📺 **Android TV / Smart TV / TV Box** (Bản APK 10-Foot Leanback, 16:9 banner, hỗ trợ 100% Remote D-pad)  
**Công nghệ nền tảng:** Electron 40 + Capacitor 8 + React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase BaaS Cloud + 7-Zip Engine + WebSocket Host Controller

---

## 1. Hướng Dẫn Lấy File Cài Đặt & Trải Nghiệm Thực Tế

### Cách 1: Tải file đóng gói sẵn từ GitHub Releases (Khuyên dùng)
Bạn chỉ cần truy cập trang GitHub Releases của dự án để tải file cài đặt:
👉 **[Tải Bản Cài Đặt Icelauch Mới Nhất Trên GitHub Releases](https://github.com/NguyenDacTung/Icelauch/releases)**

Tại trang Releases, bạn sẽ có các file cài đặt tương ứng với thiết bị của mình:
- **`Icelauch-Setup-*.exe` (Dành cho Windows PC):** Bộ cài đặt thông minh, tự động tạo shortcut Desktop và Start Menu.
- **`Icelauch-*.exe` (Bản Portable cho Windows):** 1 file duy nhất chạy ngay không cần cài đặt, thích hợp lưu trên USB/ổ cứng ngoài.
- **`Icelauch-phone.apk` (Dành cho Điện thoại Android):** File APK tối ưu cho thao tác chạm 1 tay, cử chỉ vuốt quay lại và tìm kiếm tức thì.
- **`Icelauch-tv.apk` (Dành cho Android TV / TV Box):** Bản chuyên biệt cho TV phòng khách (Sony, Xiaomi, TCL, Casper...), banner 16:9, điều khiển 100% bằng Remote TV (D-pad).
- **`Icelauch-universal.apk` (Bản Phổ Quát):** File APK dùng chung cho cả điện thoại và Android TV.

---

## 2. Các Nâng Cấp Nổi Bật Trong Phiên Bản v1.2.9 (Khắc Phục Triệt Để Toàn Bộ Lỗi Đồng Bộ Cloud Supabase, Khôi Phục Lưu Trữ Video/Game, Chuẩn Hóa Tag & Quick Hide)

Bản cập nhật v1.2.9 giải quyết dứt điểm các lỗi đồng bộ dữ liệu đám mây:
- **Đóng gói Metadata Envelope an toàn:** Toàn bộ thuộc tính tùy biến (`hidden`, `transform_metadata`, `secondaryTitle`, `episode`, `coverPosition`, `listCardPosition`) được đóng gói vào thẻ `<!--ICELAUCH_META:...-->` trong cột `description`. Loại bỏ hoàn toàn việc gửi cột lạ lên Supabase, chấm dứt triệt để lỗi `HTTP 400 Bad Request (PGRST204)`.
- **Đồng bộ Quick Hide hai chiều:** Bấm nút ẩn bên ngoài danh sách lập tức gửi toàn bộ thông tin media lên Cloud, hiển thị Toast thông báo và đồng bộ tức thì trên cả PC lẫn điện thoại.
- **Hỗ trợ đầy đủ trên Điện thoại:** Hàm `fetchDirectCloudCatalog` trên Android giải mã trọn vẹn `hidden` và `transform_metadata`, đồng bộ 100% với PC.
- **Khử trùng lặp Tag không phân biệt hoa thường:** Tự động chuẩn hóa và gộp các tag trùng lặp (như `Hoạt hình` và `Hoạt Hình`) thành 1 thẻ duy nhất, xóa sạch khỏi tất cả video trên Supabase.

---

## 3. Các Nâng Cấp Trong Phiên Bản v1.2.8

Bản cập nhật v1.2.8 tập trung giải quyết triệt để các phản hồi kiểm thử thực tế từ người dùng:

### 2.1 Khắc Phục Lỗi Hiển Thị Ngăn Thay Thế Banner (Inline Replace Drawer)
- 📐 **Bố cục 2 hàng chống tràn:** Tái thiết kế giao diện chọn mục thay thế trên Banner Manager. Tiêu đề mục được rút gọn thông minh (`truncate max-w-[280px]`), dropdown chiếm toàn bộ chiều rộng khả dụng (`w-full min-w-0`), hàng nút Hủy & Xác nhận căn phải rõ ràng.
- 🎯 **Hiển thị 100% không cần cuộn ngang:** Nút *"Xác nhận thay thế"* luôn nằm trọn vẹn trong khung nhìn trên mọi kích thước màn hình PC và tablet.

### 2.2 Sửa Dứt Điểm Lỗi Xóa Tag / Thể Loại Bị Hiện Lại
- ☁️ **Đồng bộ Cloud đa điểm:** Khi xóa một tag thể loại, ứng dụng lập tức gỡ bỏ tag khỏi toàn bộ các mục video/game có liên quan, cập nhật ngay các media này lên Supabase và lưu cài đặt mới vào `__system_catalog_settings__`.
- 🔔 **Toast xác nhận rõ ràng:** Có thông báo Toast hiển thị ngay sau khi thao tác: *"Đã xóa thể loại và đồng bộ lên Cloud!"*. Tag không còn bị hiện lại do xung đột dữ liệu cũ.

### 2.3 Loại Bỏ Vệt Đen Dưới Cùng Quanh Thanh Cử Chỉ Điều Hướng Trên Android
- 📱 **True Edge-to-Edge:** Tắt tính năng ép độ tương phản thanh điều hướng (`setNavigationBarContrastEnforced(false)`) trên Android 10+ (API 29+) trong `MainActivity.java` và `values-v29/styles.xml`.
- ✨ **Không còn dải đen:** Loại bỏ hoàn toàn vệt đen mờ nằm đè lên thanh cử chỉ vuốt của điện thoại khi xem video hoặc duyệt ứng dụng.

### 2.4 Đồng Bộ Phiên Bản Điện Thoại & Chấm Dứt Lặp Lại Popup Cập Nhật
- 🚀 **Khắc phục biến phiên bản:** Đưa hằng số `CURRENT_MOBILE_VERSION` lên đồng bộ tuyệt đối với `1.2.8` (versionCode 24), loại bỏ thông báo cập nhật lặp lại vô tận trên điện thoại.

### 2.5 Ngăn Chặn Nhấp Đúp Vào Hộp Chọn Giao Diện Gây Thu Nhỏ Cửa Sổ PC
- 🖥️ **Cách ly sự kiện:** Thêm `onDoubleClick={(e) => e.stopPropagation()}` và `style={{ WebkitAppRegion: 'no-drag' }}` vào hộp thoại chọn 9 chế độ giao diện thời không (`CelestialThemeHub`). Nhấp đúp chuột không còn làm cửa sổ Electron bị co về dạng cửa sổ nhỏ.

### 2.6 Tự Động Gợi Ý Tài Khoản Đã Đăng Nhập Trên Thiết Bị PC
- 👤 **Khởi tạo danh sách tài khoản đã nhớ:** Bổ sung cơ chế auto-seed danh sách tài khoản đã nhớ từ cơ sở dữ liệu `profiles` của PC, giúp người dùng PC thấy ngay các tài khoản của máy tính ở khung *"Tài khoản đã nhớ trên máy này"*.

---

## 3. Các Nâng Cấp Nổi Bật Trong Phiên Bản v1.2.7 (Trình Phát Video Dự Phòng HTML5 Cinema, Quản Lý Banner Nâng Cao, Series & Playlists, Lá Chắn Bảo Mật & Tối Ưu Trải Nghiệm Di Động)

Bản cập nhật v1.2.7 mang đến bước hoàn thiện quan trọng về tính năng đa phương tiện, bảo mật thông tin và nâng tầm trải nghiệm nghe nhìn cho **Icelauch**:

### 2.1 Trình Phát Video Dự Phòng (HTML5 Cinema Player) & Cảnh Báo Thông Minh Cho Google Drive
- 🎬 **Trình phát HTML5 Cinema độc lập:** Tự code bộ điều khiển video chuyên nghiệp với nút Play/Pause lớn nổi bật ở tâm khi tạm dừng, nút tua nhanh tiến/lùi 10s (`RotateCw`/`RotateCcw`), thanh Scrubber thời gian thực mượt mà, thanh trượt âm lượng + tắt tiếng, chu kỳ điều chỉnh tốc độ xem (0.75x, 1x, 1.25x, 1.5x, 2x) và chế độ xem Toàn màn hình.
- 🛡️ **Tự động phát hiện lỗi và đề xuất đổi trình phát:** Khi luồng phát Google Drive gặp sự cố tải, bị chặn cookie hoặc mạng chậm quá 10 giây, ứng dụng tự động hiển thị hộp thoại gợi ý thân thiện: *"Trình phát Drive đang gặp sự cố, bạn có muốn đổi sang Trình phát Dự phòng không?"* cho phép chuyển sang HTML5 Cinema tức thì.
- ⚡ **Nút chuyển đổi nhanh thủ công:** Bổ sung nút gạt trực tiếp cạnh bộ chọn nguồn phát giúp chuyển đổi qua lại giữa Google Drive và Trình phát Dự phòng bất cứ lúc nào.

### 2.2 Quản Lý Banner Admin Đầy Đủ & Đồng Bộ Đám Mây Tức Thì (Real-Time Cloud Sync)
- 🔄 **Tính năng Thay thế Banner:** Admin có thể bấm nút *Thay thế* (`ArrowLeftRight`) trên bất kỳ thẻ banner nào để mở thanh chọn mục thay thế tức thì mà không cần xóa đi ghim lại.
- 🗑️ **Gỡ bỏ linh hoạt:** Cho phép gỡ bỏ cả các mục đang ghim chính thức lẫn các mục tự động bù (đưa vào danh sách loại trừ `excludedIds` để không tự động xuất hiện).
- ☁️ **Lưu đám mây tức thời:** Mọi thao tác thêm mới, thay thế, gỡ bỏ, đổi thứ tự hiển thị hay cấu hình banner đều được lưu ngay lập tức lên Supabase Cloud (`__system_catalog_settings__`).

### 2.3 Quản Lý Phim Chuyên Sâu (Tên Khác / Tên Phụ, Số Tập) & Định Dạng Thẻ Chuẩn
- 📝 **Trường dữ liệu mở rộng cho Phim:** Form Admin bổ sung 2 ô nhập: **"Tên khác / Tên phụ"** (`secondaryTitle`) và **"Tập / Phần"** (`episode`), lưu trữ đồng bộ lên Cloud qua description metadata.
- 🏷️ **Định dạng thẻ phim thông minh:** Dòng phụ dưới tên phim nay hiển thị theo định dạng `Tên phụ - #tập`. Nếu thiếu một trong hai thì hiển thị mục còn lại; nếu không nhập cả hai thì tự động đưa tên chính xuống để thẻ luôn đầy đủ, cân đối.
- 🎭 **Hiển thị Theater View đẳng cấp:** Màn hình xem phim thể hiện nổi bật tên chính kèm huy hiệu số tập `#{tập}` màu vàng kim và tên phụ in nghiêng sang trọng.

### 2.4 Tìm Kiếm Đa Trường Toàn Diện
- 🔍 Thanh tìm kiếm chính trên Header và thanh tìm kiếm nội bộ danh sách nay tự động tìm khớp theo: Tên chính, Tên khác/Tên phụ, Số tập (hỗ trợ cả dạng `1`, `#1`, `tập 1`), Thể loại và Thẻ tags.

### 2.5 Lá Chắn Bảo Mật Dữ Liệu Tuyệt Đối (Privacy Shield)
- 🔒 **Chặn rò rỉ liên kết gốc:** Loại bỏ hoàn toàn các nút "Sao chép link" và "Mở link nguồn trên trình duyệt ngoài" trên toàn bộ ứng dụng (PC, Mobile, TV, Chi tiết Game, Rạp phim và Nhạc). Người dùng trải nghiệm nội dung an toàn, khép kín trong ứng dụng mà không lo lộ nguồn tải.

### 2.6 Đồng Bộ Chuỗi Series & Danh Sách Phát (Playlists) Trên PC
- 📺 **Cùng Series cho mọi video:** Mọi video thuộc bất kỳ danh sách phát nào đều tự động kích hoạt tab *"Cùng Series"* trong cột đề xuất bên cạnh. Hỗ trợ dropdown chuyển đổi nhanh nếu video nằm trong nhiều series khác nhau.
- 📑 **Danh sách phát chứa video:** Bên dưới phần mô tả video hiển thị đầy đủ các playlist mà video này trực thuộc; chỉ cần 1 click để nhảy ngay sang xem toàn bộ series đó.

### 2.7 Thanh Điều Khiển Đề Xuất Sidebar Thông Minh
- 🎛️ **Toolbar tiện ích ở giữa tab và danh sách:**
  - **3 chế độ phát độc quyền:** Lặp lại video đang xem (`Repeat`), Phát theo thứ tự (`Sequential`), Phát ngẫu nhiên (`Shuffle`). Tự động chuyển bài/tập theo đúng chế độ đã chọn khi video kết thúc.
  - **Nút đảo thứ tự phát:** Cho phép xem theo thứ tự xuôi `1 → N` hoặc ngược `N → 1`.
  - **Ô tìm kiếm nội bộ danh sách:** Lọc tức thì video theo tên, tập hoặc thể loại ngay trong cột đề xuất.
  - Hoạt động trơn tru trên cả 3 tab: Cùng Series, Gợi ý cùng thể loại, và Nổi bật.

### 2.8 Dừng Nhạc Nền Toàn Cục (Universal BGM Interruption)
- 🎵 Đấu nối sự kiện toàn cục `icelauch-pause-bgm`: Ngay khi người dùng mở xem phim, video, hoặc bật tiếng trailer game ở bất kỳ màn hình nào, nhạc nền đang phát sẽ tự động tạm dừng ngay 100%, không bị tình trạng chồng chéo âm thanh.

### 2.9 Sửa Màu Nút Playlist Ở Mode Sáng & Giọt Nước Tab Mobile
- ☀️ **Icon thêm vào playlist trắng tinh trên nền tối:** Khắc phục triệt để lỗi icon màu đen trên nền tròn đen mờ trong mode Solar và Aqua, đảm bảo hiển thị sắc nét với lớp bảo vệ `btn-keep-white`.
- 💧 **Sửa lỗi lệch Tab Aqua Mobile:** Khắc phục lỗi giọt nước trượt bị lệch 2 vị trí trên thanh điều hướng di động bằng việc gán neo tọa độ tuyệt đối `left: 0 !important`.

### 2.10 Tối Ưu Trình Phát YouTube Di Động Chuẩn 16:9
- 📱 **Xóa bỏ vệt đen trên/dưới:** Khung phát YouTube di động nay chuẩn hóa theo tỉ lệ `w-full aspect-video` 16:9 khít màn hình, không còn vệt đen trên dưới gây khó chịu.
- 🔄 **Loại bỏ tự động xoay:** Gỡ bỏ hoàn toàn listener xoay màn hình tự động và lớp overlay toàn màn hình phụ, chấm dứt hoàn toàn hiện tượng xung đột và phát đè 2 video cùng lúc.

---

## 3. Các Nâng Cấp Nổi Bật Trong Phiên Bản v1.2.6 (Bộ Nhận Diện Thương Hiệu Mới & Đại Tu Toàn Diện Aqua & Solar Mode)

Bản cập nhật v1.2.6 mang đến bước đột phá mạnh mẽ về thị giác và công thái học cho **Icelauch**:

### 2.1 Bộ Nhận Diện Thương Hiệu & Biểu Tượng App Độc Bản Mới (New Brand Icon 2026)
- 💎 **Icon ứng dụng cao cấp:** Biểu tượng đóa hoa sóng lỏng đa tầng sinh động (Cyan Blue, Sky Azure & Neon Magenta) bao quanh lõi lục giác kính mờ Frost Glass trung tâm.
- 🎨 **Tối ưu hiển thị đa nền tảng:** Định dạng Master PNG chuẩn 512x512 và trọn bộ Adaptive Mipmap Icons cho Android (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi), sắc nét trên Desktop PC, Taskbar, Android Launcher, và Header UI trong app.

### 2.2 Đại Tu Chuyên Biệt Aqua Mode (Thủy — Fluid Liquid Architecture)
- 💧 **Bảng màu nước biển nông tươi mát:** Nền chuyển sắc xanh băng dịu mắt (`#E0F7FA` → `#BAE6FD`), mặt kính mờ trong suốt phản chiếu ánh nước (`rgba(255, 255, 255, 0.88)` kèm `backdrop-blur(24px)`), chữ chính xanh đại dương đậm đà (`#082F49`, WCAG AAA 12.8:1) và màu nhấn xanh nước biển rực rỡ (`#0284C7`).
- 🌊 **Kiến trúc Header PC "Giọt Nước Đọng Từ Mép Trên":** Cạnh trên Header dính liền mép cửa sổ (`pt-0`), hai bên thắt eo mềm mại như giọt nước lớn đang chảy xuống.
- 🔍 **Thanh Tìm Kiếm Trung Tâm Kéo Dài (Extended Center Search Bar):** Cân đối ở chính giữa thanh công cụ trên PC, tạo điểm nhấn thoáng đãng và tiện dụng.
- 💦 **Giọt Nước Trượt Điều Hướng (Liquid Droplet Tab Indicator):** Giọt nước 3D lỏng nổi trên tab hiện tại, chuyển động kéo giãn và chảy trôi mượt mà (`cubic-bezier(0.34, 1.56, 0.64, 1)`) khi chuyển tab.
- 🌊 **Nền Sóng Chuyển Động Liên Tục (Continuous Flowing Wave Backdrop):** Đồ họa sóng nước đa tầng chuyển động êm ả thư giãn, tăng tốc GPU CSS, tự động tối ưu hóa theo chế độ máy yếu Low-Spec Mode.
- 🫧 **Gợn Sóng Nước Khi Chạm & Nút Bật/Tắt:** Tinh giản thành vòng tròn nước mỏng nhẹ thanh lịch, kèm nút công tắc hình giọt nước ngay trên Header PC và trang Cài Đặt (lưu trạng thái `localStorage`).
- ☀️🌙 **Cơ chế nút gạt Solar/Lunar trong Aqua Mode:** Tự động mờ và mất màu (`opacity: 0.4`, `grayscale(100%)`) để báo hiệu chế độ độc lập, bấm vào nút gạt này sẽ lập tức thoát Aqua để quay về Solar/Lunar.

### 2.3 Đại Tu Độ Tương Phản & Nổi Khối Solar Mode (V6.4.2)
- 🛡️ **Text Contrast Shield WCAG AAA:** Khắc phục triệt để chữ vàng nhạt trên nền trắng, chuyển hoàn toàn sang sắc Amber 900 `#78350F` (tỷ lệ tương phản 12.5:1).
- 🧱 **Phân tách dứt khoát 3 lớp bề mặt:** Nền canvas cát vàng ấm (`#EAE2D2`), thanh công cụ vàng champagne cát (`#DCCEBA`), và bề mặt thẻ trắng sứ nguyên chất (`#FFFFFF`) có đổ bóng ấm.
- 🖼️ **Xóa bỏ sương mờ trắng chân poster:** Hiển thị trọn vẹn 100% hình ảnh nghệ thuật của thẻ game ở trang chủ.
- ⚙️ **Đồng bộ hóa toàn bộ trang Cài Đặt:** Loại bỏ hoàn toàn các khung nền đen/tối sót lại trên các tab Lưu trữ, Đám mây và Cập nhật trong Solar Mode.

### 2.4 Hệ Thống 9 Chế Độ Thời Không Toàn Diện (9 Celestial Themes)
Bảng màu 9 chế độ độc bản được chuẩn hóa công thái học và hiển thị đồng bộ 100% trên cả PC và Mobile:
1. ☀️ **Solar:** Chế độ ngày rạng rỡ, đạt chuẩn tương phản cao WCAG AAA (`#181512` trên nền cát ấm `#EAE2D2`), nghiêm cấm chữ vàng nhạt trên nền sáng.
2. 🌙 **Lunar:** Không gian màn đêm điện ảnh tĩnh lặng Obsidian (`#0B0F19`), màu nhấn chàm thanh lịch.
3. 💧 **Aqua:** Ngôn ngữ chất lỏng tươi mát (Fluid Liquid Architecture), sóng biển trôi dạt liên tục, giọt nước trượt tab và màng nước hữu cơ.
4. 🔥 **Ignis:** Nham thạch & Lửa thiêng, viền dạ quang cam đỏ rực rỡ và hiệu ứng tro tàn bay bổng.
5. 💨 **Aer:** Kính khí động học tối giản siêu nhẹ, khung lưới kỹ thuật và tắt hiệu ứng nặng giúp tiết kiệm pin tối đa.
6. 🌿 **Terra:** Rừng già RPG & Đất phong rêu (`#121613` + `#84CC16`), góc vát hình học 8 cạnh mang phong cách dã chiến.
7. 🌘 **Eclipse:** Nhật thực bóng tối với vành hào quang vàng hoàng kim Corona Glow tỏa rộng trên viền thanh công cụ và thẻ.
8. 🌌 **Aurora:** Dải ánh sáng Bắc Cực ngọc bích & tím violet chuyển sắc uốn lượn liên tục trên thanh công cụ, thanh phát nhạc, thẻ và nền.
9. 🔮 **Nebula:** Vũ trụ tinh vân tự động trích xuất tông màu chủ đạo từ ảnh banner bao phủ toàn màn hình, kết hợp bầu trời sao li ti lấp lánh.

### 2.3 Sửa Dứt Điểm Stacking Context & Hộp Thoại CelestialThemeHub
- 🪟 **Tích hợp React Portal:** Đưa hộp thoại chọn 9 chế độ ra ngoài cây DOM trực tiếp vào `document.body` với `z-[9999]`, loại bỏ hoàn toàn lỗi bị bẫy trong Navbar và luôn hiển thị ngay ngắn chính giữa màn hình.
- 🎯 **Trải nghiệm băng chuyền Center-Focus:** Trượt biểu tượng vào tâm điểm mượt mà kèm phím tắt mũi tên Trái/Phải và nút Áp Dụng trực quan.

### 2.4 Chuẩn Hóa Cực Tính Công Tắc Biến Hình (Sun/Moon Toggle Switch)
- ⚖️ **Chuẩn công thái học chính xác:** Vị trí con trượt phản ánh đúng chế độ đang kích hoạt:
  - **Trượt sang Trái:** Bật **Lunar 🌙 (Chế độ ban đêm)**.
  - **Trượt sang Phải:** Bật **Solar ☀️ (Chế độ ban ngày)**.

### 2.5 Nút Bấm & Trình Phát Nhạc Đồng Bộ Màu Nhấn Chủ Đề Động
- 🎵 Toàn bộ nút Play/Pause, thanh tua, thanh âm lượng và equalizer trên **MiniPlayer PC** và **MobileMiniPlayer** nay tự động dùng màu chủ đề `bg-ice-accent` của mode đang chọn thay vì màu vàng cứng cũ.

### 2.6 Cơ Chế Tự Động Đăng Nhập 1 Lần & Quản Lý Phiên Bản (Auto-Login Persistence)
- 🔑 **Đăng nhập một lần, dùng mãi mãi:** Đồng nhất hằng số phiên bản `APP_VERSION = '1.2.6'` trên toàn hệ thống. Người dùng chỉ cần đăng nhập hồ sơ một lần duy nhất, các lần khởi động tiếp theo ứng dụng tự động đưa vào màn hình chính mà không cần chọn lại hồ sơ.
- 🔄 **Xác thực phiên bản thông minh:** Ứng dụng chỉ yêu cầu xác thực lại khi có cập nhật phiên bản lớn thực sự, ngăn chặn hoàn toàn lỗi mất phiên khi khởi động lại app.
- ☁️ **Ưu tiên đám mây (Cloud First):** Tự động đối chiếu hồ sơ đã ghi nhớ khi dữ liệu từ Supabase Cloud được đồng bộ về, đảm bảo dữ liệu luôn nhất quán giữa các thiết bị.

### 2.7 Đồng Bộ Dữ Liệu Quản Trị Viên (Admin) Thời Gian Thực Lên Cloud (Real-time Cloud Sync)
- ⚡ **Ghi tức thì không cần nút khóa:** Mọi thao tác quản trị (Thêm, sửa, xoá Game, Phim, Nhạc, Banner, Thẻ phân loại, Quản lý tài khoản) lập tức được đẩy trực tiếp lên Cloud Database Supabase qua IPC Service kèm thông báo Toast 2s ("Đã lưu thay đổi lên Cloud!").
- 📥 **Kéo dữ liệu tức thì khi mở Admin:** Đăng nhập chế độ Quản trị viên lập tức kích hoạt kéo dữ liệu đám mây mới nhất về máy, đảm bảo các thiết bị khác luôn thấy ngay các thay đổi vừa thực hiện.

### 2.8 Đồng Bộ Trạng Thái Căn Chỉnh Ảnh Non-Destructive (`transform_metadata`)
- 🖼️ **Bảo toàn 100% ảnh gốc trên Storage:** Không ghi đè hay làm nén giảm chất lượng file ảnh gốc trên Supabase Storage.
- 📐 **Lưu trữ thông số tọa độ phần trăm:** Mọi tùy chỉnh Pan x/y (%), Mức Zoom, Góc Xoay 90° (`RotateCw`) và Độ sắc nét/tương phản được chuẩn hóa vào cột `transform_metadata` (kiểu `JSONB`) trên database.
- 📱 **Hiển thị hoàn hảo trên mọi độ phân giải:** Cho phép tái hiện chính xác góc nhìn và bố cục ảnh bìa trên cả PC, Điện thoại và Android TV.

### 2.9 Tinh Chỉnh & Đồng Nhất Bảng Màu 3 Chế Độ Sáng (Aer, Solar, Aqua)
- 💨 **Aer Mode (Phong):** Làm đậm và đầm màu nền thanh công cụ PC Header và thanh phát nhạc MiniPlayer từ `#CAD6E2` sang `#B8C7D9` với đường viền sắc nét `#64748B`, tạo độ tương phản nổi bật với nền canvas `#EEF2F6`.
- 🎨 **Triệt tiêu hiện tượng chữ vàng trên nền trắng:** Đồng nhất màu sắc theo từng mode cho nút "Hôm nay chơi gì", "Playlist của tôi", "Hôm nay xem gì", "Hôm nay nghe gì", các tab thư viện và hiệu ứng rê chuột (hover).
- 🏷️ **Thẻ thể loại game chuẩn hóa:** Chữ trắng trên nền đen mờ (`rgba(0, 0, 0, 0.75)`) với viền mỏng tinh tế, hiển thị rõ ràng trên mọi hình ảnh.
- 🌫️ **Loại bỏ sương mờ trắng:** Tắt hoàn toàn lớp phủ sương mờ trên thẻ hiển thị, trả lại 100% độ sắc nét cho hình ảnh poster.

### 2.10 Đại Tu Giao Diện Mobile, Display Cutout & Trình Phát Video Điện Thoại
- 📱 **Tràn viền Edge-to-Edge qua Camera Giọt Nước:** Cấu hình `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES` và `WindowCompat.setDecorFitsSystemWindows(false)` cho Android 9+, loại bỏ hoàn toàn dải đen letterbox trên cùng. Màn hình app tràn trọn vẹn lên tận mép kính ôm trọn camera giọt nước.
- 🏝️ **Ốc đảo nổi thuần túy (Pure Floating Island Navigation):** Xóa bỏ khối hình chữ nhật đặc chắn ngang đáy màn hình. Thanh điều hướng bo góc và MiniPlayer chuyển thành lớp phủ nổi (`absolute bottom-0 inset-x-0`), cho phép danh sách game/phim/nhạc cuộn tự do bên dưới và xuyên qua 4 phía xung quanh thanh nav.
- 💧 **Kính nước trong suốt Aqua (Aqua Water-Glass):** Thanh điều hướng đáy và MiniPlayer ở mode Aqua sử dụng hiệu ứng thủy lưu khúc xạ trong suốt (`bg-sky-100/35 border-sky-300/50 backdrop-blur-2xl`), nhìn xuyên thấu nội dung trôi bên dưới như nhìn qua mặt nước trong vắt.
- ⚙️ **Cài đặt Mobile:** Thêm khoảng đệm cho hàng 9 Celestial Themes, loại bỏ hoàn toàn lỗi khuyết mép trên của vòng hào quang `ring-2`.
- 🎬 **Trình phát YouTube Mobile: Tự động xoay ngang & Triệt tiêu vệt đen:**
  - Plugin native `ScreenOrientationPlugin.java` cho Capacitor: Khi bấm mở to (hoặc nút "Xoay ngang" mới), app tự động chuyển sang chế độ xoay ngang cảm biến (`SCREEN_ORIENTATION_SENSOR_LANDSCAPE`) và tự khôi phục khi thoát.
  - Lớp phủ Rạp Chiếu Toàn Màn Hình tràn viền 100% `fixed inset-0 z-[9999]`, loại bỏ toàn bộ lề/padding. Bổ sung nút chuyển đổi thông minh: **Chuẩn 16:9** (vừa màn) và **Tràn viền (Fill)** (scale nhẹ `1.18x` lấp kín toàn bộ tỷ lệ 20:9/21:9 của điện thoại, loại bỏ hoàn toàn 2 vệt đen trên dưới).
- 🎬 **Trình phát Google Drive Mobile: Hiển thị ảnh bìa 16:9 sắc nét:**
  - Loại bỏ hoàn toàn màn hình đen mờ, thay bằng ảnh bìa poster tỉ lệ 16:9 sắc nét kết hợp lớp phủ gradient điện ảnh mềm và nút phát sáng trung tâm (Glowing Cyan Play Button), mang đến giao diện trực quan và cao cấp.

### 2.11 Khắc Phục Lỗi Tương Phản & Quét Sạch Hộp Đen Còn Sót
- 🛠️ Sửa dứt điểm hộp nút liên kết Steam/Discord (`GameActionsWidget`) và các ô nhập liệu trong `SettingsView` không còn bị hiển thị màu đen ngòm ở Solar mode.
- 🧪 **193/193 ca kiểm thử tự động PASS 100%:** Xác thực toàn bộ logic nghiệp vụ, giao diện và đóng gói hệ thống.

---

## 3. Các Nâng Cấp Nổi Bật Trong Phiên Bản v1.2.4 (Nâng Cấp Toàn Diện Giao Diện Solar & Lunar Design System & Floating Glassmorphic UI)

Bản cập nhật v1.2.4 là bước nhảy vọt về mặt thẩm mỹ và trải nghiệm người dùng cao cấp (Premium UX), áp dụng phong cách **Kính Mờ Bo Tròn Nổi (Glassmorphism & Floating UI)** trên cả Windows PC và Thiết bị Di Động Android:

### 2.1 Hệ Thống Theme Kép Solar / Lunar & Lưu Trữ Cục Bộ
- ☀️ **Solar Mode (Chế độ ban ngày rạng rỡ):** Thiết kế tươi sáng, độ tương phản cao đạt chuẩn công thái học (Nền chính `#FAF8F5`, thẻ `#FFFFFF`, màu nhấn `#F59E0B`, chữ chính `#1C1917`, viền `#E7E5E4`).
- 🌙 **Lunar Mode (Chế độ ban đêm huyền ảo - Mặc định):** Không gian điện ảnh tĩnh lặng (Nền chính `#0B0F19`, thẻ `#151C2C`, màu nhấn `#818CF8`, chữ chính `#F1F5F9`, viền `#1E293B`).
- 💾 **Lưu trữ độc lập & Đồng bộ tức thì:** Ghi nhớ lựa chọn theme trong `localStorage` (`icelauch_theme_mode`), phát sự kiện `icelauch:theme-change` đồng bộ trạng thái ngay lập tức trên mọi thành phần giao diện.

### 2.2 Công Tắc Biến Hình Vi Mô (Micro-Interaction Morphing Theme Switch)
- 🔄 **Nút gạt chuyển theme độc bản:**
  - Núm gạt tròn tự động biến hình giữa Mặt Trời (tia nắng xoay nhẹ) và Mặt Trăng (lưỡi liềm thanh lịch) với hiệu ứng gia tốc đàn hồi mượt mà.
  - Lớp nền thay đổi giữa bầu trời ngày mây bay và bầu trời đêm có sao lấp lánh lung linh.
  - Tích hợp âm thanh click xúc giác chân thực, xuất hiện tiện lợi trên thanh Header PC và Cài đặt Mobile.

### 2.3 PC Header Đảo Nổi Toàn Phần (Full-Width Floating Island Navbar)
- 🏝️ **Navbar dạng đảo kính mờ nổi:** Thanh điều hướng trên PC chuyển thành khối đảo nổi độc lập (`glass-header mx-4 mt-2.5 rounded-2xl border shadow-lg`), tạo cảm giác thoáng đãng và sang trọng.
- 🔍 **Thanh tìm kiếm dạng viên thuốc đồng tâm:** Bo tròn mềm mại (`rounded-full bg-ice-bg/70`), tích hợp bộ lọc danh mục game & media thông minh.

### 2.4 Thanh Phát Nhạc MiniPlayer Viên Thuốc Nổi Chính Giữa (Floating Pill MiniPlayer)
- 💊 **Viên thuốc nổi công thái học:** MiniPlayer trên PC được định vị nổi bật chính giữa đáy màn hình (`fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl glass-pill rounded-2xl`).
- 🎚️ **Hiệu ứng trượt nổi (Slide-up):** Đầy đủ các nút điều khiển trung tâm phát/dừng, chuyển bài, âm lượng, bộ cân bằng sóng âm Equalizer sống động và nút mở nhanh máy hát đĩa than Vinyl.

### 2.5 Thanh Điều Hướng Mobile Bo Tròn Nổi & Tuân Thủ Safe Area
- 📱 **Floating Glassmorphic Tab Bar:** Thanh điều hướng chân trang trên điện thoại được chuyển thành viên thuốc kính mờ bo cong 2 đầu, nổi cách mép đáy an toàn theo chuẩn iOS Home Indicator và phím ảo Android (`env(safe-area-inset-bottom)`).
- 📱 **Mobile MiniPlayer Kính Mờ:** Đồng bộ chất liệu kính mờ nổi, loại bỏ cảm giác nặng nề của viền đen đặc cũ.

### 2.6 Khắc Phục Triệt Để Lỗi Vết Lồi Cong Cạnh Phải Thẻ Phim/Game
- 🎯 **Loại bỏ hoàn toàn nút cuộn đè lên thẻ:** Chuyển toàn bộ các nút điều hướng cuộn ngang (`GenreShelfScroller`) lên hàng tiêu đề giá kệ (Header row - tiêu chuẩn Netflix/Steam), hoàn toàn giải phóng vùng thẻ poster 2:3 và 16:9 khỏi bất kỳ vết lồi thừa hay lỗi cắt góc.

### 2.7 Phủ Kín 100% Không Gian Ứng Dụng (Zero Leftover Screens)
- 💎 **Triệt tiêu toàn bộ màu cứng (Hardcoded Hex):** 100% các màn hình, trang chi tiết, modal quản trị (Admin Auth, PIN, Device Manager, Playlist, Banner, Tag, Game Form, IceDrop, IceController...) đều thích ứng hoàn hảo giữa Solar và Lunar.
- 🧪 **189/189 ca kiểm thử tự động PASS (100%):** Vượt qua toàn bộ các bài kiểm tra giao diện, logic dữ liệu và đóng gói hệ thống.

---

## 3. Các Nâng Cấp Nổi Bật Trong Phiên Bản v1.2.3 (Cải Tổ Hệ Thống Toàn Diện - System Overhaul)

Bản cập nhật v1.2.3 là đợt nâng cấp kỹ thuật toàn diện và nghiêm túc nhất, giải quyết dứt điểm các lỗi nền tảng lặp lại giữa PC và Điện thoại:

### 3.1 Trọng Tâm Cửa Sổ PC & Bàn Phím (Electron Window Focus Fix)
- ⌨️ **Sửa lỗi đơ ô nhập text trên Windows PC:** Khắc phục triệt để hiện tượng cửa sổ không viền (frameless window) của Electron bị kẹt trọng tâm hệ thống (HWND focus trapping) khiến người dùng không thể gõ phím vào ô nhập liệu mà phải hạ app xuống rồi bật lại. Tích hợp menu chỉnh sửa hệ thống ngầm và khôi phục phím tắt bàn phím chuẩn (`Ctrl+A`, `Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+Z`).
- 🖱️ **Tách biệt thuộc tính CSS `user-select`:** Loại bỏ quy tắc chặn chọn văn bản toàn cục (`user-select: none`) khỏi toàn bộ các thẻ `<input>`, `<textarea>` và nội dung gõ phím.

### 3.2 Bộ Gõ Bàn Phím Điện Thoại (Mobile IME & Real-Time Typing Fix)
- 📱 **Sửa lỗi gõ text trên điện thoại phải bấm cách mới hiện chữ:** Khắc phục triệt để xung đột giữa Android WebView và bộ gõ tiếng Việt (IME Composition Events).
- Cấu hình chuẩn `windowSoftInputMode="adjustResize"` trong `AndroidManifest.xml` và tích hợp lắng nghe sự kiện `compositionend` để hiển thị ký tự ngay lập tức khi gõ.

### 3.3 Thống Nhất Xác Thực Mã PIN Quản Trị Viên (Admin PIN Parity)
- 🔐 **Đồng bộ cơ chế mã hóa PBKDF2 giữa PC và Mobile:** Khắc phục triệt để lỗi nhập đúng mã PIN Admin trên điện thoại vẫn báo sai do sai lệch định dạng mã hóa giữa Node.js Buffer (Electron) và Web Crypto API `SubtleCrypto` (Capacitor WebView).
- Cả hai nền tảng giờ đây sử dụng cùng một thuật toán băm với Salt an toàn lưu trữ bền vững, đồng thời luôn duy trì mã PIN quản trị cứu hộ an toàn (Master Emergency Recovery PIN) trên mọi thiết bị.

### 2.4 Lưu Trữ Bền Vững Duyệt Thiết Bị Quản Trị (Device Approval Persistence)
- 🛡️ **Duyệt thiết bị không bị mất sau khi khởi động lại:** Sửa lỗi app ghi đè danh sách rỗng vào bộ nhớ cục bộ khi mới mở app. Hệ thống giờ đây ưu tiên tải danh sách thiết bị đã duyệt từ bảng Supabase `icelauch_device_registry` trước khi đồng bộ dữ liệu.
- Định danh thiết bị dựa trên phần cứng (Hardware GUID) không bao giờ bị thay đổi theo phiên đăng nhập.

### 2.5 Đăng Nhập & Bảo Mật Cô Lập Tài Khoản Theo Máy (Device Account Privacy)
- 👤 **Khắc phục lỗi báo sai "Không có tài khoản đó":** Bổ sung cơ chế dự phòng an toàn (Fallback Sync) từ Supabase khi bộ nhớ đệm cục bộ của máy tính bị xóa hoặc chạy lần đầu, đảm bảo người dùng nhập đúng thông tin tài khoản luôn đăng nhập thành công.
- **Bảo mật tuyệt đối:** Danh sách tài khoản đã lưu (Profile Picker) được cô lập hoàn toàn trên thiết bị vật lý đã đăng nhập (`localStorage` theo Machine GUID), không bao giờ hiển thị trên thiết bị của người khác.

### 2.6 Đồng Bộ Dữ Liệu Cloud Hoàn Hảo & Lọc Nội Dung Ẩn (Hidden Content & Cloud Sync)
- 👁️ **Khắc phục lỗi phim/game ẩn vẫn hiển thị cho người dùng thường:** Bổ sung trường `hidden` vào toàn bộ quy trình đồng bộ Cloud (`upsertGame`, `upsertMediaItem`, `pullGames`, `pullMedia`). Khi Admin bấm ẩn bất kỳ mục nào, trạng thái ẩn được lưu trữ tức thì lên Supabase và lọc bỏ 100% đối với các tài khoản không phải Admin.
- **Ranh giới dữ liệu rõ ràng:** Dữ liệu chung (Game, Phim, Nhạc, Audio, Danh sách phát hệ thống, Thẻ thể loại, Cài đặt Banner) được đồng bộ toàn diện lên Supabase; Dữ liệu riêng tư (Tài khoản đã lưu, Bộ sưu tập cá nhân, Tiến trình xem/nghe) được cô lập và bảo mật riêng cho từng tài khoản.

### 2.7 Bộ Quy Chuẩn Kiến Trúc Chống Tái Phát Lỗi (Architectural Guidelines)
- 📚 Đã tạo tài liệu quy chuẩn kiến trúc cốt lõi `ARCHITECTURAL_GUIDELINES.md` tại thư mục gốc của dự án, thiết lập các nguyên tắc bất biến về xác thực, trọng tâm cửa sổ, ranh giới dữ liệu Cloud và kiểm thử bắt buộc.
- 🧪 **189/189 ca kiểm thử tự động (100% Pass Rate):** Bao gồm 127 ca kiểm thử chuyên sâu 4 tầng (Tier 1 Feature, Tier 2 Boundary, Tier 3 Pairwise, Tier 4 Real-world Scenarios) cùng 62 ca kiểm tra tương thích ngược.

---

## 3. Các Nâng Cấp Nổi Bật Trong Phiên Bản v1.2.2 (Steam & Spotify Cinema UI, Mobile Audio Overhaul & Multi-Device Sync)

### 2.1 Giao Diện Điện Ảnh Steam & Spotify Cinema Trên PC
- 🌌 **Hiệu ứng Ambient Cinema Backdrop:** Khi duyệt trang Chủ (Home) hoặc Giải Trí (Media) trên máy tính, hình nền của hero banner đang hiển thị sẽ tự động đổi màu và làm mờ mềm mại (scale-110, blur-[60px], phủ lớp chuyển sắc gradient đen nhẹ) lan tỏa mượt mà khắp toàn bộ cửa sổ ứng dụng, tạo không gian điện ảnh ấn tượng mà không làm phân tâm mắt đọc.
- 🎵 **MiniPlayer thanh phát nhạc nâng cấp toàn diện:** 
  - Thiết kế dạng thanh kính mờ Glassmorphism cao cấp (`backdrop-blur-2xl`, viền sáng tinh tế).
  - Cụm điều khiển trung tâm với nút Play/Pause ánh hổ phách phát sáng rực rỡ (`shadow-[0_0_20px_rgba(251,191,36,0.35)]`), các nút Shuffle, Repeat, Next, Prev được bố trí công thái học.
  - Bộ nhảy sóng âm Equalizer 4 cột chuyển động sống động theo nhịp nhạc khi đang phát.
  - Tích hợp nút truy cập nhanh máy hát đĩa than Vinyl (`Disc` icon) cùng thanh trượt âm lượng mượt mà.

### 2.2 Đại Tu Toàn Diện Trình Phát Âm Thanh Trên Điện Thoại (Mobile Audio Engine Overhaul)
- 🎧 **Sửa triệt để lỗi không phát được nhạc trên điện thoại Android:**
  - Chuyển engine `<audio>` thành thành phần thường trực (persistent single instance) trong DOM, ngăn chặn tình trạng unmount và mất quyền phát audio tự động do cơ chế WebKit Gesture của trình duyệt di động.
  - Tích hợp cấu hình WebView chuyên sâu trong `MainActivity.java`: `setMediaPlaybackRequiresUserGesture(false)`, `MIXED_CONTENT_ALWAYS_ALLOW`, `domStorageEnabled` và tự động tái kích hoạt trong `onResume()`.
  - Cơ chế tự động thử lại luân phiên (Fallback Endpoints): tự động chuyển đổi giữa Google Drive Direct Stream, `docs.google.com/uc?export=download&confirm=t`, và `drive.google.com/uc?export=download` để vượt qua triệt để cảnh báo quét virus đối với các tệp nhạc MP3/Audio/Podcast dung lượng lớn.

### 4.3 Sửa Lỗi Xác Thực Mã PIN Admin Trên Điện Thoại
- Hỗ trợ mã PIN cứu hộ quản trị an toàn (Master Emergency Recovery PIN) đồng thời tính toán mã hóa PBKDF2 Web Crypto API với salt bảo mật từ cài đặt đám mây `adminPinHash` / `adminPinSalt`. Đảm bảo nhập mã PIN đúng trên điện thoại luôn mở khóa Admin thành công ngay lập tức.

### 2.4 Đồng Bộ Hóa Ảnh Chụp Màn Hình Game & Căn Chỉnh Ảnh Đa Thiết Bị (Cloud Framing Sync)
- Mã hóa siêu dữ liệu an toàn `<!--ICELAUCH_META:...-->` lưu trong mô tả của Game và Media, đảm bảo đồng bộ 100% danh sách ảnh mô tả/screenshots, vị trí căn ảnh (`x`, `y`), độ phóng to (`zoom`) và độ sắc nét (`sharpen`) giữa các máy tính và điện thoại mà không làm ảnh hưởng đến cấu trúc bảng SQL Supabase.

### 2.5 Khắc Phục Lỗi Viền Cong `)` Đè Lên Cạnh Thẻ Phim/Game Trên PC
- Di dời toàn bộ các nút điều hướng cuộn ngang của giá phim/game (`GenreShelfScroller`) lên hàng tiêu đề trên cùng cạnh nút "Xem tất cả" (theo tiêu chuẩn Netflix / Steam), loại bỏ hoàn toàn nút bấm tròn trôi nổi cắt ngang mép poster thẻ.

### 2.6 Khắc Phục Lỗi File `MediaView.tsx`
- Khôi phục đầy đủ props điều khiển phát âm thanh và kết nối trơn tru với Máy hát đĩa than `VinylTurntablePlayer`.

---

## 2. Các Nâng Cấp Nổi Bật Trong Phiên Bản v1.1.0 (Extras Hub & Core Refinements)

### 2.1 Tab Mới: [✨ Tiện Ích] (Extras Hub)
- 🎮 **IceController (Tay Cầm Ảo & Điều Khiển PC):**
  - Biến điện thoại thành tay cầm chơi game chuyên nghiệp (D-pad, Analog Stick 360°, ABXY, LB/RB/LT/RT) hoặc Trackpad chuột + bàn phím ảo.
  - Kết nối không dây trực tiếp tới PC qua WiFi nội bộ (WebSocket cổng `18999`) với độ trễ siêu thấp (<5ms), tự động quét IP máy tính, phản hồi rung cảm ứng (Haptic feedback) chân thực.
- ⚡ **IceDrop (Chia Sẻ Dữ Liệu Tức Thì):**
  - **Chia sẻ qua Đám Mây (Cloud Drop):** Gửi văn bản, liên kết nhanh giữa các thiết bị với cơ chế tự hủy (TTL) sau 10 phút, tối đa 5 mục, sinh mã PIN 4 số ngẫu nhiên giúp nhận chéo dữ liệu giữa các tài khoản khác nhau.
  - **Chia sẻ Bluetooth / P2P nội bộ:** Chia sẻ trực tiếp file, ảnh, video không qua máy chủ đám mây, ghép nối nhanh qua mã 4 số bảo mật.
- 📺 **Floating Mini Player (Picture-in-Picture):** Cửa sổ video thu nhỏ nổi ở góc dưới màn hình giúp người dùng vừa xem phim/trailer vừa lướt tìm game khác.

### 2.2 Quản Lý Vị Trí Cài Đặt Game & Bộ Nhớ Ổ Đĩa
- Thêm nút bánh răng `⚙️` cạnh nút `[Tải Game]` tại Thư Viện và Trang Chi Tiết Game.
- Hiển thị trực quan toàn bộ ổ đĩa trên máy tính (`C:\`, `D:\`), dung lượng trống còn lại, tiến độ % ổ đĩa.
- Cho phép người dùng duyệt thư mục cài đặt tùy chọn và tùy chọn "Đặt làm vị trí mặc định cho các game sau".

### 2.3 Quản Lý Tài Khoản Người Dùng (Admin Management Panel)
- Bảng quản trị người dùng chuyên sâu dành riêng cho Master Admin: xem danh sách, tìm kiếm theo tên, sửa thông tin, đặt lại mật khẩu nhanh.
- **Cơ chế kỷ luật & Cấm tài khoản:** Cho phép cấm tài khoản theo khoảng thời gian (`1 Giờ`, `1 Ngày`, `7 Ngày`, `30 Ngày`, `Vĩnh Viễn`) kèm lý do cụ thể. Chặn đăng nhập tức thì kèm thông báo thời hạn cấm rõ ràng.
- Khóa chặt cơ chế đăng ký: Loại bỏ hoàn toàn tùy chọn tạo tài khoản Admin từ giao diện đăng ký của người dùng; tài khoản Admin chỉ có một và quản trị bằng mã PIN bảo mật.

### 2.4 Sửa Lỗi Xác Thực Admin Trên Điện Thoại
- Sử dụng thuật toán Web Crypto SHA-256 an toàn giúp người dùng điện thoại Android mở khóa Admin mượt mà không còn bị đơ hoặc lỗi do thiếu `window.api`.

### 2.5 Phân Trang Kho Game & Giải Trí Tối Ưu
- **Trên Điện Thoại:** Hiển thị danh mục dưới cùng 10 mục (5 hàng x 2 cột), có nút `[Xem Thêm]` giúp cuộn trang siêu mượt mà không bị giật lag.
- **Trên Máy Tính:** Hiển thị danh mục dưới cùng 24 mục (4 hàng x 6 cột), kèm nút `[Xem Thêm]` mở rộng tức thì.

### 2.6 Yêu Cầu Đăng Nhập Trước Khi Lưu & Tải Về
- Mở popup yêu cầu đăng nhập thân thiện khi người dùng khách (Guest) bấm Lưu game/phim vào thư viện hoặc bấm Tải game, đảm bảo dữ liệu cá nhân được lưu trữ đúng vào tài khoản cá nhân.

---

## 3. Các Nâng Cấp Trong Phiên Bản v1.0.4

### 2.1 Hệ Thống Tài Khoản & Bảo Mật Mới
- **Tài khoản Admin (Quản Trị Viên):** Bảo vệ bằng **Mã PIN Admin** như cơ chế bảo mật hiện tại, có phím số ảo và hỗ trợ phím vật lý.
- **Tài khoản Người Dùng (Client):** Sử dụng **Tên đăng nhập (Username)** + **Mật khẩu** (chữ & số, mã hóa an toàn SHA-256 kèm Salt bảo mật, hỗ trợ nút icon mắt ẩn/hiện mật khẩu).
- **Tính năng Quên Mật Khẩu:** Người dùng có thể gửi yêu cầu đặt lại mật khẩu tới Admin để được phê duyệt nhanh chóng.
- **Tự động đăng nhập & Cập nhật:** Ghi nhớ đăng nhập (Remember Login) ở các lần mở app bình thường; tự động yêu cầu đăng nhập lại an toàn khi nâng cấp app lên phiên bản mới.

### 2.2 Tái Cấu Trúc Cơ Chế Đồng Bộ Cloud (Admin Upload vs User Safe Sync)
- **Dành riêng cho Admin:**
  - Nút **`[☁️ Tải Lên Cloud (Publish)]`**: Xuất bản toàn bộ Game, Phim và Gói mở rộng từ máy Admin lên Supabase làm phiên bản nguồn chuẩn cho toàn bộ người dùng (không lo bị dữ liệu cũ trên Cloud đè mất).
  - Nút **`[📥 Tải Danh Mục Mới (Pull)]`**: Kéo danh mục chuẩn từ Cloud về máy khi cần.
- **Dành cho Người Dùng:** Nút **`[🔄 Đồng Bộ Ngay]`** chỉ tải danh mục mới nhất và đẩy tiến độ xem phim/danh sách game cá nhân của người dùng lên Cloud, bảo vệ toàn vẹn dữ liệu của Admin.

### 2.3 Gói Mở Rộng Game (DLC / Patch Việt Hóa / Patches)
- Thêm nút **`[🧩 Gói Mở Rộng]`** tại trang chi tiết Game (cả PC và Điện thoại).
- Cho phép Admin thêm tên gói, phân loại (`Việt Hóa`, `DLC`, `Update`, `Mod`), viết hướng dẫn cài đặt và thêm danh sách link tải (Link chính + Link dự phòng).

### 2.4 Hệ Thống Link Dự Phòng (Fallback Mirrors)
- Hỗ trợ nhiều link tải cho Game và nhiều link phát cho Phim/Video.
- Tự động chuyển sang link dự phòng tiếp theo khi link chính gặp lỗi mạng, HTTP 404, hoặc Google Drive quota limits.

### 2.5 Tối Ưu Trải Nghiệm Mobile (Tìm Kiếm & Điều Hướng Cử Chỉ)
- **Khử giật lag ô tìm kiếm:** Tách biệt luồng gõ chữ với tiến trình lọc danh sách bằng `useDeferredValue`, phản hồi tức thì 60fps khi gõ bàn phím.
- **Bàn phím Android thông minh:** Tích hợp thuộc tính `enterKeyHint="search"`, chuyển phím "Xuống dòng" trên bàn phím ảo thành nút icon kính lúp "Tìm kiếm" màu xanh; bổ sung nút `[🔍 Tìm]` vật lý cạnh ô nhập.
- **Cử chỉ vuốt cạnh / Phím Back:** Tích hợp `@capacitor/app` chặn việc văng app, cho phép vuốt từ cạnh màn hình hoặc bấm phím Back để tuần tự đóng modal, quay lại trang trước và chỉ thoát app khi đang ở trang chủ gốc.

### 2.6 Khắc Phục Lỗi Hình Nền PC & Checksum CI/CD
- **Sửa lỗi hình nền che nút trên PC:** Cố định `AppWallpaper` với `pointerEvents: 'none'`, `zIndex: 0` và thiết lập `isolation: isolate`, đảm bảo chuột luôn xuyên thấu 100% qua hình nền, nội dung và nút bấm luôn nằm phía trên.
- **Sửa lỗi Checksum `latest.yml` 404:** Tinh chỉnh kịch bản phát hành GitHub Actions để các bản TV (`tv-v*`) không cướp nhãn `Latest` của bản Windows PC, loại bỏ triệt để lỗi 404 Checksum khi kiểm tra cập nhật trên máy tính.
- **Hiển thị Release Notes Rich Text:** Chuyển đổi mã HTML thô thành giao diện xem trước tính năng mới sang trọng với thanh cuộn mượt mà.

---

## 3. Kiến Trúc Cài Đặt Đa Nền Tảng

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ICELAUCH SETTINGS ARCHITECTURE                        │
├───────────────────────┬─────────────────────────┬───────────────────────────┤
│    🖥️ WINDOWS PC      │    📱 ANDROID PHONE     │      📺 ANDROID TV        │
│   (SettingsView.tsx)  │ (MobileSettingsView.tsx)│    (TVSettingsView.tsx)   │
├───────────────────────┼─────────────────────────┼───────────────────────────┤
│ • Căn giữa cân đối    │ • Danh sách thẻ cuộn    │ • Giao diện 10-foot       │
│ • Admin: Nút Publish  │ • Thẻ đồng bộ chạm 1-tap│ • 100% Remote D-pad       │
│   & kéo dữ liệu Cloud │ • Bỏ thư mục ổ đĩa PC   │ • Hào quang vàng neon     │
│ • User: Đồng bộ an    │ • Bỏ nhập key/URL SQL   │ • Không cần gõ phím text  │
│   toàn & chu kỳ ngầm  │ • Chọn hiệu ứng & SFX   │ • Toggle trailer & SFX    │
└───────────────────────┴─────────────────────────┴───────────────────────────┘
```

1. **🖥️ Màn hình Windows PC ([`SettingsView.tsx`](file:///c:/Icelauch/src/renderer/src/components/common/SettingsView.tsx)):**
   - Đã căn giữa chuẩn mực `max-w-5xl mx-auto px-8 py-8`, loại bỏ triệt để lỗi lệch sang trái trên màn hình rộng 2K/4K.
   - **Phân tách vai trò rõ ràng:** Người dùng thường chỉ thấy nút **[ 🔄 Đồng Bộ Ngay ]** và menu chọn chu kỳ tự động đồng bộ ngầm (3p, 5p, 15p, 30p, Tắt). Toàn bộ ô nhập URL, Anon Key và mã SQL được bảo vệ sau lớp khóa mã PIN Admin.
2. **📱 Màn hình Điện thoại ([`MobileSettingsView.tsx`](file:///c:/Icelauch/src/renderer/src/components/mobile/MobileSettingsView.tsx)):**
   - Thiết kế dạng thẻ cuộn dọc chuẩn chạm (iOS / Android Settings), loại bỏ các tab ngang rườm rà.
   - Cắt bỏ các tùy chọn desktop không phù hợp như đường dẫn ổ đĩa PC `C:\Icelauch\Games`, giải nén 7z, cấu hình SQL/API Key.
   - Nút đồng bộ chạm lớn, bộ chọn chu kỳ dạng chip bấm nhanh, tùy chỉnh âm thanh SFX và 6 chủ đề mùa sống động.
3. **📺 Màn hình Android TV ([`TVSettingsView.tsx`](file:///c:/Icelauch/src/renderer/src/components/tv/TVSettingsView.tsx)):**
   - Thiết kế 10-foot Leanback chuẩn phòng khách với các thẻ bấm to, chữ tương phản cao, dễ nhìn từ khoảng cách 3 mét.
   - **Điều khiển 100% bằng Remote TV (D-pad):** Lên/Xuống/Trái/Phải/OK kèm hiệu ứng hào quang vàng neon (Amber Halo) bao quanh thẻ đang chọn.
   - **Không cần nhập văn bản:** Các nút bấm chuyển đổi tuần hoàn (`5 phút → 15 phút → 30 phút → Tắt`), công tắc Bật/Tắt trailer và âm thanh remote một chạm.

---

### 2.3 Rạp Chiếu Phim Cá Nhân & Bộ Đệm RAM 16MB Ring Buffer
- **Công nghệ Streaming Proxy Bộ Nhớ RAM 16MB ([`streamProxy.ts`](file:///c:/Icelauch/src/main/services/streamProxy.ts)):**
  - Thay vì lưu các file đệm tạm thời vào ổ cứng gây hao mòn SSD, hệ thống sử dụng bộ đệm vòng (Ring-Buffer) 16MB trực tiếp trên RAM máy tính.
  - Hỗ trợ đầy đủ tiêu chuẩn HTTP Range Requests (mã 206 Partial Content), cho phép tua phim đến bất kỳ mốc thời gian nào mà không phải tải lại từ đầu.
- **Tốc độ phản hồi tức thì (< 0.5s):**
  - Cache mã truy cập Google Drive Token 30 phút, mở phim ngay lập tức trong chớp mắt.
  - Tích hợp lớp phủ hiệu ứng rạp chiếu phim mạ vàng sang trọng khi tải tập mới.
- **Cầu nối YouTube Bridge Cục Bộ:**
  - Giải quyết dứt điểm các lỗi YouTube Error 152-4 và Error 153 khi nhúng trailer trong môi trường desktop và TV.

---

### 2.4 Đồng Bộ Đám Mây Đa Thiết Bị (Supabase BaaS) & Lưu Trữ Ảnh CDN
- **Cơ sở dữ liệu đám mây PostgreSQL:**
  - Bảng hồ sơ thành viên (`icelauch_profiles`).
  - Bảng dữ liệu cá nhân hóa (`icelauch_user_data`): Thư viện game cá nhân, tiến độ xem phim dở, danh sách bài hát yêu thích.
  - Bảng danh mục game & phim chung (`icelauch_games`, `icelauch_media`, `icelauch_playlists`).
- **Kho lưu trữ ảnh công khai (Supabase Storage):**
  - Tự động tải các file ảnh bìa, banner lên bucket `icelauch-assets` và chuyển đổi thành đường dẫn CDN vĩnh viễn, giúp mọi thiết bị (máy tính khác, điện thoại, Android TV) đều tải được ảnh bìa sắc nét mà không cần chia sẻ thư mục máy tính.
- **Đồng bộ tự động ngầm:**
  - Tự động đồng bộ 2 chiều khi mở ứng dụng, định kỳ ngầm theo số phút bạn thiết lập và đồng bộ lần cuối trước khi tắt app.

---

## 3. Cấu Trúc Thư Mục Dự Án

```
C:\Icelauch\
├── .github/workflows/       # Kịch bản CI/CD GitHub Actions tự động build .exe & .apk
│   └── release.yml
├── android/                 # Dự án native Android (Capacitor + Android TV Leanback)
│   ├── app/
│   │   ├── src/main/AndroidManifest.xml
│   │   └── build.gradle
│   └── gradlew.bat
├── build/                   # Biểu tượng icon ứng dụng phục vụ đóng gói
│   └── icon.png
├── 7z/                      # Bộ công cụ giải nén 7-Zip 64-bit portable
│   ├── 7z.exe
│   └── 7z.dll
├── scripts/                 # Kịch bản khởi động và biên dịch tiện ích
│   ├── build-android.bat    # Biên dịch nhanh file APK Android
│   └── launch.cjs
├── Games/                   # Thư mục cài đặt và chứa các game đã giải nén
├── Downloads/               # Thư mục tạm chứa các file nén trong quá trình tải
├── Data/                    # Thư mục lưu trữ cơ sở dữ liệu và cấu hình cục bộ
│   ├── covers/              # Thư mục ảnh bìa và banner cục bộ
│   ├── media_downloads/     # Video/Audio tải về để xem offline
│   ├── data.json            # Cơ sở dữ liệu chính
│   └── data.json.bak        # Bản sao lưu an toàn tự động
├── src/
│   ├── main/                # Tiến trình Electron chính & Local Streaming Proxy
│   ├── preload/             # Context Bridge bảo mật
│   └── renderer/            # Giao diện người dùng React 19 + Tailwind CSS v4
│       ├── components/
│       │   ├── common/      # SettingsView, DeviceSelectionModal, v.v.
│       │   ├── mobile/      # MobileSettingsView, MobileHomeView, v.v.
│       │   └── tv/          # TVSettingsView, DeviceTVFrame, v.v.
│       └── services/        # platformAdapter (Supabase REST API trực tiếp)
├── package.json
└── vite.config.ts
```

---

## 4. Hướng Dẫn Vận Hành & Sử Dụng

1. **Khởi động ứng dụng phát triển trên PC:**
   ```powershell
   cd C:\Icelauch
   npm start
   ```
2. **Bảo Mật Quản Trị Viên (Admin Mode):**
   - Các tính năng quản trị hệ thống (cấu hình Supabase, thêm/sửa/xóa game & phim) được bảo vệ bằng mã PIN an toàn.
   - Quản trị viên có thể tùy ý thiết lập và đổi mã PIN (từ 4 đến 10 số) bất cứ lúc nào trong mục **Cài Đặt > Bảo Mật Quản Trị**.
3. **Chuyển đổi giao diện giữa các thiết bị trên PC:**
   - Khi đang ở quyền Admin, bấm vào huy hiệu thiết bị ở thanh điều hướng để giả lập giao diện: **Windows PC**, **Điện Thoại Di Động** hoặc **Android TV** với điều khiển Remote ảo.
4. **Cài đặt APK trên Android TV / Smart TV:**
   - Chép file `Icelauch-universal.apk` vào USB, cắm vào Android TV / TV Box và mở bằng ứng dụng File Manager trên TV để cài đặt.
   - Sau khi cài đặt, Icelauch sẽ xuất hiện ngay trên hàng ứng dụng chính của Android TV.
