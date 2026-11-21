# Icelauch — Architectural Guidelines & Regression Prevention

> Generated as part of v1.2.2 System Overhaul (Milestone 4).  
> **All contributors MUST read and follow these rules before making changes.**

---

## 1. Admin PIN & Device Auth

### 1.1 PIN Hashing — Platform Parity Rule
- **Electron** (Node.js) uses `crypto.pbkdf2` with Buffer hex encoding.
- **Mobile/Web** (Capacitor) uses `SubtleCrypto.deriveKey` (PBKDF2) with `Uint8Array` → hex string.
- **RULE:** Both platforms MUST produce identical hex strings for the same PIN + Salt combo.  
  Any change to hash parameters (`iterations`, `keyLen`, `digest`) must be applied to **both** `src/main/services/storage.ts` **and** `src/renderer/src/services/platformAdapter.ts` simultaneously.
- **RULE:** The salt for each PIN must be stored in `localStorage` / Electron store under a stable key (`ADMIN_PIN_SALT`) and must never be regenerated unless the PIN itself is changed.

### 1.2 Device Registry Persistence
- Device approval data is stored in Supabase table `icelauch_device_registry`.
- **RULE:** On app startup, **always pull** `icelauch_device_registry` from Supabase **before** writing local state. Never overwrite the local registry with an empty array before the cloud fetch completes.
- **RULE:** `deviceAuth.ts` must use a hardware-stable GUID (Electron: `machineIdSync`; Android: `Settings.Secure.ANDROID_ID`). Never regenerate the GUID per session.
- **RULE:** Supabase schema for `icelauch_device_registry` must have columns: `id` (text PK), `label` (text), `approved` (bool), `registered_at` (timestamptz). RLS must allow anon read + authenticated write.

---

## 2. Electron Focus & Mobile IME / Keyboard

### 2.1 Electron — Frameless Window & Keyboard Focus
- Icelauch uses a **frameless Electron window** (`frame: false`).  
  On Windows, frameless HWNDs can lose keyboard focus after certain OS events (task-switcher, UAC dialogs, etc.).
- **RULE:** `src/main/index.ts` MUST register an Edit menu (even hidden) with standard accelerators (`Ctrl+A`, `Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+Z`, `Ctrl+Y`) so the OS routes keyboard events correctly.
- **RULE:** Never set `user-select: none` on elements that contain or parent an `<input>` / `<textarea>`. Apply it only to decorative containers.
- **RULE:** `index.html` / `index.css` global `* { user-select: none }` rules must include explicit overrides for `input, textarea, [contenteditable]` to restore `user-select: text`.

### 2.2 Mobile — Android IME / Keyboard Input
- Capacitor Android uses a WebView whose default `windowSoftInputMode` can conflict with IME composition events, causing typed characters to only appear after pressing Space.
- **RULE:** `AndroidManifest.xml` activity MUST declare `android:windowSoftInputMode="adjustResize"`.
- **RULE:** `capacitor.config.json` MUST set `"keyboard": { "resize": "body", "style": "dark" }` and `"adjustResize": true` under `android`.
- **RULE:** Controlled `<input>` components MUST handle `onCompositionEnd` to flush the composed string into state. Never block `onChange` for IME-composed characters.

---

## 3. Shared vs Private Cloud Data Sync

### 3.1 Shared Data (Visible to All Authenticated Users)
The following data types are **global/shared** and must always sync to Supabase without omission:

| Data | Supabase Table | Key Rule |
|------|---------------|----------|
| Games catalog | `icelauch_games` | All fields including `hidden`, `featured` |
| Media catalog | `icelauch_media` | All fields including `hidden`, `is_banner_pinned` |
| System playlists (admin) | `icelauch_playlists` | `is_system: true` |
| Genre/tag lists | `icelauch_playlists` with id `__system_catalog_settings__` | JSON blob in description |
| Banner settings | `icelauch_playlists` with id `__system_catalog_settings__` | JSON blob in description |
| Action buttons | `icelauch_playlists` with id `__system_catalog_settings__` | JSON blob in description |
| Device registry | `icelauch_device_registry` | All approved devices |

**RULE:** Every field that affects presentation or access control (including `hidden`, `featured`, `is_banner_pinned`) MUST be included in both the `upsert` payload sent to Supabase and the `pull`/`map` function that reconstructs the object. Missing a field in either direction breaks the data round-trip.

### 3.2 Private Data (Scoped Per User / Device)
The following data types are **private** and MUST be isolated per user or device:

| Data | Supabase Table | Isolation Key |
|------|---------------|---------------|
| User profiles | `icelauch_profiles` | `user_id` (account PIN hash) |
| Saved accounts | `localStorage` only | Machine GUID / device |
| Personal library | `icelauch_user_data` | `user_id` |
| Personal playlists | `icelauch_playlists` | `user_id`, `is_system: false` |
| Playback progress | `icelauch_user_data` | `user_id` |
| Approved device list | `icelauch_device_registry` | Machine GUID |

**RULE:** Saved login accounts (profile picker) MUST only be stored on the machine that created them (`localStorage`, keyed by machine GUID). They must never be synced to Supabase or be visible from another machine.  
**RULE:** Pulling profiles from Supabase on startup must only be used as a fallback when local cache is empty, and must still filter to `user_id` matching the local account.

---

## 4. Content Visibility Filtering

### 4.1 `hidden` Flag — Enforcement Points
An admin can mark any game or media item as `hidden: true`. Items with this flag MUST be invisible to non-admin users.

**RULE:** Filtering must happen at **three** independent layers — any single layer failing is a security regression:

