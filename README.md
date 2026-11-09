# Icelauch - Trình Quản Lý Game & Giải Trí Cá Nhân Đa Năng

**Phiên bản:** 1.5.0  
**Hệ điều hành:** Windows 10 / 11 (64-bit)  
**Công nghệ nền tảng:** Electron + React 19 + TypeScript + Vite + Tailwind CSS v4 + 7-Zip Portable (100% Cục bộ & Di động)

---

## 1. Tổng Quan Ứng Dụng

**Icelauch** là ứng dụng desktop quản lý thư viện trò chơi và trung tâm giải trí đa phương tiện chuẩn phong cách Steam & Netflix Dark Aesthetic:

- **Giao Diện Không Viền Hiện Đại (Seamless Frameless Dark Titlebar & Controls):**
  - Loại bỏ hoàn toàn thanh trắng hệ thống và menu bar (`File Edit View Window`) mặc định của Windows, tích hợp giao diện dark theme `#0F1115` nguyên khối liền mạch phong cách Steam / Discord.
  - Bổ sung cụm nút điều khiển cửa sổ trực tiếp trên Navbar: **Thu nhỏ (`-`)**, **Phóng to / Khôi phục kích thước (`□` / `❐`)**, **Đóng ứng dụng (`✕` hover đỏ)**.
  - Thanh Navbar hỗ trợ giữ chuột kéo rê cửa sổ mượt mà (`drag region`) và nhấp đúp chuột để phóng to/khôi phục toàn màn hình.
- **Hệ Thống Banner Chuẩn 16:9 Nâng Cấp Kích Thước & Căn Chỉnh Độ Mờ Viền (v1.5.0):**
  - **Khóa Cứng Tỉ Lệ 16:9 (`aspect-video`) & Giới Hạn Chiều Rộng Tối Đa:** Banner game và rạp giải trí được mở rộng chiều cao lên `440px` (`md:h-[440px]`), giúp ảnh banner 16:9 bên trái to và rõ nét vượt bậc (rộng ~782px), đồng thời giới hạn chiều ngang thẻ `max-w-[1360px] mx-auto` để không bị bè ngang toàn màn hình trên các màn hình ultrawide.
  - **Khắc Phục Lỗi Che Nút:** Cột tóm tắt bên phải được phân bổ chiều cao thoáng đãng; thanh tác vụ dưới cùng (nút Tải game / Chơi ngay / Xem phim, cụm chuyển số trang `< 1 / 5 >`) được cố định `shrink-0 min-h-[44px]` đảm bảo **100% không bao giờ bị cắt viền hay che nút**.
  - **Tuỳ Chỉnh Độ Mờ Đen 2 Bên Viền (Edge Fade: 0% - 100%):** Mặc định loại bỏ lớp sương mờ đen 2 bên (về 0%) giúp các nhân vật bên trái và phải ảnh banner luôn sáng rõ, nguyên bản; bổ sung thanh trượt điều chỉnh độ mờ đen 2 bên trong bộ căn chỉnh Admin.
  - **Bộ Làm Nét Ảnh Chuyên Sâu (Image Sharpening Studio):** Tích hợp bộ lọc ma trận chập (Unsharp Mask Convolution Matrix Filter) kết hợp render tăng cường độ tương phản cạnh sắc phần cứng; bổ sung thanh trượt **✨ Độ sắc nét (Sharpen: 0 - 100%)** trong bộ căn chỉnh ảnh để Admin chủ động cứu nét những ảnh bìa / banner bị mờ hoặc vỡ hạt.
  - **Trung Tâm Quản Lý Banner Nổi Bật (Admin Banner Manager):** Quản trị tập trung 4 phân hệ (`Game Trang Chủ`, `Phim & Video`, `Âm Nhạc`, `Audio & Podcast`):
    - Cài đặt số lượng slot banner tối đa (3 - 10 slot).
    - Tự động thêm mục mới vào banner với thời hạn chạy mặc định (ví dụ: 7 ngày, kèm tag nổi bật `MỚI & NỔI BẬT (còn X ngày)`).
    - Quy tắc loại FIFO (Cũ nhất ra trước) khi số lượng vượt mức tối đa, tự động bảo vệ các mục được Admin ghim *Vĩnh viễn*.
    - Cơ chế tự động bù slot trống linh hoạt: Ưu tiên lượt xem/giờ chơi cao nhất hoặc ngẫu nhiên.
    - Nút ghim nhanh trực tiếp trong form tạo/sửa Game và Phim/Nhạc.
