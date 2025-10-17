'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const defaultSteps: TourStep[] = [
  {
    target: '[data-tour="overview"]',
    title: '👋 Welcome to Your Dashboard!',
    description: 'Get a quick overview of your platform stats and activity here.',
    position: 'bottom'
  },
  {
    target: '[data-tour="tenants"]',
    title: '🏢 Manage Tenants',
    description: 'View and manage all your tenant organizations from this section.',
    position: 'bottom'
  },
  {
    target: '[data-tour="users"]',
    title: '👥 User Management',
    description: 'Monitor and manage all users across your platform.',
    position: 'bottom'
  },
  {
    target: '[data-tour="chatbot"]',
    title: '💬 AI Chatbot',
    description: 'Click here to get instant help and support from our AI assistant.',
    position: 'left'
  }
];

interface OnboardingTourProps {
  steps?: TourStep[];
  onComplete?: () => void;
}

export function OnboardingTour({ steps = defaultSteps, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
    if (!hasSeenTour) {
      // Delay tour start to allow page to render
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const updatePosition = () => {
      const target = document.querySelector(steps[currentStep].target);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      } else {
        // Clear targetRect if target is not found
        setTargetRect(null);
      }
    };

    updatePosition();
    
    // Retry finding target after a short delay (for dynamic content)
    const retryTimeout = setTimeout(updatePosition, 100);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      clearTimeout(retryTimeout);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenOnboardingTour', 'true');
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;
  
  // If target not found, show a message and allow skipping
  if (!targetRect) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-background/95 backdrop-blur-xl border border-primary/40 rounded-xl p-6 shadow-2xl max-w-sm">
          <h3 className="text-lg font-bold text-primary mb-2">
            Element Not Found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            The highlighted element for this step is not currently visible.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleNext} size="sm" className="flex-1">
              {currentStep === steps.length - 1 ? 'Finish' : 'Skip Step'}
            </Button>
            <Button onClick={handleSkip} variant="outline" size="sm" className="flex-1">
              End Tour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];
  const position = step.position || 'bottom';

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {};
  
  switch (position) {
    case 'top':
      tooltipStyle = {
        left: targetRect.left + targetRect.width / 2,
        top: targetRect.top - 20,
        transform: 'translate(-50%, -100%)'
      };
      break;
    case 'bottom':
      tooltipStyle = {
        left: targetRect.left + targetRect.width / 2,
        top: targetRect.bottom + 20,
        transform: 'translateX(-50%)'
      };
      break;
    case 'left':
      tooltipStyle = {
        left: targetRect.left - 20,
        top: targetRect.top + targetRect.height / 2,
        transform: 'translate(-100%, -50%)'
      };
      break;
    case 'right':
      tooltipStyle = {
        left: targetRect.right + 20,
        top: targetRect.top + targetRect.height / 2,
        transform: 'translateY(-50%)'
      };
      break;
  }

  return (
    <>
      {/* Overlay with spotlight cutout */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        {/* Spotlight cutout */}
        <div
          className="absolute border-4 border-primary rounded-lg animate-pulse"
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: `
              0 0 0 9999px rgba(0, 0, 0, 0.6),
              0 0 40px rgba(0, 255, 255, 0.6),
              inset 0 0 40px rgba(0, 255, 255, 0.3)
            `
          }}
        />
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[9999] pointer-events-auto"
        style={tooltipStyle}
      >
        <div className={cn(
          "bg-background/95 backdrop-blur-xl border border-primary/40 rounded-xl p-6 shadow-2xl",
          "max-w-sm w-80",
          "animate-in fade-in slide-in-from-bottom-4 duration-300"
        )}>
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 w-6 rounded-full transition-all duration-300",
                      index === currentStep 
                        ? "bg-primary" 
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="gap-1 bg-primary hover:bg-primary/90"
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Skip option */}
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
            >
              Skip tour
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
