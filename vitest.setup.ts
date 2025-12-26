import '@testing-library/jest-dom';

// Suppress unhandled rejections from React Router navigation in tests
// These occur because React Router v7 tries to make HTTP requests when navigating,
// but the AbortSignal from jsdom isn't compatible with Node's undici in test environment
if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', (reason) => {
    // Suppress AbortSignal errors from React Router navigation in tests
    if (
      reason instanceof Error &&
      reason.message.includes('AbortSignal') &&
      reason.stack?.includes('react-router')
    ) {
      return; // Suppress this specific error
    }
    // Re-throw other unhandled rejections
    throw reason;
  });
}