1. **Supabase query layer** (future): Use Supabase RLS or query filter `?hidden=eq.false` for non-admin clients. *(Currently not enforced at DB level — apply client-side filtering as the enforced layer.)*
2. **`platformAdapter.ts` / `supabaseSync.ts` pull layer:** After fetching from Supabase, filter `r.hidden === true` items out before delivering to non-admin state.
3. **Component render layer:** `baseGames` and `baseMedia` computed arrays in `HomeView.tsx` and `MediaView.tsx` MUST include `!game.hidden` / `!item.hidden` guards when `isAdmin === false`.

**RULE:** When `upsertGame` or `upsertMediaItem` is called, the `hidden` boolean field MUST be included in the POST payload so that the flag persists across sync cycles.

**RULE:** When `pullGames` or `pullMedia` deserialises Supabase rows, it MUST map `r.hidden` → `hidden: Boolean(r.hidden)` on the returned object.

### 4.2 Leaked Visibility Checklist
Before every release, verify:
- [ ] Non-admin client cannot see items where `hidden: true` on any page (Home, Media, Game, Search)
- [ ] Admin toggle of `hidden` persists after app restart (pull from cloud confirms the saved value)
- [ ] `icelauch_games` and `icelauch_media` tables in Supabase have a `hidden` column of type `boolean DEFAULT false`

---

## 5. Data Persistence Checklist (For Every New Field)

When adding a new field to `Game`, `MediaItem`, or `MediaPlaylist`:

- [ ] Add the field to the TypeScript type/interface
- [ ] Add it to the `upsert*` payload (sent to Supabase)
- [ ] Add it to the `pull*` row-mapping function (read from Supabase)
- [ ] Add a default value in the type definition so older records don't crash
- [ ] If the field affects visibility or access, add it to the Content Visibility Checklist

---

## 6. Regression Testing Requirements

- **RULE:** Every PR that touches auth, sync, or visibility code must run `node scripts/run-all-verifications.cjs` and achieve **189/189 PASS** before merging.
- **RULE:** TypeScript must compile with zero errors: `npx tsc --noEmit`.
- **RULE:** Never remove or weaken an existing test without written justification in the PR description.

---

## 7. UI Theme Contrast, Elevation & Celestial Design System (v1.2.5 / v6.3)

### 7.1 Color Contrast Standards (WCAG AAA / AA)
- **Primary Body & Heading Text:** Must strictly achieve a minimum contrast ratio of **7:1 (WCAG AAA)** against its container/background.
  - In Solar mode: Background `#F8F6F1` requires primary text `#181512` (15.2:1 ratio).
- **Secondary Text, Subtitles & Metadata:** Must achieve a minimum contrast ratio of **4.5:1 (WCAG AA)**.
  - In Solar mode: Subtext must be `#524C46` or darker (6.2:1 ratio). Never use low-contrast grey (`#9CA3AF`, `#78716C`) on light backgrounds.
- **Interactive Accents:** Interactive elements must have a minimum contrast ratio of **4.5:1** on light backgrounds (e.g. Amber 600 `#D97706`).

### 7.2 Toolbar Elevation & Silhouette Rule
To prevent floating toolbars (Navbar Island, Mobile Tab Bar, MiniPlayer) from visually merging/drowning into light or white backgrounds:
- **RULE (Tinted Glass):** Never use plain transparent white glass. Use tinted glass with minimum 90% opacity (`rgba(255, 255, 255, 0.92)`).
- **RULE (Double-edge Rim Border):** Always pair an outer colored rim (`border: 1px solid rgba(217, 119, 6, 0.22)`) with an inner specular highlight (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95)`).
- **RULE (Layered Ambient Shadow):** Combine contact shadow (2px-4px) with diffused ambient shadow (16px-36px) to physically elevate the toolbar above scrolling content.

### 7.3 Full Adaptive Geometry Architecture
When implementing celestial and elemental modes:
- **RULE:** Themes must not only swap color palettes, but also alter component geometry (`--theme-radius`), glass opacity (`--glass-blur`), and surface textures via CSS variables.
- **RULE:** The `Aer` (Lite) theme MUST disable all GPU-heavy filters (`backdrop-filter: none !important`, `box-shadow: none !important`, `0ms delay`) for maximum battery and FPS efficiency.
- **RULE:** The `Eclipse` theme MUST use pure `#000000` on canvas and backgrounds to fully switch off OLED pixels.

### 7.4 Solar Text Contrast & Color Ban Rules
- NEVER use light amber or yellow (`#FBBF24`, `#F59E0B`, `text-amber-400`, `text-yellow-400`) as text color on light backgrounds.
- All body text in light modes must be `#1C1917` (AAA 15:1), secondary text `#44403C` (AA 6:1), and active text `#B45309` (AA 5:1).
- Yellow/amber is strictly restricted to button backgrounds, bold icons, and glowing rims.

### 7.5 Hardcoded Dark Container Ban
- Hardcoded dark backgrounds (`bg-black`, `bg-slate-900`, `bg-[#0B0F19]`) inside text boxes, inputs, cards, and modals are strictly prohibited.
- All containers must bind to dynamic theme tokens (`bg-ice-card`, `bg-ice-hover/50`, `bg-ice-bg/80`).

### 7.6 Dual Distinct Elevation Architecture
- Floating Toolbars (Header, Tab Bar, MiniPlayer): Tinted glass (0.96) + 1.5px rim border + 3-stage layered anti-gravity shadow.
- Content Cards (Cards, Panels): Pure card surface + 1px border + hover depth lift (`translateY(-3px)`) with subtle ambient shadow.