- **Hệ Thống Đóng Gói Phân Phối v1.0.0 & Cập Nhật Tự Động Trong App (In-App OTA Auto-Update):**
  - Cấu hình phát hành trực tiếp qua kho GitHub Releases: `https://github.com/NguyenDacTung/Icelauch`.
  - Hỗ trợ đóng gói song song cả 2 phiên bản Windows:
    - **Bản Cài Đặt NSIS (`Icelauch-Setup-1.0.0.exe`):** Tự động tạo Shortcut Desktop & Start Menu, cho phép tuỳ chọn thư mục cài đặt và tích hợp trình gỡ sạch sẽ.
    - **Bản Di Động Portable (`Icelauch-Portable-1.0.0.exe`):** 1 file duy nhất chạy ngay từ USB không cần cài đặt.
  - **Cơ Chế Tự Động Cập Nhật Trong App (In-App OTA):**
    - **Thanh Thông Báo Nổi (UpdateToast):** Xuất hiện nhẹ nhàng ở góc dưới khi phát hiện bản mới, tải ngầm dưới nền kèm thanh tiến trình %, có nút *Khởi động lại ngay* khi tải xong.
    - **Tab "Phiên Bản & Cập Nhật" Chuyên Biệt (Trong Cài Đặt):** Hiển thị số phiên bản hiện tại, nút *Kiểm Tra Bản Mới*, xem chi tiết Changelog ghi chú bản nâng cấp, nút tải ngầm và nút khởi động lại một chạm.
    - **Bảo Toàn Dữ Liệu Tuyệt Đối (Zero Data Loss):** Toàn bộ kho game trong thư mục `Games/` và dữ liệu người dùng trong thư mục `Data/` (danh mục game, video, playlist, cài đặt, mã PIN) luôn được giữ nguyên vẹn 100% khi ứng dụng cập nhật bản mới.
- **Tuỳ Chọn Thư Mục Lưu Game Mặc Định Đa Ổ Đĩa (C:, D:, E:...):**
  - Người dùng có thể chọn ổ đĩa lưu game mặc định bất kỳ (`C:`, `D:`, `E:...`) ngay từ Bước 2 khi cài đặt app lần đầu hoặc bất kỳ lúc nào trong mục Cài Đặt.
  - Đo lường và hiển thị trực quan dung lượng trống (GB còn lại) của ổ đĩa được chọn.
  - Dù các tựa game nằm rải rác trên nhiều ổ đĩa khác nhau, ứng dụng vẫn tự động nhận diện, khởi chạy game và quản lý thư viện đồng nhất 100%.
- **Khắc Phục Triệt Để Lỗi YouTube Error 152-4:**
  - Chuẩn hoá toàn diện Referer & Origin `https://www.youtube.com/`, User-Agent chuẩn desktop, cờ `referrerPolicy="strict-origin-when-cross-origin"`, cùng cờ `origin=https://www.youtube.com` trên URL nhúng, giải quyết dứt điểm lỗi nhúng trailer của YouTube trong môi trường desktop Electron.
- **Bàn Phím PIN Admin 10 Số & 10 Chấm Trạng Thái:**
  - Cho phép mã PIN từ 4 đến 10 số, hiển thị trực quan 10 chấm tròn đổi màu vàng khi nhập, áp dụng cho cả màn hình xác thực Admin và màn hình khởi tạo ban đầu.
