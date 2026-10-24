import React from 'react';
import { AlertCircle, RefreshCw, Eye } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Drishti Error Boundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white mb-2">
            Drishti Encountered an Interface Error
          </h1>

          <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering issue occurred. Tap below to reload the assistant.'}
          </p>

          <button
            onClick={this.handleReload}
            className="px-6 py-3 rounded-2xl bg-drishti-500 hover:bg-drishti-400 text-slate-950 font-bold text-sm shadow-glow-primary flex items-center gap-2 focus:ring-4 focus:ring-yellow-400"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Reload Drishti Assistant</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
