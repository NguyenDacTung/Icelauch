# E2E Test Infra & QA Checklist: Icelauch

## Test Philosophy
- Multi-platform verification (Electron Desktop Windows + Capacitor Android Mobile Viewport).
- Functional correctness, session isolation, privacy boundary enforcement, audio playback stability, zero-overflow responsive layout, and clean production build.

## Feature Inventory Coverage
| # | Feature | Target Milestone | Test Category | Tier |
|---|---------|------------------|---------------|------|
| 1 | Auth Session Isolation | M1 | Session & Auth | Tier 1, 2, 4 |
| 2 | Supabase Data Segregation | M1 | Security & Privacy | Tier 1, 2, 4 |
| 3 | Single Audio Engine & Conflict Fix | M2 | Audio Architecture | Tier 1, 2, 3 |
| 4 | Background Vinyl Disk Removal | M2 | UI Cleanness | Tier 1 |
| 5 | Return to Current Playing Song Button | M2 | Navigation & UX | Tier 1, 3 |
| 6 | Mobile Audio Direct Streaming & MediaSession | M3 | Mobile Audio | Tier 1, 2, 4 |
| 7 | Mobile Zero-Overflow Mini Player | M3 | Responsive Layout | Tier 1, 2 |
| 8 | Dedicated Mobile Full Player UI | M3 | Mobile UI & Touch | Tier 1, 2 |
| 9 | Pre-Packaging Compilation & Build Validation | M4 | Build & Packaging | Tier 1, 4 |

## Verification Test Modules (7 Modules)
- Module 1: Auth & Session Isolation (`TC-AUTH-01` to `TC-AUTH-05`)
- Module 2: Admin Data Isolation (`TC-ADM-01` to `TC-ADM-04`)
- Module 3: Desktop Audio Player & Navigation (`TC-DSK-01` to `TC-DSK-06`)
- Module 4: Mobile Audio Playback & MediaSession (`TC-MOB-01` to `TC-MOB-06`)
- Module 5: Mobile Layout & Zero-Overflow (`TC-MLAY-01` to `TC-MLAY-05`)
- Module 6: Mobile Full Player UI & Touch UX (`TC-MUI-01` to `TC-MUI-06`)
- Module 7: Packaging & Build Verification (`TC-PKG-01` to `TC-PKG-04`)

## Automated Build Verification Commands
```powershell
cmd /c npx tsc --noEmit
cmd /c npm run build
```
Expected output: 0 errors, successful Vite & Electron bundles.
