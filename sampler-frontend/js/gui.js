/**
 * GUI - Couche interface utilisateur
 * Utilise AudioEngine pour toute la logique audio
 */

class SamplerGUI {
  constructor(audioEngine) {
    this.engine = audioEngine;
    this.elements = {};
    this.currentPadIndex = null;
    this.currentAudioBuffer = null;

    this.trimBarsDrawer = null;
    this.interactionSetupDone = false;

    // MIDI (initialisé plus tard)
    this.midiController = null;
    this.midiUI = null;

    // Mapping clavier → pads (layout 4x4 AZERTY)
    this.keyMap = {
      '1': 12, '2': 13, '3': 14, '4': 15,
      'a': 8, 'z': 9, 'e': 10, 'r': 11,
      'q': 4, 's': 5, 'd': 6, 'f': 7,
      'w': 0, 'x': 1, 'c': 2, 'v': 3
    };

    // Pour éviter les répétitions de touches
    this.keysPressed = new Set();
  }

  init() {
    console.log("🚀 GUI Initialisation...");
    this.initializeElements();
    this.createPadGrid();
    this.loadPresetList();
    this.setupEventListeners();
    this.setupKeyboardControls();
    this.initMIDI(); // Initialise MIDI (optionnel, ne bloque pas si non supporté)
  }

  initializeElements() {
    this.elements = {
      presetSelect: document.getElementById('preset-select'),
      loadPresetBtn: document.getElementById('load-preset-btn'),
      padGrid: document.getElementById('pad-grid'),
      loadingContainer: document.getElementById('loading-container'),
      waveformCanvas: document.getElementById('waveform-canvas'),
      currentPadName: document.getElementById('current-pad-name'),
      trimStart: document.getElementById('trim-start'),
      trimEnd: document.getElementById('trim-end'),
      trimDetails: document.getElementById('trim-details'),
    };
  }

  setupEventListeners() {
    this.elements.loadPresetBtn.addEventListener('click', () => this.loadSelectedPreset());

    this.elements.presetSelect.addEventListener('change', () => {
      if (this.elements.presetSelect.value) this.loadSelectedPreset();
    });

    const onTrimChange = () => {
      if (this.currentPadIndex === null || !this.currentAudioBuffer) return;

      const startVal = parseInt(this.elements.trimStart.value, 10);
      const endVal = parseInt(this.elements.trimEnd.value, 10);

      const startRatio = startVal / 1000;
      const endRatio = endVal / 1000;

      const finalStart = Math.min(startRatio, endRatio);
      const finalEnd = Math.max(startRatio, endRatio);

      this.engine.setTrim(this.currentPadIndex, finalStart, finalEnd);

      if (this.trimBarsDrawer) {
        this.trimBarsDrawer.setTrimValues(finalStart, finalEnd);
      }

      this.displayWaveform(this.currentAudioBuffer, this.currentPadIndex);
    };

    if (this.elements.trimStart) this.elements.trimStart.addEventListener('input', onTrimChange);
    if (this.elements.trimEnd) this.elements.trimEnd.addEventListener('input', onTrimChange);
  }

