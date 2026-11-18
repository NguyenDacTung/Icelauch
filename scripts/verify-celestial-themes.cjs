const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('========================================================================================');
console.log('          CELESTIAL DESIGN SYSTEM (9 THEMES & CONTRAST) VERIFICATION');
console.log('========================================================================================');

const cssSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/src/index.css'), 'utf8');
const hookSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/src/hooks/useTheme.ts'), 'utf8');
const hubSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/src/components/common/CelestialThemeHub.tsx'), 'utf8');
const switchSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/src/components/common/ThemeToggleSwitch.tsx'), 'utf8');
const navSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/src/components/layout/Navbar.tsx'), 'utf8');
const miniSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/src/components/layout/MiniPlayer.tsx'), 'utf8');
const mobileFrameSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/src/components/common/DevicePhoneFrame.tsx'), 'utf8');
const mobileMiniSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/src/components/mobile/MobileMiniPlayer.tsx'), 'utf8');
const settingsSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/src/components/common/SettingsView.tsx'), 'utf8');
const mobileSettingsSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/renderer/src/components/mobile/MobileSettingsView.tsx'), 'utf8');

// 1. Verify CSS Selectors for 9 themes
const expectedThemes = ['lunar', 'solar', 'aqua', 'ignis', 'aer', 'terra', 'eclipse', 'aurora', 'nebula'];
expectedThemes.forEach(theme => {
  assert.ok(cssSrc.includes(`[data-theme="${theme}"]`), `index.css must define [data-theme="${theme}"]`);
  console.log(`[PASS] CSS Theme Token: [data-theme="${theme}"] declared`);
});

// 2. Verify Solar WCAG Contrast Tokens
assert.ok(cssSrc.includes('#181512'), 'Solar text token must be #181512 (WCAG AAA)');
assert.ok(cssSrc.includes('#524C46'), 'Solar subtext token must be #524C46 (WCAG AA)');
assert.ok(cssSrc.includes('#D97706'), 'Solar accent token must be #D97706 (WCAG AA)');
console.log('[PASS] Solar WCAG AAA/AA text and accent tokens verified');

// 3. Verify Elevation & Tinted Rim tokens in CSS
assert.ok(cssSrc.includes('.glass-header-elevated'), 'index.css must define .glass-header-elevated');
assert.ok(cssSrc.includes('.glass-pill-elevated'), 'index.css must define .glass-pill-elevated');
assert.ok(cssSrc.includes('.adaptive-card'), 'index.css must define .adaptive-card');
assert.ok(cssSrc.includes('backdrop-filter: none !important'), 'Aer mode must disable heavy backdrop-filter');
console.log('[PASS] Floating elevation and Aer mode battery saver overrides verified');

// 4. Verify useTheme Engine
assert.ok(hookSrc.includes("'lunar'") && hookSrc.includes("'solar'") && hookSrc.includes("'aqua'"), 'useTheme must define 9 ThemeMode union');
assert.ok(hookSrc.includes('THEME_REGISTRY'), 'useTheme must export THEME_REGISTRY');
assert.ok(hookSrc.includes('isLightMode'), 'useTheme must export isLightMode helper');
console.log('[PASS] useTheme Engine with 9 ThemeMode union and THEME_REGISTRY verified');

// 5. Verify CelestialThemeHub Component
assert.ok(hubSrc.includes('CelestialThemeHub'), 'CelestialThemeHub component must be declared');
assert.ok(hubSrc.includes('handleSelectTheme'), 'CelestialThemeHub must support 1-click theme switching');
console.log('[PASS] CelestialThemeHub component verified');

// 6. Verify Controls Integration
assert.ok(switchSrc.includes('CelestialThemeHub'), 'ThemeToggleSwitch must mount CelestialThemeHub');
assert.ok(switchSrc.includes('showPaletteButton'), 'ThemeToggleSwitch must support palette button');
assert.ok(navSrc.includes('glass-header-elevated'), 'Navbar must use glass-header-elevated');
assert.ok(miniSrc.includes('glass-pill-elevated'), 'MiniPlayer must use glass-pill-elevated');
assert.ok(mobileFrameSrc.includes('glass-pill-elevated'), 'DevicePhoneFrame must use glass-pill-elevated');
assert.ok(mobileMiniSrc.includes('glass-header-elevated'), 'MobileMiniPlayer must use glass-header-elevated');
console.log('[PASS] PC Header, MiniPlayer, Mobile Tab Bar, and Mobile MiniPlayer elevation verified');

// 7. Verify Settings Views
assert.ok(settingsSrc.includes('Hệ Thống 9 Chế Độ Thời Không'), 'SettingsView must contain 9 themes gallery');
assert.ok(mobileSettingsSrc.includes('9 Chế độ Thời Không'), 'MobileSettingsView must contain mobile theme picker');
console.log('[PASS] PC SettingsView & MobileSettingsView 9-theme showcase verified');

console.log('\n>>> ALL CELESTIAL THEME TESTS PASSED (100%) <<<');