- **Trung Tâm Trò Chơi (Game Hub):**
  - Tải game nhiều part từ Google Drive (hỗ trợ HTTP Range Resume), tự động giải nén bằng 7-Zip, tự quét và chấm điểm file `.exe` chạy game tối ưu nhất, khởi chạy game một chạm kèm tuỳ chọn quyền Administrator (UAC).
  - **Quản Trị Lưu Trữ Đa Ổ Đĩa (Multi-Drive Storage Manager):** Người dùng có thể chọn ổ đĩa lưu game mặc định bất kỳ (`C:`, `D:`, `E:...`) và kiểm tra dung lượng trống của từng ổ đĩa; tuỳ chọn hỏi vị trí lưu cho từng game giúp tránh tràn ổ cứng.
  - **Trang Chi Tiết Game Chuẩn Steam:** Trailer YouTube tự phát êm dịu (đã fix lỗi 152-4), dải ảnh chụp màn hình (*Screenshots filmstrip*), Lightbox phóng to và thanh tiến trình thời gian thực.
  - **Mục "Yêu Cầu & Hướng Dẫn Chơi" (Game Requirements & Quick Actions):** Hiển thị văn bản hướng dẫn chi tiết của Admin (lưu ý trước khi chơi, cách co-op, cách kích hoạt) và dàn nút liên kết 1-chạm (Mở Steam, Kênh Voice Discord, Tải mod, v.v.).
  - **Thư Viện Nút Liên Kết & Tích Hợp (Game Integrations):** Admin dễ dàng tạo, sửa, xoá các nút lối tắt mở app (.exe hoặc protocol `steam://`, `discord://`) hoặc link web; có tuỳ chọn đặt làm mặc định cho mọi game mới.
  - **Vòng Quay "Hôm Nay Chơi Gì? / Surprise Me":** Nút xúc xắc ma thuật mở vòng quay may mắn chọn game ngẫu nhiên với âm thanh quay số vui nhộn và hiệu ứng trúng thưởng.
  - **Hàng "Vừa Chơi Gần Đây" (Quick Resume):** Truy cập tức thì các tựa game vừa chơi kèm ngày chơi và nút phát 1 chạm.
  - **Lọc Theo Tâm Trạng (Mood Tags):** Co-op cùng bạn bè, Thư giãn xả stress, Chiến đấu bùng nổ, Cốt truyện đỉnh cao.
  - **Hồ Sơ Gamer & Cấp Bậc:** Hiển thị cấp độ người chơi (*Tân Binh Băng Giá*, *Cú Đêm Điện Ảnh*...) cùng thống kê số lượng game đã cài.
  - **Bảo Mật Admin Đầy Đủ:** Bàn phím số PIN hỗ trợ 4 đến 10 chữ số với 10 chấm trạng thái trực quan và mã khôi phục Recovery Key dự phòng.

- **Studio Giao Diện Theo Mùa & Hiệu Năng Vượt Trội (Theme Studio & Performance Boost):**
  - **Studio Hiệu Ứng Theo Mùa (Seasonal Particle Studio):** Hỗ trợ 5 chủ đề sống động: ❄️ *Mùa Đông* (Tuyết rơi nhẹ), 🍂 *Mùa Thu* (Lá phong vàng chao nghiêng), 🌸 *Mùa Xuân* (Cánh hoa anh đào phấp phới), 💡 *Mùa Hè* (Đom đóm phát sáng lung linh), 🌌 *Cyber Stardust* (Bụi sao neon lơ lửng), hoặc *Tắt hạt*. Đi kèm 3 thanh trượt điều chỉnh chuyên sâu: Tốc độ rơi (0.2x - 3.0x), Mật độ hạt (15 - 80), Độ mờ (10% - 100%).
  - **Hình Nền Ứng Dụng Tùy Chỉnh (Custom App Wallpaper):** Cho phép Admin chọn ảnh nền tuỳ ý từ máy tính hoặc link web; điều chỉnh tâm điểm hiển thị (Focal position), thu phóng Zoom (1.0x - 3.0x), độ làm mờ Blur (0 - 20px), lớp phủ tối Darkness (0% - 90%) và tuỳ chọn hiển thị đồng thời cùng hiệu ứng hạt.
  - **Chế Độ Máy Yếu / Tiết Kiệm Tài Nguyên (Low-Spec Mode):** 1 công tắc thông minh tắt toàn bộ hiệu ứng Canvas và bộ lọc mờ nặng, giúp launcher đạt 60 FPS mượt mà tuyệt đối trên mọi máy tính cấu hình yếu hoặc laptop tiết kiệm pin.
  - **Tối Ưu Hoá Bị Động:** Canvas tự động tạm dừng vòng lặp `requestAnimationFrame` khi cửa sổ Electron bị ẩn hoặc thu nhỏ xuống Taskbar, phần tử đồ hoạ tăng tốc phần cứng GPU (`translateZ(0)`).