### 7.7 Specialized Mode Muted Switch Paradigm
- When in 1 of 7 specialized modes, the quick Sun/Moon toggle switch must display `opacity: 0.4; filter: grayscale(100%)`.
- Clicking the muted switch immediately exits the specialized mode back to standard Solar or Lunar.

### 7.8 Stacking Context & Modal Portaling Invariant
- **Bắt buộc dùng React Portal cho Modal/Floating Hub:** Mọi component dạng lớp phủ toàn màn hình (`fixed inset-0`) như `CelestialThemeHub`, `GameInstallModal`, `ProfileModal` BẮT BUỘC phải được render qua `createPortal(jsx, document.body)`.
- **Tuyệt đối không mount trực tiếp bên trong component có `backdrop-filter` hoặc `transform`:** Điều này ngăn chặn triệt để lỗi phần tử `fixed` bị bẫy trong containing block của Navbar/Header.

### 7.9 Toggle Switch Visual Polarity Standard
- **Quy ước vị trí con trượt:**
  - Vị trí Trái (Left): Trạng thái Ban Đêm / Tối (`Lunar 🌙`). Con trượt ở bên trái, biểu tượng Mặt Trăng, bầu trời sao.
  - Vị trí Phải (Right): Trạng thái Ban Ngày / Sáng (`Solar ☀️`). Con trượt ở bên phải, biểu tượng Mặt Trời, bầu trời mây ấm.
- **Phản ánh trạng thái hiện hành:** Nút gạt luôn thể hiện chế độ đang được kích hoạt, tuyệt đối không hiển thị chế độ mục tiêu sẽ chuyển đến.

### 7.10 Dynamic Theme Accent on Buttons & Media Controls
- **Không hardcoded màu vàng hổ phách:** Cấm sử dụng trực tiếp các class `bg-amber-500`, `text-amber-400`, `bg-yellow-400` cho các nút bấm hành động chung và thanh phát nhạc.
- **Sử dụng Theme Accent Token:** Toàn bộ nút chính và thanh điều khiển nhạc phải gắn với `var(--theme-accent)` (`bg-ice-accent`, `text-ice-accent`), tự động biến chuyển theo từng Mode (Xanh biển Aqua, Cam lửa Ignis, Ngọc bích Aurora, Đất rêu Terra...).

### 7.11 Surface Contrast Separation (Zero-Merge Invariant)
- **Thanh công cụ (Toolbars):** Không bao giờ được cùng mã màu hex hoặc độ mờ với `--theme-bg`. Bắt buộc có viền bắt sáng riêng và độ chênh lệch sắc độ bề mặt tối thiểu để luôn nổi bật trên màn hình.
- **Thẻ nội dung (Cards):** Bắt buộc có viền bao quanh (`--theme-card-border` / `border-ice-border/70`) ở mọi mode để phân tách rõ rệt khối nội dung khỏi nền launcher.

### 7.12 Specialized Mode Visual Hierarchy & Base Switch Dimming
- Khi kích hoạt bất kỳ chế độ chuyên biệt nào (Aqua, Ignis, Aer, Terra, Eclipse, Aurora, Nebula), nút gạt hai trạng thái `Solar/Lunar` trên thanh công cụ phải tự động mờ và mất màu (`opacity: 0.4; filter: grayscale(100%); cursor: pointer;`).
- Bấm vào nút gạt này trong chế độ chuyên biệt sẽ kích hoạt lệnh thoát chế độ chuyên biệt, đưa ứng dụng quay về chế độ cơ sở tương ứng (`isLight ? 'solar' : 'lunar'`).

### 7.13 Aqua Fluid Architecture & High-Contrast Light Ocean Standard
- **Bảng màu (Rich Azure Water):**
  - Nền chính: Gradient xanh nước hồ đậm đà rõ nét `#CEEBF8` → `#92D6F5`.
  - Thẻ & Bề mặt kính: Trắng ánh xanh xuyên thấu `rgba(255, 255, 255, 0.78)` kèm `backdrop-blur(18px)`.
  - Chữ chính: Xanh đại dương rất đậm `#082F49` (đạt chuẩn WCAG AAA 12.8:1).
  - Chữ phụ: Xanh xám đậm `#334155` (đạt chuẩn WCAG AA 6.5:1).
  - Màu nhấn: Xanh biển rực rỡ `#0284C7` và ánh phản chiếu `#38BDF8`.
- **Top-Attached Header:** Cạnh trên của Header PC gắn sát viền trên cửa sổ ứng dụng, bo thắt eo hai bên mô phỏng giọt nước đọng. Vùng kéo cửa sổ (`-webkit-app-region: drag`) và các nút tương tác (`no-drag`) phải được bảo toàn 100%.

### 7.14 Compositor-Only Ambient Wave & Water Ripple Guardrail
- Các lớp sóng nền di chuyển bằng GPU-accelerated CSS `transform: translate3d(x, 0, 0)` hoặc SVG clip-path nhẹ, CPU tiêu thụ < 1%.
- Hiệu ứng chạm gợn nước chỉ gồm 1 vòng nhỏ bán kính < 48px, thời gian tồn tại < 800ms, có nút bật/tắt lưu tại `localStorage.getItem('icelauch_aqua_ripple_enabled')`.

