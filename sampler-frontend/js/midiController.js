/**
 * MIDIController - Gestion des contrôleurs MIDI
 * Module indépendant pour détecter et gérer les périphériques MIDI
 */

class MIDIController {
    constructor(options = {}) {
        this.midiAccess = null;
        this.selectedInput = null;
        this.enabled = true;

        // Mapping MIDI note -> pad index (par défaut: notes 36-51 -> pads 0-15)
        this.noteMapping = options.noteMapping || this.getDefaultNoteMapping();

        // Callbacks
        this.onNoteOn = options.onNoteOn || ((padIndex, velocity) => { });
        this.onNoteOff = options.onNoteOff || ((padIndex) => { });
        this.onDeviceChange = options.onDeviceChange || ((devices) => { });
        this.onStatusChange = options.onStatusChange || ((status) => { });

        // État
        this.supportsMIDI = false;
        this.devices = [];
    }

    /**
     * Mapping par défaut : notes 36-51 (C1-D#2) vers pads 0-15
     * Convention standard pour drum machines
     */
    getDefaultNoteMapping() {
        const mapping = {};
        for (let i = 0; i < 16; i++) {
            mapping[36 + i] = i; // Note 36 = pad 0, note 37 = pad 1, etc.
        }
        return mapping;
    }

    /**
     * Initialise l'accès MIDI
     */
    async init() {
        try {
            // Vérifie si Web MIDI API est disponible
            if (!navigator.requestMIDIAccess) {
                console.warn(' Web MIDI API non disponible dans ce navigateur');
                this.onStatusChange('unsupported');
                return false;
            }

            // Demande l'accès au MIDI
            this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
            this.supportsMIDI = true;

            console.log(' MIDI Access accordé');
            this.onStatusChange('ready');

            // Détecte les périphériques
            this.scanDevices();

            // Écoute les changements de périphériques (branchement/débranchement)
            this.midiAccess.onstatechange = (e) => {
                console.log(' Changement d\'état MIDI:', e.port.name, e.port.state);
                this.scanDevices();
            };

            return true;

        } catch (error) {
            console.error(' Erreur lors de l\'initialisation MIDI:', error);
            this.onStatusChange('error');
            return false;
        }
    }

    /**
     * Scanne les périphériques MIDI disponibles
     */
    scanDevices() {
        if (!this.midiAccess) return;

        this.devices = [];
        const inputs = this.midiAccess.inputs.values();

        for (let input of inputs) {
            if (input.state === 'connected') {
                this.devices.push({
                    id: input.id,
                    name: input.name,
                    manufacturer: input.manufacturer || 'Inconnu',
                    state: input.state
                });
            }
        }

        console.log(` ${this.devices.length} périphérique(s) MIDI détecté(s):`, this.devices);
        this.onDeviceChange(this.devices);

        return this.devices;
    }

    /**
     * Sélectionne un périphérique MIDI par son ID
     */
    selectDevice(deviceId) {
        if (!this.midiAccess) {
            console.warn(' MIDI non initialisé');
            return false;
        }

        // Déconnecte l'ancien périphérique
        if (this.selectedInput) {
            this.selectedInput.onmidimessage = null;
            console.log(' Déconnexion de:', this.selectedInput.name);
        }

        // Connecte le nouveau périphérique
        const input = this.midiAccess.inputs.get(deviceId);

        if (!input) {
            console.warn(' Périphérique non trouvé:', deviceId);
            this.onStatusChange('disconnected');
            return false;
        }

        this.selectedInput = input;

        // Configure le gestionnaire de messages MIDI
        this.selectedInput.onmidimessage = (message) => {
            this.handleMIDIMessage(message);
        };

        console.log(' Connecté à:', input.name);
        this.onStatusChange('connected');

        return true;
    }

    /**
     * Traite les messages MIDI entrants
     */
    handleMIDIMessage(message) {
        if (!this.enabled) return;

        const [status, note, velocity] = message.data;

        // Détermine le type de message
        const command = status & 0xF0;

        // Note On (0x90) avec vélocité > 0
        if (command === 0x90 && velocity > 0) {
            const padIndex = this.noteMapping[note];

            if (padIndex !== undefined) {
                console.log(` Note ON: ${note} (vélocité: ${velocity}) -> Pad ${padIndex}`);
                this.onNoteOn(padIndex, velocity);
            } else {
                console.log(` Note ${note} non mappée (hors plage 36-51)`);
            }
        }
        // Note Off (0x80) ou Note On avec vélocité 0
        else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
            const padIndex = this.noteMapping[note];

            if (padIndex !== undefined) {
                console.log(` Note OFF: ${note} -> Pad ${padIndex}`);
                this.onNoteOff(padIndex);
            }
        }
    }

    /**
     * Active/désactive le contrôleur MIDI
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(` MIDI ${enabled ? 'activé' : 'désactivé'}`);
    }

    /**
     * Définit un mapping personnalisé note -> pad
     */
    setNoteMapping(mapping) {
        this.noteMapping = mapping;
        console.log(' Nouveau mapping MIDI:', mapping);
    }

    /**
     * Retourne le mapping actuel
     */
    getNoteMapping() {
        return { ...this.noteMapping };
    }

    /**
     * Déconnecte le périphérique actuel
     */
    disconnect() {
        if (this.selectedInput) {
            this.selectedInput.onmidimessage = null;
            this.selectedInput = null;
            console.log(' Périphérique MIDI déconnecté');
            this.onStatusChange('disconnected');
        }
    }

    /**
     * Retourne les informations sur le périphérique sélectionné
     */
    getSelectedDevice() {
        if (!this.selectedInput) return null;

        return {
            id: this.selectedInput.id,
            name: this.selectedInput.name,
            manufacturer: this.selectedInput.manufacturer || 'Inconnu'
        };
    }

    /**
     * Vérifie si MIDI est supporté
     */
    isSupported() {
        return this.supportsMIDI;
    }
}

// Export pour Node.js (si nécessaire)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MIDIController;
}
