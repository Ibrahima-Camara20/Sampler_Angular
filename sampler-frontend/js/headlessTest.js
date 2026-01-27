/**
 * Headless Test Runner (sans GUI)
 * - Instancie AudioEngine seul
 * - fetch presets via API
 * - charge un preset
 * - applique un trim individuel
 * - joue un pad automatiquement
 * - log sur la page + console
 */

async function runHeadlessTest(BACKEND_URL) {
  const logEl = document.getElementById('headless-log');

  const log = (msg, type = 'info') => {
    if (!logEl) {
      console[type === 'error' ? 'error' : 'log'](msg);
      return;
    }
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  };

  try {
    if (logEl) logEl.innerHTML = '';

    log(' Démarrage du test headless...', 'info');

    // 1) moteur sans GUI
    const engine = new AudioEngine(BACKEND_URL);
    log('✓ AudioEngine créé (sans GUI)', 'success');

    // 2) AudioContext
    engine.init();
    log(`✓ AudioContext créé (state=${engine.audioContext.state})`, 'success');

    await engine.ensureRunning();
    log(`✓ AudioContext running (state=${engine.audioContext.state})`, 'success');

    // 3) fetch presets
    const presets = await engine.fetchPresets();
    log(`✓ ${presets.length} preset(s) récupéré(s)`, 'success');

    if (!presets.length) {
      log(' Aucun preset disponible', 'error');
      return;
    }

    // 4) load preset (premier)
    const preset = presets[0];
    log(` Chargement preset: "${preset.name}" (id=${preset.id})`, 'info');

    await engine.loadPreset(preset.id, (padIndex, progress) => {
      const pct = Math.round(progress * 100);
      if (pct === 100) log('✓ Chargement terminé (100%)', 'success');
    });

    // 5) Trouver tous les pads chargés
    const pads = engine.getAllPads();
    const loadedPads = pads.filter(p => p.loaded);

    if (loadedPads.length === 0) {
      log(' Aucun pad chargé', 'error');
      return;
    }

    log(`✓ ${loadedPads.length} pad(s) chargé(s)`, 'success');

    // 6) Jouer des sons aléatoires
    const numberOfSounds = Math.min(5, loadedPads.length); // Jouer 5 sons ou moins si pas assez de pads
    log(` Lecture aléatoire de ${numberOfSounds} son(s)...`, 'info');

    for (let i = 0; i < numberOfSounds; i++) {
      // Choisir un pad aléatoire
      const randomIndex = Math.floor(Math.random() * loadedPads.length);
      const randomPad = loadedPads[randomIndex];
      const padIndex = randomPad.index;
      const padInfo = engine.getPadInfo(padIndex);

      log(`\n🎵 [${i + 1}/${numberOfSounds}] Pad ${padIndex}: "${padInfo?.name || 'sans nom'}"`, 'info');

      // Appliquer un trim aléatoire (optionnel)
      const randomStart = Math.random() * 0.2; // Entre 0 et 0.2
      const randomEnd = 0.8 + Math.random() * 0.2; // Entre 0.8 et 1.0
      engine.setTrim(padIndex, randomStart, randomEnd);
      const trim = engine.getTrim(padIndex);
      log(`  Trim: ${trim.start.toFixed(2)} → ${trim.end.toFixed(2)}`, 'info');

      // Jouer le son
      const playback = engine.playPad(padIndex);
      if (!playback) {
        log(`   Échec de lecture du pad ${padIndex}`, 'error');
        continue;
      }

      log(`  ✓ Lecture en cours...`, 'success');
      log(`    Durée: ${playback.buffer.duration.toFixed(2)}s`, 'info');
      log(`    Sample: ${playback.buffer.sampleRate} Hz`, 'info');
      log(`    Channels: ${playback.buffer.numberOfChannels}`, 'info');

      // Pause entre chaque son (500ms)
      await new Promise(res => setTimeout(res, 500));
    }

    log('\n TEST HEADLESS RÉUSSI : moteur audio OK sans GUI', 'success');

  } catch (err) {
    console.error(err);
    log(` Erreur: ${err.message}`, 'error');
  }
}

if (typeof window !== 'undefined') {
  window.runHeadlessTest = runHeadlessTest;
}
