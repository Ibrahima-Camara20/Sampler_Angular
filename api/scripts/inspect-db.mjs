import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import { Preset } from '../src/models/preset.model.mjs';

const inspect = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        if (!MONGO_URI) {
            console.error("❌ MONGO_URI not found");
            process.exit(1);
        }

        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        const presets = await Preset.find().limit(2);
        
        for (const preset of presets) {
            console.log(`\n📦 Preset: ${preset.name}`);
            console.log(`   Type: ${preset.type}`);
            console.log(`   Factory: ${preset.isFactoryPresets}`);
            console.log(`   Samples (${preset.samples.length}):`);
            
            preset.samples.slice(0, 3).forEach(s => {
                console.log(`      - ${s.name}: ${s.url}`);
            });
            
            if (preset.samples.length > 3) {
                console.log(`      ... and ${preset.samples.length - 3} more`);
            }
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
};

inspect();
