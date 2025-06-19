// Add this to your main.tsx or App.tsx for development
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('message port closed') || 
        args[0]?.includes?.('Extension context invalidated')) {
      return; // Suppress extension errors
    }
    originalError.apply(console, args);
  };
}