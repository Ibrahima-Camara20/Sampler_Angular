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

// Ensure data dir exists at startup (best-effort)
await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});

// ------- Routes -------

// Simple health check endpoint
app.get("/api/health", (_req, res) => res.json({ ok: true, now: new Date().toISOString() }));

// Use presets router
app.use("/api/presets", presetsRouter);

// POST route for uploading audio sample files

app.post("/api/upload/:folder", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file was uploaded." });
  }

  const destinationFolder = req.params.folder || "";
  console.log(`Uploaded file to folder: ${destinationFolder}`);
  
  const fileInfo = {
    name: req.file.originalname, // Assuming display name equals original name initially
    url: `${req.params.folder}/${req.file.filename}`,
    storedName: req.file.filename,
    size: req.file.size
  };

  try {
    // Update MongoDB
    // Try to find preset by name (folder name is usually the preset name)
    // If not found, should we create it? Or require it to exist?
    // Migration script imported everything, so it should exist if valid.
    // If it doesn't exist, maybe this upload is creating a "new" preset folder essentially?
    // Let's upsert if possible, or usually just findOneAndUpdate.
    
    // Atomic Update Strategy to prevent race conditions
    
    // 1. Try to find the preset and push the sample ONLY IF a sample with the same name does not exist.
    const updatedPreset = await Preset.findOneAndUpdate(
        { 
            name: destinationFolder,
            "samples.name": { $ne: fileInfo.name } // Condition: No sample with this name
        },
        { 
            $push: { samples: fileInfo }
        },
        { new: true }
    );

    if (updatedPreset) {
        // Success: Sample added atomically
        return res.status(201).json({ uploaded: 1, file: fileInfo });
    }

    // 2. If update failed, it means either:
    //    a) The preset does not exist.
    //    b) The preset exists but has a duplicate sample.
    
    const existingPreset = await Preset.findOne({ name: destinationFolder });

    if (existingPreset) {
        // Case b: Duplicate sample
        // Delete the orphan file
        await fs.unlink(req.file.path).catch(e => console.error("Error deleting duplicate file:", e));
        return res.status(409).json({ error: "A sample with this name already exists in the preset." });
    } else {
        // Case a: Preset does not exist. Create it.
        try {
            const newPreset = new Preset({ 
                id: crypto.randomUUID(),
                name: destinationFolder, 
                slug: slugify(destinationFolder),
                type: "Drumkit",
                isFactoryPresets: true,
                samples: [fileInfo]
            });
            await newPreset.save();
            return res.status(201).json({ uploaded: 1, file: fileInfo });
        } catch (createErr) {
            // Handle race condition where preset was created just now by another request
            if (createErr.code === 11000) {
                 // Retry the atomic update logic one last time or just return error
                 // For simplicity, we can recurse or just ask user to retry, but let's handle cleanup
                 await fs.unlink(req.file.path).catch(() => {});
                 return res.status(409).json({ error: "Concurrent creation detected. Please try again." });
            }
            throw createErr;
        }
    }
  } catch (err) {
    console.error("Error updating DB after upload:", err);
    // Should we return 500? Or just warn?
    // Return 500 because user wants "perfect implementation" of persistence.
    return res.status(500).json({ error: "Database error during upload sync." });
  }

  res.status(201).json({ uploaded: 1, file: fileInfo });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Re-export constants for tests/utils if needed
export { PUBLIC_DIR, DATA_DIR };
