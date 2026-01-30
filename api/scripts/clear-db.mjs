import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env FIRST, before any other imports that use it
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Now import modules that depend on environment variables
import mongoose from 'mongoose';
import { Preset } from '../src/models/preset.model.mjs';

/**
 * Script to completely clear the MongoDB database
 * WARNING: This will delete ALL presets and samples from the database!
 */
const clearDatabase = async () => {
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
        console.log("✅ Connected to MongoDB");

        // Count before deletion
        const count = await Preset.countDocuments();
        console.log(`📊 Found ${count} presets in database`);

        if (count === 0) {
            console.log("ℹ️  Database is already empty");
            await mongoose.connection.close();
            process.exit(0);
        }

        // Delete all presets
        const result = await Preset.deleteMany({});
        console.log(`🗑️  Deleted ${result.deletedCount} presets`);

        console.log("✅ Database cleared successfully!");
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to clear database:", err);
        await mongoose.connection.close();
        process.exit(1);
    }
};

clearDatabase();