### 7.15 Quy Tắc Chiều Sâu Màu Nước & Xuyên Thấu Mặt Nước Trong Aqua Mode (Water-Depth & Translucency Invariant)
1. **Độ Bão Hòa & Độ Đậm Màu Nước (Rich Ocean Cyan/Sky Saturation):**
   - Nền canvas và các bề mặt của Aqua Mode không được dùng màu ngả quá gần về trắng tinh (`#F0FDFA` / `#E0F7FA`). Phải duy trì sắc thái xanh dương/xanh ngọc rõ rệt (dải tham chiếu: `#CEEBF8` → `#92D6F5`), giúp người dùng nhận biết ngay lập tức chế độ nước mát.
   - Text chữ chính luôn duy trì Deep Ocean Navy `#082F49` đảm bảo tỷ lệ tương phản vượt chuẩn WCAG AAA (> 12:1).
2. **Hiệu Ứng Xuyên Thấu Mặt Nước Trên Thanh Phát Nhạc (Translucent Liquid Player):**
   - Nghiêm cấm đặt nền đục trắng đặc (`bg-white/80+`) lên thanh MiniPlayer hay các thanh công cụ dạng viên nang trong Aqua Mode.
   - Phải sử dụng độ trong suốt lỏng (`bg-sky-100/35`) kết hợp `backdrop-blur-2xl` và viền sáng khúc xạ (`border-sky-300/50`, `shadow-[0_12px_36px_rgba(2,132,199,0.25),inset_0_1px_1px_rgba(255,255,255,0.7)]`), tạo cảm giác như đang nhìn xuyên thấu qua một lớp nước trong vắt xuống nội dung cuộn bên dưới.

### 7.16 Quy Tắc Thiết Kế Sinh Thái Tối & Bọ Rùa Trong Terra Mode (Dark Earthy & Ladybug Invariant)
1. **Bảng Màu Phân Tầng Nâu Đất Đậm (Dark Earthy Layering):**
   - Canvas nền chính: Nâu đen đất mùn `#161310`.
   - Nền thẻ nội dung (Game, Phim, Nhạc, Audio): Nâu gỗ trầm `#211C17`.
   - Nền 2 Thanh công cụ (Header PC, MiniPlayer PC, Mobile Floating Tab Bar): Nâu đất nung đậm ấm `#2B241D`, viền đất dày rõ nét `#7C5332`, bóng đổ đa tầng `0 8px 24px rgba(0, 0, 0, 0.65)` nổi bật rõ trên nền canvas.
   - Chữ chính: Trắng kem giấy ấm `#F3ECE1` (WCAG AAA). Chữ phụ: Xám cát ấm `#B5A898`.
   - Màu nhấn chính & mầm cây: Xanh rêu tươi sáng `#65A30D` pha `#84CC16`.
   - Nút yêu thích Quả Táo: Đỏ táo chín `#DC2626` với lá xanh `#65A30D`.

2. **Bất Biến Bám Sát Viền Thẻ & Sinh Trưởng Dây Leo (Zero Gap & Zero Overlap Invariant):**
   - Dây leo và mầm lá của `TerraBotanicalCardFrame` bắt buộc phải neo gốc bám khít trực tiếp lên đường viền đất (`border: 2px solid #7C5332`) của chính thẻ đó (`inset: 0`), không được để lơ lửng ngoài khoảng trống giữa hai thẻ, không lấn quá nửa khoảng cách `gap` giữa các thẻ để triệt tiêu 100% hiện tượng đè lên thẻ lân cận.
   - Trạng thái chưa yêu thích: Chỉ hiển thị mầm lá nhỏ kín đáo ở 2 góc đối diện với tông xanh trầm dịu mắt (`#4D7C0F`).
   - Trạng thái đã yêu thích: Kích hoạt hoạt ảnh mọc vươn dài bám sát các mép cạnh viền thẻ (`stroke-dashoffset` & `scale`), bung mở lá non xanh tươi (`#65A30D` & `#84CC16`).

3. **Đồng Bộ Trạng Thái Lưu Game Với Profile Người Dùng (User Library State Binding):**
   - Mọi view hiển thị Game (`HomeView`, `HeroBanner`, `GameDetailView`, `MobileHomeView`) bắt buộc phải nhận `userLibraryIds` từ `activeProfile.library` và liên kết động `inLibrary = userLibraryIds?.includes(game.id) ?? game.inLibrary`. Tuyệt đối không đọc đơn lẻ thuộc tính tĩnh `game.inLibrary` để đảm bảo nút Quả Táo đỏ và hiệu ứng dây leo kích hoạt lập tức khi bấm lưu/bỏ lưu.

4. **Đồ Họa Cỏ Viền MiniPlayer Dạng Đường Cong Hữu Cơ & Gradient Tự Nhiên (Organic Meadow Curves):**
   - Dải cỏ sinh thái mép trên MiniPlayer sử dụng đường cong Bézier bậc 3 uốn lượn mềm mại tự nhiên, đan xen cỏ cao/thấp, dương xỉ và nụ hoa dại, kết hợp `linearGradient` từ gốc xanh rêu sẫm (`#3F6212`) lên ngọn xanh non (`#84CC16`), lan tỏa mượt mà theo vị trí con bọ rùa thông qua mặt nạ chuyển tiếp gradient.

5. **Bọ Rùa Tiến Độ Tối Giản (Minimal Geometric Ladybug Thumb):**
   - Nút kéo tiến độ (`thumb`) trên thanh phát nhạc là hình tượng chú bọ rùa hình học tối giản: thân tròn đỏ `#DC2626`, đầu đen nhỏ hướng sang BÊN PHẢI (`rotate(90deg)` theo hướng chạy), không chân, không râu.
   - Ẩn hoàn toàn chấm tròn trắng mặc định của browser slider thumb (`::-webkit-slider-thumb { appearance: none; display: none; }`).
   - Căn chỉnh điểm bắt đầu của track sao cho bọ rùa tại `0%` không đè lên nhãn thời gian `0:00`.

