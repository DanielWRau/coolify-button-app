/**
 * Next.js Instrumentation
 * Initializes cron scheduler when app starts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeScheduler } = await import('./lib/scheduled-poster');
    await initializeScheduler();
  }
}
