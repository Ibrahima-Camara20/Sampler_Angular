# 🎵 Audio Sampler Platform

Full-stack web application for managing audio presets and samples with a modern admin dashboard. Built with Angular 18 and Node.js, featuring real-time CRUD operations and a futuristic neon-themed UI.

## 📦 Project Structure

```
Sampler_Angular/
├── angular-sampler/     # Frontend (Angular 18 SPA)
├── api/                 # Backend API (Node.js/Express/MongoDB)
└── sampler-frontend/    # Legacy vanilla JS frontend (deprecated)
```

## ✨ Key Features

### Admin Dashboard (angular-sampler)

- **Preset Management**: Create, rename, delete, search audio presets
- **Sample Management**: Upload, play, rename, delete audio samples
- **Real-time Updates**: Automatic UI refresh after all CRUD operations
- **Modern UI**: Dark gradient theme with neon green/pink accents
- **Responsive Design**: Mobile-first layout with TailwindCSS

### Backend API (api)

- **RESTful API**: Complete CRUD for presets and samples
- **Cloud Storage**: MongoDB Atlas for data, persistent disk for files
- **File Management**: Audio upload/download with automatic URL rewriting
- **Deployed on Render**: https://web-audio-api.onrender.com/api

## 🛠️ Technology Stack

### Frontend

- **Framework**: Angular 18.2.0
- **Language**: TypeScript 5.5.2
- **Styling**: TailwindCSS 3.4.17
- **UI Components**: Angular Material 18.2.14
- **State Management**: RxJS with BehaviorSubject
- **HTTP Client**: Angular HttpClient

### Backend

- **Runtime**: Node.js with Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **File Storage**: Disk-based with cloud persistence
- **Deployment**: Render.com
- **API Architecture**: RESTful with event-driven updates

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Angular CLI v18+

### Running Locally

```bash
# Frontend only (connects to deployed API)
cd angular-sampler
npm install
ng serve
# Open http://localhost:4200
```

### Local Development with API

```bash
# Terminal 1 - Backend
cd api
npm install
# Set MONGO_URI in .env
npm start  # http://localhost:3000

# Terminal 2 - Frontend
cd angular-sampler
# Update apiUrl in preset-service.ts to http://localhost:3000/api
npm install
ng serve  # http://localhost:4200
```

## 🔌 API Endpoints

- `GET/POST /api/presets` - List/Create presets
- `PATCH/DELETE /api/presets/:id` - Update/Delete preset
- `POST /api/presets/upload` - Upload sample to preset
- `PATCH/DELETE /api/presets/:id/samples/:id` - Update/Delete sample

Full API documentation: See [api/README.md](api/README.md)

## 🤖 AI-Assisted Development

This project was developed with assistance from Large Language Models (LLMs):

### LLMs Used

- **Google Gemini 2.0 Flash (Experimental)**: Primary development assistant via Google AI Studio
- **Claude 3.5 Sonnet**: Code review and architecture decisions

### Example Prompts Used

**Initial Setup:**

```
Create an Angular 18 admin dashboard for managing audio samples with CRUD operations.
Use TailwindCSS for styling and Angular Material for dialogs.
```

**Feature Development:**

```
Implement automatic UI refresh after create/update/delete operations using RxJS
and event emitters. The refresh should trigger for presets and samples.
```

**Styling:**

```
Style the application with a neon green (#00ff88) and pink (#ff0080) color scheme.
Use a dark gradient background and add glow effects on interactive elements.
```

**Bug Fixing:**

```
When renaming a preset, sample URLs need to update from ./OldName/file.mp3 to
./NewName/file.mp3. Fix the URL rewriting logic in the preset controller.
```

**Documentation:**

```
Create a comprehensive README with installation instructions, API documentation,
and project structure overview. Keep it under 100 lines.
```

## 👥 Authors

- **Mamadou Ougailou Diallo**
- **Ibrahima Camara**

**Course**: M1 Info - Web Technologies 2025/2026

---

**Live API**: https://web-audio-api.onrender.com/api  
**Documentation**: See README files in [angular-sampler/](angular-sampler/README.md) and [api/](api/README.md)