### 7.17 Quy Tắc Kiến Trúc Ignis Mode (Hỏa — Thermal Combustion & Magma Invariant)
1. **Bảng Màu Obsidian, Tro Tàn & Nham Thạch (Dark Volcanic Palette):**
   - Canvas nền chính: Đen đá núi lửa sâu thẳm `#110B09`.
   - Bề mặt thẻ card: Đen tro ấm `#1C120E` kết hợp Nâu nham thạch tối `#261712`, viền kim loại nguội `#4A2518`.
   - Nền thanh công cụ: Khối đá đen Obsidian vát chéo 45 độ với viền kim loại nung ám khói `#8C4320` và bóng đổ sâu đa tầng (`0 12px 32px rgba(0,0,0,0.95)`).
   - Chữ chính: Trắng kem ánh lửa `#FFF7ED` (WCAG AAA 16.2:1). Chữ phụ: Cam khói nhạt `#D6B4A6` (WCAG AA 7.4:1).
   - Màu nhấn nhiệt lượng: Cam lửa `#F97316`, Vàng dung nham `#FBBF24`, Đỏ than hồng `#DC2626`.

2. **Kiến Trúc Header PC 3 Khối Đá Sắc Nét & Tab Active Nứt Dung Nham (Header Magma Fissure):**
   - Header PC tách thành 3 khối đá Obsidian vát chéo 45 độ nằm trên cùng hàng ngang (Khối Logo/Tên - Khối Menu điều hướng - Khối Tìm kiếm/Solar/Lunar/Cửa sổ).
   - Tại tab điều hướng đang chọn: Khung bao quanh nứt rộng ra để lộ dòng dung nham nóng chảy rực sáng (`#FBBF24` & `#F97316`) bên trong khe nứt, đồng thời chữ trên nút chuyển sang hiệu ứng chữ nung đỏ cam sáng rực (`drop-shadow-[0_0_8px_#FBBF24]`).

3. **Bất Biến KHÔNG Phủ Màu Đè Lên Nội Dung Thẻ & Quầng Lửa Liền Mạch (Zero Content Tint & Seamless Flame Halo):**
   - **TUYỆT ĐỐI KHÔNG phủ bất kỳ lớp màu cam/đỏ nào đè lên ảnh bìa hay chữ:** Ảnh bìa poster và tên game/phim/nhạc phải giữ nguyên 100% độ sắc nét và màu sắc gốc. Không đặt gradient nhiệt hay overlay đè lên vùng nội dung thẻ.
   - **Quầng lửa liền mạch quanh viền ngoài (Seamless Flame Halo):** Thay thế các khối/cục lửa rời rạc ở 4 góc bằng một quầng lửa chuyển động mềm mại, liền mạch bao quanh toàn bộ 4 cạnh viền ngoài của thẻ (lõi sáng vàng trắng sát viền thẻ, chuyển sang cam rực và tan thành làn khói mờ ở rìa ngoài).
   - Tương tác hover: Thẻ phóng to toàn khối `scale(1.06)`, quầng lửa bùng lên êm ái. Khi rời chuột: ngọn lửa từ từ hạ thấp, thu nhỏ và tắt lịm mượt mà trong đúng `0.45s`.

4. **Vùng Đệm An Toàn Cho Hàng Thẻ Cuộn (Row Container Clearance Invariant):**
   - Các container chứa hàng thẻ (`GenreShelfScroller` và các grid/flex hàng thẻ) bắt buộc phải cung cấp đủ vùng đệm an toàn theo chiều dọc (`py-6 -my-3`) kết hợp nâng `z-index` của thẻ đang hover.
   - Tuyệt đối không để mép trên hoặc mép dưới của ngọn lửa và thẻ phóng to bị cắt ngang sắc lẹm, đồng thời không tạo thanh cuộn dọc thừa trên hàng thẻ.

5. **Rãnh Nứt Nham Thạch Hữu Cơ Đa Tầng (Organic Volcanic Fissures Invariant):**
   - Các vết nứt trên thanh phát nhạc bắt buộc phải là đường rãnh nứt tự nhiên có độ dày mỏng không đều, rẽ nhánh hữu cơ như bề mặt đá núi lửa thật, tuyệt đối không dùng các đường kẻ thẳng gấp khúc đơn giản.
   - *Trạng thái Paused:* Khung co gọn; các rãnh nứt khép lại thành đường vân rãnh tối màu chìm trên mặt đá đen (`#26140D`, không phát sáng cam vàng).
   - *Trạng thái Playing:* Khung giãn nở nhẹ `scale(1.015)`, rãnh nứt tách rộng (`strokeWidth="2.8"`) để lộ dòng dung nham nóng chảy (`#FBBF24`, `#F97316`, `#EF4444`) phát sáng rực rỡ từ sâu bên trong với hiệu ứng tỏa nhiệt ấm (`inner glow` và `@keyframes magmaPulse`).

6. **Cơ Chế Thiêu Rụi Giấy Cháy Từ Tâm Nút X (0.85s Paper-Burn Dissolve Close Invariant):**
   - Khi bấm nút `X` tắt thanh phát nhạc, bắt buộc chặn việc ẩn ngay lập tức, trì hoãn đúng `0.85 giây` (850ms) để chạy trọn vẹn hoạt ảnh đốt cháy.
   - *Diễn tiến cháy lan:*
     - `0.0s`: Đốm lửa bùng lên tại tâm nút `X` bên phải.
     - `0.1s -> 0.75s`: Mặt trận lửa hình vòng cung răng cưa nham nhở (`CSS mask-image` + `SVG feTurbulence`) lan dần từ phải sang hết bên trái. Lửa cháy lan tới đâu, thanh phát nhạc phía bên phải biến thành tro đen và biến mất tới đó.
     - *Mép cháy:* Viền than hồng sáng rực màu cam vàng (`Glowing Ember Edge`), kèm tàn tro nhỏ li ti và làn khói mỏng bay nhẹ lên trên trước khi gọi hàm đóng gốc.

