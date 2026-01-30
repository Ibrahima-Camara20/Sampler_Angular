import { app } from "./src/app.mjs";
import { connectDB } from "./src/db.mjs";
import { synchronizePresets } from "./src/sync.mjs";

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log to a service and gracefully shutdown
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Graceful shutdown
  process.exit(1);
});

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connection established');
    
    // Auto-sync files on restart
    try {
      await synchronizePresets();
    } catch (syncError) {
      console.error('⚠️  Preset synchronization failed, but server will continue:', syncError.message);
      // Non-fatal: server can still operate without sync
    }
    
    // Start HTTP server
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`API Presets http://localhost:${PORT}`);
    });

    // Graceful shutdown handler
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
