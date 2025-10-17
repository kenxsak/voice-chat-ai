
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, KeyRound, ArrowRight } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/theme-logo';



export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    // Check if initial setup is required
    const checkSetupStatus = async () => {
      try {
        const response = await fetch('/api/auth/setup');
        
        const contentType = response.headers.get('content-type');
        if (!response.ok || !contentType?.includes('application/json')) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();

        if (data.setupRequired) {
          router.replace('/setup');
          return;
        }
      } catch (error) {
        console.error('Error checking setup status:', error);
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetupStatus();
  }, [router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned an invalid response. Please try again.');
      }

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'Login Successful', description: 'Welcome!' });
        router.push('/dashboard');
      } else {
        toast({
          title: 'Login Failed',
          description: data.message || 'Invalid email or password.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login API error:', error);
      toast({
        title: 'Login Error',
        description: error instanceof Error ? error.message : 'Could not connect to the server or an unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <AnimatedLogo 
            size={80} 
            withRipple={false}
            glowIntensity="low"
            className="mb-4 mx-auto"
          />
          <p className="mt-4 text-muted-foreground font-medium">Checking system status...</p>
          <div className="mt-6 flex justify-center">
            <div className="loader"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header with logo */}
        <div className="text-center mb-8">
          <AnimatedLogo 
            size={80} 
            withRipple={false}
            glowIntensity="low"
            className="mb-6 mx-auto"
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">Sign in to your Voice Chat AI dashboard</p>
        </div>

        {/* Modern card */}
        <Card modern className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-semibold">Admin Login</CardTitle>
            <CardDescription>
              Access your dashboard to manage AI agents and conversations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="form-group-modern">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-4 w-4 rounded bg-primary/10 flex items-center justify-center">
                    <Mail className="w-2.5 h-2.5 text-primary" />
                  </div>
                  Email Address
                </Label>
                <Input
                  modern
                  id="email"
                  type="email"
                  placeholder="admin@voicechat.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="form-group-modern">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-4 w-4 rounded bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-2.5 h-2.5 text-primary" />
                  </div>
                  Password
                </Label>
                <Input
                  modern
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
                <div className="flex justify-end">
                  <Link 
                    href="/forgot" 
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="user-profile w-full animate-modern-fade-in"
                aria-label="Sign In Button"
                tabIndex={0}
                role="button"
              >
                <div className="user-profile-inner">
                  {isLoading ? (
                    <>
                      <div className="loader"></div>
                      <p>Signing In...</p>
                    </>
                  ) : (
                    <>
                      <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                        ></path>
                      </svg>
                      <p>Sign In</p>
                    </>
                  )}
                </div>
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">New to the platform?</span>
              </div>
            </div>

            <div className="text-center">
              <Link href="/register" className="user-profile w-full animate-modern-fade-in inline-block">
                <div className="user-profile-inner">
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="19" y1="8" x2="19" y2="14"></line>
                    <line x1="22" y1="11" x2="16" y2="11"></line>
                  </svg>
                  <p>Create Account</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            © 2024 Voice Chat AI. Professional conversational AI platform.
          </p>
        </div>
      </div>
    </div>
  );
}
