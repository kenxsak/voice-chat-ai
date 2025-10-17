'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building, Mail, KeyRound, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: 'Registration Failed',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
        toast({
            title: 'Registration Failed',
            description: 'Password must be at least 8 characters long.',
            variant: 'destructive',
        });
        setIsLoading(false);
        return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Registration Successful',
          description: data.message || 'You can now log in.',
        });
        router.push('/login');
      } else {
        toast({
          title: 'Registration Failed',
          description: data.message || 'An error occurred. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Registration API error:', error);
      toast({
        title: 'Registration Error',
        description: 'Could not connect to the server or an unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 px-4 py-6 sm:py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Professional header with logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-professional-lg mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Get Started
          </h1>
          <p className="text-muted-foreground mt-2">Create your AI-powered chat assistant</p>
        </div>

        <Card modern className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-semibold text-foreground">Create Your Brand Account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Join us and set up your AI-powered chat assistant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="form-group-modern">
                <Label htmlFor="companyName" className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <Building className="w-3 h-3 text-primary flex-shrink-0" />
                  </div>
                  Company Name
                </Label>
                <Input
                  modern
                  id="companyName"
                  type="text"
                  placeholder="Your Company Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 transition-all duration-200"
                />
              </div>
              <div className="form-group-modern">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <Mail className="w-3 h-3 text-primary flex-shrink-0" />
                  </div>
                  Admin Email
                </Label>
                <Input
                  modern
                  id="email"
                  type="email"
                  placeholder="admin@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 transition-all duration-200"
                />
              </div>
              <div className="form-group-modern">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-3 h-3 text-primary flex-shrink-0" />
                  </div>
                  Password
                </Label>
                <Input
                  modern
                  id="password"
                  type="password"
                  placeholder="•••••••• (min. 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 transition-all duration-200"
                />
              </div>
              <div className="form-group-modern">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-3 h-3 text-primary flex-shrink-0" />
                  </div>
                  Confirm Password
                </Label>
                <Input
                  modern
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 transition-all duration-200"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="user-profile w-full animate-modern-fade-in"
                aria-label="Create Account Button"
                tabIndex={0}
                role="button"
              >
                <div className="user-profile-inner">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-current/20 border-t-transparent" />
                      <p>Creating...</p>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            <div className="text-center">
              <Link href="/login" className="user-profile w-full animate-modern-fade-in inline-block">
                <div className="user-profile-inner">
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
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}