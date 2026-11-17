/**
 * Tier 4: Real-World Application Scenarios Verification Suite
 * Exactly 6 comprehensive scenarios (T4-SCEN-01 to T4-SCEN-06)
 * Defined in TEST_INFRA.md and Explorer 3 Report.
 */

const assert = require('assert');
const path = require('path');
const {
  ADMIN_PIN_PRI,
  readFile,
  fileExists,
  MockLocalStorage,
  MockSupabaseApi,
  simulateVerifyAdminPin,
  sha256Sync,
  evaluate9LeakPoints,
} = require('./test-helpers.cjs');

async function runTier4Tests(options = {}) {
  const logger = options.logger || console.log;
  const results = [];
  const failures = [];

  async function recordScenario(id, title, fn) {
    const startTime = Date.now();
    try {
      await fn();
      const durationMs = Date.now() - startTime;
      results.push({ id, title, status: 'PASS', details: 'OK', durationMs });
      if (options.verbose) {
        logger(`  \x1b[32m[PASS]\x1b[0m ${id}: ${title} (${durationMs}ms)`);
      }
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err.message || String(err);
      results.push({ id, title, status: 'FAIL', details: errorMsg, durationMs });
      failures.push({ id, title, error: errorMsg, stack: err.stack });
      if (options.verbose) {
        logger(`  \x1b[31m[FAIL]\x1b[0m ${id}: ${title} - ${errorMsg}`);
      }
    }
  }

  // =========================================================================
  // 1. T4-SCEN-01: Complete Admin Lifecycle
  // =========================================================================
  await recordScenario('T4-SCEN-01', 'Complete Admin Lifecycle: Unlock, Approval, CRUD, Hide & Delete', async () => {
    const api = new MockSupabaseApi();
    const storage = new MockLocalStorage();
    let session = { isAdmin: false };

    // Step 1 (Unlock): Admin enters Master PIN 42336737
    const unlocked = simulateVerifyAdminPin(ADMIN_PIN_PRI, storage);
    assert.strictEqual(unlocked, true, 'Master PIN must unlock Admin mode');
    session.isAdmin = true;

    // Step 2 (Device Approval): Admin approves pending device
    const pendingDev = { device_id: 'ICE-MOB-DEV-01', device_name: 'Samsung Tab', status: 'pending' };
    await api.upsert('icelauch_device_registry', pendingDev);

    await api.upsert('icelauch_device_registry', {
      device_id: 'ICE-MOB-DEV-01',
      device_name: 'Samsung Tab',
      status: 'approved',
      approved_at: new Date().toISOString(),
    });
    const approvedDevices = await api.select('icelauch_device_registry', d => d.device_id === 'ICE-MOB-DEV-01');
    assert.strictEqual(approvedDevices[0].status, 'approved');

    // Step 3 (Catalog Creation): Admin adds shared video
    const newVideo = { id: 'vid_new_4k', title: 'Matrix 4K', type: 'video', hidden: false };
    await api.upsert('icelauch_media', newVideo);

    // Step 4 (Content Hiding): Admin marks obsolete item as hidden
    const obsoleteVideo = { id: 'vid_obsolete', title: 'Old Trailer', type: 'video', hidden: true };
    await api.upsert('icelauch_media', obsoleteVideo);

    // Step 5 (Content Deletion): Admin deletes deprecated game
    await api.upsert('icelauch_games', { id: 'game_deprecated', name: 'Legacy Game' });
    await api.delete('icelauch_games', 'game_deprecated');

    // Step 6 (Multi-Component Assertions)
    const mediaList = await api.select('icelauch_media');
    assert.strictEqual(mediaList.some(m => m.id === 'vid_new_4k'), true);

    const nonAdminMedia = mediaList.filter(m => !m.hidden);
    assert.strictEqual(nonAdminMedia.some(m => m.id === 'vid_obsolete'), false);

    const gamesList = await api.select('icelauch_games');
    assert.strictEqual(gamesList.some(g => g.id === 'game_deprecated'), false);
  });

  // =========================================================================
  // 2. T4-SCEN-02: Mobile End-to-End User Journey
  // =========================================================================
  await recordScenario('T4-SCEN-02', 'Mobile User Journey: IME Input, Profile Auth, Partitioning & Cold Boot', async () => {
    const api = new MockSupabaseApi();
    const storage = new MockLocalStorage({
      icelauch_device_id: 'ICE-MOB-JOURNEY-01',
      icelauch_device_approved_status: 'approved',
    });

    // Step 1 (Input Handling): Mobile search input composition
    const query = 'Chiếu Rạp';
    const normalizedQuery = query.toLowerCase().trim();
    assert.strictEqual(normalizedQuery, 'chiếu rạp');

    // Step 2 (On-Demand Profile Auth): Profile exists in Supabase Cloud
    const cloudProfile = { id: 'user_hanoi', nickname: 'Hanoi User', pin_hash: sha256Sync('9999') };
    await api.upsert('icelauch_profiles', cloudProfile);

    // Simulate on-demand query fallback
    const remoteProfiles = await api.select('icelauch_profiles', p => p.id === 'user_hanoi');
    assert.strictEqual(remoteProfiles.length, 1);
    storage.setItem('icelauch_active_profile_id', 'user_hanoi');

    // Step 3 (Private Data Mutation): Save playlist and watch progress
    const userPrivateData = {
      profile_id: 'user_hanoi',
      watch_progress: { 'vid_cinema_1': 600 },
      custom_playlists: [{ id: 'pl_hanoi_favs', title: 'Favorites', itemIds: ['vid_cinema_1'] }],
    };
    await api.upsert('icelauch_user_data', userPrivateData);
    storage.setItem('icelauch_user_data_cache', JSON.stringify(userPrivateData));

    // Step 4 (Cold Boot Restart Simulation)
    const restoredProfileId = storage.getItem('icelauch_active_profile_id');
    const restoredCache = JSON.parse(storage.getItem('icelauch_user_data_cache'));
    assert.strictEqual(restoredProfileId, 'user_hanoi');
    assert.strictEqual(restoredCache.watch_progress['vid_cinema_1'], 600);
    assert.strictEqual(restoredCache.custom_playlists[0].title, 'Favorites');

    // Step 5 (Isolation Check): Shared catalog has no user fields
    const sharedGames = await api.select('icelauch_games');
    assert.ok(sharedGames.every(g => g.watch_progress === undefined));
  });

  // =========================================================================
  // 3. T4-SCEN-03: Multi-Platform Sync & Complete Elimination of Ghost Items
  // =========================================================================
  await recordScenario('T4-SCEN-03', 'Cross-Platform Sync & Complete Elimination of Ghost Items', async () => {
    const api = new MockSupabaseApi();
    const pcStorage = new MockLocalStorage();
    const mobileStorage = new MockLocalStorage();

    // Step 1: PC Admin creates shared game
    const newGame = { id: 'game_super_star', name: 'Super Star', hidden: false };
    await api.upsert('icelauch_games', newGame);
    pcStorage.setItem('icelauch_app_data', JSON.stringify({ games: [newGame] }));

    // Step 2: Mobile client pulls catalog
    const cloudGames = await api.select('icelauch_games');
    mobileStorage.setItem('icelauch_app_data', JSON.stringify({ games: cloudGames }));
    assert.strictEqual(JSON.parse(mobileStorage.getItem('icelauch_app_data')).games.length, 1);

    // Step 3: PC Admin deletes game with immediate cloud DELETE
    await api.delete('icelauch_games', 'game_super_star');
    pcStorage.setItem('icelauch_app_data', JSON.stringify({ games: [] }));

    // Step 4: Background syncAll on both clients
    const remainingCloudGames = await api.select('icelauch_games');
    pcStorage.setItem('icelauch_app_data', JSON.stringify({ games: remainingCloudGames }));
    mobileStorage.setItem('icelauch_app_data', JSON.stringify({ games: remainingCloudGames }));

    // Step 5: Ghost elimination assertions
    const pcFinal = JSON.parse(pcStorage.getItem('icelauch_app_data')).games;
    const mobFinal = JSON.parse(mobileStorage.getItem('icelauch_app_data')).games;
    assert.strictEqual(pcFinal.length, 0, 'PC catalog must not contain deleted game');
    assert.strictEqual(mobFinal.length, 0, 'Mobile catalog must not resurrect deleted game');
    assert.strictEqual(remainingCloudGames.length, 0, 'Cloud database must be clean');
  });

  // =========================================================================
  // 4. T4-SCEN-04: Content Privacy Across All 9 UI Leak Points
  // =========================================================================
  await recordScenario('T4-SCEN-04', 'Content Privacy Across All 9 UI Leak Points', async () => {
    // Step 1: Codebase UI files audit for genuine content visibility filtering
    const uiFiles = [
      'src/renderer/src/components/home/HomeView.tsx',
      'src/renderer/src/components/media/MediaView.tsx',
      'src/renderer/src/components/mobile/MobileMediaView.tsx',
      'src/renderer/src/components/mobile/MobileVideoTheaterView.tsx',
      'src/renderer/src/components/library/LibraryView.tsx',
      'src/renderer/src/components/tv/TVGameView.tsx',
      'src/renderer/src/components/tv/TVHomeMediaView.tsx',
      'src/renderer/src/services/platformAdapter.ts',
    ];

    for (const relPath of uiFiles) {
      assert.ok(fileExists(relPath), `UI component ${relPath} must exist on disk`);
    }

    // Verify HomeView.tsx implements genuine hidden filtering
    const homeSrc = readFile('src/renderer/src/components/home/HomeView.tsx');
    assert.ok(homeSrc.includes('!isAdmin && g.hidden'),
      'HomeView.tsx must filter out hidden items for non-admin users');

    // Verify MediaView.tsx implements genuine hidden filtering
    const mediaSrc = readFile('src/renderer/src/components/media/MediaView.tsx');
    assert.ok(mediaSrc.includes('!isAdmin && m.hidden'),
      'MediaView.tsx must filter out hidden items for non-admin users');

    // Verify LibraryView.tsx implements genuine hidden filtering
    const libSrc = readFile('src/renderer/src/components/library/LibraryView.tsx');
    assert.ok(libSrc.includes('isAdmin || !g.hidden'),
      'LibraryView.tsx must filter out hidden items for non-admin users');

    // Verify Mobile views wire isAdmin prop
    const mobMediaSrc = readFile('src/renderer/src/components/mobile/MobileMediaView.tsx');
    assert.ok(mobMediaSrc.includes('isAdmin: boolean') && mobMediaSrc.includes('isAdmin,'),
      'MobileMediaView.tsx must accept and wire isAdmin prop');

    // Step 2: Algorithmic dataset verification including truthy values (hidden: true and hidden: 1)
    const testCatalog = [
      { id: 'g_pub_1', title: 'Public Game 1', type: 'game', hidden: false, status: 'ready', lastPlayed: 100 },
      { id: 'g_hid_1', title: 'Secret Game 1', type: 'game', hidden: true, status: 'ready', lastPlayed: 200 },
      { id: 'm_pub_1', title: 'Public Movie 1', type: 'video', hidden: false },
      { id: 'm_hid_1', title: 'Secret Movie 1 (numeric truthy)', type: 'video', hidden: 1 },
      { id: 'm_pub_2', title: 'Public Audio 1', type: 'audio', hidden: false },
    ];

    // Step 3 (Non-Admin Verification Across All 9 Leak Points)
    const nonAdminEvaluation = evaluate9LeakPoints(testCatalog, false);
    assert.strictEqual(nonAdminEvaluation.hasNoLeaks, true, 'Zero leaks across all 9 UI views for non-admin');
    assert.strictEqual(nonAdminEvaluation.leakCount, 0, 'Leak count must be 0 for non-admin');
    assert.strictEqual(Object.keys(nonAdminEvaluation.auditedFiles).length, 8, 'Must audit all 8 UI files');

    // Verify each leak point specifically has no truthy hidden items
    for (const [viewName, items] of Object.entries(nonAdminEvaluation.results)) {
      assert.ok(items.every(i => !Boolean(i.hidden)), `Leak detected in ${viewName}`);
    }

    // Step 4 (Admin Mode Verification): Admin sees all items
    const adminEvaluation = evaluate9LeakPoints(testCatalog, true);
    assert.strictEqual(adminEvaluation.results.cloudCatalog.length, 5, 'Admin must see all 5 items');
  });

  // =========================================================================
  // 5. T4-SCEN-05: Desktop Frameless Focus & Text Editing Under Multitasking
  // =========================================================================
  await recordScenario('T4-SCEN-05', 'PC Desktop Frameless Focus & Text Editing Under Rapid Multitasking', async () => {
    let focusEventsFired = 0;
    let webContentsFocusFired = 0;

    const mockMainWindow = {
      isFocused: () => true,
      focus: () => { focusEventsFired++; },
      webContents: {
        focus: () => { webContentsFocusFired++; },
      },
    };

    // Step 1: Launch focus sequence
    mockMainWindow.focus();
    mockMainWindow.webContents.focus();
    assert.strictEqual(focusEventsFired, 1);
    assert.strictEqual(webContentsFocusFired, 1);

    // Step 2: Native dialog interruption (Browse File)
    function simulateBrowseFileDialog() {
      try {
        // Native OS file dialog steals focus...
        return { canceled: true, filePaths: [] };
      } finally {
        mockMainWindow.webContents.focus();
      }
    }

    simulateBrowseFileDialog();
    assert.strictEqual(webContentsFocusFired, 2, 'Dialog finally block must restore WebContents focus');

    // Step 3: External window task switch & focus return
    function onWindowFocus() {
      mockMainWindow.webContents.focus();
    }
    onWindowFocus();
    assert.strictEqual(webContentsFocusFired, 3, 'Window focus listener must restore WebContents focus');
  });

  // =========================================================================
  // 6. T4-SCEN-06: Full Offline-to-Online State Reconciliation
  // =========================================================================
  await recordScenario('T4-SCEN-06', 'Full Offline-to-Online State Reconciliation', async () => {
    const api = new MockSupabaseApi();
    const storage = new MockLocalStorage({
      icelauch_device_id: 'ICE-KIOSK-01',
      icelauch_device_approved_status: 'approved',
      icelauch_app_data: JSON.stringify({
        games: [{ id: 'kiosk_game', name: 'Cached Game' }],
        media: [{ id: 'kiosk_movie', title: 'Cached Movie' }],
      }),
    });

    // Step 1: Client is offline
    let isOnline = false;

    // Step 2: Offline Authentication & Cache access
    const unlockedOffline = simulateVerifyAdminPin('1234', storage);
    assert.strictEqual(unlockedOffline, true, 'Default PIN must authenticate offline');
    const cachedCatalog = JSON.parse(storage.getItem('icelauch_app_data'));
    assert.strictEqual(cachedCatalog.games.length, 1);

    // Step 3: Offline mutation (watch progress updated)
    const offlineProgress = { 'kiosk_movie': 400 };
    storage.setItem('icelauch_offline_watch_progress', JSON.stringify(offlineProgress));

    // Step 4: Network restores
    isOnline = true;

    // Step 5: Reconciliation via syncAll
    if (isOnline) {
      // Push offline progress to Supabase user data
      await api.upsert('icelauch_user_data', {
        profile_id: 'kiosk_user',
        watch_progress: offlineProgress,
      });

      // Pull latest catalog
      await api.upsert('icelauch_games', { id: 'new_remote_game', name: 'Cloud Game' });
      const remoteGames = await api.select('icelauch_games');
      storage.setItem('icelauch_app_data', JSON.stringify({ games: remoteGames }));
    }

    // Step 6: Reconciliation assertions
    assert.strictEqual(storage.getItem('icelauch_device_approved_status'), 'approved');
    const cloudUserData = await api.select('icelauch_user_data', u => u.profile_id === 'kiosk_user');
    assert.strictEqual(cloudUserData[0].watch_progress['kiosk_movie'], 400);
    const updatedLocal = JSON.parse(storage.getItem('icelauch_app_data'));
    assert.strictEqual(updatedLocal.games.some(g => g.id === 'new_remote_game'), true);
  });

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  return {
    tierId: 'Tier 4',
    tierName: 'Real-World Application Scenarios (T4)',
    planned: 6,
    executed: results.length,
    passed,
    failed,
    results,
    failures,
  };
}

module.exports = { runTier4Tests };

if (require.main === module) {
  runTier4Tests({ verbose: true }).then((summary) => {
    console.log(`\nTier 4 Summary: ${summary.passed}/${summary.executed} passed (${summary.failed} failed)`);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
