import mongoose from 'mongoose';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { connectDB } from '../src/db.mjs'; // This loads .env and connects
import { Preset } from '../src/models/preset.model.mjs';
import { listPresetFiles, readJSON, safePresetPath } from '../src/utils.mjs'; // Helper functions
import { DATA_DIR } from '../src/config.mjs';

const __filename = fileURLToPath(import.meta.url);

const migrate = async () => {
    try {
        await connectDB();
        console.log("Connected to MongoDB...");
        console.log(`Reading presets from: ${DATA_DIR}`);

        // Read all JSON files
        const files = await listPresetFiles();
        console.log(`Found ${files.length} local preset files.`);

        let count = 0;
        for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            const data = await readJSON(filePath);
            
            // Check if exists
            const existing = await Preset.findOne({ name: data.name });
            if (existing) {
                console.log(`Skipping "${data.name}" (already exists in DB).`);
                continue;
            }
            
            // Ensure ID exists
            if (!data.id) {
                data.id = crypto.randomUUID();
            }

            const doc = new Preset(data);
            await doc.save();

            
            // If the local file didn't have an ID, generate one or let logic handle it?
            // Controller generated UUID. If local file has ID, we keep it.
            // If local file is effectively "valid", it should be fine.
            
            await doc.save();
            console.log(`Imported "${data.name}"`);
            count++;
        }

        console.log(`Migration complete. Imported ${count} presets.`);
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();
