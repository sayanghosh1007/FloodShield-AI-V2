import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AppCrash } from './ErrorState';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Top-level error boundary so a render fault doesn't blank the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <AppCrash error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}