7. **An Toàn Tương Tác & Phản Cực Solar/Lunar:**
   - Mọi lớp đồ họa ngọn lửa, tàn lửa, khói và dung nham bắt buộc mang `pointer-events: none`.
   - Khi ở Ignis Mode, nút gạt Solar/Lunar tự động mờ và mất màu (`opacity: 0.4` + `grayscale(100%)`). Bấm vào nút gạt này sẽ thoát Ignis để quay về Solar hoặc Lunar.
   - Đồng bộ 100% mọi màn hình sang ngôn ngữ Ignis khi được kích hoạt.

### 7.18 Aer Mode (Phong — Ultra-Performance & Zero-Gravity Architecture) Invariants (v6.4)
When `theme === 'aer'` or `[data-theme="aer"]`, the application strictly adheres to the Ultra-Performance & Zero-Gravity Swiss Wireframe Architecture:
1. **Zero Heavy GPU/CPU Effects (Universal Master Override):**
   - Disables 100% of `backdrop-filter: blur(...)` across all panels, modals, toolbars, and cards (`backdrop-filter: none !important;`).
   - Eliminates multi-layered ambient `box-shadow` (`box-shadow: none !important;`).
   - Disables SVG displacement/turbulence filters and continuous particle/canvas loops.
2. **Strict Tonal Stepping Hierarchy (No Blur Separation):**
   - App Canvas: Mist Slate (`#EEF2F6`).
   - Content Cards (Game, Phim, Nhạc, Thư viện): Pure White (`#FFFFFF`) with crisp hairline border (`#CBD5E1`).
   - Sub-boxes & Search inputs: Atmospheric Slate (`#E2E8F0`).
   - Toolbars (Header PC, MiniPlayer, Mobile Tab Bar): Steel Mist (`#CAD6E2`) with 1.5px border (`#94A3B8`).
   - Primary Text: Deep Slate Ink (`#0F172A`, WCAG AAA > 14:1).
   - Secondary Text: Slate Neutral (`#475569`, WCAG AA > 5.5:1).
   - Accent: Airy Cyan-Teal (`#0284C7`).
3. **Instant Interaction (0ms Delay & Zero Bloat):**
   - Card Hover: `scale(1)` (no layout shifts, no delayed scale animations), immediate hairline border switch to `#0284C7` (`transition-none` / 0ms).
   - MiniPlayer Close: Instant unmount (`0ms delay`), no burning/dissolution delays.
4. **Connected Floating Wireframe Header (PC):**
   - 3 distinct capsules (Logo/Brand, 5 Tabs, Controls) connected by a central horizontal hairline axis (`1px solid #CBD5E1`).
   - Active Tab: Sharply defined by a `2.5px` bottom hairline bar (`#0284C7`) and an aerodynamic indicator dot (`w-1.5 h-1.5 bg-[#0284C7]`).
5. **Ultra-Slim Aerodynamic Scrubber (MiniPlayer PC & Mobile):**
   - Direct `3px` linear progress bar (`#0284C7`) with a minimalist vertical cursor line (`w-1 h-3.5 bg-[#0284C7] rounded-sm`).
6. **Battery & Resource Optimization:**
   - Image tags enforce `loading="lazy"` and `decoding="async"`.
   - Idle CPU/GPU usage reaches ~0% when user is not interacting (pausing auto-slide carousel in HeroBanner and background teaser video in MediaTrailerBanner).
7. **Business Logic & Control Completeness Invariant:**
   - 100% of buttons, inputs, modals, search, playback controls, admin tools, and routing are strictly preserved.
   - Theme toggle switch shows dimmed + grayscale (`opacity: 0.4 grayscale(100%)`) in Aer Mode; clicking it safely exits back to Lunar or Solar mode.

### 7.19 Light Themes (Aer, Solar, Aqua) Chromatic Invariants & Anti-Washout Standard (v6.5)
When the active theme is one of the light modes (`aer`, `solar`, `aqua`), the application strictly adheres to the following chromatic and legibility standards:
1. **Zero Yellow Text on Light Backgrounds (Strict WCAG Invariant):**
   - Strictly prohibit `text-amber-300`, `text-amber-400`, and `text-yellow-300` on white or light backgrounds.
   - Text color must resolve to high-contrast dark ink tones (Aer: `#0F172A`, `#0284C7`; Aqua: `#0C4A6E`, `#0284C7`; Solar: `#0F172A`, `#92400E` / `#D97706`).
   - Active buttons with amber accents in Solar must use dark slate ink text (`bg-amber-400 text-slate-950 font-extrabold`).
2. **Global CSS Safety Guard (Double Shield):**
   - In `index.css`, enforce automatic high-contrast overrides under `[data-theme="aer"]`, `[data-theme="solar"]`, and `[data-theme="aqua"]` to guarantee zero unreadable light-amber text survives any component or plugin injection.
3. **Complete Elimination of Poster Fog Overlays:**
   - On light backgrounds, bottom gradients (`from-ice-card via-transparent to-transparent`) create an opaque white milk fog that degrades game and media artwork.
   - All light modes (`aer`, `solar`, `aqua`) must completely suppress `.game-card-poster-fog` (`display: none !important;`) and conditionally omit the fog element in JSX.
