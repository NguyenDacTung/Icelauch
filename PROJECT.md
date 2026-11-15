# Project: Icelauch — Release Pre-Packaging Overhaul

## Architecture
Icelauch is a multi-platform gaming and multimedia application built with:
- **Core UI**: React 19.2.4, TypeScript 5.9.3, Vite 8.3.6, Tailwind CSS 4.1.18, Lucide React icons.
- **Desktop Engine**: Electron 40.8.0 with main process Node.js services (storage, local HTTP stream proxy, IPC bridges).
- **Mobile Engine**: Capacitor 8.6.0 with Android WebView runtime (`@capacitor/android`, `@capacitor/app`, `@capacitor/core`).
- **Backend & Cloud**: Supabase PostgreSQL database and Storage buckets (`icelauch_games`, `icelauch_media`, `icelauch_playlists`, `icelauch_profiles`, `icelauch_user_data`, `icelauch_icedrop`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Auth Session Isolation | Prevent cross-device account overwrite by removing unconditional `profiles[0]` auto-select, storing `activeProfileId` and `rememberedProfileId` in `localStorage`, and sorting Supabase profile queries by `created_at.asc` | M1 | R1 (Survey 1) |
| 2 | Supabase Data Segregation | Strictly restrict Admin upload (`publishCatalog`, `syncAll`, `runAutoCloudSync`) to shared system catalog data (`Game`, `MediaItem`, system playlists `!isUserCustom && !ownerProfileId`), preventing any user private data (`UserProfile`, PIN, library, favorites, watch progress, custom playlists) from uploading to cloud | M1 | R1 (Survey 1) |
| 3 | Single Audio Engine & Conflict Fix | Eliminate dual HTML5 `<audio>` tags by making `MiniPlayer` the single persistent audio engine, refactoring `VinylTurntablePlayer` to controlled UI, fixing `isTurntableOpen` tab-leak, supporting offline downloaded files (`file://`), and throttling IPC updates | M2 | R2 (Survey 2) |
| 4 | Background Vinyl Disk Removal | Completely remove `FloatingMiniDiscWidget.tsx` and its rendering in `App.tsx`, eliminating visual clutter and PIP collision | M2 | R2 (Survey 2) |
| 5 | Return to Current Playing Song Button | Add navigation button (`Maximize2`) and clickable metadata to `MiniPlayer` that switches to Media tab and opens the turntable view with the active song | M2 | R2 (Survey 2) |
| 6 | Mobile Audio Direct Streaming & MediaSession | Transform Google Drive URLs into direct audio download streams (`drive.usercontent.google.com/download?id=...&export=download`) on Android WebView, and integrate Web Media Session API for lockscreen, notification shade, and Bluetooth earbud controls | M3 | R3 (Survey 3) |
| 7 | Mobile Zero-Overflow Mini Player & Frame Integration | Implement dedicated `MobileMiniPlayer` (54px, 100% width, no volume slider) docked directly above `renderBottomNav()` inside `DevicePhoneFrame` respecting safe area insets, eliminating 188-240px horizontal overflow | M3 | R3 (Survey 3) |
| 8 | Dedicated Mobile Full Player UI | Upgrade `MobileVinylPlayerModal` with touch-friendly scrubber seekbar, current/duration time indicators (`mm:ss`), minimize action, and queue drawer | M3 | R3 (Survey 3) |
| 9 | Pre-Packaging Testing & Validation | Execute 7-module comprehensive QA checklist across Auth, Admin Data, Desktop Player, Mobile Audio, Mobile Layout, Mobile UI, and build verification (`tsc --noEmit`, `npm run build`, `npx cap sync android`) | M4 | R4 (Survey 3) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Auth Session Isolation & Supabase Data Segregation | Implement independent device sessions via localStorage, fix Supabase profile ordering, enforce Admin upload boundaries to shared catalog only | None | DONE |
| M2 | Desktop Audio Player & Mini Bar Optimization | Refactor to Single Persistent Audio Engine, delete FloatingMiniDiscWidget, add return-to-playing-song navigation, support offline audio, throttle IPC | M1 | DONE |
| M3 | Mobile Audio Playback & Dedicated Responsive Mobile Player UI | Implement direct audio stream URL transformation, MediaSession API, zero-overflow MobileMiniPlayer inside DevicePhoneFrame, and enhanced MobileVinylPlayerModal | M2 | DONE |
| M4 | Comprehensive Pre-Packaging QA & Checklist Verification | Execute full 7-module test checklist, run automated compiler and build validations, generate formal verification report | M3 | DONE |

## Interface Contracts
### Client Storage ↔ Platform Adapter (M1)
- `localStorage.getItem('icelauch_active_profile_id'): string | null`
- `localStorage.getItem('icelauch_remembered_profile_id'): string | null`
- `fetchDirectCloudCatalog()`: queries `icelauch_profiles?select=*&order=created_at.asc`

### Admin Upload ↔ Cloud Storage (M1)
- `publishCatalog(url, anonKey, games, media, playlists)`:
  - `systemPlaylists = playlists.filter(p => !p.isUserCustom && !p.ownerProfileId)`
  - MUST NOT call `upsertProfile` or `upsertUserData`
- `runAutoCloudSync`:
  - Syncs only `games`, `media`, and `systemPlaylists`

### App ↔ MiniPlayer ↔ VinylTurntablePlayer (M2)
- `App.tsx` maintains:
  - `currentTrack: MediaItem | null`
  - `isPlayingAudio: boolean`
  - `isTurntableActive: boolean` (derived: `isTurntableOpen && currentTab === 'media'`)
- `MiniPlayer.tsx`:
  - Single `<audio ref={audioRef}>` element
  - Props: `currentTrack`, `isPlaying`, `onTogglePlay`, `onNext`, `onPrev`, `onTrackProgress`, `onNavigateToTrack`, `isTurntableActive`
  - When `isTurntableActive === true`, renders hidden visual container but keeps `<audio>` alive
- `VinylTurntablePlayer.tsx`:
  - Controlled UI component (no internal `<audio>` tag)
  - Props: `media`, `isPlaying`, `currentTime`, `duration`, `onTogglePlay`, `onSeek`, `onNext`, `onPrev`, `onBack`

### Mobile URL Resolver & Media Session (M3)
- `getDirectAudioStreamUrl(rawUrl: string): string`: Converts Google Drive view/embed URLs to direct binary stream URL for Android WebView
- `updateMediaSession(track: MediaItem, isPlaying: boolean, handlers: MediaSessionHandlers): void`
- `MobileMiniPlayer.tsx`:
  - Props: `currentTrack`, `isPlaying`, `currentTime`, `duration`, `onTogglePlay`, `onOpenFullPlayer`, `onClose`
  - Height: 54px, docked inside `DevicePhoneFrame` above `renderBottomNav()`

## Code Layout
- `src/renderer/src/App.tsx`: Global state, routing, and component orchestration
- `src/renderer/src/services/platformAdapter.ts`: Platform abstraction and Supabase direct fetching
- `src/main/services/supabaseSync.ts`: Desktop Supabase sync and catalog publish services
- `src/main/index.ts`: Electron main process lifecycle and IPC handlers
- `src/renderer/src/components/layout/MiniPlayer.tsx`: Desktop audio player bar and single audio engine
- `src/renderer/src/components/media/VinylTurntablePlayer.tsx`: Desktop full vinyl turntable UI
- `src/renderer/src/components/media/MediaView.tsx`: Desktop media and music catalog view
- `src/renderer/src/components/media/FloatingMiniDiscWidget.tsx`: [DEPRECATED / TO BE DELETED]
- `src/renderer/src/utils/mediaUrl.ts`: Media URL parsing and direct stream transformation
- `src/renderer/src/utils/mediaSession.ts`: Web Media Session API helper
- `src/renderer/src/components/mobile/MobileMiniPlayer.tsx`: Mobile compact player bar
- `src/renderer/src/components/common/DevicePhoneFrame.tsx`: Mobile emulation frame and responsive container
- `src/renderer/src/components/mobile/MobileVinylPlayerModal.tsx`: Mobile full-screen player modal