- **Rạp Phim & Giải Trí Đa Tầng (Media Hub v1.4.0):**
  - **Thanh 3 Tab Co Giãn Động (Dynamic Expanding Pill Tabs):** `[🎬 Phim & Video]`, `[🎵 Âm Nhạc]`, `[🎙️ Audio & Podcast]`. Tab đang chọn sẽ mở rộng hiển thị đầy đủ icon + tên + số lượng item; 2 tab còn lại tự động thu gọn chỉ hiển thị icon giúp giao diện thanh thoát, hiện đại.
  - **Hàng Video Theo Thể Loại Cuộn Ngang (Genre Shelves):** Khi duyệt tab Phim & Video, các hàng cuộn ngang theo từng thể loại (*Hoạt hình*, *Phim Chiếu Rạp*, *Phim Lẻ*...) được phân chia rõ nét tương tự giao diện Netflix.
  - **Ô Sổ Chọn Phương Thức Phát (Dropdown Selector):** Đặt trực quan ngay bên dưới khung phát video, cho phép chuyển đổi tức thì giữa: *Bản Offline (Đã tải về máy)*, *Google Drive Stream*, *HTML5 Local Proxy (Chống lỗi tải)*, *YouTube HD Player*, *Facebook Video Player*.
  - **Hệ Thống Danh Sách Phát (Playlists / Series / Albums):** Admin tạo và quản lý danh sách phát, thêm/bớt và sắp xếp thứ tự tập, phát liên tục tự chuyển tập (Auto-Next).
  - **Tải Về Máy (Offline Downloads):** Tải video hoặc bài hát về máy lưu tại thư mục `Data/media_downloads/` để xem offline không cần mạng, có nút quản lý/xoá file tải về.
  - **Hỗ Trợ Video Facebook & Xử Lý Tỉ Lệ:** Nhận diện video Facebook và Facebook Reel. Mặc định khung 16:9 Cinema, kèm nút chuyển nhanh sang 9:16 Reel Dọc với hiệu ứng nền mờ hào quang (Ambient Glow).
  - **Trình Phát Đĩa Than Vinyl (`VinylTurntablePlayer`):** Trải nghiệm đĩa than cổ điển xoay tròn khi phát nhạc, cần kim (tonearm needle) hạ xuống đĩa khi Play và nâng lên khi Pause.
  - **Widget Đĩa Than Nổi Mini Góc Phải (Background Playback):** Khi duyệt game hoặc thư viện, đĩa than mini (52x52px) xoay tròn ở góc dưới bên phải, rê chuột vào bung ra hộp điều khiển phát nhạc nổi.

- **Cài Đặt Phân Loại 4 Nhóm Chuyên Biệt:**
  1. *Giao Diện & Trải Nghiệm:* Studio hiệu ứng theo mùa, Bộ chỉnh hình nền App, Chế độ máy yếu, Âm thanh UI SFX, Danh hiệu Gamer.
  2. *Nút Liên Kết & Tích Hợp:* Quản trị danh mục nút mở App ngoài và mở Link web.
  3. *Lưu Trữ & Thư Mục:* Đường dẫn thư mục di động và nút mở trực tiếp trong Windows Explorer.
  4. *Quản Trị Hệ Thống (Admin Only):* Đổi mã PIN (4-10 số), Khôi phục Recovery Key, Quản lý Tag thể loại, Xuất/Nhập file JSON, Nạp dữ liệu Demo mẫu.

---

## 2. Cách Khởi Động Nhanh

### Cách 1: Khởi động một chạm (Khuyên dùng)
Nhấp đúp chuột vào file **`Chay_Icelauch.bat`** tại thư mục gốc `C:\Icelauch`.

### Cách 2: Khởi động từ PowerShell / Terminal
```powershell
cd C:\Icelauch
npm start
```
*(Để phát triển hoặc lập trình trực tiếp, dùng `npm run dev`).*

---

## 3. Cấu Trúc Thư Mục Portable (Di Động & Độc Lập)

Ứng dụng lưu trữ toàn bộ dữ liệu nội bộ trong thư mục `C:\Icelauch`, người dùng có thể sao chép cả thư mục sang ổ cứng di động hoặc máy tính khác mà không bị thất thoát cấu hình:

```
C:\Icelauch\
├── Chay_Icelauch.bat        # File khởi động nhanh một chạm cho Windows
├── 7z/                     # Bộ công cụ giải nén 7-Zip 64-bit portable
│   ├── 7z.exe
│   └── 7z.dll
├── Games/                  # Thư mục cài đặt và chứa các game đã giải nén
│   └── <Tên Game>/
├── Downloads/              # Thư mục tạm chứa các file nén trong quá trình tải
├── Data/                   # Thư mục lưu trữ dữ liệu người dùng
│   ├── covers/             # Thư mục ảnh bìa, banner và ảnh chụp màn hình cục bộ
│   ├── media_downloads/    # Thư mục chứa video và audio tải về để xem offline
│   ├── logs/               # Nhật ký vận hành và thông báo lỗi
│   ├── data.json           # Tệp cơ sở dữ liệu chính (danh mục game, video, playlist, cài đặt)
│   └── data.json.bak       # Bản sao lưu an toàn tự động
├── src/                    # Mã nguồn TypeScript & React
│   ├── main/               # Tiến trình Electron chính (Node.js / IPC / Download / 7-Zip)
│   ├── preload/            # Context Bridge bảo mật IPC giữa Node và React
│   └── renderer/           # Giao diện người dùng React 19 + Tailwind CSS v4
├── package.json
└── vite.config.ts
```

---

