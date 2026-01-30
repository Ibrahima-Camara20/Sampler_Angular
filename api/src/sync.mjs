import { Preset } from './models/preset.model.mjs';
import { listPresetFiles, readJSON } from './utils.mjs';
import { DATA_DIR } from './config.mjs';
import path from 'path';
import crypto from 'crypto';

export const synchronizePresets = async () => {
  console.log("🔄 Synchronizing presets from filesystem...");
  try {
    const files = await listPresetFiles();
    console.log(`📂 Found ${files.length} preset files in ${DATA_DIR}`);

    let updatedCount = 0;
    let createdCount = 0;

    for (const file of files) {
      const filePath = path.join(DATA_DIR, file);
      try {
        const data = await readJSON(filePath);
        
        // Basic validation or ID generation
        if (!data.id) data.id = crypto.randomUUID();

        // Upsert: Find by name, update if exists, insert if not.
        // We use full replacement of fields present in JSON, but be careful with partials.
        // Usually factory presets in JSON are the source of truth.
        
        const result = await Preset.findOneAndUpdate(
          { name: data.name },
          { $set: data },
          { upsert: true, new: false, rawResult: true }
        );

        if (result.lastErrorObject?.updatedExisting) {
          updatedCount++;
        } else {
          createdCount++;
        }
      } catch (err) {
        console.error(`❌ Failed to process ${file}:`, err.message);
      }
    }

    console.log(`✅ Sync complete: ${createdCount} created, ${updatedCount} updated.`);
  } catch (err) {
    console.error("❌ Preset synchronization failed:", err);
    // We do not exit process here, strict sync failure might be non-fatal or fatal depending on requirements.
    // User requested "update accordingly", implying best-effort sync.
  }
};
