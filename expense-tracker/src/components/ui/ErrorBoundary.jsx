import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep runtime recovery: log for debugging, don't crash whole app
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    const { fallback } = this.props;

    if (!hasError) return this.props.children;

    if (fallback) return fallback;

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-rose-600">
            Something went wrong
          </div>
          <div className="mt-3 text-slate-700">
            {error?.message ? error.message : "Unknown render error."}
          </div>
        </div>
      </div>
    );
  }
}
