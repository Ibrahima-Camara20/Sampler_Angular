import path from "path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config();

export const MONGO_URI = process.env.MONGO_URI;


// PUBLIC_DIR: env var wins, else ../public (absolute path)
export const PUBLIC_DIR = process.env.PUBLIC_DIR
  ? path.resolve(process.env.PUBLIC_DIR)
  : path.resolve(__dirname, "../public");

// DATA_DIR: env var wins, else <PUBLIC_DIR>/presets
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(PUBLIC_DIR, "presets");