4. **Genre & Status Badge Legibility on Media Cards:**
   - Any badge overlaid on top of game or media artwork must use explicit high-contrast styling: `text-white font-semibold bg-black/75 border border-white/20 backdrop-blur-sm`, avoiding `text-ice-subtext` which resolves to dark grey in light themes.
5. **Harmonized 4-Tab & Sub-Tab Architecture:**
   - In Library (Game, Movie, Music, Podcast) and Entertainment sub-tabs, active tabs must cleanly reflect the native theme palette:
     - **Aer:** Clean solid `#0284C7` with white text, zero shadow.
     - **Aqua:** Ocean sky blue (`bg-sky-500`) with crisp white text.
     - **Solar:** Radiant amber-500 (`bg-amber-500`) with dark slate ink text (`#0F172A`).
6. **Toolbar Depth Separation in Aer Mode:**
   - The Aer Mode toolbars (PC Header capsules, MiniPlayer, Mobile Navigation) must maintain distinct elevation from the `#EEF2F6` canvas using `#CAD6E2` (Steel Mist) with `#94A3B8` hairline borders.

### 7.20 Auto-Login Session Persistence & Immediate Admin Cloud Sync Invariants (v6.6)
1. **Single Source of Truth for App Version (Version Invalidation):**
   - The application version must be defined from a single synchronized constant `APP_VERSION` (matching `package.json`).
   - When a user logs in, `markCurrentVersionLoggedIn(APP_VERSION)` must record the exact current version in storage.
   - On app startup, `shouldRequireReLoginForNewVersion(APP_VERSION)` only invalidates the session if a previously recorded version exists and differs from `APP_VERSION`. If the version matches, the app must automatically restore the active profile silently without prompting the login screen.
2. **Zero-Session Data Loss on Cloud Sync Startup:**
   - On startup, if cloud profiles sync after initial local load, the app must reconcile the remembered/active profile ID against freshly pulled cloud profiles rather than resetting to a blank session.
3. **Immediate Real-time Cloud Sync for All Admin Mutations (No Lock Dependency):**
   - Strictly prohibit deferring cloud persistence to the Admin Lock action.
   - Any mutation performed by Admin (Adding, editing, deleting, or toggling hidden status of games/media, editing tags, changing banner settings, approving devices, or modifying profiles) must immediately invoke the corresponding Supabase Cloud upsert/delete operations.
4. **Instant Cloud Pull on Admin Activation:**
   - Opening the Admin mode (via PIN or Master PIN verification in `handleAdminSuccess`) must immediately trigger a Cloud Pull (`syncCloud()` on Electron, `fetchDirectCloudCatalog()` on Mobile/Web) to ensure the Admin interface immediately displays the freshest state from the central cloud database.

---

## 8. Mobile Edge-to-Edge Cutout, Floating Island & Video Theater Architecture

1. **Edge-to-Edge Display Cutout Integration (Camera Giọt Nước / Punch-Hole):**
   - In `MainActivity.java` (Android 9+ / API 28+), always enforce `lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`.
   - Always invoke `WindowCompat.setDecorFitsSystemWindows(getWindow(), false)` with transparent status and navigation bars.
   - In frontend React components, NEVER place empty spacer elements (e.g. `<div className="h-[env(safe-area-inset-top)] shrink-0" />`) in top-level flex column layouts, as this creates artificial black letterboxing bars on notched devices. Instead, apply padding inline directly on content headers (`pt-[max(0.75rem,env(safe-area-inset-top,0px))]`) while letting the background canvas stretch 100% edge-to-edge.

2. **Pure Floating Island Bottom Navigation (Ốc Đảo Nổi Thuần Túy):**
   - The Mobile Bottom Navigation Bar and MiniPlayer must be positioned as a floating overlay (`absolute bottom-0 inset-x-0 z-40 pointer-events-none flex flex-col items-center pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] px-3.5`).
   - The interactive nav pill elements must have `pointer-events-auto`.
   - Never wrap the bottom nav in a solid full-width rectangle bar. Content lists must scroll freely behind and around all 4 sides of the rounded pill, using `pb-28` to ensure the final items can scroll comfortably above the floating island.
   - Special mode glasses: Mode Aqua must employ translucent water glass (`bg-sky-100/35 border-sky-300/50 backdrop-blur-2xl`) allowing posters and titles to glide visibly underneath.

3. **Horizontal Scroll Container Padding (Zero Ring Clipping):**
   - Whenever horizontal scrollers with `overflow-x-auto` (such as Celestial Themes row in Mobile Settings) contain items with active rings (`ring-2 ring-ice-accent`), always allocate vertical breathing room (`pt-2.5 pb-2.5 px-2 -mx-2`). Failure to provide top padding causes the parent's `overflow-y: hidden` to clip off the top 2px ring border.

4. **Mobile Video Player Natural Orientation & Letterbox Elimination:**
   - Avoid programmatic forced screen orientation locks (`lockToLandscape`) during video playback, as this can crash or cause overlapping video render bugs on various Android WebViews. Allow natural device sensor rotation.
   - Container must enforce standard `aspect-video` (16:9) and fill width/height seamlessly to eliminate top and bottom black letterbox bars without cropping or distorting video.
   - Drive/External video launcher cards must display the crisp 16:9 thumbnail preview banner (`media.bannerPath || media.coverPath`) with a subtle cinematic gradient and glowing play button instead of a pitch-black screen.

---

## 10. Data Privacy, Sliding Indicator Anchoring & Media Theater Stability