## 4. Các Tính Năng & Trải Nghiệm Nổi Bật

### 4.1 Trang Chủ Game Chuẩn Steam & Trải Nghiệm Đột Phá
- **Gamer Profile Card:** Hiển thị cấp bậc danh hiệu (*Tân Binh Băng Giá*, *Cú Đêm Điện Ảnh*...), tổng số game đã cài và tổng số giờ chơi.
- **Nút "Hôm Nay Chơi Gì? / Surprise Me":** Bấm nút để mở vòng quay may mắn chọn game ngẫu nhiên kèm âm thanh quay số vui nhộn và hiệu ứng pháo hoa khi trúng game.
- **Hàng "Vừa Chơi Gần Đây" (Quick Resume):** Danh thiếp game đã chơi hiển thị thời điểm gần nhất cùng nút **[Chơi]** 1 chạm.
- **Hàng "Tiếp Tục Xem & Nghe Dở":** Đồng bộ các video và bài hát đang thưởng thức dang dở với thanh tiến trình % đỏ rực và thông báo thời gian còn lại.
- **Bộ Lọc Theo Tâm Trạng (Mood Tags):** Chuyển nhanh giữa các thể loại cảm xúc: `Co-op cùng bạn bè`, `Thư giãn xả stress`, `Chiến đấu bùng nổ`, `Cốt truyện đỉnh cao`.
- **Hàng "Game Nổi Bật Trong Tuần":** Spotlight các tựa game hay nhất do Admin đánh dấu.
- **Hiệu Ứng Bông Tuyết (Ambient Ice Snow):** Các hạt tuyết chuyển động nhẹ nhàng trên giao diện, tạo cảm giác mùa đông mát lạnh (có thể tắt trong Cài đặt).
- **Âm Thanh Giao Diện (UI SFX):** Tiếng click nút, âm thanh quay thưởng, nhạc chuông khởi chạy game bằng Web Audio API không tốn tài nguyên.

---

### 4.2 Hệ Thống Danh Sách Phát (Playlists / Series / Albums)
- **Quản Trị Danh Sách Phát:** Admin có thể tạo playlist mới, đặt tên, ảnh bìa, mô tả, chọn danh sách tập và dùng nút mũi tên ▲ ▼ để đổi thứ tự tập/bài hát.
- **Trang Xem Video Chi Tiết:**
  - Tab **"Cùng Series"**: Danh sách các tập trong playlist, hỗ trợ tính năng **Auto-Next** tự động chuyển sang tập tiếp theo khi xem xong.
  - Tab **"Gợi Ý Cùng Thể Loại"**: Tự động tìm và đề xuất các video có cùng tags thể loại với video đang xem.
  - Tab **"Nổi Bật / Thịnh Hành"**: Khám phá các video thịnh hành khác trong rạp chiếu.

---

### 4.3 Tải Media Offline & Bộ Chọn Đa Nguồn Phát (Pill Selector)
- **Tải Media Offline:** Tải trực tiếp video và bài hát từ Google Drive hoặc link MP4/MP3 về máy tính (`Data/media_downloads/`).
- **Ưu Tiên Phát Offline:** Khi đã tải về, ứng dụng tự động chọn nguồn phát offline để xem nhanh chóng, không giật lag và không tốn mạng.
- **Bộ Chọn Nguồn Phát Trực Quan (Pill Selector):** Cho phép người dùng linh hoạt đổi nguồn phát:
  - `[⚡ Bản Offline (Đã tải)]`: Phát file video/nhạc lưu trên ổ cứng.
  - `[🌐 Google Stream]`: Nhúng trực tiếp iframe Google Drive.
  - `[🚀 HTML5 Proxy]`: Luồng stream HTML5 mượt mà qua proxy cục bộ (vượt lỗi tệp đang xử lý của Google Drive).
  - `[▶️ YouTube HD]`: Cầu nối phát YouTube chất lượng cao.
  - `[📘 Facebook Video]`: Phát video hoặc Reel từ Facebook.
- **Quản Lý Dung Lượng:** Nút xoá file tải về trên máy giúp người dùng giải phóng dung lượng ổ đĩa bất kỳ lúc nào.

---

