/**
 * AudioEngine - Moteur audio indépendant de l'interface (headless capable)
 * Gère le chargement des presets, la lecture des sons, et le trimming
 */

class AudioEngine {
  constructor(backendUrl = 'http://localhost:3000') {
    this.backendUrl = backendUrl;
    this.audioContext = null;
    this.presets = [];
    this.currentPreset = null;
    this.pads = new Array(16).fill(null);
    this.trimSettings = new Array(16).fill(null).map(() => ({ start: 0, end: 1 }));
  }

  /**
   * Initialise le contexte audio
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Assure que l'audio context est "running" (utile pour headless test)
   */
  async ensureRunning() {
    this.init();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Récupère la liste des presets depuis le backend
   */
  async fetchPresets() {
    try {
      const response = await fetch(`${this.backendUrl}/api/presets`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const rawPresets = await response.json();
      this.presets = this.normalizePresets(rawPresets);
      return this.presets;
    } catch (error) {
      console.error('Erreur lors du chargement des presets:', error);
      this.presets = this.getDemoPresets();
      return this.presets;
    }
  }

  /**
   * Normalise la structure des presets
   */
  normalizePresets(rawPresets) {
    console.log('🔧 Normalisation des presets...', rawPresets);

    return rawPresets.map(preset => {
      const id = preset.id || preset.name.toLowerCase().replace(/\s+/g, '-');

      let sounds = [];
      if (preset.samples && Array.isArray(preset.samples)) {
        sounds = preset.samples.map((sample, index) => ({
          pad: index,
          name: sample.name,
          url: sample.url
        }));
      } else if (preset.sounds && Array.isArray(preset.sounds)) {
        sounds = preset.sounds.map((sound, index) => ({
          pad: sound.pad !== undefined ? sound.pad : index,
          name: sound.name,
          url: sound.url
        }));
      } else {
        console.warn(`⚠️ Preset "${preset.name}" n'a ni samples ni sounds!`);
      }

      return {
        id,
        name: preset.name,
        category: preset.type || preset.category || 'Autres',
        sounds
      };
    });
  }

  /**
   * Presets de démonstration
   */
  getDemoPresets() {
    return [
      {
        id: 'demo-kit',
        name: 'Demo Kit (Sons synthétiques)',
        category: 'drums',
        sounds: [
          { pad: 0, name: 'Kick', url: 'demo', frequency: 60 },
          { pad: 1, name: 'Snare', url: 'demo', frequency: 200 },
          { pad: 2, name: 'Hi-Hat', url: 'demo', frequency: 8000 },
          { pad: 3, name: 'Clap', url: 'demo', frequency: 1000 }
        ]
      }
    ];
  }

  /**
   * Charge un preset
   */
  async loadPreset(presetId, progressCallback = null) {
    this.init();

    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) throw new Error(`Preset ${presetId} non trouvé`);

    this.currentPreset = preset;
    this.pads = new Array(16).fill(null);
    this.trimSettings = new Array(16).fill(null).map(() => ({ start: 0, end: 1 }));

    const totalSounds = preset.sounds.length;
    let loadedCount = 0;

    const loadPromises = preset.sounds.map(async (sound) => {
      try {
        let audioBuffer;

        if (sound.url === 'demo') {
          audioBuffer = this.generateSyntheticSound(sound.frequency || 440, 0.5);
        } else {
          let fullUrl;
          if (sound.url.startsWith('http')) {
            fullUrl = sound.url;
          } else {
            const cleanUrl = sound.url.replace(/^\.\//, '');
            fullUrl = `${this.backendUrl}/presets/${cleanUrl}`;
          }

          const response = await fetch(fullUrl);
          if (!response.ok) throw new Error(`Fetch sound failed: ${response.status} ${response.statusText}`);
          const arrayBuffer = await response.arrayBuffer();
          audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        }

        if (sound.pad < 0 || sound.pad >= 16) {
          console.warn(`Pad index hors limites pour "${sound.name}" => ${sound.pad} (ignoré)`);
        } else {
          this.pads[sound.pad] = { buffer: audioBuffer, name: sound.name, url: sound.url };
        }

      } catch (error) {
        console.error(`Erreur lors du chargement du son ${sound.name}:`, error);
      } finally {
        loadedCount++;
        if (progressCallback) progressCallback(sound.pad, loadedCount / totalSounds);
      }
    });

    await Promise.all(loadPromises);
    return this.currentPreset;
  }

  /**
   * Génère un son synthétique (démo)
   */
  generateSyntheticSound(frequency, duration) {
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-5 * t);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
    }

    return buffer;
  }

  /**
   * Joue le son d'un pad (avec trim)
   */
  playPad(padIndex) {
    this.init();

    if (!this.pads[padIndex] || !this.pads[padIndex].buffer) {
      console.warn(`Pas de son au pad ${padIndex}`);
      return null;
    }

    const pad = this.pads[padIndex];
    const trim = this.trimSettings[padIndex];

    const source = this.audioContext.createBufferSource();
    source.buffer = pad.buffer;

    const duration = pad.buffer.duration;
    const startTime = trim.start * duration;
    const endTime = trim.end * duration;
    const playDuration = Math.max(0, endTime - startTime);

    source.connect(this.audioContext.destination);

    try {
      source.start(0, startTime, playDuration);
    } catch (e) {
      console.error("Erreur source.start:", e);
      return null;
    }

    return { source, buffer: pad.buffer, padIndex, name: pad.name };
  }

  /**
   * Trim individuel par pad
   */
  setTrim(padIndex, start, end) {
    if (padIndex < 0 || padIndex >= 16) throw new Error('Index de pad invalide');

    const s = Math.max(0, Math.min(1, start));
    const e = Math.max(0, Math.min(1, end));

    this.trimSettings[padIndex] = {
      start: Math.min(s, e),
      end: Math.max(s, e)
    };
  }

  getTrim(padIndex) {
    return this.trimSettings[padIndex];
  }

  getPadInfo(padIndex) {
    return this.pads[padIndex] || null;
  }

  getPadBuffer(padIndex) {
    return this.pads[padIndex]?.buffer || null;
  }

  hasPad(padIndex) {
    return this.pads[padIndex] !== null;
  }

  getAllPads() {
    return this.pads.map((pad, index) => ({
      index,
      loaded: pad !== null && !!pad.buffer,
      name: pad?.name || null
    }));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioEngine;
}