### 10.1 Data Privacy Shield — No Leaked Source/Download Links
- Non-admin users must NEVER have access to raw download URLs, Google Drive links, or stream sources.
- **RULE:** Remove all "Copy Link", "Sao chép link", and "Mở link nguồn trên trình duyệt" buttons from client-facing video theater, media cards, game cards, and audio views.
- Only Admin forms (`GameFormModal`, `MediaFormModal`) are permitted to view and edit raw link strings.

### 10.2 Sliding Indicator Flex Anchoring (`left: 0`)
- When creating animated sliding indicators (e.g., `.aqua-droplet-bubble`) inside a flex container with `transform: translate3d(offsetLeft, ...)`:
- **RULE:** Always explicitly specify `left: 0; top: 50%;` in CSS. Without `left: 0`, Blink/WebKit lays out the absolute element according to flex item flow before applying the transform, causing cumulative offset errors (shifting by 2 or more tabs).

### 10.3 Universal BGM Interruption
- Background music (BGM) must be paused unconditionally whenever ANY video, trailer, or media stream begins playback.
- **RULE:** Emit a global `window.dispatchEvent(new CustomEvent('icelauch-pause-bgm'))` on video start, and handle it in the root audio manager to ensure 100% pause reliability across all views.

---

## 11. Quick Reference — Key Files

| Concern | File(s) |
|---------|---------|
| Admin PIN hashing (Electron) | `src/main/services/storage.ts` |
| Admin PIN hashing (Mobile/Web) | `src/renderer/src/services/platformAdapter.ts` |
| Device GUID & registry | `src/renderer/src/services/deviceAuth.ts` |
| Cloud sync (upsert + pull) | `src/main/services/supabaseSync.ts` |
| Hidden filter — Games | `src/renderer/src/components/home/HomeView.tsx` (baseGames) |
| Hidden filter — Media | `src/renderer/src/components/media/MediaView.tsx` (baseMedia) |
| Electron window focus | `src/main/index.ts` |
| Android IME / keyboard | `android/app/src/main/AndroidManifest.xml`, `capacitor.config.json` |
| Android Display Cutout & Native Orientation | `android/app/src/main/java/com/icelauch/app/MainActivity.java`, `ScreenOrientationPlugin.java` |
| Mobile Version Invariant & APK Updater | `src/renderer/src/utils/apkUpdater.ts` |
| Known Accounts & Profile Memory | `src/renderer/src/components/profile/ProfilePickerView.tsx` |

---

## 12. Cross-Platform Version Invariant & Modal Isolation Guardrails

### 12.1 Version SSOT & Update Alert Accuracy
- `CURRENT_MOBILE_VERSION` in `src/renderer/src/utils/apkUpdater.ts` MUST match `package.json`, `android/app/build.gradle`, and `App.tsx` on every release.
- A mismatch causes false update popups on mobile devices immediately after updating.

### 12.2 Modal Event Isolation in Frameless Windows
- Modals opened on PC must isolate double-click events (`onDoubleClick={(e) => e.stopPropagation()}`) and declare `style={{ WebkitAppRegion: 'no-drag' }}`.
- Without this, React synthetic event bubbling from portals inside draggable headers will trigger native window maximize/unmaximize on double-click.

### 12.3 Cloud-First Reconciliation Over Local Cache
- Local storage acts as a fast-boot cache. Upon startup or network connectivity, Supabase Cloud catalog data must take precedence and hydrate local cache.
- Admin mutations (hide/unhide, transform metadata, tags, banners) must write atomically to Supabase to prevent app updates from resetting catalog customizations back to template `data.json`.

### 12.4 Android Gesture Bar Contrast Elimination
- On Android 10+ (API 29+), call `getWindow().setNavigationBarContrastEnforced(false)` in `MainActivity.java` and declare `enforceNavigationBarContrast = false` in `values-v29/styles.xml` to eliminate the dark overlay bar over bottom system gestures.

---

## 13. Cross-Device E2E Testing Protocol & Data Sandboxing

### 13.1 Data Sandboxing & Zero-Leftover Teardown
- **Test Item Prefix:** All media, games, and tags created during automated tests MUST carry the `[E2E_TEST]` prefix.
- **Teardown Lifecycle:** Every test runner execution must guarantee clean teardown (via `try...finally`), purging 100% of `[E2E_TEST]` entities from local storage and Supabase Cloud.

### 13.2 Dual-Bridge Hybrid Architecture
- **PC Automation:** Connects to Electron Chrome DevTools Protocol (`127.0.0.1:9222`) for direct DOM control, state evaluation, and renderer screenshotting.
- **Mobile Hybrid Automation:** Connects via ADB (`adb.exe`) to forwarded Android WebView DevTools (`127.0.0.1:9223`) for DOM/state operations, combined with native `adb exec-out screencap -p` for true edge-to-edge physical screen verification (including system gesture bar inspection).

### 13.3 Triple-Layer Concurrent Verification
Every state-mutating test case (hide/unhide, tag deletion, transform adjustment, metadata edits) MUST verify three layers concurrently:
1. **Layer 1 (Local UI):** Immediate UI state reflection & toast confirmation.
2. **Layer 2 (Cloud DB):** Direct Supabase query asserting correct column values and metadata serialization without duplicate primary keys.
3. **Layer 3 (Cross-Device Reflection):** Secondary device pull/sync verification confirming end-to-end multi-device consistency.

---

*Last updated: 2026-11-21 | Icelauch v1.2.8 / Banner Inline Drawer, Cloud Tag Sync & Cross-Device E2E Automation*