### 4.4 Hỗ Trợ Video Facebook & Xử Lý Tỉ Lệ (16:9 Ngang vs 9:16 Reel Dọc)
- **Nhận Diện Đa Dạng Link Facebook:** Hỗ trợ link video chuẩn, Facebook Reel, link chia sẻ (`facebook.com/share/r/`, `fb.watch`).
- **Mặc Định 16:9 Cinema:** Khi mở video, khung phát mặc định là 16:9 chuẩn rạp chiếu.
- **Nút Chuyển Tỉ Lệ Linh Hoạt:** Nút chuyển đổi nhanh `[16:9 Điện Ảnh]` và `[9:16 Reel Dọc]`.
- **Hiệu Ứng Hào Quang Nền Mờ (Ambient Glow):** Khi ở chế độ Reel dọc 9:16, khung video đặt ở giữa rạp với hiệu ứng nền mờ hào quang từ ảnh bìa, mang lại trải nghiệm xem điện ảnh sang trọng.

---

### 4.5 Trình Phát Đĩa Than Vinyl & Widget Nổi Mini Góc Phải
- **3 Tab Giải Trí Chuyên Biệt:**
  - `[🎬 Phim & Video]`
  - `[🎵 Âm Nhạc (Songs & Chill)]`
  - `[🎙️ Audio & Podcast (Sách nói)]`
- **Trình Phát Đĩa Than Vinyl (`VinylTurntablePlayer`):**
  - Đĩa than tròn xoay đều nhịp nhàng khi phát nhạc với nhãn đĩa in ảnh bìa album bài hát.
  - Cần kim (tonearm needle) tự động hạ xuống đĩa khi Play và nhấc lên khi Pause.
  - Thanh tua timeline, thời lượng, các nút Shuffle, Loop, chuyển bài trước/sau, chỉnh âm lượng.
- **Widget Đĩa Than Nổi Mini Góc Phải (Background Playback):**
  - Tiếp tục nghe nhạc khi duyệt game hoặc chuyển sang thư viện.
  - Đĩa than mini (52x52px) xoay tròn ở góc dưới bên phải màn hình khi nhạc đang chạy.
  - Rê chuột vào đĩa than sẽ bung ra **Hộp Công Cụ Nổi (Floating Tool Card)** hiển thị ảnh bài hát, tên bài, timeline tua nhạc, nút Play/Pause, Next (ưu tiên bài cùng playlist), Prev và nút mở to về trang nghe nhạc.

---

### 4.6 Mục "Yêu Cầu & Hướng Dẫn Chơi" & Thư Viện Nút Liên Kết Khởi Chạy Ứng Dụng Ngoài
- **Khối "Yêu Cầu & Hướng Dẫn Chơi" Nổi Bật:** Xuất hiện trong cả **Trang Chi Tiết Game** và **Thư Viện Game**, hiển thị các ghi chú quan trọng từ Admin (VD: *"1. Mở Steam trước; 2. Vào phòng Discord Voice #3 để chơi co-op"*).
- **Dàn Nút Hành Động 1-Chạm:** Các nút lối tắt tương tác trực quan:
  - 🎮 `[Mở ứng dụng Steam]`: Tự động gọi protocol `steam://open/main` hoặc file `steam.exe`.
  - 💬 `[Vào Discord Voice Chat]`: Mở nhanh kênh đàm thoại của nhóm bạn.
  - 📁 `[Khởi chạy App .exe / Tool Mod]`: Mở trực tiếp file thực thi trên máy, có tùy chọn quyền Administrator (UAC).
  - 🌐 `[Xem Link Web / Bản Việt Hóa]`: Mở trang web ngoài bằng trình duyệt mặc định.
- **Quản Trị Thư Viện Nút Tích Hợp (Trong Cài Đặt):** Admin có thể tạo nút mới, chọn icon, kiểm tra chạy thử (Test Run), gán cờ `Mặc định` để tự động đính kèm vào mọi game mới tạo.
- **Tùy Chọn Theo Từng Game (Game Form):** Khi thêm hoặc sửa game, Admin có thể nhập ghi chú hướng dẫn và tích chọn các nút lối tắt phù hợp với game đó.

---

### 4.7 Studio Hiệu Ứng Theo Mùa, Hình Nền App & Chế Độ Máy Yếu (Low-Spec Mode)
- **Studio Hiệu Ứng Đa Mùa:**
  - ❄️ **Mùa Đông:** Bông tuyết trắng xanh rơi nhẹ nhàng, xoay lượn tự nhiên.
  - 🍂 **Mùa Thu:** Cánh lá phong vàng/cam rơi chao đảo theo chiều gió.
  - 🌸 **Mùa Xuân:** Cánh hoa anh đào màu hồng phớt lãng mạn.
  - 💡 **Mùa Hè:** Đom đóm vàng xanh phát sáng lung linh, chuyển động nhịp nhàng.
  - 🌌 **Cyber Stardust:** Bụi sao neon bay bổng hiện đại.
  - ❌ **Tắt hiệu ứng:** Không hiển thị hạt.
  - Đi kèm 3 thanh trượt điều chỉnh sâu: Tốc độ rơi (0.2x - 3.0x), Mật độ hạt (15 - 80), Độ mờ hạt (10% - 100%).
