import { app } from "./src/app.mjs";
import { connectDB } from "./src/db.mjs";

await connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Presets http://localhost:${PORT}`));
