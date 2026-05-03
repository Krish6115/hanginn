import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary that catches React render errors.
 * Displays a branded "Quiet Luxury" recovery screen instead of a white crash page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, this would send to an error tracking service
    console.error('[Hanginn ErrorBoundary]', error, info.componentStack);
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="max-w-sm w-full text-center space-y-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
              <span className="font-display text-2xl text-foreground">!</span>
            </div>

            <div className="space-y-3">
              <p className="font-display text-lg text-foreground">
                Something went wrong
              </p>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                We hit an unexpected issue. Your data is safe — let's get you back.
              </p>
            </div>

            <button
              onClick={this.handleRecover}
              className="w-full rounded-2xl py-3.5 text-sm font-body font-medium bg-primary/90 text-primary-foreground hover:bg-primary transition-all duration-500"
            >
              Go back home
            </button>

            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mt-4">
                <summary className="text-xs text-muted-foreground/60 font-body cursor-pointer">
                  Debug info
                </summary>
                <pre className="mt-2 text-[10px] text-muted-foreground/50 font-mono whitespace-pre-wrap break-all bg-secondary rounded-xl p-3">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