- **Hình Nền Ứng Dụng Tùy Chỉnh (Custom App Wallpaper):**
  - Admin có thể duyệt ảnh từ ổ đĩa máy tính (`.jpg, .png, .webp`) hoặc dán URL web.
  - Tùy chỉnh tâm điểm ảnh (Center, Top, Bottom, Left, Right), Zoom (1.0x - 3.0x), Độ làm mờ Blur (0 - 20px), Lớp phủ tối Darkness (0% - 90%).
  - Tùy chọn hiển thị kết hợp cùng hiệu ứng hạt hoặc chỉ dùng hình nền độc lập.
- **Chế Độ Máy Yếu / Tiết Kiệm Tài Nguyên (Low-Spec Mode):** 1 công tắc thông minh tắt ngay Canvas chuyển động và giảm blur nặng, đảm bảo 60 FPS mượt mà tuyệt đối cho máy cấu hình thấp.
- **Tối Ưu Hoá Bị Động:** Canvas tự động tạm dừng render khi cửa sổ bị ẩn hoặc thu nhỏ xuống Taskbar, phần tử đồ hoạ tăng tốc phần cứng GPU (`translateZ(0)`).

---

### 4.8 Nâng Cấp Rạp Giải Trí: Thanh 3 Tab Co Giãn Động, Hàng Thể Loại & Dropdown Chọn Nguồn
- **Thanh 3 Tab Co Giãn Động (Dynamic Expanding Pill Tabs):**
  - Tab đang chọn sẽ mở rộng để hiển thị đầy đủ icon + chữ + số lượng item (VD: `[🎬 Phim & Video (12)]`).
  - 2 tab còn lại thu gọn chỉ hiển thị icon (`[🎵]`, `[🎙️]`) với hiệu ứng co giãn mượt mà, tiết kiệm tối đa diện tích thanh điều hướng.
- **Hàng Video Thể Loại Cuộn Ngang (Genre Shelves):** Khi duyệt tab Phim & Video ở mục Tất cả, bên dưới Banner và danh sách tiếp tục xem dở sẽ xuất hiện các hàng cuộn ngang phân loại theo từng tag thể loại (*Hoạt hình*, *Phim Chiếu Rạp*, *Phim Lẻ*...) kèm nút *"Xem tất cả ->"*.
- **Ô Sổ Chọn Nguồn Phát Dưới Video (Dropdown Selector):**
  - Chuyển bộ chọn nguồn phát từ header trên cùng xuống **nằm ngay bên dưới khung video**.
  - Dạng hộp chọn dropdown trực quan kèm icon và trạng thái: `💾 Bản Offline (Đã tải về máy)`, `⚡ Google Drive Trực Tiếp`, `🛡️ HTML5 Local Proxy (Chống lỗi tải)`, `▶️ YouTube HD Player`, `🎬 Facebook Video Player`.
  - Bên cạnh là cụm nút chuyển tỉ lệ `16:9` / `9:16 Reel`, nút Tải về máy / Xóa bản tải, Sao chép link và nút Sửa (Admin).

---

### 4.9 Cài Đặt Phân Loại 4 Nhóm Chuyên Biệt
1. **Giao Diện & Trải Nghiệm:** Studio hiệu ứng theo mùa, Thanh trượt hạt, Bộ chỉnh hình nền App, Công tắc Chế độ máy yếu, Âm thanh UI SFX, Phát nhạc dưới nền, Danh hiệu Gamer.
2. **Nút Liên Kết & Tích Hợp:** Thư viện nút mở ứng dụng/link ngoài, thêm/sửa/xoá nút, chạy thử trực tiếp.
3. **Lưu Trữ & Thư Mục:** Đường dẫn các thư mục cục bộ (App, Games, Downloads, Media Downloads), mở trực tiếp trong File Explorer, tuỳ chọn giải nén mặc định.
4. **Quản Trị Hệ Thống (Chỉ mở khi đăng nhập Admin):** Đổi mã PIN (4-10 số), Khôi phục Recovery Key, Quản lý Tag thể loại Game & Giải trí, Xuất/Nhập file JSON sao lưu, Nạp dữ liệu Demo.

---

