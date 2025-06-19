import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Filter out extension-related errors
    if (error.message.includes('Extension context invalidated') ||
        error.message.includes('message port closed') ||
        error.stack?.includes('chrome-extension://')) {
      console.warn('Browser extension error caught and ignored:', error);
      this.setState({ hasError: false });
      return;
    }
    
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600">Something went wrong</h2>
          <p className="text-gray-600 mt-2">Please refresh the page and try again.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;