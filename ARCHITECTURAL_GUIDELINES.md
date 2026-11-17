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

## 7. Quick Reference — Key Files

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
| Verification suite | `scripts/run-all-verifications.cjs` |

---

*Last updated: 2026-11-17 | Icelauch v1.2.2 System Overhaul*
