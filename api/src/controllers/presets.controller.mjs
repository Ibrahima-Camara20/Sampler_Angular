import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { DATA_DIR } from "../config.mjs";
import {
  slugify, fileExists, validatePreset
} from "../utils.mjs";
import { Preset } from "../models/preset.model.mjs";

export const healthCheck = (_req, res) => res.json({ ok: true, now: new Date().toISOString() });

export const getAllPresets = async (req, res, next) => {
  try {
    const { q, type, factory } = req.query;
    const filter = {};

    if (type) {
      filter.type = { $regex: new RegExp(`^${type}$`, 'i') };
    }
    if (factory !== undefined) {
      filter.isFactoryPresets = String(factory) === "true";
    }
    if (q) {
      const needle = String(q);
      const regex = { $regex: needle, $options: 'i' };
      filter.$or = [
        { name: regex },
        { "samples.name": regex },
        { "samples.url": regex }
      ];
    }

    const items = await Preset.find(filter);
    res.json(items);
  } catch (e) { next(e); }
};

export const getPresetByName = async (req, res, next) => {
  try {
    const preset = await Preset.findOne({ name: req.params.name });
    if (!preset) return res.status(404).json({ error: "Preset not found" });
    res.json(preset);
  } catch (e) { next(e); }
};

export const createPreset = async (req, res, next) => {
  try {
    // Basic validation
    const errs = validatePreset(req.body);
    if (errs.length) return res.status(400).json({ errors: errs });

    const existing = await Preset.findOne({ name: req.body.name });
    if (existing) return res.status(409).json({ error: "A preset with this name already exists" });

    const preset = new Preset({
      ...req.body,
      id: req.body.id || crypto.randomUUID(),
      slug: slugify(req.body.name)
    });

    await preset.save();
    
    // Create folder if not exists logic? 
    // Usually created lazily on upload, but let's ensure consistency if needed.
    // Logic was previously inside upload route.

    res.status(201).json(preset);
  } catch (e) { next(e); }
};

export const replacePreset = async (req, res, next) => {
  try {
    const oldName = req.params.name;
    const presetToUpdate = await Preset.findOne({ name: oldName });
    
    if (!presetToUpdate) return res.status(404).json({ error: "Preset not found" });

    const newData = req.body ?? {};
    const errs = validatePreset(newData);
    if (errs.length) return res.status(400).json({ errors: errs });

    // Handle renaming with rollback logic
    if (newData.name && newData.name !== oldName) {
      // Check if new name taken in DB
      const exists = await Preset.findOne({ name: newData.name });
      if (exists) return res.status(409).json({ error: "Preset with this new name already exists" });

      // Rename folder implementation
      const oldFolderPath = path.join(DATA_DIR, oldName);
      const newFolderPath = path.join(DATA_DIR, newData.name);
      
      if (await fileExists(oldFolderPath)) {
        try {
          // 1. Attempt FS Rename first
          await fs.rename(oldFolderPath, newFolderPath);
        } catch (err) {
           console.error("Error renaming folder:", err);
           return res.status(500).json({ error: "Failed to rename preset folder on disk." });
        }

        // 2. Prepare DB update
        presetToUpdate.name = newData.name;
        presetToUpdate.slug = slugify(newData.name);
        presetToUpdate.type = newData.type;
        presetToUpdate.isFactoryPresets = newData.isFactoryPresets;
        presetToUpdate.samples = newData.samples;

        try {
            await presetToUpdate.save();
        } catch (dbErr) {
            // 3. Rollback FS if DB save fails
            console.error("DB Save failed, rolling back folder rename...", dbErr);
            await fs.rename(newFolderPath, oldFolderPath).catch(e => console.error("CRITICAL: Rollback failed", e));
            return next(dbErr);
        }
      } else {
         // Folder didn't exist? Just update DB
         presetToUpdate.name = newData.name;
         presetToUpdate.slug = slugify(newData.name);
         presetToUpdate.type = newData.type;
         presetToUpdate.isFactoryPresets = newData.isFactoryPresets;
         presetToUpdate.samples = newData.samples;
         await presetToUpdate.save();
      }
    } else {
        // No rename, just update
        presetToUpdate.type = newData.type;
        presetToUpdate.isFactoryPresets = newData.isFactoryPresets;
        presetToUpdate.samples = newData.samples;
        await presetToUpdate.save();
    }
    
    res.json(presetToUpdate);
  } catch (e) { next(e); }
};

export const updatePreset = async (req, res, next) => {
  try {
    const oldName = req.params.name;
    const presetToUpdate = await Preset.findOne({ name: oldName });

    if (!presetToUpdate) return res.status(404).json({ error: "Preset not found" });

    const merged = { ...presetToUpdate.toObject(), ...req.body };
    // validate partial?
    // Mongoose handles type validation, but custom validator was used before.
    // Re-use logic:
    const errs = validatePreset(merged, { partial: true });
    if (errs.length) return res.status(400).json({ errors: errs });

    // Rename logic with consistency
    if (req.body.name && req.body.name !== oldName) {
         // Check collision
         const exists = await Preset.findOne({ name: req.body.name });
         if (exists) return res.status(409).json({ error: "Preset name already taken" });

         // Rename folder
         const oldFolderPath = path.join(DATA_DIR, oldName);
         const newFolderPath = path.join(DATA_DIR, req.body.name);
         
         if (await fileExists(oldFolderPath)) {
             try {
                // 1. FS Rename
                await fs.rename(oldFolderPath, newFolderPath);
             } catch (e) {
                console.error("RenameFolderErr", e);
                return res.status(500).json({ error: "Failed to rename folder" });
             }

             // 2. DB Update
             Object.assign(presetToUpdate, req.body);
             if (presetToUpdate.isModified('name')) {
               presetToUpdate.slug = slugify(presetToUpdate.name);
             }

             try {
                 await presetToUpdate.save();
             } catch (dbErr) {
                 // 3. Rollback
                  console.error("DB Save failed, rolling back folder rename...", dbErr);
                  await fs.rename(newFolderPath, oldFolderPath).catch(e => console.error("CRITICAL: Rollback failed", e));
                  return next(dbErr);
             }
         } else {
             // Folder missing, just DB update
             Object.assign(presetToUpdate, req.body);
             if (presetToUpdate.isModified('name')) {
               presetToUpdate.slug = slugify(presetToUpdate.name);
             }
             await presetToUpdate.save();
         }
    } else {
        // No rename
        Object.assign(presetToUpdate, req.body);
        await presetToUpdate.save();
    }
    
    res.json(presetToUpdate);
  } catch (e) { next(e); }
};

