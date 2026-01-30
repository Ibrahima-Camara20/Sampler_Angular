/**
 * MIDIUI - Interface utilisateur pour les contrôles MIDI
 * Module séparé pour gérer l'affichage et l'interaction UI du MIDI
 */

class MIDIUI {
    constructor(midiController, container) {
        this.midi = midiController;
        this.container = container;
        this.elements = {};

        this.createUI();
        this.setupEventListeners();
    }

    /**
     * Crée l'interface utilisateur MIDI
     */
    createUI() {
        const html = `
      <div class="midi-controls">
        <div class="midi-header">
          <h3> Contrôle MIDI</h3>
          <span id="midi-status" class="midi-status">Non initialisé</span>
        </div>
        
        <div class="midi-device-selection">
          <label for="midi-device-select">Périphérique MIDI:</label>
          <select id="midi-device-select" disabled>
            <option value="">-- Aucun périphérique --</option>
          </select>
          <button id="midi-refresh-btn" title="Rafraîchir la liste">🔄</button>
        </div>
        
        <div class="midi-toggle">
          <label>
            <input type="checkbox" id="midi-enable-checkbox" checked>
            Activer le contrôle MIDI
          </label>
        </div>
        
        <div class="midi-info" id="midi-info">
          <p style="font-size: 0.85em; color: #888; margin: 10px 0 0 0;">
            Mapping: Notes MIDI 36-51 (C1-D#2) → Pads 0-15
          </p>
        </div>
      </div>
    `;

        this.container.innerHTML = html;

        // Références aux éléments
        this.elements = {
            status: this.container.querySelector('#midi-status'),
            deviceSelect: this.container.querySelector('#midi-device-select'),
            refreshBtn: this.container.querySelector('#midi-refresh-btn'),
            enableCheckbox: this.container.querySelector('#midi-enable-checkbox'),
            info: this.container.querySelector('#midi-info')
        };
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Sélection de périphérique
        this.elements.deviceSelect.addEventListener('change', (e) => {
            const deviceId = e.target.value;
            if (deviceId) {
                this.midi.selectDevice(deviceId);
            } else {
                this.midi.disconnect();
            }
        });

        // Bouton rafraîchir
        this.elements.refreshBtn.addEventListener('click', () => {
            this.midi.scanDevices();
        });

        // Checkbox activer/désactiver
        this.elements.enableCheckbox.addEventListener('change', (e) => {
            this.midi.setEnabled(e.target.checked);
            this.updateStatus(e.target.checked ? 'enabled' : 'disabled');
        });

        // Callbacks du contrôleur MIDI
        this.midi.onDeviceChange = (devices) => {
            this.updateDeviceList(devices);
        };

        this.midi.onStatusChange = (status) => {
            this.updateStatus(status);
        };
    }

    /**
     * Met à jour la liste des périphériques
     */
    updateDeviceList(devices) {
        const select = this.elements.deviceSelect;

        // Vide la liste
        select.innerHTML = '<option value="">-- Aucun périphérique --</option>';

        // Ajoute les périphériques
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.id;
            option.textContent = `${device.name} (${device.manufacturer})`;
            select.appendChild(option);
        });

        // Active le select si des périphériques sont disponibles
        select.disabled = devices.length === 0;

        // Si un seul périphérique, le sélectionner automatiquement
        if (devices.length === 1) {
            select.value = devices[0].id;
            this.midi.selectDevice(devices[0].id);
        }
    }

    /**
     * Met à jour le statut MIDI
     */
    updateStatus(status) {
        const statusElement = this.elements.status;

        const statusConfig = {
            'unsupported': {
                text: ' Non supporté',
                color: '#ef4444',
                title: 'Web MIDI API non disponible dans ce navigateur'
            },
            'error': {
                text: ' Erreur',
                color: '#f59e0b',
                title: 'Erreur lors de l\'initialisation MIDI'
            },
            'ready': {
                text: ' Prêt',
                color: '#6b7280',
                title: 'MIDI prêt, aucun périphérique sélectionné'
            },
            'connected': {
                text: ' Connecté',
                color: '#10b981',
                title: 'Périphérique MIDI connecté et actif'
            },
            'disconnected': {
                text: ' Déconnecté',
                color: '#6b7280',
                title: 'Périphérique MIDI déconnecté'
            },
            'disabled': {
                text: ' Désactivé',
                color: '#6b7280',
                title: 'Contrôle MIDI désactivé'
            },
            'enabled': {
                text: ' Connecté',
                color: '#10b981',
                title: 'Contrôle MIDI activé'
            }
        };

        const config = statusConfig[status] || statusConfig['ready'];

        statusElement.textContent = config.text;
        statusElement.style.color = config.color;
        statusElement.title = config.title;
    }

    /**
     * Affiche un message d'information temporaire
     */
    showInfo(message, duration = 3000) {
        const infoElement = this.elements.info;
        const originalContent = infoElement.innerHTML;

        infoElement.innerHTML = `<p style="font-size: 0.85em; color: #10b981; margin: 10px 0 0 0;">✓ ${message}</p>`;

        setTimeout(() => {
            infoElement.innerHTML = originalContent;
        }, duration);
    }

    /**
     * Affiche le mapping MIDI en détail (optionnel)
     */
    showMappingDetails() {
        const mapping = this.midi.getNoteMapping();
        const entries = Object.entries(mapping);

        let details = '<div style="font-size: 0.8em; margin-top: 10px;"><strong>Mapping détaillé:</strong><br>';

        for (let i = 0; i < entries.length; i += 4) {
            const row = entries.slice(i, i + 4);
            details += row.map(([note, pad]) =>
                `Note ${note}→Pad ${pad}`
            ).join(', ') + '<br>';
        }

        details += '</div>';
        this.elements.info.innerHTML = details;
    }

    /**
     * Anime visuellement un pad quand déclenché par MIDI
     */
    highlightPadFromMIDI(padIndex, duration = 200) {
        const pad = document.querySelector(`[data-pad-index="${padIndex}"]`);
        if (!pad) return;

        // Ajoute une classe CSS temporaire
        pad.classList.add('midi-triggered');

        setTimeout(() => {
            pad.classList.remove('midi-triggered');
        }, duration);
    }
}

// Export pour Node.js (si nécessaire)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MIDIUI;
}
