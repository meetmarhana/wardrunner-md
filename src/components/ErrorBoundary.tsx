import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

function clearAllDemoData(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('wardrunner_'));
  keys.forEach(k => localStorage.removeItem(k));
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error): void {
    console.error('[WardRunner] Uncaught error:', error);
  }

  private handleReturnHome = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  private handleResetData = (): void => {
    clearAllDemoData();
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center space-y-5">
            <div className="text-5xl">🚨</div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                An unexpected error occurred. Your saved progress should still be intact.
                Try returning home — if the issue persists, reset the demo data.
              </p>
            </div>

            {this.state.errorMessage && (
              <div className="text-left bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-500 font-mono break-all">{this.state.errorMessage}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReturnHome}
                className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
              >
                🏥 Return to Home
              </button>
              <button
                onClick={this.handleResetData}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                🗑️ Reset All Demo Data &amp; Reload
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Reset clears your profile, best scores, and onboarding — useful if the app gets into a bad state.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
