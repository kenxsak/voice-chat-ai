'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, KeyRound, Building } from 'lucide-react';
import { AnimatedLogo } from '@/components/ui/theme-logo';

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if setup is required
    const checkSetupStatus = async () => {
      try {
        const response = await fetch('/api/auth/setup');
        const data = await response.json();
        setSetupRequired(data.setupRequired);
        
        if (!data.setupRequired) {
          // Setup already completed, redirect to login
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error checking setup status:', error);
        setSetupRequired(true); // Assume setup is required on error
      }
    };

    checkSetupStatus();
  }, [router]);

  const handleSetup = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyName }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ 
          title: 'Setup Complete', 
          description: 'Your account has been created successfully!' 
        });
        router.push('/dashboard');
      } else {
        toast({
          title: 'Setup Failed',
          description: data.message || 'Failed to complete setup.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Setup API error:', error);
      toast({
        title: 'Setup Error',
        description: 'Could not connect to the server or an unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (setupRequired === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking setup status...</p>
        </div>
      </div>
    );
  }

  if (!setupRequired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 px-4 py-6 sm:py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Futuristic header with logo */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-6">
            <AnimatedLogo 
              size={100} 
              withRipple={true}
              glowIntensity="high"
            />
          </div>
          <h1 className="text-3xl font-bold cyber-gradient bg-clip-text text-transparent neon-text">
            Platform Setup
          </h1>
          <p className="text-muted-foreground mt-2">Initialize your AI chat platform</p>
        </div>

        <Card className="card-professional shadow-professional-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-semibold text-foreground">Initial Setup</CardTitle>
            <CardDescription className="text-muted-foreground">
              Create your super admin account to get started with the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSetup} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="companyName" className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <Building className="w-3 h-3 text-primary flex-shrink-0" />
                  </div>
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Your Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <Mail className="w-3 h-3 text-primary flex-shrink-0" />
                  </div>
                  Admin Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-3 h-3 text-primary flex-shrink-0" />
                  </div>
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                  minLength={8}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-3 h-3 text-primary flex-shrink-0" />
                  </div>
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                  minLength={8}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-professional transition-all duration-200 hover-lift"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-transparent"></div>
                    <span>Setting up platform...</span>
                  </div>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                This will create your super admin account with full platform access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
