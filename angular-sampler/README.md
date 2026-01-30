# 🎵 Audio Sampler - Admin Dashboard

Modern audio sample management application with Angular 18. Features neon green/pink theming and real-time CRUD operations.

## ✨ Features

- **Preset Management**: Create, rename, delete, and search audio presets
- **Sample Management**: Upload, play, rename, and delete audio samples
- **Real-time Updates**: Auto-refresh UI after all operations
- **Modern UI**: Dark theme with neon accents, Material Design dialogs, responsive layout

## 🛠️ Tech Stack

**Frontend**: Angular 18, TypeScript, TailwindCSS, Angular Material  
**Backend**: Node.js, Express, MongoDB Atlas (deployed on Render)  
**API URL**: https://web-audio-api.onrender.com/api

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Angular CLI v18+

### Installation

```bash
# Install frontend dependencies
cd angular-sampler
npm install
```

### Run Application

```bash
# Start development server
ng serve

# App runs at http://localhost:4200
# Connects to API at https://web-audio-api.onrender.com/api
```

### Build for Production

```bash
ng build --configuration production
# Output: dist/angular-sampler/browser/
```

## 📁 Project Structure

```
angular-sampler/src/app/
├── components/             # Navbar, SampleCard
├── dialogs/                # Create, Upload, Rename modals
├── pages/                  # AdminPage
├── preset-component/       # Preset display
├── preset-list-component/  # Preset list with search
└── preset-service.ts       # API service
```

## 🔌 API Endpoints

- `GET/POST /api/presets` - List/Create presets
- `PATCH/DELETE /api/presets/:id` - Update/Delete preset
- `POST /api/presets/upload` - Upload sample
- `PATCH/DELETE /api/presets/:id/samples/:sampleId` - Update/Delete sample

---

**Author**: Mamadou Ougailou Diallo | M1 Info Web Technologies 2025/2026
