import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env FIRST, before any other imports that use it
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Now import modules that depend on environment variables
import mongoose from 'mongoose';
import { Preset } from '../src/models/preset.model.mjs';
import { listPresetFiles, readJSON, safePresetPath } from '../src/utils.mjs';
import { DATA_DIR } from '../src/config.mjs';

const migrate = async () => {
    try {
        // Connect directly using the environment variable
        const MONGO_URI = process.env.MONGO_URI;
        
        if (!MONGO_URI) {
            console.error("❌ MONGO_URI not found in environment variables");
            console.log("Make sure .env file exists at:", path.resolve(__dirname, '../.env'));
            process.exit(1);
        }

        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB Connected");
        console.log(`📂 Reading presets from: ${DATA_DIR}`);

        // Read all JSON files
        const files = await listPresetFiles();
        console.log(`📁 Found ${files.length} local preset files.`);

        let count = 0;
        for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            const data = await readJSON(filePath);
            
            // Check if exists
            const existing = await Preset.findOne({ name: data.name });
            if (existing) {
                console.log(`⏭️  Skipping "${data.name}" (already exists in DB).`);
                continue;
            }
            
            // Ensure ID exists
            if (!data.id) {
                data.id = crypto.randomUUID();
            }

            const doc = new Preset(data);
            await doc.save();

            console.log(`✅ Imported "${data.name}"`);
            count++;
        }

        console.log(`🎉 Migration complete. Imported ${count} presets.`);
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        await mongoose.connection.close();
        process.exit(1);
    }
};

migrate();
