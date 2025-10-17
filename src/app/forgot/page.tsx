'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Reset Link Sent",
          description: "If an account with that email exists, we've sent you a password reset link.",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: "Error",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-green-100 dark:bg-green-900/20 rounded-full p-3 w-16 h-16 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Check Your Email</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center space-y-2">
              <p>Click the link in the email to reset your password.</p>
              <p>If you don't see the email, check your spam folder.</p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="w-full"
              >
                Try Different Email
              </Button>
              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-foreground">Reset Password</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
                  <Mail className="w-3 h-3 text-primary" />
                </div>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 bg-background border-input focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md transition-colors"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/20 border-t-transparent"></div>
                  Sending Reset Link...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