  createPadGrid() {
    const padGrid = this.elements.padGrid;
    padGrid.innerHTML = '';

    for (let row = 3; row >= 0; row--) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'pad-row';

      for (let col = 0; col < 4; col++) {
        const padIndex = row * 4 + col;
        rowDiv.appendChild(this.createPad(padIndex));
      }

      padGrid.appendChild(rowDiv);
    }
  }

  createPad(index) {
    const pad = document.createElement('div');
    pad.className = 'pad';
    pad.dataset.index = index;
    pad.dataset.padIndex = index; // Pour MIDI UI highlighting

    const padNumber = document.createElement('div');
    padNumber.className = 'pad-number';
    padNumber.textContent = index;

    const padName = document.createElement('div');
    padName.className = 'pad-name';
    padName.textContent = '-';

    // Touche clavier assignée
    const keyLabel = this.getKeyForPad(index);
    if (keyLabel) {
      const padKey = document.createElement('div');
      padKey.className = 'pad-key';
      padKey.textContent = keyLabel.toUpperCase();
      pad.appendChild(padKey);
    }

    // Barre de progression
    const progressBar = document.createElement('div');
    progressBar.className = 'pad-progress';
    const progressFill = document.createElement('div');
    progressFill.className = 'pad-progress-fill';
    progressBar.appendChild(progressFill);

    pad.appendChild(padNumber);
    pad.appendChild(padName);
    pad.appendChild(progressBar);

    pad.addEventListener('click', () => this.handlePadClick(index));
    return pad;
  }

  async loadPresetList() {
    try {
      const presets = await this.engine.fetchPresets();
      this.populatePresetSelect(presets);
    } catch (error) {
      console.error('Erreur lors du chargement des presets:', error);
    }
  }

  populatePresetSelect(presets) {
    const select = this.elements.presetSelect;
    select.innerHTML = '<option value="">-- Sélectionner un preset --</option>';

    const categories = {};
    presets.forEach(preset => {
      const category = preset.category || 'Autres';
      if (!categories[category]) categories[category] = [];
      categories[category].push(preset);
    });

    Object.entries(categories).forEach(([category, categoryPresets]) => {
      if (Object.keys(categories).length > 1) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        categoryPresets.forEach(preset => optgroup.appendChild(this.createPresetOption(preset)));
        select.appendChild(optgroup);
      } else {
        categoryPresets.forEach(preset => select.appendChild(this.createPresetOption(preset)));
      }
    });
  }

  createPresetOption(preset) {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    return option;
  }

  async loadSelectedPreset() {
    const presetId = this.elements.presetSelect.value;
    if (!presetId) return;

    this.showLoading(true);
    this.clearPads();

    // reset canvas state
    this.currentPadIndex = null;
    this.currentAudioBuffer = null;
    this.trimBarsDrawer = null;
    this.interactionSetupDone = false;

    try {
      await this.engine.loadPreset(presetId, (padIndex, progress) => {
        this.updateLoadingProgress(padIndex, progress);
      });

      this.updatePadDisplay();
      this.showLoading(false);
      console.log('Preset chargé avec succès!');
    } catch (error) {
      console.error('Erreur lors du chargement du preset:', error);
      this.showLoading(false);
      alert('Erreur lors du chargement du preset');
    }
  }

  showLoading(show) {
    this.elements.loadingContainer.style.display = show ? 'block' : 'none';
  }

  updateLoadingProgress(padIndex, progress) {
    // Animation de la barre de progression sur le pad spécifique
    const padElement = document.querySelector(`[data-index="${padIndex}"]`);
    if (!padElement) return;

    const progressBar = padElement.querySelector('.pad-progress');
    const progressFill = padElement.querySelector('.pad-progress-fill');

    if (!progressBar || !progressFill) return;

    // Afficher la barre de progression
    progressBar.classList.add('active');

    // Animer le remplissage (0% -> 100% pour ce pad)
    progressFill.style.width = '100%';

    // Masquer la barre après un court délai une fois le chargement terminé
    setTimeout(() => {
      progressBar.classList.remove('active');
      progressFill.style.width = '0%';
    }, 500);
  }

  updatePadDisplay() {
    const pads = this.engine.getAllPads();

    pads.forEach(pad => {
      const padElement = document.querySelector(`[data-index="${pad.index}"]`);
      if (!padElement) return;

      const nameElement = padElement.querySelector('.pad-name');
      if (pad.loaded && pad.name) {
        nameElement.textContent = pad.name;
        padElement.classList.add('loaded');
      } else {
        nameElement.textContent = '-';
        padElement.classList.remove('loaded');
      }
    });
  }

  clearPads() {
    document.querySelectorAll('.pad').forEach(pad => {
      pad.classList.remove('loaded', 'active');
      pad.querySelector('.pad-name').textContent = '-';

      // Réinitialiser les barres de progression
      const progressBar = pad.querySelector('.pad-progress');
      const progressFill = pad.querySelector('.pad-progress-fill');
      if (progressBar) progressBar.classList.remove('active');
      if (progressFill) progressFill.style.width = '0%';
    });
  }

  handlePadClick(index) {
    this.currentPadIndex = index;

    if (!this.engine.hasPad(index)) {
      console.log(`Pas de son au pad ${index}`);
      return;
    }

    const playback = this.engine.playPad(index);
    if (playback) {
      this.highlightPad(index);
      this.displayWaveform(playback.buffer, index);
    }
  }

  highlightPad(index) {
    document.querySelectorAll('.pad').forEach(p => p.classList.remove('active'));

    const pad = document.querySelector(`[data-index="${index}"]`);
    if (pad) {
      pad.classList.add('active');
      setTimeout(() => pad.classList.remove('active'), 200);
    }
  }

  displayWaveform(audioBuffer, padIndex) {
    if (!audioBuffer || !this.elements.waveformCanvas) return;

    this.currentAudioBuffer = audioBuffer;
    this.currentPadIndex = padIndex;

    const trim = this.engine.getTrim(padIndex);

    const padInfo = this.engine.getPadInfo(padIndex);
    if (this.elements.currentPadName && padInfo) {
      this.elements.currentPadName.textContent = `Pad ${padIndex}: ${padInfo.name}`;
    }

    const canvas = this.elements.waveformCanvas;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b0e13';
    ctx.fillRect(0, 0, W, H);

    // waveform
    const ch = audioBuffer.getChannelData(0);
    const step = Math.ceil(ch.length / W);

    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      let min = 1, max = -1;
      const start = x * step;
      const end = Math.min(start + step, ch.length);
      for (let k = start; k < end; k++) {
        const v = ch[k];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = (1 - (max + 1) / 2) * H;
      const y2 = (1 - (min + 1) / 2) * H;
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    }
    ctx.strokeStyle = '#22d3ee';
    ctx.stroke();

    // TrimbarsDrawer
    if (!this.trimBarsDrawer) {
      this.trimBarsDrawer = new TrimbarsDrawer(canvas, trim.start * W, trim.end * W);
      this.setupCanvasInteraction();
    } else {
      this.trimBarsDrawer.setTrimValues(trim.start, trim.end);
    }

    this.trimBarsDrawer.draw();

    // sliders + details
    if (this.elements.trimStart && this.elements.trimEnd) {
      const startVal = Math.round(trim.start * 1000);
      const endVal = Math.round(trim.end * 1000);

      if (document.activeElement !== this.elements.trimStart) this.elements.trimStart.value = startVal;
      if (document.activeElement !== this.elements.trimEnd) this.elements.trimEnd.value = endVal;

      if (this.elements.trimDetails) {
        const duration = audioBuffer.duration;
        const startSeconds = trim.start * duration;
        const endSeconds = trim.end * duration;
        this.elements.trimDetails.textContent = `${startSeconds.toFixed(2)}s - ${endSeconds.toFixed(2)}s`;
      }
    }
  }

  setupCanvasInteraction() {
    const canvas = this.elements.waveformCanvas;
    if (!canvas) return;
    if (this.interactionSetupDone) return;
    this.interactionSetupDone = true;

    console.log('✅ Interaction souris activée (TrimBars)');

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    canvas.addEventListener('mousedown', (e) => {
      if (!this.trimBarsDrawer) return;
      const mousePos = getMousePos(e);

      this.trimBarsDrawer.highLightTrimBarsWhenClose(mousePos);
      this.trimBarsDrawer.startDrag();
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.trimBarsDrawer) return;

      const mousePos = getMousePos(e);
      this.trimBarsDrawer.moveTrimBars(mousePos);

      if (this.trimBarsDrawer.leftTrimBar.dragged || this.trimBarsDrawer.rightTrimBar.dragged) {
        const vals = this.trimBarsDrawer.getTrimValues();
        if (this.currentPadIndex !== null) {
          this.engine.setTrim(this.currentPadIndex, vals.start, vals.end);
        }
      }

      if (this.currentAudioBuffer && this.currentPadIndex !== null) {
        this.displayWaveform(this.currentAudioBuffer, this.currentPadIndex);
      }
    });

    const stopDrag = () => {
      if (!this.trimBarsDrawer) return;
      if (this.trimBarsDrawer.leftTrimBar.dragged || this.trimBarsDrawer.rightTrimBar.dragged) {
        this.trimBarsDrawer.stopDrag();
        if (this.currentAudioBuffer && this.currentPadIndex !== null) {
          this.displayWaveform(this.currentAudioBuffer, this.currentPadIndex);
        }
      }
    };

    canvas.addEventListener('mouseup', stopDrag);
    canvas.addEventListener('mouseleave', stopDrag);
  }

  /**
   * Trouve la touche assignée à un pad
   */
  getKeyForPad(padIndex) {
    for (const [key, index] of Object.entries(this.keyMap)) {
      if (index === padIndex) return key;
    }
    return null;
  }

  /**
   * Configure les contrôles clavier
   */
  setupKeyboardControls() {
    console.log('⌨️ Contrôles clavier activés');

    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();

      // Ignorer si la touche est déjà enfoncée (éviter la répétition)
      if (this.keysPressed.has(key)) return;

      // Vérifier si la touche est mappée
      if (this.keyMap.hasOwnProperty(key)) {
        e.preventDefault(); // Empêcher le comportement par défaut

        const padIndex = this.keyMap[key];
        this.keysPressed.add(key);

        // Jouer le pad
        this.handlePadClick(padIndex);

        // Animation visuelle supplémentaire pour le clavier
        const padElement = document.querySelector(`[data-index="${padIndex}"]`);
        if (padElement) {
          padElement.classList.add('keyboard-active');
          setTimeout(() => padElement.classList.remove('keyboard-active'), 300);
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keysPressed.delete(key);
    });
  }

  /**
   * Initialise le contrôleur MIDI (si disponible)
   */
  async initMIDI() {
    // Vérifie si les modules MIDI sont chargés
    if (typeof MIDIController === 'undefined' || typeof MIDIUI === 'undefined') {
      console.log('🎹 Modules MIDI non chargés, fonctionnalité MIDI désactivée');
      return;
    }

    // Crée le contrôleur MIDI
    this.midiController = new MIDIController({
      onNoteOn: (padIndex, velocity) => {
        // Joue le pad avec la vélocité MIDI
        if (this.engine.hasPad(padIndex)) {
          const playback = this.engine.playPad(padIndex, velocity);

          if (playback) {
            // Affiche la forme d'onde (comme handlePadClick)
            this.highlightPad(padIndex);
            this.displayWaveform(playback.buffer, padIndex);

            // Mise à jour de l'index du pad courant
            this.currentPadIndex = padIndex;
          }

          // Animation visuelle spéciale pour MIDI
          const padElement = document.querySelector(`[data-index="${padIndex}"]`);
          if (padElement) {
            padElement.classList.add('midi-triggered');
            setTimeout(() => padElement.classList.remove('midi-triggered'), 200);
          }
        }
      },
      onNoteOff: (padIndex) => {
        // On peut implémenter un comportement spécial au relâchement si nécessaire
        // Pour l'instant, rien (les sons jouent en one-shot)
      }
    });

    // Initialise l'accès MIDI
    const success = await this.midiController.init();

    if (success) {
      // Crée l'interface MIDI
      const midiContainer = document.getElementById('midi-container');
      if (midiContainer) {
        this.midiUI = new MIDIUI(this.midiController, midiContainer);
        console.log('🎹 MIDI initialisé avec succès');
      }
    } else {
      console.log('🎹 MIDI non disponible ou non supporté');
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SamplerGUI;
}