### 4.10 Bộ Căn Chỉnh Ảnh Trực Quan Chuẩn Tỉ Lệ Thực Tế (`ImagePositionSelector`)
Tích hợp trong cả hai form quản trị **Thêm/Sửa Game** và **Thêm/Sửa Giải Trí**:
- **Bố Cục Banner Steam Spotlight Cân Đối (65% / 35%):** Khối Banner chuẩn cao ~370px không choán diện tích màn hình. 65% bên trái là ảnh Banner giữ nguyên tỉ lệ 16:9 (`aspect-video`) đồng bộ 100% với khung căn chỉnh; 35% bên phải là cột tóm tắt game (tiêu đề, 4 ảnh nhỏ chụp màn hình đổi ảnh xem trước khi rê chuột, tags, nút Chơi ngay và cụm chuyển slide).
- **Khung Xem Trước Thực Tế (Live Realistic Preview):**
  - *Ảnh bìa Game:* Khung chuẩn 2:3 mô phỏng chính xác Thẻ Game ngoài Trang Chủ.
  - *Ảnh Banner Hero:* Khung chuẩn 16:9 (`aspect-video`) đồng bộ tuyệt đối 100% với Banner ngoài Trang Chủ và Rạp Giải Trí.
  - *Ảnh Thẻ Video:* Khung 16:9 chuẩn định dạng video điện ảnh.
- **Kéo Chuột Tự Do (Mouse Drag & Pan):** Bấm giữ chuột trái trên khung ảnh và rê chuột theo mọi hướng để chọn tâm điểm (Focal Point).
- **Thu Phóng (Zoom Slider):** Phóng to từ 1.0x đến 3.0x bằng thanh trượt hoặc lăn bánh xe chuột trên khung ảnh.
- **Hiệu Ứng Banner Nâng Cao:** Tinh chỉnh thanh trượt **Độ làm mờ banner (Blur: 0 - 12px)** và **Độ tối lớp phủ (Darkness overlay: 0 - 80%)**.

---

### 4.7 Tính Năng Quản Trị & Mã PIN 4-10 Số
- **Form Nhập Liệu Chuẩn:** Thêm mới làm sạch 100% dữ liệu form; sửa nạp đầy đủ thông tin của item đang chọn.
- **Chọn Ảnh Cục Bộ từ Máy Tính:** Hỗ trợ duyệt ảnh `.jpg, .png, .webp` từ ổ đĩa máy tính.
- **Tính Năng Ẩn / Hiện (Admin Hide/Unhide):** Ẩn game hoặc video khỏi khách, có huy hiệu `[ĐÃ ẨN]` màu vàng trong tài khoản Admin và bộ lọc nhanh "Mục đã ẩn".
- **Mã PIN Admin Linh Hoạt (4 đến 10 số):** Đặt mã PIN an toàn từ 4 đến tối đa 10 chữ số, có bàn phím số ảo trên màn hình.

---

## 5. Hướng Dẫn & Xử Lý Sự Cố

1. **Mã PIN Admin mặc định:** Mã PIN mặc định là **`3003`** (độ dài 4-10 số). Nhấp vào biểu tượng Admin ở góc trên bên phải để đăng nhập.
2. **Khôi phục khi quên mã PIN:** Bấm vào chữ *"Quên mã PIN? Khôi phục bằng Recovery Key"*, nhập mã dự phòng được tạo lúc ban đầu để đặt lại mã PIN mới (4-10 chữ số).
3. **Lỗi tải về 0% hoặc link Google Drive:** Đảm bảo link chia sẻ ở quyền *"Bất kỳ ai có đường liên kết đều có thể xem"*. Ứng dụng tự động xử lý file lớn (>100MB) vượt qua trang quét virus của Google Drive.
4. **Phát Video Google Drive:** Hỗ trợ cả 2 chế độ: Google Drive Stream trực tiếp qua Preview iframe (được bảo vệ header riêng biệt) và chế độ HTML5 Proxy tua mượt qua Local Streaming Server.
5. **Khắc phục lỗi YouTube (Error 152-4 & Error 153):** Ứng dụng tích hợp Cầu nối Cục bộ HTTP (`StreamProxyService` qua `http://127.0.0.1:<port>/youtube/:id`) cùng bộ lọc header `Referer` và `Origin` tự động, khắc phục hoàn toàn rào cản giao thức `file://` của Electron khi nhúng iframe YouTube. Có kèm nút fallback mở thẳng trên trình duyệt ngoài nếu chủ sở hữu cấm nhúng.
6. **Bật/Tắt Hiệu Ứng Tuyết & Âm Thanh:** Vào tab **Cài Đặt** > **Hiệu Ứng Giao Diện & Âm Thanh (Icelauch Experience)** để bật/tắt tiếng click, hiệu ứng tuyết rơi, hoặc đổi Danh hiệu Gamer theo sở thích.
