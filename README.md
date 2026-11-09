# Icelauch - Trình Quản Lý Game & Rạp Giải Trí Đa Nền Tảng (Windows, Mobile & Android TV)

**Phiên bản:** 2.0.0 Multi-Platform Edition  
**Hệ điều hành hỗ trợ:** 
- 🖥️ **Windows 10 / 11 (64-bit)** (Bản Cài Đặt NSIS Setup & Bản Di Động Portable)
- 📱 **Android Smartphone & Tablet** (File cài đặt `.apk` cảm ứng chạm)
- 📺 **Android TV / Smart TV / TV Box** (File cài đặt `.apk` chuẩn 10-Foot Leanback, hỗ trợ 100% Remote TV)  
**Công nghệ nền tảng:** Electron 40 + Capacitor 8 + React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase BaaS Cloud + 7-Zip Engine

---

## 1. Hướng Dẫn Lấy File Cài Đặt & Trải Nghiệm Thực Tế

### Cách 1: Tải file đóng gói sẵn từ GitHub Releases (Khuyên dùng)
Bạn chỉ cần truy cập trang GitHub Releases của dự án để tải file cài đặt:
👉 **[Tải Bản Cài Đặt Icelauch Mới Nhất Trên GitHub Releases](https://github.com/NguyenDacTung/Icelauch/releases)**

Tại trang Releases, bạn sẽ có các file cài đặt tương ứng với thiết bị của mình:
- **`Icelauch-Setup-*.exe` (Dành cho Windows PC):** Bộ cài đặt thông minh, tự động tạo biểu tượng trên Màn hình chính (Desktop) và Start Menu, hỗ trợ tùy chọn thư mục cài đặt.
- **`Icelauch-*.exe` (Bản Portable cho Windows):** 1 file duy nhất chạy ngay không cần cài đặt, có thể chép vào USB hoặc ổ cứng di động mang sang máy tính khác cắm là chạy.
- **`Icelauch-universal.apk` (Dành cho Điện thoại Android & Android TV):** 1 file APK duy nhất tương thích phổ quát:
  - Cài trên điện thoại: Tự động kích hoạt giao diện cảm ứng chạm 1 tay.
  - Cài trên Android TV / Smart TV Box (Sony, Xiaomi, TCL, Casper...): Tự động hiển thị trên màn hình chính TV (Leanback Launcher) và kích hoạt giao diện điều khiển 100% bằng phím Remote.

---

### Cách 2: Tự biên dịch (Build) file cài đặt cục bộ trên máy tính cá nhân

#### 🖥️ Biên dịch gói Windows (.exe):
Mở PowerShell tại thư mục `C:\Icelauch` và chạy:
```powershell
npm run dist:win
```
File cài đặt hoàn thiện sẽ được xuất tại thư mục: `C:\Icelauch\release\`

#### 📱 / 📺 Biên dịch gói Android APK (.apk):
Nhấp đúp chuột vào file:
```
C:\Icelauch\scripts\build-android.bat
```
Hoặc chạy lệnh từ terminal:
```powershell
npx cap build android
```
File APK xuất xưởng sẽ nằm tại: `android\app\build\outputs\apk\debug\app-debug.apk`

---

## 2. Các Nâng Cấp Nổi Bật Mới Nhất (v2.0.0)

### 2.1 Hệ Thống Đóng Gói Đa Nền Tảng & Tự Động Hóa CI/CD GitHub Actions
- **Kịch bản CI/CD đám mây (`.github/workflows/release.yml`):**
  - Mỗi khi bạn tạo một bản phát hành (Release) hoặc đẩy Git tag (ví dụ: `v2.0.0`), máy chủ GitHub Runners sẽ tự động biên dịch đồng thời file `.exe` cho Windows và file `.apk` cho Android.
  - Tự động đóng gói và đính kèm vào phần Tải về mà không yêu cầu máy tính cá nhân phải cài đặt Android Studio nặng nề.
- **Hộp thoại chọn thiết bị lần đầu trên Android (`DeviceSelectionModal`):**
  - Khi mở app lần đầu trên Android, ứng dụng xuất hiện màn hình trực quan hỏi bạn đang sử dụng **Điện Thoại Di Động** hay **Android TV / Smart TV** để kích hoạt chế độ phù hợp nhất.
  - Lựa chọn được ghi nhớ tự động và có thể đổi lại bất cứ khi nào trong Cài Đặt.
- **Bộ chuyển đổi nền tảng không dây (`platformAdapter`):**
  - Trên Windows: Ứng dụng chạy trên nền tảng Electron với toàn quyền truy cập file hệ thống, 7z CLI và tiến trình nền.
  - Trên Android / Web: Ứng dụng tự động kết nối trực tiếp với Supabase Cloud REST API và bộ đệm `localStorage` để xem phim, duyệt game và đồng bộ tiến độ mượt mà.

---

### 2.2 Thiết Kế Lại Giao Diện Cài Đặt Tối Ưu Riêng Cho Cả 3 Thiết Bị

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ICELAUCH SETTINGS ARCHITECTURE                        │
├───────────────────────┬─────────────────────────┬───────────────────────────┤
│    🖥️ WINDOWS PC      │    📱 ANDROID PHONE     │      📺 ANDROID TV        │
│   (SettingsView.tsx)  │ (MobileSettingsView.tsx)│    (TVSettingsView.tsx)   │
├───────────────────────┼─────────────────────────┼───────────────────────────┤
│ • Căn giữa cân đối    │ • Danh sách thẻ cuộn    │ • Giao diện 10-foot       │
│ • User: Chỉ xem sync  │ • Thẻ đồng bộ chạm 1-tap│ • 100% Remote D-pad       │
│   & đổi chu kỳ ngầm   │ • Bỏ thư mục ổ đĩa PC   │ • Hào quang vàng neon     │
│ • Admin: Mở khóa mới  │ • Bỏ nhập key/URL SQL   │ • Không cần gõ phím text  │
│   hiện URL/Key/SQL    │ • Chọn hiệu ứng & SFX   │ • Toggle trailer & SFX    │
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
