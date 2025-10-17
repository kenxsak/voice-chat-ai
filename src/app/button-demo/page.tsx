'use client';

import React from 'react';
import { ModernButton } from '@/components/ui/button-modern';
import { ArrowRight, Send, Download, Heart } from 'lucide-react';

export default function ButtonDemoPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Modern Button Showcase
          </h1>
          <p className="text-muted-foreground text-lg">
            Featuring the exact Uiverse.io button design with Galano Grotesque typography
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Interactive Buttons</h2>
            
            <div className="space-y-4">
              <ModernButton icon={<Send className="w-5 h-5" />}>
                Send Message
              </ModernButton>
              
              <ModernButton icon={<ArrowRight className="w-5 h-5" />}>
                Get Started
              </ModernButton>
              
              <ModernButton icon={<Download className="w-5 h-5" />}>
                Download Now
              </ModernButton>
              
              <ModernButton icon={<Heart className="w-5 h-5" />}>
                Add to Favorites
              </ModernButton>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Typography Showcase</h2>
            
            <div className="space-y-4 p-6 border border-border rounded-lg">
              <h1 className="text-3xl font-bold">Heading 1 - Galano Grotesque</h1>
              <h2 className="text-2xl font-semibold">Heading 2 - Professional</h2>
              <h3 className="text-xl font-medium">Heading 3 - Clean Design</h3>
              <p className="text-base">
                Body text using Galano Grotesque font family with excellent readability 
                and professional appearance. Perfect for modern web applications.
              </p>
              <p className="text-sm text-muted-foreground">
                Small text with muted color for secondary information.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Button Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 border border-border rounded-lg">
              <strong>Hover Effects</strong><br />
              Scale animation with enhanced shadows
            </div>
            <div className="p-4 border border-border rounded-lg">
              <strong>Letter Animation</strong><br />
              Individual letter animations on hover
            </div>
            <div className="p-4 border border-border rounded-lg">
              <strong>Focus States</strong><br />
              Animated transitions and state changes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
