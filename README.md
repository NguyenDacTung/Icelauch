# Icelauch - Trình Quản Lý Game & Rạp Giải Trí Đa Nền Tảng (Windows, Mobile & Android TV)

**Phiên bản phát hành:** 
- 🖥️ **Windows PC:** `v1.1.1`
- 📱 **Android Điện Thoại:** `v1.1.1`
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
