import mongoose from 'mongoose';

const sampleSchema = new mongoose.Schema({
  name: String,
  url: String,
  storedName: String,
  size: Number
});

const presetSchema = new mongoose.Schema({
  id: { type: String, unique: true }, // Keeping strict UUID compatibility
  name: { type: String, required: true, unique: true },
  slug: String,
  type: String, // e.g., "kit", "synth", etc.
  isFactoryPresets: Boolean,
  description: String,
  samples: [sampleSchema],
}, {
  timestamps: true // adds createdAt, updatedAt
});

export const Preset = mongoose.model('Preset', presetSchema);
