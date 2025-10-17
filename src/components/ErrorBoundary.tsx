'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 p-4">
          <Card className="max-w-md w-full glass-card border-destructive/30">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Something went wrong</CardTitle>
              <CardDescription className="text-muted-foreground">
                We encountered an unexpected error. Don't worry, your data is safe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <details className="text-sm bg-muted/30 p-3 rounded-lg">
                  <summary className="cursor-pointer font-medium text-muted-foreground">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs text-destructive overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