export const deletePreset = async (req, res, next) => {
  try {
    const deleted = await Preset.findOneAndDelete({ name: req.params.name });
    
    if (!deleted) {
      return res.status(404).json({ error: "Preset not found" });
    }
    
    // Delete folder after confirming DB deletion
    const folderPath = path.join(DATA_DIR, req.params.name);
    await fs.rm(folderPath, { recursive: true, force: true }).catch(err => {
      console.error("Failed to delete preset folder:", err);
    });

    res.json({ message: "Preset deleted", name: req.params.name });
  } catch (e) { next(e); }
};

export const seedPresets = async (req, res, next) => {
  // Use Mongoose deleteMany
  try {
      await Preset.deleteMany({}); // Clear DB first?
      const arr = Array.isArray(req.body) ? req.body : [];
      if (!arr.length) return res.status(400).json({ error: "No presets provided" });

      const created = [];
      for (const p of arr) {
          const doc = new Preset({
             ...p,
             id: p.id || crypto.randomUUID(),
             slug: slugify(p.name) 
          });
          await doc.save();
          created.push(doc.slug);
      }
      res.status(201).json({ created: created.length, slugs: created });
  } catch (e) { next(e); }
};

export const deleteSample = async (req, res, next) => {
  try {
    const { name, filename } = req.params;
    
    // Verify preset exists in DB
    const preset = await Preset.findOne({ name });
    if (!preset) {
      return res.status(404).json({ error: "Preset not found" });
    }
    
    // Verify sample exists in preset
    const sampleExists = preset.samples.some(s => s.url && s.url.endsWith(`/${filename}`));
    if (!sampleExists) {
      return res.status(404).json({ error: "Sample not found in preset" });
    }
    
    const folderPath = path.join(DATA_DIR, name);

    // Update DB first
    const updated = await Preset.findOneAndUpdate(
       { name: name },
       { $pull: { samples: { url: { $regex: `/${filename}$` } } } },
       { new: true }
    );
    
    // Then delete file
    const filePath = path.join(folderPath, filename);
    try {
        await fs.rm(filePath, { force: true });
    } catch (err) {
        console.error("Error deleting sample file (orphan created):", err);
        // Do not fail the request, as DB is already updated.
    }
    
    res.json({ message: "Sample deleted", name, filename });
  } catch (e) { next(e); }
};

export const updateSample = async (req, res, next) => {
  try {
    const { name, filename } = req.params;
    
    const folderPath = path.join(DATA_DIR, name);
    
    if (!(await fileExists(folderPath))) return res.status(404).json({ error: "Preset folder not found" });

    const oldFilePath = path.join(folderPath, filename);
    if (!(await fileExists(oldFilePath))) return res.status(404).json({ error: "Sample file not found" });
    
    const { name: newBaseName } = req.body;
    if (!newBaseName || !newBaseName.trim()) return res.status(400).json({ error: "New name is required" });

    const ext = path.extname(filename);
    const newName = newBaseName + ext;
    const newFilePath = path.join(folderPath, newName);

    if (await fileExists(newFilePath)) return res.status(409).json({ error: "File with this name already exists" });

    // Consistency Strategy: FS Rename First -> DB Update -> Revert FS on failure
    
    try {
        await fs.rename(oldFilePath, newFilePath);
    } catch (e) {
        console.error("Error renaming sample file:", e);
        return res.status(500).json({ error: "Failed to rename sample file." });
    }

    try {
        const preset = await Preset.findOne({ name });
        if (!preset) {
            // Rollback file rename if preset not found
            await fs.rename(newFilePath, oldFilePath).catch(e => console.error("Rollback failed", e));
            return res.status(404).json({ error: "Preset not found in database" });
        }
        
        if (preset.samples) {
            const s = preset.samples.find(sample => sample.url && sample.url.endsWith(`/${filename}`));
            if (!s) {
                // Rollback if sample not in DB
                await fs.rename(newFilePath, oldFilePath).catch(e => console.error("Rollback failed", e));
                return res.status(404).json({ error: "Sample not found in preset" });
            }
            
            const parts = s.url.split('/');
            parts[parts.length - 1] = newName;
            s.url = parts.join('/');
            if (s.storedName) s.storedName = newName;
            
            await preset.save();
        }
    } catch (dbErr) {
        console.error("DB Update failed for sample rename, reverting file...", dbErr);
        // Rollback FS
        await fs.rename(newFilePath, oldFilePath).catch(e => console.error("CRITICAL: Sample rename rollback failed", e));
        return next(dbErr);
    }

    res.json({ ok: true, oldName: filename, newName });
  } catch (e) { next(e); }
};
