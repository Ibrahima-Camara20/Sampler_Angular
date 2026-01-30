# 🎵 Audio Sampler - Frontend

## Description

Audio Sampler est une application web d'échantillonnage audio interactive permettant de charger, manipuler et jouer des samples audio à travers une interface de pads 4x4. Le projet offre une expérience complète de sampler avec support MIDI, visualisation de forme d'onde et contrôles de trimming avancés.

**Projet M1 INFO 2025-2026**  
**Binôme:** Ibrahima Camara & Mamadou Ougailou Diallo  
**Professeur:** M. Michel Buffa

---

## Fonctionnalités

### Interface de Pads
- **Grille de 16 pads (4x4)** pour la lecture de samples
- **Affichage visuel** de l'état des pads (chargé/vide)
- **Animation de chargement** avec barres de progression individuelles sur chaque pad
- **Contrôle par clic** pour jouer les samples
- **Support clavier** avec mapping de touches personnalisé (AZERTY)
- **Affichage des raccourcis clavier** sur chaque pad

### Gestion des Presets
- **Chargement dynamique** des presets depuis le backend
- **Menu déroulant** organisé par catégories (drums, melodics, atmospheres, etc.)
- **Feedback de chargement** en temps réel avec indicateur de progression par pad
- **Support de presets par défaut** (démo avec sons synthétiques) en cas de défaillance du backend
- **Normalisation automatique** des structures de presets

###  Visualisation Audio
- **Affichage de forme d'onde** (waveform) en temps réel
- **Canvas interactif** avec dessin optimisé des pics audio
- **Visualisation multi-canaux** (support mono/stéréo)
- **Mise à jour dynamique** lors de la sélection d'un pad
- **Affichage du nom** du pad et du sample actuellement sélectionné

###  Trimming Audio
- **Barres de trim visuelles** interactives sur le canvas
- **Contrôle par drag & drop** des points de début/fin
- **Sliders dédiés** pour un contrôle précis
- **Affichage en temps réel** des valeurs de trim en secondes
- **Trim individuel par pad** avec sauvegarde des réglages
- **Zones grisées** pour visualiser les parties coupées
- **Indicateurs visuels** (triangles rouge/blanc) pour les poignées de trim

###  Support MIDI
- **Détection automatique** des périphériques MIDI connectés
- **Interface de sélection** des contrôleurs MIDI
- **Mapping MIDI personnalisable** (notes 36-51 → pads 0-15 par défaut)
- **Support de vélocité MIDI** pour contrôler le volume de lecture
- **Activation/désactivation** du contrôle MIDI
- **Gestion des événements** Note On/Note Off
- **Détection des changements** de périphériques (branchement/débranchement)
- **Messages de statut** MIDI dans l'interface

###  Moteur Audio (AudioEngine)
- **Architecture headless** : moteur audio indépendant de l'interface
- **Web Audio API** pour un traitement audio haute performance
- **Gestion du contexte audio** avec reprise automatique
- **Lecture avec trim** : découpe précise des samples
- **Support de vélocité** pour contrôler le gain
- **Génération de sons synthétiques** (fallback de démonstration)
- **Gestion de 16 pads** simultanés
- **Chargement asynchrone** avec callback de progression

###  Mode Headless
- **Test du moteur audio** sans interface graphique
- **Validation complète** du pipeline audio
- **Console de logs** interactive dans l'interface
- **Tests automatiques** : chargement de presets, application de trim, lecture de sons
- **Affichage des métriques** : durée, sample rate, nombre de canaux
- **Lecture aléatoire** de plusieurs sons avec trim aléatoire

###  Interactions Utilisateur
- **Canvas interactif** avec détection de proximité pour les barres de trim
- **Highlight au survol** des éléments interactifs
- **Drag & drop** fluide pour les contrôles de trim
- **Synchronisation** entre sliders et canvas
- **Feedback visuel** immédiat sur toutes les actions
- **Gestion du clic** pour reprendre le contexte audio (politique des navigateurs)

