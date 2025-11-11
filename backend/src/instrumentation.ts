/**
 * Next.js Instrumentation
 * Initializes cron scheduler when app starts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { initializeScheduler } = await import('./lib/scheduled-poster');
      await initializeScheduler();
      console.log('[INSTRUMENTATION] ✓ Scheduler initialized successfully');
    } catch (error) {
      console.error('[INSTRUMENTATION] Failed to initialize scheduler:', error);
      // Don't crash the app if scheduler fails
    }
  }
}
