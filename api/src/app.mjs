// src/app.mjs — corrigé complet
import express from "express";
import fs from "fs/promises";
import path from "path";
import multer from "multer";
import crypto from "crypto";

import { PUBLIC_DIR, DATA_DIR } from "./config.mjs"; // Keep original names for compatibility if used elsewhere

// import utility functions from utils.mjs
import {
  slugify, safePresetPath, fileExists,
  readJSON, writeJSON, listPresetFiles, validatePreset
} from "./utils.mjs";

import { presetsRouter } from "./routes/presets.routes.mjs";
import { Preset } from "./models/preset.model.mjs";

import cors from "cors";

export const app = express();

app.use(cors()); // Enable CORS for ALL origins
app.use(express.json({ limit: "2mb" }));

// configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const folder = req.params.folder || "";
      const destDir = path.join(DATA_DIR, folder);
      await fs.mkdir(destDir, { recursive: true }).catch(() => {});
      cb(null, destDir);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// app.use should use a path that works on unix and windows
app.use(express.static(PUBLIC_DIR));
// Serve presets from DATA_DIR explicitly to allow external volumes (e.g. Docker/Cloud mounts)
// This ensures that even if DATA_DIR is not inside PUBLIC_DIR, files are accessible at /presets/...
app.use('/presets', express.static(DATA_DIR));

// Ensure data dir exists at startup (best-effort)
await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});

// ------- Routes -------

// Simple health check endpoint
app.get("/api/health", (_req, res) => res.json({ ok: true, now: new Date().toISOString() }));

// Use presets router
app.use("/api/presets", presetsRouter);

// POST route for uploading audio sample files

app.post("/api/upload/:folder", upload.any(), async (req, res) => {
  // Check if file is present in req.files (Multer puts files here with upload.any())
  const file = req.files?.find(f => f.fieldname === 'file');

  if (!file) {
    return res.status(400).json({ error: "No file was uploaded." });
  }

  const destinationFolder = req.params.folder || "";
  
  // Validate folder parameter
  if (!destinationFolder || !destinationFolder.trim()) {
    await fs.unlink(file.path).catch(() => {});
    return res.status(400).json({ error: "Preset folder name is required" });
  }
  
  console.log(`Uploaded file to folder: ${destinationFolder}`);
  
  const fileInfo = {
    name: file.originalname,
    url: `${req.params.folder}/${file.filename}`,
  };

  try {
    // Atomic Update Strategy to prevent race conditions
    // 1. Try to find the preset and push the sample ONLY IF a sample with the same name does not exist.
    // AND check limit (max 16)
    const updatedPreset = await Preset.findOneAndUpdate(
        { 
            name: destinationFolder,
            "samples.name": { $ne: fileInfo.name },
            "samples.15": { $exists: false } // Only allow if there are 15 or fewer samples currently (indices 0-14)
        },
        { 
            $push: { samples: fileInfo }
        },
        { new: true }
    );

    if (updatedPreset) {
        return res.status(201).json({ uploaded: 1, file: fileInfo });
    }

    // 2. If update failed, determine why
    const existingPreset = await Preset.findOne({ name: destinationFolder });

    if (existingPreset) {
        // Validation failed (duplicate or limit)
        // Delete the uploaded file
        await fs.unlink(file.path).catch(e => console.error("Error deleting orphan file:", e));

        if (existingPreset.samples.length >= 16) {
           return res.status(409).json({ error: "Limit reached: Preset cannot have more than 16 samples." });
        }
        return res.status(409).json({ error: "A sample with this name already exists in the preset." });
    } else {
        // Preset does not exist. Create it.
        try {
            const newPreset = new Preset({ 
                id: crypto.randomUUID(),
                name: destinationFolder, 
                slug: slugify(destinationFolder),
                type: "Drumkit",
                isFactoryPresets: false, // User-uploaded presets
                samples: [fileInfo]
            });
            await newPreset.save();
            return res.status(201).json({ uploaded: 1, file: fileInfo });
        } catch (createErr) {
            await fs.unlink(file.path).catch(() => {});
            if (createErr.code === 11000) {
                 return res.status(409).json({ error: "Concurrent creation detected. Please try again." });
            }
            throw createErr;
        }
    }
  } catch (err) {
    console.error("Error updating DB after upload:", err);
    await fs.unlink(file.path).catch(() => {});
    return res.status(500).json({ error: "Database error during upload sync." });
  }
});

// Error handler middleware
app.use((err, req, res, next) => {
  // Log full error for debugging
  console.error('❌ Error:', err);
  
  // Handle Multer-specific errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: `Unexpected field: ${err.field}` });
    }
    if (err.code === 'MISSING_FIELD_NAME') {
      return res.status(400).json({ error: 'Missing field name in multipart form.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation failed', errors });
  }
  
  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry detected' });
  }
  
  // Generic server error
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message || 'Internal Server Error'
  });
});

// Re-export constants for tests/utils if needed
export { PUBLIC_DIR, DATA_DIR };