###  Intégration Backend
- **API REST** pour récupérer les presets
- **Chargement de samples** depuis le backend
- **Support d'URLs multiples** : absolues HTTP/HTTPS, absolues serveur (/path), relatives (./path)
- **Gestion des erreurs** avec fallback sur des presets de démo
- **Backend URL configurable** (par défaut: https://web-audio-api.onrender.com)

---

##  Architecture

### Structure des Fichiers

```
sampler-frontend/
├── index.html              # Page principale de l'application
├── css/
│   └── style.css          # Styles de l'interface
└── js/
    ├── audioEngine.js     # Moteur audio headless (Web Audio API)
    ├── gui.js             # Interface utilisateur (SamplerGUI)
    ├── midiController.js  # Gestion des contrôleurs MIDI
    ├── midiUI.js          # Interface MIDI (sélection de périphériques)
    ├── waveformdrawer.js  # Dessin de forme d'onde
    ├── trimbarsdrawer.js  # Dessin des barres de trim
    └── headlessTest.js    # Tests headless du moteur audio
```

### Architecture Modulaire

####  `AudioEngine` (audioEngine.js)
Moteur audio indépendant et réutilisable :
- Gestion du contexte Web Audio API
- Chargement et décodage des samples
- Lecture avec trim et vélocité
- Gestion de 16 pads
- Génération de sons synthétiques
- Interface headless (utilisable sans GUI)

####  `SamplerGUI` (gui.js)
Couche d'interface utilisateur :
- Création de la grille de pads
- Gestion des événements utilisateur
- Affichage des waveforms
- Synchronisation avec AudioEngine
- Contrôles clavier
- Intégration MIDI

####  `MIDIController` (midiController.js)
Gestion des périphériques MIDI :
- Détection des contrôleurs MIDI
- Mapping notes MIDI → pads
- Gestion de la vélocité
- Événements Note On/Note Off
- API événementielle avec callbacks

####  `WaveformDrawer` (waveformdrawer.js)
Visualisation audio :
- Extraction des pics audio
- Dessin optimisé sur canvas
- Support multi-canaux
- Rendu visuellement attrayant

####  `TrimbarsDrawer` (trimbarsdrawer.js)
Contrôles de trim :
- Dessin des barres de début/fin
- Détection de proximité souris
- Gestion du drag & drop
- Zones grisées pour feedback visuel

####  `runHeadlessTest` (headlessTest.js)
Tests automatisés :
- Validation du moteur audio
- Tests de chargement
- Tests de lecture
- Logs détaillés

---

##  Utilisation

### Installation

Aucune installation requise ! Ouvrez simplement `index.html` dans un navigateur moderne.

### Démarrage

1. **Ouvrir l'application** : Double-cliquez sur `index.html` ou servez-le via un serveur HTTP local
2. **Sélectionner un preset** : Choisissez un preset dans le menu déroulant
3. **Cliquer sur "Charger"** : Attendez que les samples se chargent (barres de progression)
4. **Jouer des sons** : Cliquez sur les pads ou utilisez votre clavier

### Contrôles Clavier

Les touches sont mappées sur les pads de façon intuitive (layout AZERTY) :

```
A  Z  E  R  →  Pads 0-3
Q  S  D  F  →  Pads 4-7
W  X  C  V  →  Pads 8-11
1  2  3  4  →  Pads 12-15
```

### Contrôle MIDI

1. **Connecter un contrôleur MIDI** (clavier, pad controller, etc.)
2. **L'application détecte automatiquement** le périphérique
3. **Sélectionner le périphérique** dans l'interface MIDI
4. **Jouer** : Les notes MIDI 36-51 sont mappées sur les pads 0-15
5. **Vélocité supportée** : La force de frappe contrôle le volume

### Trimming

**Via le canvas :**
- Survolez le canvas de waveform
- Les barres de trim apparaissent en rouge au survol
- Cliquez et glissez pour ajuster le début/fin

**Via les sliders :**
- Utilisez les sliders "Début" et "Fin" sous le canvas
- Les valeurs en secondes s'affichent en temps réel

### Mode Headless

Cliquez sur **"Lancer Test Headless"** pour :
- Tester le moteur audio sans GUI
- Valider le chargement des presets
- Vérifier la lecture avec trim
- Consulter les logs détaillés

---

