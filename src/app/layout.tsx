
import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegistration } from './register-sw';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Note: Galano Grotesque is loaded via CSS @import for better fallback handling

export const metadata: Metadata = {
  title: 'Voice Chat AI',
  description: 'Manage your AI agents, training data, and chatbot configurations',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Voice Chat AI',
  },
  icons: {
    icon: [
      {
        url: '/favicon-light.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favicon-dark.svg',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/logo.png',
  },
};

// Improve mobile viewport scaling
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-galano antialiased bg-background text-foreground`}>
        <ServiceWorkerRegistration />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
