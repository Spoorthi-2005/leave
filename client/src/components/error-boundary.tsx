import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Handle DOMException specifically
    if (error.name === 'DOMException' || error.message.includes('fetch')) {
      console.warn('Network error detected, attempting recovery...');
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">
                Connection Error
              </AlertTitle>
              <AlertDescription className="text-red-700 mt-2">
                {this.state.error?.name === 'DOMException' || 
                 this.state.error?.message.includes('fetch') ? (
                  <>
                    Network connection lost. This might be due to:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Temporary server connectivity issues</li>
                      <li>WebSocket connection problems</li>
                      <li>Browser cache conflicts</li>
                    </ul>
                  </>
                ) : (
                  'An unexpected error occurred in the application.'
                )}
              </AlertDescription>
              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  variant="outline"
                  size="sm"
                >
                  Return to Login
                </Button>
              </div>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;