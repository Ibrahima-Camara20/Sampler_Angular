import express from "express";
import * as PresetsController from "../controllers/presets.controller.mjs";

const router = express.Router();

// GET list/search
router.get("/", PresetsController.getAllPresets);

// POST create
router.post("/", PresetsController.createPreset);

// POST seed
router.post(":seed", PresetsController.seedPresets);

// GET one
router.get("/:name", PresetsController.getPresetByName);

// PUT replace
router.put("/:name", PresetsController.replacePreset);

// PATCH update
router.patch("/:name", PresetsController.updatePreset);

// DELETE
router.delete("/:name", PresetsController.deletePreset);

// DELETE sample
router.delete("/:name/samples/:filename", PresetsController.deleteSample);

// PATCH update sample
router.patch("/:name/samples/:filename", PresetsController.updateSample);

export const presetsRouter = router;
