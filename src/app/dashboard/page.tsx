'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Power, Zap, Users, Languages, CheckCircle, Info, AlertTriangle, Sparkles, Settings, Brain, DollarSign, MessageSquareQuote, BookOpen, Building, LinkIcon, FileText, ExternalLink, Edit3, Edit2, PlusCircle, UserCheck, UserX, CalendarDays, ShieldCheck, ShieldAlert, TrendingUp, Activity, UsersRound, BarChart3, DatabaseZap, MapPin, Bot, Trash2, FileUp, ArrowUp, Search, Phone, Mail, CalendarCheck, MessageCircle, Home, Voicemail, Volume2, Share2, User, Filter, Lightbulb, Clock, Copy, Code, MessageSquarePlus, Palette, Gauge, Loader2, Type, Smile, Maximize, Bold, Move, HelpCircle, Mic, LayoutDashboard, Globe, FileIcon, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format, addDays, differenceInDays, addYears, subDays, differenceInMonths } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/theme-toggle';
import { NeonLoader } from '@/components/ui/loading/neon-loader';
import { useTheme } from "next-themes";
import { AnimatedLogo } from '@/components/ui/theme-logo';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import * as pdfjs from 'pdfjs-dist';
import { extractColorFromImage } from '@/ai/flows/extract-color-from-image';
import {
  checkTrialStatus,
  resetTenantFeaturesToPlan,
  getEffectivePlanLimits,
  getTrialWarningMessage,
  type TrialStatus
} from '@/lib/trial-management';
import { translateText } from '@/ai/flows/translate-text';
import { Progress } from '@/components/ui/progress';
import { HelpDocumentation } from '@/components/help-documentation';
import { ALL_COUNTRIES, ALL_CURRENCIES, ALL_LANGUAGES, getCurrencyForCountry, convertPrice, formatPrice } from '@/lib/global-data';

// Live Preview Iframe Component
const LivePreviewIframe = React.memo(({
    adminManagedTenant,
    widgetBaseUrl,
    widgetPosition,
    previewIframeRef,
    previewRefreshKey,
    embedAgentId
}: {
    adminManagedTenant: any;
    widgetBaseUrl: string;
    widgetPosition: string;
    previewIframeRef: React.RefObject<HTMLIFrameElement>;
    previewRefreshKey: number;
    embedAgentId: string;
}) => {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Don't render until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <div className="absolute inset-0 p-2" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                <div className="w-full h-full flex items-center justify-center border rounded-xl bg-background">
                    <p className="text-muted-foreground">Loading preview...</p>
                </div>
            </div>
        );
    }

    // Fix preview size to medium for consistent layout
    const sizeMap: { [key: string]: { width: number; height: number } } = { small: { width: 360, height: 520 }, medium: { width: 420, height: 640 }, large: { width: 480, height: 720 } };

    // Use exact theme colors from globals.css - check both theme and resolvedTheme
    const isDarkMode = resolvedTheme === 'dark' || theme === 'dark';
    const bgColor = isDarkMode ? 'hsl(222, 84%, 4.9%)' : 'hsl(0, 0%, 99%)';
    const textColor = isDarkMode ? 'hsl(210, 40%, 98%)' : 'hsl(222, 84%, 4.9%)';

    return (
        <div className="absolute inset-0 p-2" style={{ maxWidth: '100%', maxHeight: '100%' }}>
            <iframe
                ref={previewIframeRef}
                key={`${isDarkMode}-${adminManagedTenant.id}-${widgetPosition}-${adminManagedTenant.launcherButtonText}-${adminManagedTenant.launcherButtonIcon}-${adminManagedTenant.launcherButtonSize}-${adminManagedTenant.launcherButtonStyle}-${adminManagedTenant.launcherButtonAnimation}-${adminManagedTenant.brandColor}-${embedAgentId}-${previewRefreshKey}`} // Force re-render on changes
                srcDoc={`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Widget Preview</title><style>html,body{height:100%;margin:0;background:${bgColor};color:${textColor};overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}</style></head><body><script src="${widgetBaseUrl}/widget.js?tenantId=${adminManagedTenant.id}&position=${encodeURIComponent(widgetPosition)}${embedAgentId && embedAgentId !== 'all' ? `&agentId=${embedAgentId}` : ''}" defer></script></body></html>`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                className="w-full h-full"
                style={{
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    background: bgColor
                }}
                title={`${adminManagedTenant.name} Chat Assistant Preview`}
            />
        </div>
    );
});

// Set workerSrc for pdfjs
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;
}

function openImageSafely(imageUrl: string) {
  if (!imageUrl) return;
  
  if (imageUrl.startsWith('data:')) {
    try {
      const parts = imageUrl.split(',');
      if (parts.length !== 2) {
        window.open(imageUrl, '_blank');
        return;
      }
      
      const mimeMatch = imageUrl.match(/data:([^;]+);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      
      const byteString = atob(parts[1]);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([arrayBuffer], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      
      const newWindow = window.open(blobUrl, '_blank');
      
      if (newWindow) {
        newWindow.addEventListener('beforeunload', () => {
          URL.revokeObjectURL(blobUrl);
        });
      }
    } catch (error) {
      console.error('Error opening image:', error);
      window.open(imageUrl, '_blank');
    }
  } else {
    window.open(imageUrl, '_blank');
  }
}

function downloadImageSafely(imageUrl: string, filename: string = 'support-attachment.png') {
  if (!imageUrl) return;
  
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- MOCK DATA & TYPES ---

type MockAgent = {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  avatarHint: string;
  websiteUrl?: string;
  greeting?: string;
  voice?: string;
  trainingContexts?: TrainingContext[];
  // Professional training options
  tone?: 'professional' | 'friendly' | 'casual' | 'formal' | 'enthusiastic';
  responseStyle?: 'concise' | 'detailed' | 'conversational' | 'technical';
  expertiseLevel?: 'beginner-friendly' | 'intermediate' | 'expert' | 'technical';
  customInstructions?: string;
};

type MockTenantStatus = "Active" | "Disabled (Payment Due)" | "Disabled (Usage Limit Reached)";
type MockSubscriptionStartDate = Date;

type TrainingContext = { 
  // Legacy format
  websiteUrl?: string; 
  docInfo?: string; 
  uploadedDocContent?: string;
  // New enhanced format
  id?: string;
  sourceInfo?: string;
  extractedText?: string;
  wordCount?: number;
  characterCount?: number;
  createdAt?: string;
  updatedAt?: string;
};
type SupportedLanguage = { code: string; name: string; rtl?: boolean };

type MockTenant = {
  id: string;
  name: string;
  assignedPlanId: string;
  status: MockTenantStatus;
  country?: string;
  companyLogoUrl?: string;
  brandColor?: string;
  companyDetails?: string;
  trainingWebsiteUrl?: string; // Keep for backward compatibility
  trainingContexts?: TrainingContext[];
  trainingDocInfo?: string; // Keep for backward compatibility
  subscriptionStartDate: MockSubscriptionStartDate | string; // Allow string for JSON persistence
  supportedLanguages?: SupportedLanguage[];
  agents: MockAgent[];
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  billingAddress?: string;
  leadWebhookUrl?: string;
  launcherButtonText?: string;
  launcherButtonIcon?: 'mic' | 'chat' | 'help' | 'phone' | 'none';
  launcherButtonSize?: 'small' | 'medium' | 'large';
  launcherButtonStyle?: 'light' | 'normal' | 'bold';
  launcherButtonAnimation?: 'none' | 'pulse' | 'bounce' | 'glow';
  launcherButtonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  launcherAutoOpenDelay?: 'none' | '10' | '20' | '30' | '60';
  // Usage Tracking
  conversationCount?: number;
  leadCount?: number;
  usageLastReset?: string; // ISO string date
  // Billing Period
  billingPeriod?: 'monthly' | 'yearly';
  // Trial management
  trialOverride?: boolean;
  trialExtendedUntil?: Date | string;
};

type PlanFeature = {
  id: string;
  text: string;
  included: boolean;
};

type Plan = {
  id: string;
  name: string;
  priceINR: string;
  priceUSD: string;
  features: PlanFeature[];
  agentLimit: number;
  languageLimit: number;
  contextLimit: number;
  tokenLimit: number;
  // Plan limits
  conversationLimit: number;
  leadLimit: number;
  description: string;
  isPremiumTrial?: boolean;
  allowsCustomBranding: boolean;
  // Monthly billing support - Razorpay
  razorpayLinkUSD?: string;
  razorpayLinkINR?: string;
  razorpayLinkUSDMonthly?: string;
  razorpayLinkINRMonthly?: string;
  // PayPal links
  paypalLinkUSD?: string;
  paypalLinkINR?: string;
  paypalLinkUSDMonthly?: string;
  paypalLinkINRMonthly?: string;
  // Stripe links
  stripeLinkUSD?: string;
  stripeLinkINR?: string;
  stripeLinkUSDMonthly?: string;
  stripeLinkINRMonthly?: string;
  // Payoneer links
  payoneerLinkUSD?: string;
  payoneerLinkINR?: string;
  payoneerLinkUSDMonthly?: string;
  payoneerLinkINRMonthly?: string;
  yearlyDiscountPercentage: number;
};

const ALL_AVAILABLE_LANGUAGES: SupportedLanguage[] = ALL_LANGUAGES.map(lang => ({
  code: lang.code,
  name: lang.nativeName
}));


// Initial data used to populate localStorage if it's empty
const INITIAL_PLANS_DATA: Plan[] = [
    {
        id: 'free',
        name: 'Free Forever',
        priceINR: '0',
        priceUSD: '0',
        description: 'For individuals or small teams just getting started. Uses default platform branding.',
        features: [
            { id: 'f1', text: '50 conversations/month', included: true },
            { id: 'f2', text: '5 leads/month', included: true },
            { id: 'f3', text: '1 Chatbot Agent', included: true },
            { id: 'f4', text: 'English language only', included: true },
            { id: 'f5', text: 'Basic analytics overview', included: true },
            { id: 'f6', text: 'Community support', included: true },
            { id: 'f7', text: 'Platform branding on chatbot', included: true },
            { id: 'f8', text: 'Manage 1 website context', included: true },
            { id: 'f9', text: 'No conversation history/logs export', included: false },
        ],
        agentLimit: 1,
        languageLimit: 1,
        contextLimit: 1,
        tokenLimit: 50000,
        conversationLimit: 50,
        leadLimit: 5,
        allowsCustomBranding: false,
        yearlyDiscountPercentage: 0,
        razorpayLinkUSD: '',
        razorpayLinkINR: '',
        razorpayLinkUSDMonthly: '',
        razorpayLinkINRMonthly: '',
    },
    {
        id: 'standard',
        name: 'Standard Plan',
        priceINR: '2499',
        priceUSD: '39',
        description: 'For growing businesses needing more agents, languages, and custom branding.',
        features: [
            { id: 's1', text: '500 conversations/month', included: true },
            { id: 's2', text: '50 leads/month', included: true },
            { id: 's3', text: 'Up to 5 Chatbot Agents', included: true },
            { id: 's4', text: 'Up to 5 Languages', included: true },
            { id: 's5', text: 'Manage up to 10 website contexts', included: true },
            { id: 's6', text: 'Standard analytics & lead management', included: true },
            { id: 's7', text: 'Custom branding (your logo)', included: true },
            { id: 's8', text: 'Conversation history & logs export', included: true },
            { id: 's9', text: 'Lead capture via Webhook', included: true },
            { id: 's10', text: 'Email support', included: true },
        ],
        agentLimit: 5,
        languageLimit: 5,
        contextLimit: 10,
        tokenLimit: 500000,
        conversationLimit: 500,
        leadLimit: 50,
        allowsCustomBranding: true,
        yearlyDiscountPercentage: 10,
        razorpayLinkUSD: 'https://example.com/razorpay/standard_usd_yearly',
        razorpayLinkINR: 'https://example.com/razorpay/standard_inr_yearly',
        razorpayLinkUSDMonthly: 'https://example.com/razorpay/standard_usd_monthly',
        razorpayLinkINRMonthly: 'https://example.com/razorpay/standard_inr_monthly',
    },
    {
        id: 'premium',
        name: 'Premium Plan',
        priceINR: '6999',
        priceUSD: '99',
        description: 'For large businesses requiring advanced capabilities, high limits, and priority support.',
        features: [
            { id: 'p1', text: '2,000 conversations/month', included: true },
            { id: 'p2', text: 'Unlimited leads', included: true },
            { id: 'p3', text: 'Unlimited Chatbot Agents', included: true },
            { id: 'p4', text: 'Unlimited Languages', included: true },
            { id: 'p5', text: 'Unlimited website contexts', included: true },
            { id: 'p6', text: 'Advanced document parsing (PDF, DOCX)', included: false }, // Feature flag
            { id: 'p7', text: 'Premium AI Voices (via API)', included: true }, // Feature flag
            { id: 'p8', text: 'Advanced analytics & reporting', included: true },
            { id: 'p9', text: 'Priority email & chat support', included: true },
            { id: 'p10', text: 'Full data export/integration hooks', included: true },
            { id: 'p11', text: 'Custom branding & no platform logo', included: true },
        ],
        agentLimit: 999, // Effectively unlimited
        languageLimit: 999,
        contextLimit: 999,
        tokenLimit: 2000000,
        conversationLimit: 2000,
        leadLimit: 99999,
        isPremiumTrial: true,
        allowsCustomBranding: true,
        yearlyDiscountPercentage: 15,
        razorpayLinkUSD: 'https://example.com/razorpay/premium_usd_yearly',
        razorpayLinkINR: 'https://example.com/razorpay/premium_inr_yearly',
        razorpayLinkUSDMonthly: 'https://example.com/razorpay/premium_usd_monthly',
        razorpayLinkINRMonthly: 'https://example.com/razorpay/premium_inr_monthly',
    },
];

const INITIAL_TENANTS_DATA: MockTenant[] = [
  {
    id: 'tenant_acme_corp',
    name: 'Acme Corp',
    assignedPlanId: 'standard',
    status: 'Active',
    country: 'United States',
    companyLogoUrl: 'https://placehold.co/150x50.png',
    brandColor: '#4C51BF',
    companyDetails: 'Leading provider of innovative solutions.',
    trainingWebsiteUrl: 'https://acme-sales.com',
    trainingDocInfo: 'Product_Catalog_v3.pdf',
    trainingContexts: [
      { websiteUrl: 'https://acme-sales.com', docInfo: 'Product_Catalog_v3.pdf', uploadedDocContent: '' }
    ],
    subscriptionStartDate: new Date(),
    supportedLanguages: [
        { code: 'en-US', name: 'English (US)', rtl: false },
        { code: 'es-ES', name: 'Español', rtl: false },
    ],
    contactEmail: 'billing@acme-corp.com',
    contactPhone: '+1-555-0101',
    contactWhatsapp: '15550101',
    billingAddress: '123 Innovation Drive, Tech Park, CA 94043, USA',
    leadWebhookUrl: 'https://hooks.zapier.com/hooks/catch/123/abc/',
    launcherButtonText: 'Chat with Acme',
    launcherAutoOpenDelay: 'none',
    billingPeriod: 'yearly',
    agents: [
        {
          id: 'acme_assistant',
          name: 'Acme Assistant',
          description: 'Handles all customer inquiries for Acme Corp, including sales and support. For sales-related questions (e.g., product features, pricing), provides information and aims to collect contact details (email, phone) for follow-up. For support issues, attempts to resolve them or gathers necessary information for escalation. Uses acme-sales.com and acme-support-kb.com as context.',
          avatarUrl: 'https://placehold.co/100x100.png',
          avatarHint: 'corporation support sales',
          websiteUrl: 'https://acme-sales.com',
          greeting: "Hello! I'm the Acme Assistant, your guide for all things Acme Corp. How can I do for you today?",
          voice: 'female-us',
          tone: 'professional',
          responseStyle: 'conversational',
          expertiseLevel: 'intermediate',
          customInstructions: 'Always prioritize customer satisfaction and provide helpful, accurate information about Acme Corp products and services. IMPORTANT: Always collect contact information (name, email, phone) when appropriate for follow-up.',
        },
    ],
    conversationCount: 120,
    leadCount: 15,
    usageLastReset: new Date().toISOString(),
  },
  {
    id: 'tenant_beta_solutions',
    name: 'Beta Solutions',
    assignedPlanId: 'free',
    status: 'Active',
    country: 'United Kingdom',
    companyLogoUrl: 'https://placehold.co/140x60.png',
    brandColor: '#F50057',
    companyDetails: 'Software development and consultancy.',
    trainingWebsiteUrl: 'https://beta-support.dev',
    trainingDocInfo: 'API_Documentation.md',
    trainingContexts: [
      { websiteUrl: 'https://beta-support.dev', docInfo: 'API_Documentation.md', uploadedDocContent: '' }
    ],
    subscriptionStartDate: addDays(new Date(), -5),
    supportedLanguages: [{ code: 'en-US', name: 'English (US)', rtl: false }],
    contactEmail: 'support@beta.dev',
    contactPhone: '+44-20-7946-0958',
    launcherButtonText: 'Get Support',
    launcherAutoOpenDelay: 'none',
    billingPeriod: 'monthly',
    agents: [
        {
          id: 'beta_support',
          name: 'Support Specialist',
          description: 'Provides customer support for Beta Solutions software. Context from beta-support.dev. Solves problems and gathers user info (email, phone) for complex cases.',
          avatarUrl: 'https://placehold.co/100x100.png',
          avatarHint: 'software help',
          websiteUrl: 'https://beta-support.dev',
          greeting: "Welcome to Beta Solutions Support! I'm here to assist with any software issues or questions you have. How can I help you today?",
          voice: 'female-gb',
          tone: 'friendly',
          responseStyle: 'detailed',
          expertiseLevel: 'technical',
          customInstructions: 'Focus on solving technical issues step-by-step. Always ask for specific error messages or symptoms to provide accurate troubleshooting. IMPORTANT: Collect user contact information (name, email, phone) for complex cases that may require follow-up.',
        },
    ],
    conversationCount: 48,
    leadCount: 4,
    usageLastReset: new Date().toISOString(),
  },
  {
    id: 'tenant_gamma_inc',
    name: 'Gamma Inc',
    assignedPlanId: 'premium',
    status: 'Active',
    country: 'India',
    companyLogoUrl: 'https://placehold.co/160x40.png',
    brandColor: '#00B8D4',
    companyDetails: 'Global logistics and supply chain.',
    trainingContexts: [{websiteUrl: 'https://gamma-logistics.com', docInfo: 'Service_Level_Agreement.pdf', uploadedDocContent: ''}, {websiteUrl: 'https://gamma-support.com', docInfo: 'Support_FAQ.pdf', uploadedDocContent: ''}],
    subscriptionStartDate: addDays(new Date(), -10),
    supportedLanguages: [
        { code: 'en-US', name: 'English (US)', rtl: false },
        { code: 'hi-IN', name: 'हिन्दी (Hindi)', rtl: false },
        { code: 'fr-FR', name: 'Français', rtl: false },
    ],
    contactEmail: 'contact@gamma-inc.com',
    contactPhone: '+91-22-6659-3283',
    launcherButtonText: 'Track Shipment',
    launcherAutoOpenDelay: 'none',
    billingPeriod: 'yearly',
    agents: [
        {
          id: 'gamma_logistics',
          name: 'Gamma Logistics Bot',
          description: 'Specializes in logistics and supply chain inquiries for Gamma Inc.',
          avatarUrl: 'https://placehold.co/100x100.png',
          avatarHint: 'logistics shipping bot',
          websiteUrl: 'https://gamma-logistics.com',
          greeting: "Welcome to Gamma Inc. Logistics. How can I assist with your shipping needs today?",
          voice: 'male-in',
          tone: 'professional',
          responseStyle: 'concise',
          expertiseLevel: 'expert',
          customInstructions: 'Provide accurate shipping and logistics information. Focus on tracking numbers, delivery dates, and shipping options. IMPORTANT: Collect contact information (name, email, phone) for shipping updates and issue resolution.',
        }
    ],
    conversationCount: 850,
    leadCount: 95,
    usageLastReset: new Date().toISOString(),
  },
];

// Analytics data will be loaded from API

const analyticsChartConfig = {
  conversations: {
    label: "Conversations",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const getInitials = (name: string = ""): string => { if (!name) return 'U'; const parts = name.split(' '); if (parts.length > 1) return parts[0][0] + parts[parts.length -1][0]; return name.substring(0,2).toUpperCase(); };
const getRoleName = (role: string, tenantName?: string): string => { if (role === 'superadmin') return 'Super Admin'; if (role === 'admin' && tenantName) return `Admin (${tenantName})`; if (role === 'admin') return 'Admin'; return 'User'; };
const calculateEffectivePrice = (priceStr: string, discountPercent: number): string => { const price = parseFloat(priceStr); if (isNaN(price)) return priceStr; const discountedPrice = price * (1 - discountPercent / 100); return discountedPrice.toFixed(2); };
const displayPrice = (plan: Plan, currency: string): string => {
  const basePrice = plan.priceUSD ? parseFloat(plan.priceUSD) : 0;
  const convertedPrice = convertPrice(basePrice, currency);
  if (plan.id === 'free') return formatPrice(0, currency);
  const effectiveMonthly = calculateEffectivePrice(convertedPrice.toString(), plan.yearlyDiscountPercentage);
  return formatPrice(parseFloat(effectiveMonthly), currency);
};

const getWhatsAppLink = (input: string | undefined | null): string | null => {
  if (!input) return null;
  let numberStr = input.trim();
  if (numberStr.includes('wa.me/')) {
    if (!numberStr.startsWith('http')) {
      return `https://${numberStr}`;
    }
    return numberStr;
  }
  const digitsOnly = numberStr.replace(/\D/g, '');
  if (digitsOnly) {
    return `https://wa.me/${digitsOnly}`;
  }
  return null;
};

const getPaymentLinks = (plan: Plan, billingPeriod: 'monthly' | 'yearly', currency: string) => {
  const isMonthly = billingPeriod === 'monthly';
  
  const links = {
    razorpay: '',
    paypal: '',
    stripe: '',
    payoneer: ''
  };

  // Define which currencies should use INR payment links (South Asian region)
  const inrRegionCurrencies = ['INR', 'PKR', 'BDT', 'LKR', 'NPR', 'BTN', 'MVR'];
  
  // Determine which base currency links to use
  const useINRLinks = inrRegionCurrencies.includes(currency);
  
  if (isMonthly) {
    if (useINRLinks) {
      links.razorpay = plan.razorpayLinkINRMonthly || plan.razorpayLinkUSDMonthly || '';
      links.paypal = plan.paypalLinkINRMonthly || plan.paypalLinkUSDMonthly || '';
      links.stripe = plan.stripeLinkINRMonthly || plan.stripeLinkUSDMonthly || '';
      links.payoneer = plan.payoneerLinkINRMonthly || plan.payoneerLinkUSDMonthly || '';
    } else {
      // Use USD links for all other currencies (Americas, Europe, Middle East, Africa, East Asia, Oceania)
      links.razorpay = plan.razorpayLinkUSDMonthly || plan.razorpayLinkINRMonthly || '';
      links.paypal = plan.paypalLinkUSDMonthly || plan.paypalLinkINRMonthly || '';
      links.stripe = plan.stripeLinkUSDMonthly || plan.stripeLinkINRMonthly || '';
      links.payoneer = plan.payoneerLinkUSDMonthly || plan.payoneerLinkINRMonthly || '';
    }
  } else {
    if (useINRLinks) {
      links.razorpay = plan.razorpayLinkINR || plan.razorpayLinkUSD || '';
      links.paypal = plan.paypalLinkINR || plan.paypalLinkUSD || '';
      links.stripe = plan.stripeLinkINR || plan.stripeLinkUSD || '';
      links.payoneer = plan.payoneerLinkINR || plan.payoneerLinkUSD || '';
    } else {
      // Use USD links for all other currencies (Americas, Europe, Middle East, Africa, East Asia, Oceania)
      links.razorpay = plan.razorpayLinkUSD || plan.razorpayLinkINR || '';
      links.paypal = plan.paypalLinkUSD || plan.paypalLinkINR || '';
      links.stripe = plan.stripeLinkUSD || plan.stripeLinkINR || '';
      links.payoneer = plan.payoneerLinkUSD || plan.payoneerLinkINR || '';
    }
  }

  return links;
};


// LocalStorage Keys
const LOCAL_STORAGE_PLANS_KEY = 'saas_mock_plans';
const LOCAL_STORAGE_TENANTS_KEY = 'saas_mock_tenants';
const LOCAL_STORAGE_LEADS_KEY = 'saas_mock_leads';
const LOCAL_STORAGE_GAPS_KEY = 'saas_mock_knowledge_gaps';


const chartConfig = {
  tenants: {
    label: "Tenants",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

// A simple component to render chat messages in the log viewer modal
const LogMessage = React.memo(({ role, content, agentAvatar }: { role: string; content: any; agentAvatar?: string; }) => {
    const isUser = role === 'user';

    const renderContent = () => {
        if (typeof content === 'string') {
            return <p className="text-sm">{content}</p>;
        }

        if (Array.isArray(content)) {
            return (
                <div className="space-y-2">
                    {content.map((part, index) => {
                        if (part.text) {
                            return <p key={index} className="text-sm">{part.text}</p>;
                        }
                        if (part.media && part.media.url) {
                            return (
                                <img
                                    key={index}
                                    src={part.media.url}
                                    alt="User upload in chat log"
                                    className="max-w-[200px] rounded-lg border mt-2"
                                    data-ai-hint="user image upload"
                                    loading="lazy"
                                />
                            );
                        }
                        return null;
                    })}
                </div>
            );
        }

        return <p className="text-sm text-muted-foreground">[Unsupported message format]</p>;
    };

    return (
        <div className={`flex items-start gap-3 my-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <Avatar className="h-8 w-8">
                <AvatarImage src={!isUser ? agentAvatar : undefined} data-ai-hint={isUser ? 'user avatar' : 'agent avatar'} loading="lazy" />
                <AvatarFallback>{isUser ? <User size={16} /> : <Bot size={16} />}</AvatarFallback>
            </Avatar>
            <div className={`p-3 rounded-lg max-w-[80%] break-words ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {renderContent()}
            </div>
        </div>
    );
});




// Lead item component with translation support
const LeadItem = React.memo(({ lead }: { lead: any }) => {
  // Use structured data fields (customerName, customerEmail, customerPhone) with fallback to parsing customerInfo string
  const name = lead?.customerName || (lead?.customerInfo?.split(/[,@]|phone|tel|mobile/i)[0] || '').trim() || null;
  const email = lead?.customerEmail || (lead?.customerInfo?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [null])[0];
  const phone = lead?.customerPhone || (lead?.customerInfo?.replace(/[^0-9+]/g, '').match(/\+?[0-9]{6,}/) || [null])[0];
  const rawInfo: string = lead?.customerInfo || '';

  const isReturning = lead?.isReturningCustomer || (lead?.totalCustomerSessions && lead.totalCustomerSessions > 1) || false;
  
  return (
    <Dialog>
      <Card modern className="p-4 text-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div className="space-y-1 sm:space-y-2">
            <p className="break-words"><strong>Date:</strong> {lead.date ? format(new Date(lead.date), 'yyyy-MM-dd HH:mm') : 'N/A'}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="break-words"><strong>Customer:</strong> {name || rawInfo || 'N/A'}</p>
              {isReturning && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 rounded-full">
                  🔄 Repeat Customer {lead?.totalCustomerSessions ? `(${lead.totalCustomerSessions} visits)` : ''}
                </span>
              )}
            </div>
            {email && (
              <p className="break-all">
                <strong>Email:</strong>{' '}
                <a href={`mailto:${email}`} className="text-blue-600 hover:text-blue-800 underline break-all">{email}</a>
              </p>
            )}
            {phone && (
              <p className="break-all">
                <strong>Phone:</strong>{' '}
                <a href={`tel:${phone}`} className="text-blue-600 hover:text-blue-800 underline break-all">{phone}</a>
              </p>
            )}
          </div>
          <div className="space-y-1 sm:space-y-2">
            <p className="break-words"><strong>Status:</strong> {lead.status}</p>
            <p className="break-words"><strong>Reference/Agent:</strong> {lead.reference}</p>
            <p className="break-words"><strong>Website Context:</strong> {lead.websiteContext || 'N/A'}</p>
            {lead.ipAddress && (
              <p className="break-words text-xs text-gray-600"><strong>IP Address:</strong> {lead.ipAddress}</p>
            )}
          </div>
        </div>

        {lead.imageUrl && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium text-blue-800 mb-2">📎 Support Attachment</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
              <button
                onClick={() => openImageSafely(lead.imageUrl)}
                className="text-blue-600 hover:text-blue-800 underline text-sm min-h-[44px] flex items-center"
              >
                View Full Image
              </button>
              <span className="hidden sm:inline text-gray-400">|</span>
              <button
                onClick={() => downloadImageSafely(lead.imageUrl, `support-${lead.date || 'attachment'}.png`)}
                className="text-blue-600 hover:text-blue-800 underline text-sm min-h-[44px] flex items-center"
              >
                Download
              </button>
            </div>
            <img
              src={lead.imageUrl}
              alt="Customer support attachment"
              className="mt-2 max-w-full sm:max-w-[200px] max-h-[100px] object-cover rounded border cursor-pointer"
              onClick={() => openImageSafely(lead.imageUrl)}
              data-ai-hint="customer support attachment"
            />
          </div>
        )}

        {lead.summary && (
          <div className="mt-3 pt-3 border-t">
            <p className="font-semibold mb-2">AI Summary:</p>
            <div className="bg-muted/30 rounded-md p-3 border">
              <TranslatableText
                text={lead.summary}
                className="text-sm leading-relaxed break-words"
                compact={true}
                bottomRightControls={true}
              />
            </div>
          </div>
        )}
        <DialogTrigger asChild>
          <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-xs">
            View Full Log
          </Button>
        </DialogTrigger>
      </Card>
      <DialogContent className="w-[98vw] sm:max-w-5xl md:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Conversation Log</DialogTitle>
          <DialogDescription>
            For lead: {name || rawInfo || 'Unknown'}, captured on {lead.date ? format(new Date(lead.date), 'PPpp') : 'Unknown date'}
            {lead.imageUrl && (
              <span className="ml-2 text-blue-600">📎 Contains attachment</span>
            )}
          </DialogDescription>
        </DialogHeader>
        {/* Use a single scrollable area inside the viewer to avoid nested scrollbars */}
        <ConversationLogViewer history={lead.history || []} agentAvatar={lead.agentAvatarUrl} />
      </DialogContent>
    </Dialog>
  );
});

// Reusable translation component for text content
const TranslatableText = React.memo(({
  text,
  className = "",
  showLanguageSelector = true,
  compact = false,
  bottomRightControls = false
}: {
  text: string;
  className?: string;
  showLanguageSelector?: boolean;
  compact?: boolean;
  bottomRightControls?: boolean;
}) => {
  const [viewMode, setViewMode] = React.useState<'original' | 'translated'>('original');
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [translatedText, setTranslatedText] = React.useState<string | null>(null);
  const [lastTranslatedText, setLastTranslatedText] = React.useState<string | null>(null);
  const [lastTranslatedLang, setLastTranslatedLang] = React.useState<string | null>(null);
  const [targetLang, setTargetLang] = React.useState<string>('en-US');

  const doTranslate = async () => {
    if (!text || text.trim() === '') return;
    setIsTranslating(true);
    try {
      const { translatedText: translated } = await translateText({ text, languageCode: targetLang });
      const finalTranslated = translated || text;
      setTranslatedText(finalTranslated);
      // Save as last translation
      setLastTranslatedText(finalTranslated);
      setLastTranslatedLang(targetLang);
      setViewMode('translated');
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const goToLastTranslated = () => {
    if (lastTranslatedText && lastTranslatedLang) {
      setTranslatedText(lastTranslatedText);
      setTargetLang(lastTranslatedLang);
      setViewMode('translated');
    }
  };

  // Re-translate when language changes
  React.useEffect(() => {
    if (viewMode === 'translated') {
      void doTranslate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLang]);

  const displayText = viewMode === 'translated' && translatedText ? translatedText : text;

  if (bottomRightControls) {
    return (
      <div className="relative">
        <div className={`relative ${className}`}>
          {isTranslating && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border px-3 py-2 rounded-md shadow-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Translating...
              </div>
            </div>
          )}
          <p className="whitespace-pre-wrap">{displayText}</p>
        </div>
        {showLanguageSelector && (
          <div className="flex items-center gap-2 justify-end mt-2">
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="h-7 w-[120px] text-xs">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {ALL_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant={viewMode === 'translated' ? 'outline' : 'default'}
              onClick={() => {
                if (viewMode === 'translated') {
                  setViewMode('original');
                } else {
                  void doTranslate();
                }
              }}
              disabled={isTranslating}
              className="h-7 px-2 text-xs"
            >
              {viewMode === 'translated' ? 'Original' : (isTranslating ? 'Translating…' : 'Translate')}
            </Button>
            {viewMode === 'original' && lastTranslatedText && lastTranslatedLang && (
              <Button
                size="sm"
                variant="secondary"
                onClick={goToLastTranslated}
                className="h-7 px-2 text-xs"
              >
                Last Translated
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLanguageSelector && (
        <div className={`flex items-center gap-2 justify-end mb-2`}>
          <div className="flex items-center gap-2">
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className={compact ? "h-7 w-[140px] text-xs" : "h-8 w-[180px]"}>
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {ALL_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size={compact ? "sm" : "sm"}
              variant={viewMode === 'translated' ? 'outline' : 'default'}
              onClick={() => {
                if (viewMode === 'translated') {
                  setViewMode('original');
                } else {
                  void doTranslate();
                }
              }}
              disabled={isTranslating}
              className={compact ? "h-7 px-2 text-xs" : ""}
            >
              {viewMode === 'translated' ? 'Original' : (isTranslating ? 'Translating…' : 'Translate')}
            </Button>
            {/* Show "Last Translated" button when viewing original and we have a saved translation */}
            {viewMode === 'original' && lastTranslatedText && lastTranslatedLang && (
              <Button
                size={compact ? "sm" : "sm"}
                variant="secondary"
                onClick={goToLastTranslated}
                className={compact ? "h-7 px-2 text-xs" : ""}
              >
                Last Translated
              </Button>
            )}
          </div>
        </div>
      )}
      <div className={`relative ${className}`}>
        {isTranslating && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border px-3 py-2 rounded-md shadow-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Translating...
            </div>
          </div>
        )}
        <p className="whitespace-pre-wrap">{displayText}</p>
      </div>
    </div>
  );
});

// Enhanced viewer for full conversation logs with translation support
const ConversationLogViewer = React.memo(({ history, agentAvatar }: { history: any[]; agentAvatar?: string; }) => {
    const [viewMode, setViewMode] = React.useState<'original' | 'translated'>('original');
    const [isTranslating, setIsTranslating] = React.useState(false);
    const [translatedHistory, setTranslatedHistory] = React.useState<any[] | null>(null);
    const [lastTranslatedHistory, setLastTranslatedHistory] = React.useState<any[] | null>(null);
    const [lastTranslatedLang, setLastTranslatedLang] = React.useState<string | null>(null);
    const [targetLang, setTargetLang] = React.useState<string>('en-US');

    const doTranslate = async () => {
        if (!Array.isArray(history) || history.length === 0) return;
        setIsTranslating(true);
        try {
            const translated = await Promise.all(history.map(async (msg: any) => {
                if (!msg || !msg.content) return msg;
                const clone: any = { ...msg };
                if (typeof msg.content === 'string') {
                    const { translatedText } = await translateText({ text: msg.content, languageCode: targetLang });
                    clone.content = translatedText || msg.content;
                } else if (Array.isArray(msg.content)) {
                    const parts = await Promise.all(msg.content.map(async (part: any) => {
                        if (part?.text) {
                            const { translatedText } = await translateText({ text: String(part.text), languageCode: targetLang });
                            return { ...part, text: translatedText || part.text };
                        }
                        return part;
                    }));
                    clone.content = parts;
                }
                return clone;
            }));
            setTranslatedHistory(translated);
            // Save as last translation
            setLastTranslatedHistory(translated);
            setLastTranslatedLang(targetLang);
            setViewMode('translated');
        } finally {
            setIsTranslating(false);
        }
    };

    const goToLastTranslated = () => {
        if (lastTranslatedHistory && lastTranslatedLang) {
            setTranslatedHistory(lastTranslatedHistory);
            setTargetLang(lastTranslatedLang);
            setViewMode('translated');
        }
    };

    // If the user changes the language while viewing the translated log, re-translate automatically
    React.useEffect(() => {
        if (viewMode === 'translated') {
            void doTranslate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetLang]);

    const list = viewMode === 'translated' && translatedHistory ? translatedHistory : (history || []);

    return (
        <div className="space-y-3 transition-all duration-200 ease-out">
            <div className="flex items-center justify-between gap-2 pb-2 border-b">
                <div className="text-sm text-muted-foreground">Full conversation log</div>
                <div className="flex items-center gap-2">
                    <Select value={targetLang} onValueChange={setTargetLang}>
                        <SelectTrigger className="h-8 w-[180px]">
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            {ALL_LANGUAGES.map(lang => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name} ({lang.nativeName})
                              </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button size="sm" variant={viewMode === 'translated' ? 'outline' : 'default'} onClick={() => {
                        if (viewMode === 'translated') {
                          setViewMode('original');
                        } else {
                          void doTranslate();
                        }
                      }} disabled={isTranslating}>
                      {viewMode === 'translated' ? 'View Original' : (isTranslating ? 'Translating…' : 'Translate')}
                    </Button>
                    {/* Show "Last Translated" button when viewing original and we have a saved translation */}
                    {viewMode === 'original' && lastTranslatedHistory && lastTranslatedLang && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={goToLastTranslated}
                      >
                        Last Translated
                      </Button>
                    )}
                </div>
            </div>
            <ScrollArea className="h-[60vh] sm:h-[70vh] p-2 border rounded-md scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {isTranslating && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border px-3 py-2 rounded-md shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Translating…
                    </div>
                  </div>
                )}
                <div className="pb-4 md:pb-12 lg:pb-16 space-y-2">
                  {list && list.length > 0 ? (
                      list.map((msg: any, index: number) => (
                          <LogMessage key={index} role={msg.role} content={msg.content} agentAvatar={agentAvatar} />
                      ))
                  ) : (
                      <div className="text-center text-muted-foreground py-8">No conversation history available.</div>
                  )}
                </div>
            </ScrollArea>
        </div>
    );
});


function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeContextIndex, setActiveContextIndex] = useState<number | null>(null);
  const [activeAgentContextAgentId, setActiveAgentContextAgentId] = useState<string | null>(null);
  const [activeAgentContextIndex, setActiveAgentContextIndex] = useState<number | null>(null);
  
  // Bulk delete state for training contexts
  const [selectedTrainingIds, setSelectedTrainingIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userTenantId, setUserTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isViewingAsSuperAdmin, setIsViewingAsSuperAdmin] = useState(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  const [displayedPlans, setDisplayedPlans] = useState<Plan[]>([]);
  const [mockTenants, setMockTenants] = useState<MockTenant[]>([]);
  const [isAdminTenantLoading, setIsAdminTenantLoading] = useState(true);

  const [defaultTrialDays, setDefaultTrialDays] = useState<number>(14);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  
  // Platform settings state for trial management
  const [platformSettings, setPlatformSettings] = useState<{
    defaultTrialPlanId: string;
    trialLengthDays: number;
    postTrialBehavior: 'auto_downgrade' | 'require_selection';
    gracePeriodDays: number;
  }>({
    defaultTrialPlanId: 'trial',
    trialLengthDays: 14,
    postTrialBehavior: 'auto_downgrade',
    gracePeriodDays: 3,
  });
  const [isSavingPlatformSettings, setIsSavingPlatformSettings] = useState(false);
  const [showPlanSelectionModal, setShowPlanSelectionModal] = useState(false);

  // Admin specific state
  const [adminManagedTenant, setAdminManagedTenant] = useState<MockTenant | undefined>(undefined);
  // States for General Settings form
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('');
  const [companyDetails, setCompanyDetails] = useState('');
  const [companyCountry, setCompanyCountry] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [leadWebhookUrl, setLeadWebhookUrl] = useState('');
  const [launcherButtonText, setLauncherButtonText] = useState('');
  const [launcherButtonIcon, setLauncherButtonIcon] = useState('mic');
  const [launcherButtonSize, setLauncherButtonSize] = useState('medium');
  const [launcherButtonStyle, setLauncherButtonStyle] = useState('normal');
  const [launcherButtonAnimation, setLauncherButtonAnimation] = useState('pulse');
  const [launcherButtonPosition, setLauncherButtonPosition] = useState('bottom-right');
  const [launcherAutoOpenDelay, setLauncherAutoOpenDelay] = useState('none');
  
  // Data retention state
  const [retentionDays, setRetentionDays] = useState(90);
  const [isCleanupPreviewing, setIsCleanupPreviewing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupPreview, setCleanupPreview] = useState<{
    leadsToDelete: number;
    conversationsToDelete: number;
    messagesToDelete: number;
    cutoffDate: string;
  } | null>(null);
  
  // Crawl website modal state
  const [crawlModalOpen, setCrawlModalOpen] = useState(false);
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlMaxPages, setCrawlMaxPages] = useState(10);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState<{ current: number; total: number; status: string }>({ current: 0, total: 0, status: '' });
  const [crawlResults, setCrawlResults] = useState<any[]>([]);
  const [crawlAgentId, setCrawlAgentId] = useState<string | null>(null);
  
  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState<Array<{date: string, conversations: number}>>([]);
  const [totalConversations, setTotalConversations] = useState(0);
  const [totalLeadsThisMonth, setTotalLeadsThisMonth] = useState(0);
  const [totalAnonymousConversations, setTotalAnonymousConversations] = useState(0);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Super admin analytics state
  const [superAdminAnalytics, setSuperAdminAnalytics] = useState<{
    tenants: Array<{
      tenantId: string;
      tenantName: string;
      planId: string;
      planName: string;
      revenue: number;
      aiCost: number;
      profit: number;
      profitMargin: number;
      totalTokens: number;
      tokenLimit: number;
      tokenUsagePercentage: number;
      needsAttention: boolean;
      totalConversations: number;
      leadsWithContact: number;
    }>;
    totals: {
      totalRevenue: number;
      totalAICost: number;
      totalProfit: number;
      platformProfitMargin: number;
      averageProfitMargin: number;
      tenantsNeedingAttention: number;
      totalTokens: number;
      totalConversations: number;
    };
  } | null>(null);
  const [superAdminAnalyticsLoading, setSuperAdminAnalyticsLoading] = useState(false);
  
  // Client-side color extraction fallback
  const extractColorFromImageClient = useCallback(async (imageUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(null);
              return;
            }
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Color frequency map
            const colorCount: Record<string, number> = {};
            
            // Sample every 4th pixel for performance
            for (let i = 0; i < data.length; i += 16) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];
              
              // Skip transparent and near-white pixels
              if (a < 128 || (r > 240 && g > 240 && b > 240)) continue;
              
              // Group similar colors (reduce precision)
              const rGroup = Math.floor(r / 32) * 32;
              const gGroup = Math.floor(g / 32) * 32;
              const bGroup = Math.floor(b / 32) * 32;
              
              const colorKey = `${rGroup},${gGroup},${bGroup}`;
              colorCount[colorKey] = (colorCount[colorKey] || 0) + 1;
            }
            
            // Find most common color
            let maxCount = 0;
            let dominantColor = null;
            
            for (const [color, count] of Object.entries(colorCount)) {
              if (count > maxCount) {
                maxCount = count;
                const [r, g, b] = color.split(',').map(Number);
                dominantColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
              }
            }
            
            resolve(dominantColor);
          } catch (error) {
            console.error('Canvas color extraction failed:', error);
            resolve(null);
          }
        };
        
        img.onerror = () => resolve(null);
        img.src = imageUrl;
      } catch (error) {
        console.error('Image loading failed:', error);
        resolve(null);
      }
    });
  }, []);

  // Load analytics data - now uses session-based tenant filtering
  const loadAnalyticsData = useCallback(async (tenantId?: string) => {
    if (analyticsLoading) return;

    setAnalyticsLoading(true);
    try {
      console.log('[DEBUG] Loading analytics data for tenant:', tenantId);
      // For superadmins, pass tenantId. For regular users, API uses session tenantId automatically
      const url = tenantId ? `/api/analytics?tenantId=${tenantId}&days=7` : '/api/analytics?days=7';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[DEBUG] Analytics data loaded:', data);

      setAnalyticsData(data.dailyStats || []);
      setTotalConversations(data.totalConversations || 0);
      setTotalLeadsThisMonth(data.totalLeads || 0);
      setTotalAnonymousConversations(data.totalAnonymousConversations || 0);
      setTotalTokensUsed(data.totalTokensUsed || 0);
    } catch (error) {
      console.error('[DEBUG] Failed to load analytics data:', error);
      // Fallback to empty data
      setAnalyticsData([]);
      setTotalConversations(0);
      setTotalLeadsThisMonth(0);
      setTotalAnonymousConversations(0);
      setTotalTokensUsed(0);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsLoading]);

  // Load super admin analytics data
  const loadSuperAdminAnalytics = useCallback(async () => {
    if (superAdminAnalyticsLoading) return;

    setSuperAdminAnalyticsLoading(true);
    try {
      console.log('[DEBUG] Loading super admin analytics');
      const response = await fetch('/api/admin/analytics');
      
      if (!response.ok) {
        throw new Error(`Admin analytics API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[DEBUG] Super admin analytics loaded:', data);
      setSuperAdminAnalytics(data);
    } catch (error) {
      console.error('[DEBUG] Failed to load super admin analytics:', error);
      setSuperAdminAnalytics(null);
    } finally {
      setSuperAdminAnalyticsLoading(false);
    }
  }, [superAdminAnalyticsLoading]);

  // States for Training Settings form
  const [trainingContexts, setTrainingContexts] = useState<TrainingContext[]>([]);
  // States for Language Settings form
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);
  // States for Help tab
  const [aiHelpQuery, setAiHelpQuery] = useState('');
  const [aiHelpResponse, setAiHelpResponse] = useState('');
  const [helpDocumentationOpen, setHelpDocumentationOpen] = useState(false);
  const [isAskingAiHelp, setIsAskingAiHelp] = useState(false);
  
  // Superadmin tenant management filters
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // User management state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  
  // State for captured leads
  const [capturedLeads, setCapturedLeads] = useState<any[]>([]);
  
  // State for knowledge gaps
  const [knowledgeGaps, setKnowledgeGaps] = useState<any[]>([]);

  // State for lead management in analytics tab
  const [leadSearchTerm, setLeadSearchTerm] = useState(searchParams.get('q') || '');
  const [leadWebsiteFilter, setLeadWebsiteFilter] = useState(searchParams.get('site') || 'all');
  const [leadAgentFilter, setLeadAgentFilter] = useState(searchParams.get('agent') || 'all');
  const [leadDateFilter, setLeadDateFilter] = useState(searchParams.get('when') || 'all');
  const [leadContactTypeFilter, setLeadContactTypeFilter] = useState(searchParams.get('contact') || 'all');
  const [leadStatusFilter, setLeadStatusFilter] = useState(searchParams.get('status') || 'all');
  const [leadMonthFilter, setLeadMonthFilter] = useState(searchParams.get('month') || 'all');
  const [leadCurrentPage, setLeadCurrentPage] = useState(Number(searchParams.get('page') || 1));

  // Persist filters to the URL so refresh keeps the same view
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (leadSearchTerm) params.set('q', leadSearchTerm); else params.delete('q');
    if (leadWebsiteFilter !== 'all') params.set('site', leadWebsiteFilter); else params.delete('site');
    if (leadAgentFilter !== 'all') params.set('agent', leadAgentFilter); else params.delete('agent');
    if (leadDateFilter !== 'all') params.set('when', leadDateFilter); else params.delete('when');
    if (leadContactTypeFilter !== 'all') params.set('contact', leadContactTypeFilter); else params.delete('contact');
    if (leadStatusFilter !== 'all') params.set('status', leadStatusFilter); else params.delete('status');
    if (leadMonthFilter !== 'all') params.set('month', leadMonthFilter); else params.delete('month');
    if (leadCurrentPage !== 1) params.set('page', String(leadCurrentPage)); else params.delete('page');
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', url);
  }, [leadSearchTerm, leadWebsiteFilter, leadAgentFilter, leadDateFilter, leadContactTypeFilter, leadStatusFilter, leadMonthFilter, leadCurrentPage]);
  const leadsPerPage = 5;

  // State for Embed Widget tab
  const [widgetPosition, setWidgetPosition] = useState('bottom-right');
  const [widgetBaseUrl, setWidgetBaseUrl] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // Widget customization states
  const [widgetSize, setWidgetSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [widgetBubbleSize, setWidgetBubbleSize] = useState(44);
  const [widgetMargin, setWidgetMargin] = useState(16);
  const [widgetShadow, setWidgetShadow] = useState(true);
  const [widgetZIndex, setWidgetZIndex] = useState(2147483000);
  const [embedAgentId, setEmbedAgentId] = useState<string>('all');

  // Get the base URL when the component mounts on the client
  useEffect(() => {
      if (typeof window !== 'undefined') {
          setWidgetBaseUrl(window.location.origin);
      }
  }, []);

  // Sync widget position with launcher button position
  useEffect(() => {
    setWidgetPosition(launcherButtonPosition);
  }, [launcherButtonPosition]);

  // Clear selection when agent changes
  useEffect(() => {
    setSelectedTrainingIds(new Set());
  }, [activeAgentContextAgentId]);

  // Preview open/close driven by messages from the embedded iframe
  useEffect(() => {
      if (typeof window === 'undefined') return;
      const handler = (event: MessageEvent) => {
          try {
              const data: any = event.data || {};
              if (data.source === 'vcai-widget' && typeof data.open === 'boolean') {
                  setIsPreviewOpen(data.open);
              }
              // Receive lead created events from embedded widget preview and update list immediately
              if (data.source === 'vcai-widget' && data.leadCreated) {
                  setCapturedLeads(prev => {
                      const existing = prev.find(l => l.id === data.leadCreated.id);
                      if (existing) {
                          return prev.map(l => l.id === data.leadCreated.id ? { ...l, ...data.leadCreated } : l);
                      }
                      return [{ ...data.leadCreated }, ...prev];
                  });
              }
          } catch {}
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
  }, []);

  const embedCode = useMemo(() => {
    if (!adminManagedTenant || !widgetBaseUrl) return '';

    // Ultra-simple embed code - just tenantId and optional agentId
    const params = new URLSearchParams({ tenantId: adminManagedTenant.id });
    if (embedAgentId && embedAgentId !== 'all') params.set('agentId', embedAgentId);
    return `<script src="${widgetBaseUrl}/widget.js?${params.toString()}" defer></script>`;
  }, [adminManagedTenant, widgetBaseUrl, embedAgentId]);

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast({ title: "Copied!", description: "The embed code has been copied to your clipboard." });
  };


  // Initialize data from server (MongoDB) on first load
  useEffect(() => {
    const load = async () => {
      try {
        // Load plans, tenants, and platform settings
        const [plansRes, tenantsRes] = await Promise.all([
          fetch('/api/plans', { cache: 'no-store' }),
          fetch('/api/tenants', { cache: 'no-store' }),
        ]);
        const plansJson = await plansRes.json();
        const tenantsJson = await tenantsRes.json();
        setDisplayedPlans(plansJson.plans ?? INITIAL_PLANS_DATA);
        
        // Load platform settings if super admin
        if (userRole === 'superadmin') {
          try {
            const settingsRes = await fetch('/api/admin/platform-settings', { cache: 'no-store' });
            if (settingsRes.ok) {
              const settingsJson = await settingsRes.json();
              if (settingsJson.settings) {
                setPlatformSettings({
                  defaultTrialPlanId: settingsJson.settings.defaultTrialPlanId || 'trial',
                  trialLengthDays: settingsJson.settings.trialLengthDays || 14,
                  postTrialBehavior: settingsJson.settings.postTrialBehavior || 'auto_downgrade',
                  gracePeriodDays: settingsJson.settings.gracePeriodDays || 3,
                });
                // Also update defaultTrialDays for backward compatibility
                setDefaultTrialDays(settingsJson.settings.trialLengthDays || 14);
              }
            }
          } catch (error) {
            console.error('Failed to load platform settings', error);
          }
        }
        const parsedTenants = (tenantsJson.tenants ?? []).map((t: any) => ({
          ...t,
          subscriptionStartDate: t.subscriptionStartDate ? new Date(t.subscriptionStartDate) : new Date(),
        }));
        console.log('[DEBUG] Loaded tenants from API:', parsedTenants.map((t: any) => ({
          id: t.id,
          name: t.name,
          hasTrainingContexts: !!t.trainingContexts,
          trainingContextsLength: t.trainingContexts?.length || 0
        })));
        setMockTenants(parsedTenants);

        // Load tenant-specific data (leads and gaps) - APIs now handle tenant filtering automatically
        const [leadsRes, gapsRes] = await Promise.all([
          fetch('/api/leads', { cache: 'no-store' }),
          fetch('/api/gaps', { cache: 'no-store' }),
        ]);
        const leadsJson = await leadsRes.json();
        const gapsJson = await gapsRes.json();
        setCapturedLeads(leadsJson.leads ?? []);
        setKnowledgeGaps(gapsJson.gaps ?? []);

        // Refresh analytics data if we have a tenant selected
        if (adminManagedTenant?.id) {
          loadAnalyticsData(adminManagedTenant.id);
        }
        
        // Load users and analytics for super admin
        if (userRole === 'superadmin') {
          console.log('[DEBUG] Loading users and analytics for super admin');
          loadAllUsers();
          loadSuperAdminAnalytics();
        }
      } catch (error) {
        console.error('Failed to load initial data', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Trial Expiration Check - runs after tenant data is loaded
  useEffect(() => {
    if (isLoading || !adminManagedTenant || !displayedPlans.length) return;

    const checkAndHandleTrialExpiration = async () => {
      try {
        const currentPlan = displayedPlans.find(p => p.id === adminManagedTenant.assignedPlanId);
        const freePlan = displayedPlans.find(p => p.id === 'free');

        if (!currentPlan || !freePlan) return;

        const trialStatus = checkTrialStatus(adminManagedTenant, currentPlan, defaultTrialDays);

        // Show trial warning if applicable
        const warningMessage = getTrialWarningMessage(trialStatus);
        if (warningMessage && userRole === 'admin') {
          toast({
            title: "Trial Status",
            description: warningMessage,
            variant: trialStatus.daysRemaining <= 1 ? "destructive" : "default"
          });
        }

        // Auto-downgrade if trial expired
        if (trialStatus.shouldDowngrade) {
          const featureResets = resetTenantFeaturesToPlan(adminManagedTenant, freePlan);
          const updates = {
            assignedPlanId: 'free',
            ...featureResets
          };

          // Update local state
          const updatedTenant = { ...adminManagedTenant, ...updates };
          setAdminManagedTenant({ ...updatedTenant, status: updatedTenant.status as MockTenantStatus });

          // Update tenant list
          setMockTenants(prev => prev.map(t =>
            t.id === adminManagedTenant.id ? { ...updatedTenant, status: updatedTenant.status as MockTenantStatus } : t
          ));

          // Update server
          await fetch('/api/tenants', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: adminManagedTenant.id, updates })
          });

          // Update supported languages state if it was reset
          if (featureResets.supportedLanguages) {
            setSupportedLanguages(featureResets.supportedLanguages);
          }

          toast({
            title: "Trial Expired",
            description: "Your trial has ended and your account has been downgraded to the Free plan. Some features have been restricted.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Trial expiration check failed:', error);
      }
    };

    checkAndHandleTrialExpiration();
  }, [adminManagedTenant, displayedPlans, defaultTrialDays, isLoading, userRole, toast]);

  // Authentication and Tenant Setup (async)
  useEffect(() => {
    if (isLoading) return;
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          if (!ignore) {
            setUserRole(null);
            setUserTenantId(null);
            router.replace('/login');
          }
          return;
        }
        const json = await res.json();
        const role: string = json?.user?.role ?? null;
        const storedTenantId: string | null = json?.user?.tenantId ?? null;
        if (ignore) return;
        setUserRole(role);
        setUserTenantId(storedTenantId);

        const viewAsTenantId = searchParams.get('viewAsTenantId');
        let tenantToDisplayId: string | null = null;
        let effectiveRoleForView = role;
        
        if (role === 'superadmin' && viewAsTenantId) {
          tenantToDisplayId = viewAsTenantId;
          setIsViewingAsSuperAdmin(true);
          effectiveRoleForView = 'admin';
        } else {
          tenantToDisplayId = storedTenantId;
          setIsViewingAsSuperAdmin(false);
        }
        
        if (effectiveRoleForView === 'admin' && tenantToDisplayId) {
          const currentTenant = mockTenants.find(t => t.id === tenantToDisplayId);
          console.log('[DEBUG] Loading tenant data:', {
            tenantToDisplayId,
            foundTenant: !!currentTenant,
            tenantName: currentTenant?.name,
            hasTrainingContexts: !!currentTenant?.trainingContexts,
            trainingContextsLength: currentTenant?.trainingContexts?.length || 0,
            trainingContexts: currentTenant?.trainingContexts
          });
          
          if (currentTenant) {
            setAdminManagedTenant(currentTenant);
            setCompanyName(currentTenant.name);
            setCompanyLogoUrl(currentTenant.companyLogoUrl || '');
            setBrandColor(currentTenant.brandColor || '#2795f2');
            setCompanyDetails(currentTenant.companyDetails || '');
            setCompanyCountry(currentTenant.country || '');
            setContactEmail(currentTenant.contactEmail || '');
            setContactPhone(currentTenant.contactPhone || '');
            setContactWhatsapp(currentTenant.contactWhatsapp || '');
            setBillingAddress(currentTenant.billingAddress || '');
            setLeadWebhookUrl(currentTenant.leadWebhookUrl || '');
                                        setLauncherButtonText(currentTenant.launcherButtonText || '');
            setLauncherButtonIcon(currentTenant.launcherButtonIcon || 'mic');
            setLauncherButtonSize(currentTenant.launcherButtonSize || 'medium');
            setLauncherButtonStyle(currentTenant.launcherButtonStyle || 'normal');
            setLauncherButtonAnimation(currentTenant.launcherButtonAnimation || 'pulse');
            setLauncherButtonPosition(currentTenant.launcherButtonPosition || 'bottom-right');
            setLauncherAutoOpenDelay(currentTenant.launcherAutoOpenDelay || 'none');
            setWidgetPosition(currentTenant.launcherButtonPosition || 'bottom-right'); // Sync widget position
            setSupportedLanguages(currentTenant.supportedLanguages || [{ code: 'en-US', name: 'English (US)' }]);
            
            // Load analytics data for this tenant
            loadAnalyticsData(currentTenant.id);
            
            const trainingData = currentTenant.trainingContexts && currentTenant.trainingContexts.length > 0 
              ? currentTenant.trainingContexts 
              : [{ websiteUrl: '', docInfo: '', uploadedDocContent: '' }];
            
            console.log('[DEBUG] Setting training contexts:', trainingData);
            setTrainingContexts(trainingData);
          } else {
            console.warn(`Tenant with ID '${tenantToDisplayId}' not found.`);
            toast({ title: 'Tenant Data Not Found', description: 'The requested tenant data could not be loaded.', variant: 'destructive' });
            // Stay on current URL instead of forcing a redirect to /dashboard
          }
        }
        setIsAdminTenantLoading(false);
      } catch {
        if (!ignore) router.replace('/login');
      }
    })();
    return () => { ignore = true; };
  }, [router, toast, mockTenants, isLoading, searchParams]);

  // Load agent training data when an agent is selected (but prevent infinite loops)
  const lastLoadedAgentIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only load if agent has changed and we're not currently saving
    if (activeAgentContextAgentId && 
        adminManagedTenant && 
        !isSaving && 
        lastLoadedAgentIdRef.current !== activeAgentContextAgentId) {
      
      lastLoadedAgentIdRef.current = activeAgentContextAgentId;
      
      const timeoutId = setTimeout(() => {
        refreshAgentTrainingData(activeAgentContextAgentId);
      }, 100); // Small delay to prevent rapid calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeAgentContextAgentId]); // Only depend on agent ID change

  const adminCurrentPlan = useMemo(() => {
    if (!adminManagedTenant || displayedPlans.length === 0) return undefined;
    return displayedPlans.find(plan => plan.id === adminManagedTenant.assignedPlanId);
  }, [displayedPlans, adminManagedTenant]);

  const currencyForAdmin = useMemo(() => {
    if (!adminManagedTenant?.country) return 'USD';
    const country = ALL_COUNTRIES.find(c => c.name === adminManagedTenant.country);
    return country?.currency || 'USD';
  }, [adminManagedTenant]);

  const trialEndDateForAdmin = useMemo(() => {
    if (!adminManagedTenant || displayedPlans.length === 0) return 'Loading...';
    const premiumPlan = displayedPlans.find(p => p.id === 'premium');
    if (adminManagedTenant.assignedPlanId === 'premium' && premiumPlan?.isPremiumTrial) {
        const startDate = new Date(adminManagedTenant.subscriptionStartDate);
        if (isNaN(startDate.getTime())) return "Invalid Date";
        return format(addDays(startDate, defaultTrialDays), 'MMMM dd, yyyy');
    }
    return format(addDays(new Date(), defaultTrialDays), 'MMMM dd, yyyy');
  }, [adminManagedTenant, defaultTrialDays, displayedPlans]);

  const activeTenantsCount = useMemo(() => mockTenants.filter(t => t.status === 'Active').length, [mockTenants]);
  const inactiveTenantsCount = useMemo(() => mockTenants.filter(t => t.status.startsWith('Disabled')).length, [mockTenants]);
  
  const tenantsOnTrial = useMemo(() => {
    if (mockTenants.length === 0 || displayedPlans.length === 0) return [];
    return mockTenants.filter(t => {
      const plan = displayedPlans.find(p => p.id === t.assignedPlanId);
      if (!plan || !plan.isPremiumTrial || t.status !== 'Active') return false;
      const startDate = new Date(t.subscriptionStartDate);
      if (isNaN(startDate.getTime())) return false;
      return differenceInDays(addDays(startDate, defaultTrialDays), new Date()) >= 0;
    });
  }, [mockTenants, displayedPlans, defaultTrialDays]);
  
  const planDistributionData = useMemo(() => {
    if (!mockTenants.length || !displayedPlans.length) return [];
    const planCounts = mockTenants.reduce((acc, tenant) => {
        const planId = tenant.assignedPlanId;
        if (!acc[planId]) acc[planId] = { count: 0, planId: planId };
        acc[planId].count++;
        return acc;
    }, {} as Record<string, {count: number, planId: string}>);

    return Object.values(planCounts).map(data => {
        const plan = displayedPlans.find(p => p.id === data.planId);
        return { plan: plan?.name.split(" ")[0] || "Unknown", tenants: data.count };
    });
  }, [mockTenants, displayedPlans]);

  const filteredTenants = useMemo(() => {
    return mockTenants
        .filter(tenant => {
            const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPlan = planFilter === 'all' || tenant.assignedPlanId === planFilter;
            const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
            return matchesSearch && matchesPlan && matchesStatus;
        })
        .sort((a, b) => {
            // Sort by registration date in descending order (newest first)
            const dateA = new Date(a.subscriptionStartDate);
            const dateB = new Date(b.subscriptionStartDate);
            return dateB.getTime() - dateA.getTime();
        });
  }, [mockTenants, searchTerm, planFilter, statusFilter]);

  // User management filtering and sorting
  const filteredAndSortedUsers = useMemo(() => {
    return allUsers
      .filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                            (user.tenant?.name && user.tenant.name.toLowerCase().includes(userSearchTerm.toLowerCase()));
        const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        // Sort by creation date in descending order (newest first)
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
  }, [allUsers, userSearchTerm, userRoleFilter]);

  // Lead management logic
  const uniqueLeadWebsites = useMemo(() => {
      const websites = capturedLeads.map(lead => lead.websiteContext).filter(Boolean);
      return ['all', ...Array.from(new Set(websites))];
  }, [capturedLeads]);

  const uniqueLeadAgents = useMemo(() => {
      if (!capturedLeads) return ['all'];
      const agents = capturedLeads.map(lead => lead.reference?.replace('Chat with ', '')).filter(Boolean);
      return ['all', ...Array.from(new Set(agents))];
  }, [capturedLeads]);

  const uniqueLeadStatuses = useMemo(() => {
      if (!capturedLeads) return ['all'];
      const statuses = capturedLeads.map(lead => lead.status).filter(Boolean);
      return ['all', ...Array.from(new Set(statuses))];
  }, [capturedLeads]);

  const uniqueLeadMonths = useMemo(() => {
      if (!capturedLeads) return ['all'];
      const months = capturedLeads
        .map(lead => lead.periodMonth || (lead.date ? `${new Date(lead.date).getUTCFullYear()}-${String(new Date(lead.date).getUTCMonth() + 1).padStart(2, '0')}` : null))
        .filter(Boolean);
      return ['all', ...Array.from(new Set(months)).sort().reverse()];
  }, [capturedLeads]);

  const filteredAndSortedLeads = useMemo(() => {
      if (!capturedLeads) return [];
      return capturedLeads
          .filter(lead => {
              if (adminManagedTenant && lead.tenantId && lead.tenantId !== adminManagedTenant.id) {
                return false;
              }
              const matchesWebsite = leadWebsiteFilter === 'all' || lead.websiteContext === leadWebsiteFilter;
              const matchesAgent = leadAgentFilter === 'all' || (lead.reference?.replace('Chat with ', '') === leadAgentFilter);

              const now = new Date();
              let matchesDate = true;
              if (leadDateFilter !== 'all') {
                  const leadDate = new Date(lead.date);
                  if (leadDateFilter === '7days') matchesDate = leadDate >= subDays(now, 7);
                  else if (leadDateFilter === '30days') matchesDate = leadDate >= subDays(now, 30);
                  else if (leadDateFilter === '90days') matchesDate = leadDate >= subDays(now, 90);
              }

              // Contact Type Filter - Parse customerInfo to properly detect contact information
              let matchesContactType = true;
              if (leadContactTypeFilter === 'with_contact') {
                const hasDirectContact = lead.customerName || lead.customerEmail || lead.customerPhone;
                const hasParsedEmail = lead?.customerInfo?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
                const hasParsedPhone = lead?.customerInfo?.replace(/[^0-9+]/g, '').match(/\+?[0-9]{6,}/);
                const hasParsedName = lead?.customerInfo?.split(/[,@]|phone|tel|mobile/i)[0]?.trim();
                const hasValidName = hasParsedName && hasParsedName.length > 0 && hasParsedName.toLowerCase() !== 'anonymous person' && !hasParsedName.toLowerCase().includes('no contact');
                matchesContactType = hasDirectContact || hasParsedEmail || hasParsedPhone || hasValidName;
              } else if (leadContactTypeFilter === 'anonymous') {
                const hasDirectContact = lead.customerName || lead.customerEmail || lead.customerPhone;
                const hasParsedEmail = lead?.customerInfo?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
                const hasParsedPhone = lead?.customerInfo?.replace(/[^0-9+]/g, '').match(/\+?[0-9]{6,}/);
                const hasParsedName = lead?.customerInfo?.split(/[,@]|phone|tel|mobile/i)[0]?.trim();
                const hasValidName = hasParsedName && hasParsedName.length > 0 && hasParsedName.toLowerCase() !== 'anonymous person' && !hasParsedName.toLowerCase().includes('no contact');
                matchesContactType = lead.isAnonymous || (!hasDirectContact && !hasParsedEmail && !hasParsedPhone && !hasValidName);
              }

              // Status Filter
              const matchesStatus = leadStatusFilter === 'all' || lead.status === leadStatusFilter;

              // Month Filter
              let matchesMonth = true;
              if (leadMonthFilter !== 'all') {
                const leadMonth = lead.periodMonth || (lead.date ? `${new Date(lead.date).getUTCFullYear()}-${String(new Date(lead.date).getUTCMonth() + 1).padStart(2, '0')}` : '');
                matchesMonth = leadMonth === leadMonthFilter;
              }
              
              if (!leadSearchTerm) return matchesWebsite && matchesAgent && matchesDate && matchesContactType && matchesStatus && matchesMonth;

              const searchTermLower = leadSearchTerm.toLowerCase();
              const matchesSearch =
                  (lead.customerInfo && lead.customerInfo.toLowerCase().includes(searchTermLower)) ||
                  (lead.summary && lead.summary.toLowerCase().includes(searchTermLower)) ||
                  (lead.reference && lead.reference.toLowerCase().includes(searchTermLower));
              return matchesWebsite && matchesAgent && matchesDate && matchesContactType && matchesStatus && matchesMonth && matchesSearch;
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [capturedLeads, leadSearchTerm, leadWebsiteFilter, leadAgentFilter, leadDateFilter, leadContactTypeFilter, leadStatusFilter, leadMonthFilter, adminManagedTenant]);
  
  const filteredKnowledgeGaps = useMemo(() => {
    if (!adminManagedTenant) return [];
    return knowledgeGaps
        .filter(gap => gap.tenantId === adminManagedTenant.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [knowledgeGaps, adminManagedTenant]);

  const paginatedLeads = useMemo(() => {
      const startIndex = (leadCurrentPage - 1) * leadsPerPage;
      return filteredAndSortedLeads.slice(startIndex, startIndex + leadsPerPage);
  }, [filteredAndSortedLeads, leadCurrentPage]);

  const totalLeadPages = Math.ceil(filteredAndSortedLeads.length / leadsPerPage);

  // Export leads to CSV
  const exportLeadsToCSV = useCallback(() => {
    if (!filteredAndSortedLeads || filteredAndSortedLeads.length === 0) {
      toast({ title: "No Data", description: "No leads available to export with current filters.", variant: "destructive" });
      return;
    }

    // Prepare CSV headers
    const headers = [
      'Date',
      'Customer Name',
      'Email',
      'Phone',
      'Status',
      'Agent/Reference',
      'Website Context',
      'Summary',
      'Contact Type',
      'Month',
      'Is Returning Customer',
      'Total Sessions'
    ];

    // Prepare CSV rows
    const rows = filteredAndSortedLeads.map(lead => {
      const name = lead?.customerName || (lead?.customerInfo?.split(/[,@]|phone|tel|mobile/i)[0] || '').trim() || 'N/A';
      const email = lead?.customerEmail || (lead?.customerInfo?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || ['N/A'])[0];
      const phone = lead?.customerPhone || (lead?.customerInfo?.replace(/[^0-9+]/g, '').match(/\+?[0-9]{6,}/) || ['N/A'])[0];
      const contactType = (lead.isAnonymous || (!lead.customerName && !lead.customerEmail && !lead.customerPhone)) ? 'Anonymous' : 'With Contact';
      const month = lead.periodMonth || (lead.date ? `${new Date(lead.date).getUTCFullYear()}-${String(new Date(lead.date).getUTCMonth() + 1).padStart(2, '0')}` : 'N/A');
      
      return [
        lead.date ? format(new Date(lead.date), 'yyyy-MM-dd HH:mm') : 'N/A',
        name.replace(/"/g, '""'), // Escape quotes
        email,
        phone,
        (lead.status || 'N/A').replace(/"/g, '""'),
        (lead.reference || 'N/A').replace(/"/g, '""'),
        (lead.websiteContext || 'N/A').replace(/"/g, '""'),
        (lead.summary || 'N/A').replace(/"/g, '""').substring(0, 200), // Limit summary length
        contactType,
        month,
        lead.isReturningCustomer ? 'Yes' : 'No',
        lead.totalCustomerSessions || 1
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Create filename with filters applied
    const filterSuffix = leadMonthFilter !== 'all' ? `_${leadMonthFilter}` : '';
    const contactSuffix = leadContactTypeFilter !== 'all' ? `_${leadContactTypeFilter}` : '';
    link.setAttribute('download', `leads_export${filterSuffix}${contactSuffix}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ 
      title: "Export Successful", 
      description: `Exported ${filteredAndSortedLeads.length} lead(s) to CSV file.` 
    });
  }, [filteredAndSortedLeads, leadMonthFilter, leadContactTypeFilter, toast]);

  const playBrowserTTS = useCallback((text: string, voicePref: string = 'female-us') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        toast({ title: "Voice Not Supported", description: "Your browser does not support voice synthesis.", variant: "destructive" });
        return;
    }

    const speak = () => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const allVoices = window.speechSynthesis.getVoices();

        if (allVoices.length === 0) {
            console.warn("No voices available to speak.");
            return;
        }

        const [gender, region] = voicePref.split('-');
        const langMap: Record<string, string> = {
            'us': 'en-US',
            'gb': 'en-GB',
            'in': 'en-IN',
            'au': 'en-AU',
            'ca': 'en-CA'
        };
        const targetLang = langMap[region] || 'en-US';
        const isFemale = gender === 'female';

        const voiceIsFemale = (v: SpeechSynthesisVoice) => /female|woman|girl|zira|samantha|susan|hazel|heera|veena/i.test(v.name);
        const voiceIsMale = (v: SpeechSynthesisVoice) => /male|man|boy|david|mark|ravi|rishi/i.test(v.name);

        let selectedVoice: SpeechSynthesisVoice | undefined;

        const perfectMatch = allVoices.find(v => v.lang === targetLang && (isFemale ? voiceIsFemale(v) : voiceIsMale(v)));
        const languageMatch = allVoices.find(v => v.lang === targetLang && (isFemale ? !voiceIsMale(v) : !voiceIsFemale(v)));
        const anyEnglishGenderMatch = allVoices.find(v => v.lang.startsWith('en-') && (isFemale ? voiceIsFemale(v) : voiceIsMale(v)));
        const anyEnglishMatch = allVoices.find(v => v.lang.startsWith('en-') && (isFemale ? !voiceIsMale(v) : !voiceIsFemale(v)));

        selectedVoice = perfectMatch || languageMatch || anyEnglishGenderMatch || anyEnglishMatch || allVoices.find(v => v.default) || allVoices[0];
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        }
        
        window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            speak();
            window.speechSynthesis.onvoiceschanged = null;
        };
    } else {
        speak();
    }
  }, [toast]);


  const handlePlaySampleVoice = (voicePref: string) => {
    playBrowserTTS("Hello, this is a sample of the selected voice.", voicePref);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handlePlanChangeForTenant = async (tenantId: string, newPlanId: string) => {
    const updatedTenants = mockTenants.map(tenant => {
        if (tenant.id === tenantId) {
            return { 
                ...tenant, 
                assignedPlanId: newPlanId, 
                subscriptionStartDate: new Date(),
                // Reset usage counts on plan change
                conversationCount: 0,
                leadCount: 0,
                usageLastReset: new Date().toISOString(),
                // Set status to Active on plan change
                status: 'Active'
            };
        }
        return tenant;
    });
    setMockTenants(updatedTenants.map(t => ({ ...t, status: t.status as MockTenantStatus })));
    await fetch('/api/tenants', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tenantId, updates: { assignedPlanId: newPlanId, subscriptionStartDate: new Date(), conversationCount: 0, leadCount: 0, usageLastReset: new Date().toISOString(), status: 'Active' } }) });

    if (adminManagedTenant?.id === tenantId) {
      const updatedTenant = updatedTenants.find(t => t.id === tenantId);
      if (updatedTenant) setAdminManagedTenant({ ...updatedTenant, status: updatedTenant.status as MockTenantStatus });
    }
    toast({title: "Tenant Plan Updated", description: `Plan for tenant ${tenantId} changed to ${newPlanId}.`});
  };

  const handleTenantStatusChange = async (tenantId: string, newStatus: MockTenantStatus) => {
    const updatedTenants = mockTenants.map(tenant =>
        tenant.id === tenantId ? { ...tenant, status: newStatus } : tenant
    );
    setMockTenants(updatedTenants);
    await fetch('/api/tenants', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tenantId, updates: { status: newStatus } }) });
    toast({title: "Tenant Status Updated", description: `Status for tenant ${tenantId} changed to ${newStatus}.`});
  };

  const handleBillingPeriodChangeForTenant = async (tenantId: string, newPeriod: 'monthly' | 'yearly') => {
    const updatedTenants = mockTenants.map(tenant =>
        tenant.id === tenantId ? { ...tenant, billingPeriod: newPeriod } : tenant
    );
    setMockTenants(updatedTenants);
    
    // Update in admin tenant if viewing that tenant
    const updatedTenant = updatedTenants.find(t => t.id === tenantId);
    if (updatedTenant && adminManagedTenant?.id === tenantId) {
      setAdminManagedTenant({ ...updatedTenant });
    }
    
    await fetch('/api/tenants', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tenantId, updates: { billingPeriod: newPeriod } }) });
    toast({title: "Billing Period Updated", description: `Billing period for tenant ${tenantId} changed to ${newPeriod}.`});
  };

  // Trial Management Functions for Super Admin
  const handleTrialAction = async (tenantId: string, action: string, params: any = {}) => {
    try {
      const response = await fetch('/api/admin/trial-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tenantId, ...params })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to perform trial action');
      }

      const result = await response.json();

      // Update local tenant data
      setMockTenants(prev => prev.map(tenant =>
        tenant.id === tenantId ? { ...tenant, ...result.tenant } : tenant
      ));

      // Update admin managed tenant if it's the same one
      if (adminManagedTenant?.id === tenantId) {
        setAdminManagedTenant(prev => prev ? { ...prev, ...result.tenant } : prev);
      }

      toast({
        title: "Trial Action Completed",
        description: `Successfully performed ${action.replace('_', ' ')} for tenant.`
      });

      return result;
    } catch (error) {
      console.error('Trial action failed:', error);
      toast({
        title: "Trial Action Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
      throw error;
    }
  };

  const extendTrial = (tenantId: string, days: number) =>
    handleTrialAction(tenantId, 'extend_trial', { days });

  const setTrialOverride = (tenantId: string, override: boolean) =>
    handleTrialAction(tenantId, 'set_trial_override', { override });

  const expireTrial = (tenantId: string) =>
    handleTrialAction(tenantId, 'expire_trial');

  const resetTrial = (tenantId: string, trialDays: number = 14) =>
    handleTrialAction(tenantId, 'reset_trial', { trialDays });

  const resetFeatures = (tenantId: string, targetPlanId: string = 'free') =>
    handleTrialAction(tenantId, 'reset_features', { targetPlanId });

  const forcePlanChange = (tenantId: string, newPlanId: string) =>
    handleTrialAction(tenantId, 'force_plan_change', { newPlanId });

  // Platform Settings Functions for Super Admin
  const handleSavePlatformSettings = async () => {
    if (userRole !== 'superadmin') {
      toast({ title: "Access Denied", description: "Only super admins can update platform settings.", variant: "destructive" });
      return;
    }

    setIsSavingPlatformSettings(true);
    try {
      const response = await fetch('/api/admin/platform-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platformSettings)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save platform settings');
      }

      const result = await response.json();
      setPlatformSettings(result.settings);
      setDefaultTrialDays(result.settings.trialLengthDays);

      toast({
        title: "Platform Settings Saved",
        description: "Trial management settings have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving platform settings:', error);
      toast({
        title: "Error Saving Settings",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsSavingPlatformSettings(false);
    }
  };

  const handleSetDefaultTrialPlan = async (planId: string) => {
    if (userRole !== 'superadmin') {
      toast({ title: "Access Denied", description: "Only super admins can set default trial plan.", variant: "destructive" });
      return;
    }

    try {
      const updatedSettings = { ...platformSettings, defaultTrialPlanId: planId };
      const response = await fetch('/api/admin/platform-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set default trial plan');
      }

      const result = await response.json();
      setPlatformSettings(result.settings);

      const plan = displayedPlans.find(p => p.id === planId);
      toast({
        title: "Default Trial Plan Updated",
        description: `${plan?.name || planId} is now the default trial plan.`
      });
    } catch (error) {
      console.error('Error setting default trial plan:', error);
      toast({
        title: "Error Setting Default Trial Plan",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    }
  };

  // User Management Functions for Super Admin
  const loadAllUsers = async () => {
    if (userRole !== 'superadmin') return;
    
    setIsUsersLoading(true);
    try {
      const response = await fetch('/api/auth/delete-user', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
      } else {
        console.error('Failed to load users');
        toast({
          title: "Error Loading Users",
          description: "Failed to load user list.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error Loading Users",
        description: "An error occurred while loading users.",
        variant: "destructive"
      });
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch('/api/auth/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Remove the deleted user from the local state
        setAllUsers(prev => prev.filter(user => user.id !== userId));
        
        // If tenant was also deleted, remove it from tenant list
        if (data.tenantAction === 'deleted' && data.deletedUser.tenantId) {
          setMockTenants(prev => prev.filter(t => t.id !== data.deletedUser.tenantId));
        }
        
        toast({
          title: "User Deleted",
          description: `User ${data.deletedUser.email} has been successfully deleted.${data.tenantAction === 'deleted' ? ' Associated tenant was also removed.' : ''}`
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Delete Failed",
        description: error.message || 'An error occurred while deleting the user.',
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const openDeleteDialog = (user: any) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleAdminSaveChanges = async (type: 'general' | 'training', source?: 'launcher-button') => {
    if (!adminManagedTenant) {
        toast({ title: "Save Failed", description: "Tenant data is not loaded.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    let newBrandColor = brandColor;

    if (type === 'general') {
        const hasLogoChanged = companyLogoUrl && companyLogoUrl !== adminManagedTenant.companyLogoUrl;
        if (hasLogoChanged) {
            toast({ title: "Analyzing Logo...", description: "Extracting the dominant color from your logo..." });
            
            let extractedColor = null;
            
            // Try AI extraction first
            try {
                console.log('[DEBUG] Attempting AI color extraction for:', companyLogoUrl);
                const aiResult = await extractColorFromImage({ imageUrl: companyLogoUrl });
                if (aiResult && aiResult.hexColor) {
                    extractedColor = aiResult.hexColor;
                    console.log('[DEBUG] AI color extraction successful:', extractedColor);
                    toast({ title: "AI Color Extracted!", description: `AI has set your brand color to ${extractedColor}.` });
                } else {
                    console.log('[DEBUG] AI color extraction returned null, trying client-side fallback');
                }
            } catch (error: any) {
                console.error("AI color extraction failed:", error);
                console.log('[DEBUG] AI extraction failed, trying client-side fallback');
            }
            
            // If AI failed, try client-side extraction
            if (!extractedColor) {
                try {
                    console.log('[DEBUG] Attempting client-side color extraction');
                    extractedColor = await extractColorFromImageClient(companyLogoUrl);
                    if (extractedColor) {
                        console.log('[DEBUG] Client-side color extraction successful:', extractedColor);
                        toast({ title: "Color Extracted!", description: `Detected brand color: ${extractedColor} (using fallback method).` });
                    } else {
                        console.log('[DEBUG] Client-side color extraction also failed');
                    }
                } catch (error: any) {
                    console.error("Client-side color extraction failed:", error);
                }
            }
            
            // Update the color if extraction was successful
            if (extractedColor) {
                newBrandColor = extractedColor;
                setBrandColor(newBrandColor);
            } else {
                toast({ 
                    title: "Color Extraction Failed", 
                    description: "Could not automatically determine the dominant color. Please set it manually using the color picker below.", 
                    variant: "destructive" 
                });
            }
        }
    }

    let updatedTenantData: MockTenant = { ...adminManagedTenant };
    if (type === 'general') {
        updatedTenantData = {
            ...updatedTenantData,
            name: companyName,
            companyLogoUrl,
            brandColor: newBrandColor,
            companyDetails,
            country: companyCountry,
            contactEmail,
            contactPhone,
            contactWhatsapp,
            billingAddress,
            leadWebhookUrl,
            launcherButtonText,
            launcherButtonIcon: launcherButtonIcon as 'mic' | 'chat' | 'help' | 'phone' | 'none',
            launcherButtonSize: launcherButtonSize as 'small' | 'medium' | 'large',
            launcherButtonStyle: launcherButtonStyle as 'light' | 'normal' | 'bold',
            launcherButtonAnimation: launcherButtonAnimation as 'none' | 'pulse' | 'bounce' | 'glow',
            launcherButtonPosition: launcherButtonPosition as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left',
            launcherAutoOpenDelay: launcherAutoOpenDelay as 'none' | '10' | '20' | '30' | '60'
        };
    } else if (type === 'training') {
        updatedTenantData = { ...updatedTenantData, trainingContexts };
    }

    try {
        if (type === 'general') {
            const resp = await fetch('/api/tenant/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: adminManagedTenant.id,
                    companyName,
                    companyLogoUrl,
                    brandColor: newBrandColor,
                    companyDetails,
                    country: companyCountry,
                    contactEmail,
                    contactPhone,
                    contactWhatsapp,
                    billingAddress,
                    leadWebhookUrl,
                    launcherButtonText,
                    launcherButtonIcon,
                    launcherButtonSize,
                    launcherButtonStyle,
                    launcherButtonAnimation,
                    launcherButtonPosition,
                    launcherAutoOpenDelay,
                    trainingContexts
                }),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({ message: 'Save failed' }));
                throw new Error(err.message || 'Failed to save settings');
            }
            const saved = await resp.json();
            if (saved && saved.tenant) {
                updatedTenantData = { ...updatedTenantData, ...saved.tenant } as MockTenant;
            }
        } else if (type === 'training') {
            // Save training data to MongoDB
            console.log('[DEBUG] Saving training data:', {
                tenantId: adminManagedTenant.id,
                trainingContexts: trainingContexts,
                trainingContextsLength: trainingContexts.length
            });
            
            const response = await fetch('/api/tenant/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: adminManagedTenant.id,
                    companyName: adminManagedTenant.name,
                    companyLogoUrl: adminManagedTenant.companyLogoUrl,
                    brandColor: adminManagedTenant.brandColor,
                    companyDetails: adminManagedTenant.companyDetails,
                    country: adminManagedTenant.country,
                    contactEmail: adminManagedTenant.contactEmail,
                    contactPhone: adminManagedTenant.contactPhone,
                    contactWhatsapp: adminManagedTenant.contactWhatsapp,
                    billingAddress: adminManagedTenant.billingAddress,
                    leadWebhookUrl: adminManagedTenant.leadWebhookUrl,
                    launcherButtonText: adminManagedTenant.launcherButtonText,
                    trainingContexts
                }),
            });
            
            const result = await response.json();
            console.log('[DEBUG] Training data save response:', result);
        }
        
        const updatedTenants = mockTenants.map(t => t.id === adminManagedTenant.id ? updatedTenantData : t);
        setMockTenants(updatedTenants);
        setAdminManagedTenant(updatedTenantData);

        toast({
            title: source === 'launcher-button' ? "Launcher Button Updated" : "Settings Saved",
            description: source === 'launcher-button' 
                ? "Your launcher button settings have been saved. The changes will appear on your website within seconds."
                : `Your ${type} settings have been successfully updated and saved to the database.`
        });

        // Force refresh the Live Preview iframe to show latest changes
        setPreviewRefreshKey(prev => prev + 1);
        
        // Additional aggressive refresh for Live Preview
        setTimeout(() => {
            setPreviewRefreshKey(prev => prev + 1);
        }, 500);

    } catch (error: any) {
        console.error(`Save ${type} settings error:`, error);
        toast({ title: "Save Error", description: error.message || 'Could not save settings to database.', variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  // Data retention cleanup functions
  const handleCleanupPreview = async () => {
    if (!adminManagedTenant) return;
    
    setIsCleanupPreviewing(true);
    setCleanupPreview(null);
    
    try {
      const response = await fetch('/api/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retentionDays,
          tenantId: adminManagedTenant.id,
          dryRun: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to preview cleanup');
      }
      
      const data = await response.json();
      setCleanupPreview({
        leadsToDelete: data.stats.leadsToDelete,
        conversationsToDelete: data.stats.conversationsToDelete,
        messagesToDelete: data.stats.messagesToDelete,
        cutoffDate: data.cutoffDate,
      });
      
      toast({
        title: "Preview Ready",
        description: `Found ${data.stats.leadsToDelete} leads and ${data.stats.conversationsToDelete} conversations older than ${retentionDays} days.`,
      });
    } catch (error: any) {
      console.error('Cleanup preview error:', error);
      toast({
        title: "Preview Failed",
        description: error.message || 'Could not preview cleanup.',
        variant: "destructive",
      });
    } finally {
      setIsCleanupPreviewing(false);
    }
  };

  const handleCleanupExecute = async () => {
    if (!adminManagedTenant) return;
    
    setIsCleaningUp(true);
    
    try {
      const response = await fetch('/api/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retentionDays,
          tenantId: adminManagedTenant.id,
          dryRun: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute cleanup');
      }
      
      const data = await response.json();
      
      toast({
        title: "Cleanup Completed",
        description: `Successfully deleted ${data.stats.leadsDeleted} leads, ${data.stats.conversationsDeleted} conversations, and ${data.stats.messagesDeleted} messages. Refresh the page to see updated data.`,
      });
      
      setCleanupPreview(null);
    } catch (error: any) {
      console.error('Cleanup execution error:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message || 'Could not complete cleanup.',
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };
  
  const handleTrainingContextChange = (index: number, field: 'websiteUrl' | 'docInfo', value: string) => {
    const newContexts = [...trainingContexts];
    const currentContext = newContexts[index];
    if (currentContext) {
        currentContext[field] = value;
        setTrainingContexts(newContexts);
    }
  };

  const handleUploadClick = (index: number) => {
    setActiveContextIndex(index);
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };



  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = `upload-${Date.now()}`;
    toast({ title: "Processing File...", description: `Reading content from "${file.name}".` });
    
    try {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const pdf = await pdfjs.getDocument(arrayBuffer).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              fullText += textContent.items.map((item: any) => item.str).join(' ');
            }
            if (activeAgentContextAgentId && activeAgentContextIndex !== null) {
              setAdminManagedTenant(prev => {
                if (!prev) return prev;
                const updatedAgents = (prev.agents || []).map(a => {
                  if (a.id !== activeAgentContextAgentId) return a;
                  const list = [...(a.trainingContexts || [])];
                  const curr = list[activeAgentContextIndex!];
                  if (curr) {
                    curr.uploadedDocContent = fullText;
                    curr.docInfo = file.name;
                  }
                  return { ...a, trainingContexts: list };
                });
                return { ...prev, agents: updatedAgents };
              });
            } else if (activeContextIndex !== null) {
              updateContextWithContent(fullText, file.name);
            }
          } catch (pdfError: any) {
            toast({ title: "PDF Parsing Failed", description: `Could not read PDF: ${pdfError.message}`, variant: "destructive" });
          }
        };
        reader.readAsArrayBuffer(file);
      } else { // Assume .txt
        const reader = new FileReader();
        reader.onload = (e) => {
          const textContent = e.target?.result as string;
          if (activeAgentContextAgentId && activeAgentContextIndex !== null) {
            setAdminManagedTenant(prev => {
              if (!prev) return prev;
              const updatedAgents = (prev.agents || []).map(a => {
                if (a.id !== activeAgentContextAgentId) return a;
                const list = [...(a.trainingContexts || [])];
                const curr = list[activeAgentContextIndex!];
                if (curr) {
                  curr.uploadedDocContent = textContent;
                  curr.docInfo = file.name;
                }
                return { ...a, trainingContexts: list };
              });
              return { ...prev, agents: updatedAgents };
            });
          } else if (activeContextIndex !== null) {
            updateContextWithContent(textContent, file.name);
          }
        };
        reader.readAsText(file);
      }
    } catch (error: any) {
      toast({ title: "Upload Failed", description: `Could not read file: ${error.message}`, variant: "destructive" });
    } finally {
      // Reset the file input so the same file can be re-uploaded
      if (event.target) event.target.value = '';
      setActiveContextIndex(null);
      setActiveAgentContextAgentId(null);
      setActiveAgentContextIndex(null);
    }
  };

  const updateContextWithContent = (content: string, fileName: string) => {
    if (activeContextIndex === null) return;
    const newContexts = [...trainingContexts];
    const currentContext = newContexts[activeContextIndex];
    if (currentContext) {
      currentContext.uploadedDocContent = content;
      currentContext.docInfo = fileName; // Also update the doc info to the uploaded filename
      setTrainingContexts(newContexts);
      toast({ title: "File Content Loaded", description: `Content from "${fileName}" is ready. Click "Update All Training Data" to save.`});
    }
  };
  
  const handleRemoveDocumentFromContext = (indexToRemove: number) => {
      const newContexts = [...trainingContexts];
      const context = newContexts[indexToRemove];
      if (context) {
          context.docInfo = '';
          context.uploadedDocContent = '';
          setTrainingContexts(newContexts);
          toast({ title: "Document Removed", description: `The document for context ${indexToRemove + 1} has been cleared. Save your changes to make it permanent.` });
      }
  };


  const handleAddTrainingContext = () => {
    if (!adminCurrentPlan) return;
    if (trainingContexts.length >= adminCurrentPlan.contextLimit) {
        toast({ title: "Context Limit Reached", description: `You can add up to ${adminCurrentPlan.contextLimit} context(s) on the ${adminCurrentPlan.name}.`, variant: "destructive" });
        return;
    }
    setTrainingContexts([...trainingContexts, { websiteUrl: '', docInfo: '', uploadedDocContent: '' }]);
  };

  const handleRemoveTrainingContext = (indexToRemove: number) => {
    setTrainingContexts(trainingContexts.filter((_, index) => index !== indexToRemove));
  };
  
  const handleLanguageToggle = (code: string, name: string) => {
      if (code === 'en-US') {
          toast({ title: "Cannot Modify", description: "English (US) is the default language and cannot be removed.", variant: "default" });
          return;
      }

      setSupportedLanguages(prev => {
          const isSelected = prev.some(l => l.code === code);
          if (isSelected) {
              return prev.filter(l => l.code !== code);
          }

          if (adminCurrentPlan && adminManagedTenant) {
              // Check trial status and get effective plan limits
              const freePlan = displayedPlans.find(p => p.id === 'free');
              if (!freePlan) return prev;

              const trialStatus = checkTrialStatus(adminManagedTenant, adminCurrentPlan, defaultTrialDays);
              const effectivePlan = getEffectivePlanLimits(adminManagedTenant, adminCurrentPlan, freePlan, trialStatus);

              const limit = effectivePlan.languageLimit;
              const isUnlimited = limit >= 999;

              if (!isUnlimited && prev.length >= limit) {
                  const planName = trialStatus.shouldDowngrade || trialStatus.isExpired ? 'Free' : adminCurrentPlan.name;
                  toast({
                      title: "Language Limit Reached",
                      description: `You can only select up to ${limit} language(s) on your current ${planName} plan.${trialStatus.isExpired ? ' Your trial has expired.' : ''}`,
                      variant: "destructive"
                  });
                  return prev;
              }
              // Find the language in ALL_LANGUAGES to get RTL flag
              const langData = ALL_LANGUAGES.find(l => l.code === code);
              return [...prev, { code, name, rtl: langData?.rtl || false }];
          }
          return prev;
      });
  };

  const handleSaveLanguageChanges = async () => {
      if (!adminManagedTenant) return;
      setIsSaving(true);
      const updatedTenantData: MockTenant = { ...adminManagedTenant, supportedLanguages };
      
      const updatedTenants = mockTenants.map(t =>
          t.id === adminManagedTenant.id ? updatedTenantData : t
      );
      
      setMockTenants(updatedTenants);
      await fetch('/api/tenants', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: adminManagedTenant.id, updates: { supportedLanguages } }) });
      setAdminManagedTenant(updatedTenantData);
      setIsSaving(false);
      
      toast({ title: "Language Settings Saved", description: "Your chatbot will now support the selected languages." });
  };


  const handleAgentFieldChange = (agentId: string, field: keyof MockAgent, value: string) => {
      if (!adminManagedTenant) return;
      const updatedAgents = (adminManagedTenant.agents || []).map(agent => agent.id === agentId ? { ...agent, [field]: value } : agent);
      const updatedTenant = { ...adminManagedTenant, agents: updatedAgents };
      setAdminManagedTenant(updatedTenant);
  };

  const handleGenerateAvatar = (agentId: string) => {
    const randomSeed = Math.random().toString(36).substring(7);
    const avatarUrl = `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${randomSeed}`;
    handleAgentFieldChange(agentId, 'avatarUrl', avatarUrl);
    toast({title: "Avatar Generated!", description: "A new random avatar has been generated."})
  };

  const handleAddNewAgent = () => {
    if (!adminManagedTenant || !adminCurrentPlan) return;
    const currentAgentCount = adminManagedTenant.agents?.length ?? 0;
    if (currentAgentCount >= adminCurrentPlan.agentLimit) {
        toast({ title: "Agent Limit Reached", description: `You cannot add more than ${adminCurrentPlan.agentLimit} agent(s) on the ${adminCurrentPlan.name}.`, variant: "destructive" });
        return;
    }
    const newAgent: MockAgent = {
      id: `agent_${Date.now()}`,
      name: 'Untitled Agent',
      description: 'A new agent ready to be configured.',
      avatarUrl: 'https://placehold.co/100x100.png',
      avatarHint: 'new agent bot',
      greeting: 'Hello! How can I assist you?',
      websiteUrl: '',
      voice: 'female-us',
      tone: 'professional',
      responseStyle: 'conversational',
      expertiseLevel: 'intermediate',
      customInstructions: 'IMPORTANT: Always collect contact information (name, email, phone) when users need follow-up assistance or have inquiries that require further support.'
    };
    const updatedTenant = { ...adminManagedTenant, agents: [...(adminManagedTenant.agents || []), newAgent] };
    setAdminManagedTenant(updatedTenant);
    toast({ title: "New Agent Added", description: "A new agent has been added. Don't forget to save your changes." });
  };

  const handleDeleteAgent = (agentId: string) => {
    if (!adminManagedTenant) return;
    if ((adminManagedTenant.agents?.length ?? 0) <= 1) {
        toast({ title: "Cannot Delete", description: "You must have at least one agent.", variant: "destructive" });
        return;
    }
    const updatedAgents = (adminManagedTenant.agents || []).filter(agent => agent.id !== agentId);
    const updatedTenant = { ...adminManagedTenant, agents: updatedAgents };
    setAdminManagedTenant(updatedTenant);
    toast({ title: "Agent Marked for Deletion", description: "Save changes to confirm." });
  };

  const handleSaveAgentChanges = async () => {
      if (!adminManagedTenant) return;
      setIsSaving(true);
      const updatedTenants = mockTenants.map(t => t.id === adminManagedTenant.id ? adminManagedTenant : t);
      setMockTenants(updatedTenants);
      await fetch('/api/tenants', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: adminManagedTenant.id, updates: { agents: adminManagedTenant.agents } }) });
      setIsSaving(false);
      toast({ title: "Agent Settings Saved", description: "Your agent configurations have been updated." });
  };

  // ---- Agent-specific training contexts handlers ----
  const handleAddAgentTrainingContext = (agentId: string) => {
    if (!adminManagedTenant) return;
    setAdminManagedTenant(prev => {
      if (!prev) return prev;
      const updatedAgents = (prev.agents || []).map(a => a.id === agentId ? { ...a, trainingContexts: [...(a.trainingContexts || []), { websiteUrl: '', docInfo: '', uploadedDocContent: '' }] } : a);
      return { ...prev, agents: updatedAgents };
    });
  };

  const handleRemoveAgentTrainingContext = (agentId: string, indexToRemove: number) => {
    if (!adminManagedTenant) return;
    setAdminManagedTenant(prev => {
      if (!prev) return prev;
      const updatedAgents = (prev.agents || []).map(a => {
        if (a.id !== agentId) return a;
        const list = (a.trainingContexts || []).filter((_, idx) => idx !== indexToRemove);
        return { ...a, trainingContexts: list };
      });
      return { ...prev, agents: updatedAgents };
    });
  };

  const handleAgentTrainingContextChange = (agentId: string, index: number, field: 'websiteUrl' | 'docInfo', value: string) => {
    if (!adminManagedTenant) return;
    setAdminManagedTenant(prev => {
      if (!prev) return prev;
      const updatedAgents = (prev.agents || []).map(a => {
        if (a.id !== agentId) return a;
        const list = [...(a.trainingContexts || [])];
        if (!list[index]) list[index] = { websiteUrl: '', docInfo: '', uploadedDocContent: '' } as any;
        (list[index] as any)[field] = value;
        return { ...a, trainingContexts: list };
      });
      return { ...prev, agents: updatedAgents };
    });
  };

  const handleAgentUploadClick = (agentId: string, index: number) => {
    setActiveAgentContextAgentId(agentId);
    setActiveAgentContextIndex(index);
    fileInputRef.current?.click();
  };

  const handleRemoveAgentDocumentFromContext = (agentId: string, index: number) => {
    if (!adminManagedTenant) return;
    setAdminManagedTenant(prev => {
      if (!prev) return prev;
      const updatedAgents = (prev.agents || []).map(a => {
        if (a.id !== agentId) return a;
        const list = [...(a.trainingContexts || [])];
        if (list[index]) {
          list[index] = { ...list[index], docInfo: '', uploadedDocContent: '' };
        }
        return { ...a, trainingContexts: list };
      });
      return { ...prev, agents: updatedAgents };
    });
    toast({ title: "Document Removed", description: "The document has been removed from this agent's training context." });
  };

  // New enhanced training handlers
  const handleAddWebsiteContext = async (agentId: string) => {
    if (!adminManagedTenant) return;
    
    // Prompt user for website URL
    const websiteUrl = prompt('Enter the website URL to scrape and add as training data:');
    
    if (!websiteUrl || !websiteUrl.trim()) {
      return; // User cancelled or entered empty URL
    }
    
    // Validate URL format
    try {
      // Add https:// if no protocol specified
      let validUrl = websiteUrl.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }
      new URL(validUrl);
      
      // Process the website
      await handleAddWebsiteTraining(agentId, validUrl);
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL (e.g., example.com or https://example.com)",
        variant: "destructive"
      });
    }
  };

  const handleAddFileContext = (agentId: string) => {
    if (!agentId || !adminManagedTenant) return;
    
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt,text/plain,application/pdf';
    input.multiple = false;
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // Validate file type
      if (!file.type.match(/^(application\/pdf|text\/plain)$/) && 
          !file.name.toLowerCase().endsWith('.pdf') && 
          !file.name.toLowerCase().endsWith('.txt')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload only PDF or TXT files.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload files smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      
      try {
        setIsSaving(true);
        
        console.log(`[File Upload] Starting upload for ${file.name} (${file.type}, ${file.size} bytes)`);
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenantId', adminManagedTenant.id);
        formData.append('agentId', agentId);
        formData.append('uploadType', 'file');
        
        // Upload and process file
        const response = await fetch('/api/agent/training/upload', {
          method: 'POST',
          body: formData,
          credentials: 'same-origin',
        });
        
        let result;
        try {
          const responseText = await response.text();
          console.log(`[File Upload] Raw response:`, responseText.substring(0, 500));
          
          if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
            throw new Error('Server returned HTML instead of JSON. Please check server logs.');
          }
          
          result = JSON.parse(responseText);
          console.log(`[File Upload] Parsed response:`, result);
        } catch (parseError) {
          console.error(`[File Upload] Failed to parse response:`, parseError);
          throw new Error('Invalid response from server. Please check server logs and try again.');
        }
        
        if (!response.ok) {
          console.error(`[File Upload] Server error:`, result);
          throw new Error(result?.message || 'Upload failed');
        }
        
        // Refresh agent training data
        await refreshAgentTrainingData(agentId);
        
        toast({
          title: "File Uploaded Successfully",
          description: `${result.trainingContext.sourceInfo} has been processed and added to the agent's knowledge base.`
        });
        
      } catch (error: any) {
        console.error('File upload error:', error);
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload and process the file.",
          variant: "destructive"
        });
      } finally {
        setIsSaving(false);
      }
    };
    
    input.click();
  };

  const handleAddWebsiteTraining = async (agentId: string, websiteUrl: string) => {
    if (!websiteUrl.trim() || !adminManagedTenant) return;
    
    // Validate URL
    let normalizedUrl = websiteUrl.trim();
    try {
      const urlObj = new URL(normalizedUrl);
      normalizedUrl = urlObj.href; // Normalized URL
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL.",
        variant: "destructive"
      });
      return;
    }
    
    // Check for duplicates
    const agent = adminManagedTenant.agents?.find(a => a.id === agentId);
    const existingContexts = agent?.trainingContexts || [];
    
    const isDuplicate = existingContexts.some(ctx => {
      if (ctx.sourceInfo?.includes(normalizedUrl)) return true;
      if (ctx.websiteUrl && new URL(ctx.websiteUrl).href === normalizedUrl) return true;
      return false;
    });
    
    if (isDuplicate) {
      toast({
        title: "Duplicate URL",
        description: "This website URL is already added to this agent's training data.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      console.log(`[Website Processing] Starting scraping for: ${normalizedUrl}`);
      
      // Create form data
      const formData = new FormData();
      formData.append('tenantId', adminManagedTenant.id);
      formData.append('agentId', agentId);
      formData.append('uploadType', 'website');
      formData.append('websiteUrl', websiteUrl);
      
      // Process website
      const response = await fetch('/api/agent/training/upload', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });
      
      let result;
      try {
        const responseText = await response.text();
        console.log(`[Website Processing] Raw response:`, responseText.substring(0, 500));
        
        if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
          throw new Error('Server returned HTML instead of JSON. Please check server logs.');
        }
        
        result = JSON.parse(responseText);
        console.log(`[Website Processing] Parsed response:`, result);
      } catch (parseError) {
        console.error(`[Website Processing] Failed to parse response:`, parseError);
        throw new Error('Invalid response from server. Please check server logs and try again.');
      }
      
      if (!response.ok) {
        console.error(`[Website Processing] Server error:`, result);
        throw new Error(result?.message || 'Website processing failed');
      }
      
      // Refresh agent training data
      await refreshAgentTrainingData(agentId);
      
      toast({
        title: "Website Added Successfully",
        description: `Content from ${websiteUrl} has been scraped and added to the agent's knowledge base.`
      });
      
    } catch (error: any) {
      console.error('Website processing error:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process the website content.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const refreshAgentTrainingData = async (agentId: string) => {
    if (!adminManagedTenant || isSaving) return;
    
    try {
      console.log(`[Refresh Training] Loading data for agent ${agentId}`);
      const response = await fetch(`/api/agent/training?tenantId=${adminManagedTenant.id}&agentId=${agentId}`, {
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        console.error(`[Refresh Training] API error:`, response.status, response.statusText);
        return;
      }
      
      const result = await response.json();
      console.log(`[Refresh Training] Received data:`, result);
      
      if (result.success !== false) {
        // Update the agent's training contexts in the state
        setAdminManagedTenant(prev => {
          if (!prev) return prev;
          const updatedAgents = (prev.agents || []).map(a => 
            a.id === agentId 
              ? { ...a, trainingContexts: result.trainingContexts || [] }
              : a
          );
          return { ...prev, agents: updatedAgents };
        });
      }
    } catch (error) {
      console.error('Failed to refresh training data:', error);
    }
  };

  const handleCrawlWebsite = async () => {
    if (!crawlAgentId || !adminManagedTenant || !crawlUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a valid website URL to crawl.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsCrawling(true);
      setCrawlResults([]);
      setCrawlProgress({ current: 0, total: crawlMaxPages, status: 'Crawling website... Please wait, this may take a minute.' });
      
      console.log(`[Crawl] Starting crawl for ${crawlUrl} with max pages: ${crawlMaxPages}`);
      
      const response = await fetch('/api/agent/training/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: crawlAgentId,
          rootUrl: crawlUrl,
          maxPages: crawlMaxPages,
        }),
        credentials: 'same-origin',
      });
      
      let result;
      try {
        const responseText = await response.text();
        console.log(`[Crawl] Raw response:`, responseText.substring(0, 500));
        
        if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
          throw new Error('Server returned HTML instead of JSON. Please check server logs.');
        }
        
        result = JSON.parse(responseText);
        console.log(`[Crawl] Parsed response:`, result);
      } catch (parseError) {
        console.error(`[Crawl] Failed to parse response:`, parseError);
        throw new Error('Invalid response from server. Please check server logs and try again.');
      }
      
      if (!response.ok) {
        console.error(`[Crawl] Server error:`, result);
        throw new Error(result?.message || 'Website crawl failed');
      }
      
      setCrawlResults(result.pages || []);
      const successCount = result.summary?.totalCrawled || 0;
      const totalProcessed = result.summary?.totalPages || 0;
      const failedCount = result.summary?.totalFailed || 0;
      const skippedCount = result.summary?.totalSkipped || 0;
      
      setCrawlProgress({ 
        current: totalProcessed, 
        total: totalProcessed, 
        status: `Completed: ${successCount} added, ${failedCount} failed, ${skippedCount} skipped` 
      });
      
      // Refresh agent training data
      await refreshAgentTrainingData(crawlAgentId);
      
      // Create detailed, informative toast message
      let toastTitle = "";
      let toastDescription = "";
      let toastVariant: "default" | "destructive" = "default";
      
      if (successCount > 0) {
        // Some pages were successfully added
        toastTitle = "Crawl Completed Successfully";
        toastDescription = `✅ Added ${successCount} new page${successCount !== 1 ? 's' : ''} to the knowledge base`;
        
        if (skippedCount > 0) {
          toastDescription += `\n⏭️ Skipped ${skippedCount} page${skippedCount !== 1 ? 's' : ''} (already exists)`;
        }
        if (failedCount > 0) {
          toastDescription += `\n❌ Failed to crawl ${failedCount} page${failedCount !== 1 ? 's' : ''}`;
        }
      } else if (totalProcessed === 0) {
        // No pages were processed at all
        toastTitle = "No Pages Crawled";
        toastDescription = "The website could not be crawled. It may be blocked by robots.txt or the URL may be invalid.";
        toastVariant = "destructive";
      } else if (skippedCount === totalProcessed) {
        // All pages were skipped (already exist)
        toastTitle = "Pages Already Exist";
        toastDescription = `All ${skippedCount} page${skippedCount !== 1 ? 's were' : ' was'} already in the knowledge base. No new content was added.`;
      } else if (failedCount === totalProcessed) {
        // All pages failed
        toastTitle = "Crawl Failed";
        toastDescription = `Failed to crawl all ${failedCount} page${failedCount !== 1 ? 's' : ''}. Check the results below for error details.`;
        toastVariant = "destructive";
      } else {
        // Mixed results with 0 success
        toastTitle = "Crawl Completed with Issues";
        toastDescription = `Processed ${totalProcessed} page${totalProcessed !== 1 ? 's' : ''}: `;
        if (skippedCount > 0) {
          toastDescription += `${skippedCount} skipped (already exists)`;
        }
        if (failedCount > 0) {
          toastDescription += `${skippedCount > 0 ? ', ' : ''}${failedCount} failed`;
        }
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: toastVariant,
      });
      
    } catch (error: any) {
      console.error('Crawl error:', error);
      setCrawlProgress({ 
        current: 0, 
        total: crawlMaxPages, 
        status: `Error: ${error.message}` 
      });
      toast({
        title: "Crawl Failed",
        description: error.message || "Failed to crawl the website.",
        variant: "destructive"
      });
    } finally {
      setIsCrawling(false);
    }
  };

  const handleUpdateTrainingContext = async (agentId: string, trainingId: string, sourceInfo: string, extractedText: string) => {
    if (!adminManagedTenant) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/agent/training', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: adminManagedTenant.id,
          agentId,
          trainingId,
          sourceInfo,
          extractedText,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Update failed');
      }
      
      // Refresh agent training data
      await refreshAgentTrainingData(agentId);
      
      toast({
        title: "Training Data Updated",
        description: "The content has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Failed to update training data:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update the training data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrainingContext = async (agentId: string, trainingId: string) => {
    if (!adminManagedTenant) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/agent/training?tenantId=${adminManagedTenant.id}&agentId=${agentId}&trainingId=${trainingId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Delete failed');
      }
      
      // Refresh agent training data
      await refreshAgentTrainingData(agentId);
      
      toast({
        title: "Training Data Deleted",
        description: "The training context has been removed from the agent's knowledge base."
      });
      
    } catch (error: any) {
      console.error('Delete training context error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete the training context.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk delete helper functions
  const handleToggleTrainingSelection = (trainingId: string) => {
    const newSelected = new Set(selectedTrainingIds);
    if (newSelected.has(trainingId)) {
      newSelected.delete(trainingId);
    } else {
      newSelected.add(trainingId);
    }
    setSelectedTrainingIds(newSelected);
  };

  const handleSelectAllTraining = (agentId: string) => {
    const selectedAgent = (adminManagedTenant?.agents || []).find(a => a.id === agentId);
    const agentContexts = selectedAgent?.trainingContexts || [];
    
    // Get all training IDs (only for new format contexts that have IDs)
    const allIds = agentContexts
      .filter((ctx: any) => ctx.id)
      .map((ctx: any) => ctx.id);
    
    setSelectedTrainingIds(new Set(allIds));
  };

  const handleDeselectAllTraining = () => {
    setSelectedTrainingIds(new Set());
  };

  const handleBulkDeleteTraining = async (agentId: string) => {
    if (!adminManagedTenant || selectedTrainingIds.size === 0) return;

    const count = selectedTrainingIds.size;
    const confirmed = confirm(`Delete ${count} training context${count > 1 ? 's' : ''}? This action cannot be undone.`);
    
    if (!confirmed) return;

    try {
      setIsBulkDeleting(true);
      
      // Convert Set to Array for API call
      const trainingIds = Array.from(selectedTrainingIds);
      
      const response = await fetch('/api/agent/training/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: adminManagedTenant.id,
          agentId,
          trainingIds,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Bulk delete failed');
      }
      
      // Clear selection
      setSelectedTrainingIds(new Set());
      
      // Refresh agent training data
      await refreshAgentTrainingData(agentId);
      
      const deletedCount = result.deletedCount || count;
      toast({
        title: "Training Data Deleted",
        description: `Successfully deleted ${deletedCount} training context${deletedCount > 1 ? 's' : ''}.`
      });
      
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Bulk Delete Failed",
        description: error.message || "Failed to delete the selected training contexts.",
        variant: "destructive"
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleAskAiHelp = async () => {
    if (!aiHelpQuery.trim()) { 
      setAiHelpResponse("Please type a question first."); 
      return; 
    }
    
    setIsAskingAiHelp(true);
    setAiHelpResponse('');
    
    try {
      const response = await fetch('/api/help/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: aiHelpQuery }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAiHelpResponse(data.answer);
      } else {
        setAiHelpResponse(data.error || 'Failed to get AI response. Please try again.');
      }
    } catch (error) {
      console.error('[AI Help] Error:', error);
      setAiHelpResponse('Network error. Please check your connection and try again.');
    } finally {
      setIsAskingAiHelp(false);
    }
  };

  const handlePlanDetailChange = (planId: string, field: keyof Plan, value: any) => {
    const updatedPlans = displayedPlans.map(plan => {
      if (plan.id === planId) {
        if (['agentLimit', 'languageLimit', 'contextLimit', 'tokenLimit', 'yearlyDiscountPercentage', 'conversationLimit', 'leadLimit'].includes(field as string)) {
          const numValue = parseInt(value, 10);
          return { ...plan, [field]: isNaN(numValue) ? 0 : numValue };
        }
        return { ...plan, [field]: value };
      }
      return plan;
    });
    setDisplayedPlans(updatedPlans);
  };
  
  const handleFeatureChange = (planId: string, featureId: string, field: keyof PlanFeature, value: string | boolean) => {
    const updatedPlans = displayedPlans.map(plan =>
      plan.id === planId ? { ...plan, features: (plan.features || []).map(feature => feature.id === featureId ? { ...feature, [field]: value } : feature) } : plan
    );
    setDisplayedPlans(updatedPlans);
  };

  const handleSavePlanChanges = async (planId: string) => {
    try {
      const plan = displayedPlans.find(p => p.id === planId);
      if (!plan) return;
      const res = await fetch('/api/plans', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: planId, updates: plan }) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to save plan changes' }));
        throw new Error(err?.message || 'Failed to save plan changes');
      }
      toast({ title: 'Plan Changes Saved', description: `Changes for plan "${plan.name}" have been saved.` });
    } catch (e: any) {
      toast({ title: 'Save Failed', description: e.message || 'Could not save changes', variant: 'destructive' });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const plan = displayedPlans.find(p => p.id === planId);
      if (!plan) return;
      
      const res = await fetch('/api/plans', { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id: planId }) 
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to delete plan' }));
        throw new Error(err?.message || 'Failed to delete plan');
      }
      
      // Remove the plan from the displayed list
      setDisplayedPlans(prev => prev.filter(p => p.id !== planId));
      
      toast({ 
        title: 'Plan Deleted', 
        description: `Plan "${plan.name}" has been deleted successfully.` 
      });
    } catch (e: any) {
      toast({ 
        title: 'Delete Failed', 
        description: e.message || 'Could not delete plan', 
        variant: 'destructive' 
      });
    }
  };

  if (isLoading || (userRole && userRole !== 'superadmin' && isAdminTenantLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <NeonLoader variant="cyber" size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (!userRole) return null;

  const tenantNameForRole = adminManagedTenant?.name ?? '';

  const formatTrialEndDate = (startDate: MockTenant['subscriptionStartDate']) => {
    try {
      const date = new Date(startDate);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(addDays(date, defaultTrialDays), 'MMM dd');
    } catch { return 'Invalid Date'; }
  };
  
  const languageLimitDescription = (plan: Plan | undefined) => {
      if (!plan || typeof plan.languageLimit !== 'number') return '';
      if (plan.languageLimit <= 1) return '(English only)';
      if (plan.languageLimit >= 999) return '(English and many other languages)';
      const otherLanguages = plan.languageLimit - 1;
      return `(English and ${otherLanguages} other language(s))`;
  };
  
  // Use live analytics totals for usage display (month-to-date)
  const conversationUsage = totalConversations ?? 0;
  const conversationLimit = adminCurrentPlan?.conversationLimit ?? 0;
  const conversationProgress = conversationLimit > 0 ? (conversationUsage / conversationLimit) * 100 : 0;
  
  const leadUsage = totalLeadsThisMonth ?? 0;
  const leadLimit = adminCurrentPlan?.leadLimit ?? 0;
  const leadProgress = leadLimit > 0 ? (leadUsage / leadLimit) * 100 : 0;


  return (
    <ErrorBoundary>
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 dark:from-background dark:via-muted/20 dark:to-muted/40">
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept=".txt,.pdf"
      />
      <header className="header-modern sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between px-4 sm:px-8 shadow-lg">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <div className="avatar-modern p-1">
            <div className="avatar-modern-inner p-2">
              <AnimatedLogo size={32} withRipple={true} glowIntensity="medium" className="flex-shrink-0" />
            </div>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground dark:from-primary dark:via-[hsl(var(--accent-cyan))] dark:to-[hsl(var(--accent-purple))] bg-clip-text text-transparent truncate animate-in fade-in duration-500">
            Voice Chat AI
          </h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 container-modern">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span className="text-sm font-semibold whitespace-nowrap text-foreground">
              {getRoleName(userRole, tenantNameForRole)}
            </span>
          </div>
          <ThemeToggle />
          <div className="avatar-modern hover:scale-105 transition-transform">
            <div className="avatar-modern-inner">
              <Avatar className="h-full w-full">
                <AvatarImage src={(userRole === 'superadmin' ? 'https://placehold.co/100x100.png' : adminManagedTenant?.companyLogoUrl) || undefined} alt={userRole} data-ai-hint={userRole === 'superadmin' ? 'administrator crown' : 'administrator user'} className="object-contain" />
                <AvatarFallback className="bg-gradient-to-br from-cyan-600 to-purple-600 dark:from-primary dark:to-[hsl(var(--accent-purple))] text-primary-foreground font-semibold text-sm">
                  {getInitials(getRoleName(userRole, tenantNameForRole))}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <button onClick={handleLogout} className="Btn" aria-label="Logout">
            <div className="sign">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.2929 14.2929C16.9024 14.6834 16.9024 15.3166 17.2929 15.7071C17.6834 16.0976 18.3166 16.0976 18.7071 15.7071L21.6201 12.7941C21.6351 12.7791 21.6497 12.7637 21.6637 12.748C21.87 12.5648 22 12.2976 22 12C22 11.7024 21.87 11.4352 21.6637 11.252C21.6497 11.2363 21.6351 11.2209 21.6201 11.2059L18.7071 8.29289C18.3166 7.90237 17.6834 7.90237 17.2929 8.29289C16.9024 8.68342 16.9024 9.31658 17.2929 9.70711L18.5858 11H13C12.4477 11 12 11.4477 12 12C12 12.5523 12.4477 13 13 13H18.5858L17.2929 14.2929Z"/>
                <path d="M5 2C3.34315 2 2 3.34315 2 5V19C2 20.6569 3.34315 22 5 22H14.5C15.8807 22 17 20.8807 17 19.5V16.7326C16.8519 16.647 16.7125 16.5409 16.5858 16.4142C15.9314 15.7598 15.8253 14.7649 16.2674 14H13C11.8954 14 11 13.1046 11 12C11 10.8954 11.8954 10 13 10H16.2674C15.8253 9.23514 15.9314 8.24015 16.5858 7.58579C16.7125 7.4591 16.8519 7.35296 17 7.26738V4.5C17 3.11929 15.8807 2 14.5 2H5Z"/>
              </svg>
            </div>
            <div className="text">Logout</div>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-6 space-y-6 sm:space-y-8 overflow-x-hidden bg-gradient-to-br from-background via-muted/10 to-muted/20">
        <Card modern className="glass-card border-primary/20 shadow-2xl shadow-primary/10">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-purple-600 dark:from-primary dark:to-[hsl(var(--accent-purple))] flex items-center justify-center neon-pulse">
                <Sparkles className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-700 via-purple-700 to-pink-700 dark:from-primary dark:via-[hsl(var(--accent-cyan))] dark:to-[hsl(var(--accent-purple))] bg-clip-text text-transparent">
                  Welcome to your Dashboard!
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {userRole === 'superadmin' && !isViewingAsSuperAdmin ? 'Manage tenants, platform settings, and subscription plans.' : `Manage your chatbot configurations, settings, and view your subscription for ${adminManagedTenant?.name}.`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {userRole === 'superadmin' && !isViewingAsSuperAdmin && (
              <>
                <Card modern className="glass-card border-primary/20">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--accent-cyan))] flex items-center justify-center neon-pulse">
                            <Activity className="w-5 h-5 text-white"/>
                          </div>
                          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Platform Analytics
                          </span>
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">Real-time overview of platform activity and performance.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card modern className="glass-card card-3d border-[hsl(var(--accent-cyan))]/30 hover:border-[hsl(var(--accent-cyan))]/60 transition-all duration-300 bg-card/50 dark:bg-card/30">
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-card-foreground">Active Tenants</CardTitle>
                                <div className="h-9 w-9 rounded-xl bg-[hsl(var(--accent-cyan))]/20 flex items-center justify-center neon-pulse">
                                  <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent-cyan))]"></div>
                                </div>
                              </div>
                              <p className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-blue-700 dark:from-[hsl(var(--accent-cyan))] dark:to-primary bg-clip-text text-transparent mt-3">
                                {activeTenantsCount}
                              </p>
                            </div>
                        </Card>
                        <Card modern className="glass-card card-3d border-[hsl(var(--accent-pink))]/30 hover:border-[hsl(var(--accent-pink))]/60 transition-all duration-300 bg-card/50 dark:bg-card/30">
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-card-foreground">Inactive Tenants</CardTitle>
                                <div className="h-9 w-9 rounded-xl bg-[hsl(var(--accent-pink))]/20 flex items-center justify-center">
                                  <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent-pink))] animate-pulse"></div>
                                </div>
                              </div>
                              <p className="text-3xl font-bold bg-gradient-to-r from-pink-700 to-purple-700 dark:from-[hsl(var(--accent-pink))] dark:to-[hsl(var(--accent-purple))] bg-clip-text text-transparent mt-3">
                                {inactiveTenantsCount}
                              </p>
                            </div>
                        </Card>
                        <Card modern className="glass-card card-3d border-[hsl(var(--accent-purple))]/30 hover:border-[hsl(var(--accent-purple))]/60 transition-all duration-300 bg-card/50 dark:bg-card/30">
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-card-foreground">Trials Ending Soon</CardTitle>
                                <div className="h-9 w-9 rounded-xl bg-[hsl(var(--accent-purple))]/20 flex items-center justify-center neon-pulse">
                                  <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent-purple))] animate-pulse"></div>
                                </div>
                              </div>
                              <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 dark:from-[hsl(var(--accent-purple))] dark:to-[hsl(var(--accent-pink))] bg-clip-text text-transparent mt-3">
                                {tenantsOnTrial?.length ?? 0}
                              </p>
                              {tenantsOnTrial && tenantsOnTrial.length > 0 && (
                                <div className="mt-3 space-y-1">
                                   {tenantsOnTrial.slice(0, 2).map(t => (
                                     <div key={t.id} className="text-xs text-foreground/70 glass-card border-primary/20 px-2 py-1 rounded">
                                       {t.name} • {formatTrialEndDate(t.subscriptionStartDate)}
                                     </div>
                                   ))}
                                   {tenantsOnTrial.length > 2 && (
                                     <div className="text-xs text-primary font-medium">
                                       +{tenantsOnTrial.length - 2} more
                                     </div>
                                   )}
                                </div>
                              )}
                            </div>
                        </Card>
                        
                        {superAdminAnalytics && (
                          <>
                            <Card modern className="glass-card card-3d border-[hsl(var(--accent-green))]/30 hover:border-[hsl(var(--accent-green))]/60 transition-all duration-300 bg-card/50 dark:bg-card/30">
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm font-medium text-card-foreground">Total Revenue</CardTitle>
                                  <DollarSign className="h-6 w-6 text-[hsl(var(--accent-green))] neon-pulse" />
                                </div>
                                <p className="text-3xl font-bold bg-gradient-to-r from-green-700 to-cyan-700 dark:from-[hsl(var(--accent-green))] dark:to-[hsl(var(--accent-cyan))] bg-clip-text text-transparent mt-3">
                                  ${superAdminAnalytics.totals.totalRevenue.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">Monthly subscription revenue</p>
                              </div>
                            </Card>
                            <Card modern className="glass-card card-3d border-[hsl(var(--accent-pink))]/30 hover:border-[hsl(var(--accent-pink))]/60 transition-all duration-300 bg-card/50 dark:bg-card/30">
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm font-medium text-card-foreground">Total AI Cost</CardTitle>
                                  <DatabaseZap className="h-6 w-6 text-[hsl(var(--accent-pink))]" />
                                </div>
                                <p className="text-3xl font-bold bg-gradient-to-r from-pink-700 to-red-700 dark:from-[hsl(var(--accent-pink))] dark:to-destructive bg-clip-text text-transparent mt-3">
                                  ${superAdminAnalytics.totals.totalAICost.toFixed(4)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">Gemini API costs</p>
                              </div>
                            </Card>
                            <Card modern className="glass-card card-3d border-[hsl(var(--accent-purple))]/30 hover:border-[hsl(var(--accent-purple))]/60 transition-all duration-300 bg-card/50 dark:bg-card/30">
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm font-medium text-card-foreground">Total Profit</CardTitle>
                                  <TrendingUp className="h-6 w-6 text-[hsl(var(--accent-purple))] neon-pulse" />
                                </div>
                                <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 dark:from-[hsl(var(--accent-purple))] dark:to-primary bg-clip-text text-transparent mt-3">
                                  ${superAdminAnalytics.totals.totalProfit.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">Revenue - AI costs</p>
                              </div>
                            </Card>
                            <Card modern className="glass-card card-3d border-[hsl(var(--accent-cyan))]/30 hover:border-[hsl(var(--accent-cyan))]/60 transition-all duration-300 bg-card/50 dark:bg-card/30">
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm font-medium text-card-foreground">Profit Margin</CardTitle>
                                  <Gauge className="h-6 w-6 text-[hsl(var(--accent-cyan))] neon-pulse" />
                                </div>
                                <p className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-blue-700 dark:from-[hsl(var(--accent-cyan))] dark:to-primary bg-clip-text text-transparent mt-3">
                                  {superAdminAnalytics.totals.platformProfitMargin.toFixed(1)}%
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">Platform efficiency</p>
                              </div>
                            </Card>
                            <Card className="glass-card card-3d border-primary/30 hover:border-primary/60 transition-all duration-300 bg-card/50 dark:bg-card/30">
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm font-medium text-card-foreground">Average Margin</CardTitle>
                                  <TrendingUp className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 dark:from-primary dark:to-[hsl(var(--accent-purple))] bg-clip-text text-transparent mt-3">
                                  {superAdminAnalytics.totals.averageProfitMargin.toFixed(1)}%
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">Avg per tenant</p>
                              </div>
                            </Card>
                            <Card className={`glass-card card-3d transition-all duration-300 bg-card/50 dark:bg-card/30 ${
                              superAdminAnalytics.totals.tenantsNeedingAttention > 0
                                ? 'border-[hsl(var(--accent-pink))]/40 hover:border-[hsl(var(--accent-pink))]/70'
                                : 'border-[hsl(var(--accent-green))]/40 hover:border-[hsl(var(--accent-green))]/70'
                            }`}>
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm font-medium text-card-foreground">Needs Attention</CardTitle>
                                  <Activity className={`h-6 w-6 ${
                                    superAdminAnalytics.totals.tenantsNeedingAttention > 0
                                      ? 'text-[hsl(var(--accent-pink))] neon-pulse'
                                      : 'text-[hsl(var(--accent-green))]'
                                  }`} />
                                </div>
                                <p className={`text-3xl font-bold mt-3 ${
                                  superAdminAnalytics.totals.tenantsNeedingAttention > 0
                                    ? 'bg-gradient-to-r from-pink-700 to-red-700 dark:from-[hsl(var(--accent-pink))] dark:to-destructive bg-clip-text text-transparent'
                                    : 'bg-gradient-to-r from-green-700 to-cyan-700 dark:from-[hsl(var(--accent-green))] dark:to-[hsl(var(--accent-cyan))] bg-clip-text text-transparent'
                                }`}>{superAdminAnalytics.totals.tenantsNeedingAttention}</p>
                                <p className="text-xs text-muted-foreground mt-2">High usage or low profit</p>
                              </div>
                            </Card>
                          </>
                        )}
                        
                        {superAdminAnalytics && superAdminAnalytics.tenants.length > 0 && (
                          <div className="md:col-span-3 mt-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                <UsersRound className="h-4 w-4 text-white" />
                              </div>
                              <h4 className="font-semibold text-foreground">Per-Tenant Cost Control & Profit Analysis</h4>
                            </div>
                            <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-4 border border-border/30">
                              <div className="mobile-table-wrapper">
                                <table className="w-full text-sm min-w-[800px]">
                                  <thead>
                                    <tr className="border-b border-border/50">
                                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Tenant</th>
                                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Plan</th>
                                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Token Usage</th>
                                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Revenue</th>
                                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">AI Cost</th>
                                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Profit</th>
                                      <th className="text-right py-3 px-2 font-semibold text-muted-foreground">Margin %</th>
                                      <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {superAdminAnalytics.tenants.map((tenant) => {
                                      const getStatusColor = () => {
                                        if (tenant.needsAttention) return 'text-red-600 dark:text-red-400';
                                        if (tenant.profitMargin > 50) return 'text-green-600 dark:text-green-400';
                                        return 'text-yellow-600 dark:text-yellow-400';
                                      };
                                      
                                      const getStatusBg = () => {
                                        if (tenant.needsAttention) return 'bg-red-50 dark:bg-red-950/20';
                                        if (tenant.profitMargin > 50) return 'bg-green-50 dark:bg-green-950/20';
                                        return 'bg-yellow-50 dark:bg-yellow-950/20';
                                      };

                                      return (
                                        <tr key={tenant.tenantId} className={`border-b border-border/30 hover:bg-muted/20 ${getStatusBg()}`}>
                                          <td className="py-3 px-2 font-medium">{tenant.tenantName}</td>
                                          <td className="py-3 px-2">
                                            <Badge variant="outline" className="text-xs">{tenant.planName}</Badge>
                                          </td>
                                          <td className="text-right py-3 px-2">
                                            <div className="flex flex-col items-end gap-1">
                                              <span className={tenant.tokenUsagePercentage > 80 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-muted-foreground'}>
                                                {tenant.totalTokens.toLocaleString()} / {tenant.tokenLimit.toLocaleString()}
                                              </span>
                                              <span className={`text-xs ${tenant.tokenUsagePercentage > 80 ? 'text-red-600 dark:text-red-400 font-semibold' : tenant.tokenUsagePercentage > 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                                                {tenant.tokenUsagePercentage.toFixed(1)}%
                                              </span>
                                            </div>
                                          </td>
                                          <td className="text-right py-3 px-2 text-emerald-600 dark:text-emerald-400 font-semibold">${tenant.revenue.toFixed(2)}</td>
                                          <td className="text-right py-3 px-2 text-red-600 dark:text-red-400">${tenant.aiCost.toFixed(4)}</td>
                                          <td className="text-right py-3 px-2 font-semibold">${tenant.profit.toFixed(2)}</td>
                                          <td className="text-right py-3 px-2">
                                            <span className={tenant.profitMargin > 50 ? 'text-green-600 dark:text-green-400 font-semibold' : tenant.profitMargin >= 20 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400 font-semibold'}>
                                              {tenant.profitMargin.toFixed(1)}%
                                            </span>
                                          </td>
                                          <td className="text-center py-3 px-2">
                                            {tenant.needsAttention ? (
                                              <Badge variant="destructive" className="text-xs">Alert</Badge>
                                            ) : (
                                              <Badge variant="outline" className={`text-xs ${tenant.profitMargin > 50 ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-yellow-500 text-yellow-600 dark:text-yellow-400'}`}>
                                                {tenant.profitMargin > 50 ? 'Healthy' : 'OK'}
                                              </Badge>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="md:col-span-3 mt-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                              <BarChart3 className="h-4 w-4 text-white" />
                            </div>
                            <h4 className="font-semibold text-card-foreground">Tenant Distribution by Plan</h4>
                          </div>
                          <div className="bg-gradient-to-br from-muted/40 to-muted/20 dark:from-muted/30 dark:to-muted/10 rounded-xl p-4 border border-border/50">
                            <ChartContainer config={chartConfig} className="h-[200px] sm:h-[280px] w-full">
                              <BarChart data={planDistributionData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }} accessibilityLayer>
                                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                  <XAxis dataKey="plan" tickLine={false} tickMargin={10} axisLine={false} className="text-muted-foreground" />
                                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-muted-foreground" />
                                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                  <Bar dataKey="tenants" fill="var(--color-tenants)" radius={6} />
                              </BarChart>
                            </ChartContainer>
                          </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Clock className="w-5 h-5 mr-2 text-primary"/>Trial Status Monitor</CardTitle>
                        <CardDescription>Monitor and manage trial periods across all tenants.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <Card modern className="p-4">
                                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Active Trials</CardTitle>
                                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                                    {mockTenants.filter(t => {
                                        const plan = displayedPlans.find(p => p.id === t.assignedPlanId);
                                        if (!plan) return false;
                                        const trialStatus = checkTrialStatus(t, plan, defaultTrialDays);
                                        return trialStatus.isOnTrial && !trialStatus.isExpired;
                                    }).length}
                                </p>
                            </Card>
                            <Card modern className="p-4">
                                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Expiring Soon (≤3 days)</CardTitle>
                                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                                    {mockTenants.filter(t => {
                                        const plan = displayedPlans.find(p => p.id === t.assignedPlanId);
                                        if (!plan) return false;
                                        const trialStatus = checkTrialStatus(t, plan, defaultTrialDays);
                                        return trialStatus.isOnTrial && !trialStatus.isExpired && trialStatus.daysRemaining <= 3;
                                    }).length}
                                </p>
                            </Card>
                            <Card modern className="p-4">
                                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Expired Trials</CardTitle>
                                <p className="text-xl sm:text-2xl font-bold text-red-600">
                                    {mockTenants.filter(t => {
                                        const plan = displayedPlans.find(p => p.id === t.assignedPlanId);
                                        if (!plan) return false;
                                        const trialStatus = checkTrialStatus(t, plan, defaultTrialDays);
                                        return trialStatus.isExpired;
                                    }).length}
                                </p>
                            </Card>
                            <Card modern className="p-4">
                                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Trial Overrides</CardTitle>
                                <p className="text-xl sm:text-2xl font-bold text-green-600">
                                    {mockTenants.filter(t => t.trialOverride).length}
                                </p>
                            </Card>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-primary"/>
                      Trial Management Settings
                    </CardTitle>
                    <CardDescription>Configure global trial settings for all new tenants.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="defaultTrialPlan">Default Trial Plan</Label>
                        <Select 
                          value={platformSettings.defaultTrialPlanId} 
                          onValueChange={(value) => setPlatformSettings(prev => ({ ...prev, defaultTrialPlanId: value }))}
                        >
                          <SelectTrigger id="defaultTrialPlan" className="w-full">
                            <SelectValue placeholder="Select default trial plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {displayedPlans.map(plan => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name}
                                {plan.isPremiumTrial && ' (Premium Trial)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">The plan new tenants start with during their trial period.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="trialLength">Trial Duration (Days)</Label>
                        <Input 
                          id="trialLength" 
                          type="number" 
                          min="1"
                          max="365"
                          value={platformSettings.trialLengthDays} 
                          onChange={(e) => setPlatformSettings(prev => ({ ...prev, trialLengthDays: parseInt(e.target.value, 10) || 14 }))} 
                          className="w-full" 
                        />
                        <p className="text-xs text-muted-foreground">Number of days for the trial period (1-365).</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Post-Trial Behavior</Label>
                      <RadioGroup 
                        value={platformSettings.postTrialBehavior} 
                        onValueChange={(value: 'auto_downgrade' | 'require_selection') => setPlatformSettings(prev => ({ ...prev, postTrialBehavior: value }))}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <RadioGroupItem value="auto_downgrade" id="auto_downgrade" className="mt-0.5" />
                          <div className="flex-1">
                            <label htmlFor="auto_downgrade" className="text-sm font-medium leading-none cursor-pointer">
                              Auto-downgrade to Free Plan
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Automatically downgrade users to the free plan when their trial expires.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <RadioGroupItem value="require_selection" id="require_selection" className="mt-0.5" />
                          <div className="flex-1">
                            <label htmlFor="require_selection" className="text-sm font-medium leading-none cursor-pointer">
                              Require Plan Selection
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Show a plan selection modal and require users to choose a plan before continuing.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
                      <Input 
                        id="gracePeriod" 
                        type="number" 
                        min="0"
                        max="30"
                        value={platformSettings.gracePeriodDays} 
                        onChange={(e) => setPlatformSettings(prev => ({ ...prev, gracePeriodDays: parseInt(e.target.value, 10) || 0 }))} 
                        className="w-full sm:w-[200px]" 
                      />
                      <p className="text-xs text-muted-foreground">Days after trial expiration before taking action (0-30).</p>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={handleSavePlatformSettings}
                        disabled={isSavingPlatformSettings}
                        className="w-full sm:w-auto"
                      >
                        {isSavingPlatformSettings ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                        ) : (
                          <>Save Trial Settings</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center"><User className="w-5 h-5 mr-2 text-primary"/>User Management</CardTitle>
                    <CardDescription>Manage all platform users. Only super admins can delete users.</CardDescription>
                    
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                      <div className="relative flex-grow">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search by email or company name..." 
                          value={userSearchTerm} 
                          onChange={(e) => setUserSearchTerm(e.target.value)} 
                          className="pl-8" 
                        />
                      </div>
                      <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {userSearchTerm || userRoleFilter !== 'all' ? (
                          <span>Showing {filteredAndSortedUsers.length} of {allUsers.length} users</span>
                        ) : (
                          <span>Total Users: {allUsers.length}</span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadAllUsers}
                        disabled={isUsersLoading}
                      >
                        {isUsersLoading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
                        ) : (
                          'Refresh Users'
                        )}
                      </Button>
                    </div>
                    
                    {isUsersLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted rounded animate-pulse w-1/3"></div>
                              <div className="h-3 bg-muted rounded animate-pulse w-1/4"></div>
                            </div>
                            <div className="w-20 h-8 bg-muted rounded animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    ) : filteredAndSortedUsers.length > 0 ? (
                      <div className="space-y-3">
                        {filteredAndSortedUsers.map(user => (
                          <Card key={user.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className={user.role === 'superadmin' ? 'bg-red-100 text-red-700' : user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                                    {user.email.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.email}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant={user.role === 'superadmin' ? 'destructive' : user.role === 'admin' ? 'default' : 'secondary'}>
                                      {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                                    </Badge>
                                    {user.tenant && (
                                      <span>• {user.tenant.name} ({user.tenant.status})</span>
                                    )}
                                    {user.createdAt && (
                                      <span>• Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {user.tenant && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => window.location.href = `/dashboard?viewAsTenantId=${user.tenant.id}`}
                                  >
                                    View Tenant
                                  </Button>
                                )}
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => openDeleteDialog(user)}
                                  disabled={user.role === 'superadmin'} // Can't delete super admins (for safety)
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />Delete
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        {allUsers.length === 0 ? (
                          <p>No users found.</p>
                        ) : (
                          <div>
                            <p>No users match your search criteria.</p>
                            <p className="text-sm mt-2">Try adjusting your search term or filters.</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Delete Confirmation Dialog */}
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete User</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete the user <strong>{userToDelete?.email}</strong>?
                            {userToDelete?.tenant && (
                              <span className="block mt-2 text-orange-600 dark:text-orange-400">
                                ⚠️ This will also delete their associated tenant: <strong>{userToDelete.tenant.name}</strong>
                              </span>
                            )}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
                          >
                            Delete User
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><UsersRound className="w-5 h-5 mr-2 text-primary"/>Manage Tenant Subscriptions &amp; Status</CardTitle>
                        <CardDescription>Assign subscription plans and manage account status for each tenant. (Manual update after payment)</CardDescription>
                         <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                            <div className="relative flex-grow">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input modern placeholder="Search by company name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                            </div>
                            <Select value={planFilter} onValueChange={setPlanFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by plan" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Plans</SelectItem>
                                    {displayedPlans.map(plan => (<SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Disabled (Payment Due)">Disabled (Payment)</SelectItem>
                                    <SelectItem value="Disabled (Usage Limit Reached)">Disabled (Usage)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {filteredTenants.length > 0 ? (
                          filteredTenants.map(tenant => {
                              const joinedDateText = (() => { try { const date = new Date(tenant.subscriptionStartDate); return !isNaN(date.getTime()) ? format(date, 'MMM dd, yyyy') : 'Invalid Date'; } catch { return 'Invalid Date'; } })();
                              const planDetails = displayedPlans.find(p => p.id === tenant.assignedPlanId);
                              const isFreePlan = planDetails?.id === 'free';
                              let renewalDateText = '';
                              if (!isFreePlan) { try { const date = new Date(tenant.subscriptionStartDate); if (!isNaN(date.getTime())) { renewalDateText = format(addYears(date, 1), 'MMM dd, yyyy'); } } catch { renewalDateText = 'Invalid Date'; } }

                              const whatsappLink = getWhatsAppLink(tenant.contactWhatsapp);

                              // Calculate trial status for this tenant
                              const trialStatus = planDetails ? checkTrialStatus(tenant, planDetails, defaultTrialDays) : null;

                              return (
                                  <Card key={tenant.id} className="p-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                        <div className="flex-grow mb-2 sm:mb-0">
                                            <Link href={`/dashboard?viewAsTenantId=${tenant.id}`} className="font-semibold text-primary hover:underline">{tenant.name}</Link>
                                            <p className="text-xs text-muted-foreground">Current Plan: {planDetails?.name || 'Unknown'} ({tenant.billingPeriod || 'yearly'})</p>
                                            <p className="text-xs text-muted-foreground">Joined: {joinedDateText}</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                            <Select value={tenant.assignedPlanId} onValueChange={(newPlanId) => handlePlanChangeForTenant(tenant.id, newPlanId)}>
                                                <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm"><SelectValue placeholder="Select plan" /></SelectTrigger>
                                                <SelectContent>{displayedPlans.map(plan => (<SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                            <Select value={tenant.billingPeriod || 'yearly'} onValueChange={(newPeriod) => handleBillingPeriodChangeForTenant(tenant.id, newPeriod as 'monthly' | 'yearly')}>
                                                <SelectTrigger className="w-full sm:w-[120px] h-9 text-sm"><SelectValue placeholder="Billing" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="yearly">Yearly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={tenant.status} onValueChange={(newStatus) => handleTenantStatusChange(tenant.id, newStatus as MockTenantStatus)}>
                                                <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Active"><UserCheck className="w-4 h-4 mr-2 inline-block text-green-500"/>Active</SelectItem>
                                                    <SelectItem value="Disabled (Payment Due)"><UserX className="w-4 h-4 mr-2 inline-block text-red-500"/>Disabled (Payment)</SelectItem>
                                                    <SelectItem value="Disabled (Usage Limit Reached)"><UserX className="w-4 h-4 mr-2 inline-block text-orange-500"/>Disabled (Usage)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Trial Management Section */}
                                        {trialStatus && (
                                            <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        Trial Management
                                                    </h4>
                                                    <Badge variant={trialStatus.isExpired ? "destructive" : trialStatus.daysRemaining <= 3 ? "secondary" : "default"} className="self-start sm:self-auto">
                                                        {trialStatus.isExpired ? "Expired" :
                                                         trialStatus.isOnTrial ? `${trialStatus.daysRemaining} days left` : "Not on trial"}
                                                    </Badge>
                                                </div>

                                                {trialStatus.isOnTrial && (
                                                    <div className="text-xs text-muted-foreground mb-3 space-y-1">
                                                        <p>Trial ends: {trialStatus.trialEndDate ? format(trialStatus.trialEndDate, 'MMM dd, yyyy') : 'Unknown'}</p>
                                                        {tenant.trialOverride && <p className="text-primary font-medium">Override Active</p>}
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    {/* Quick Actions Row */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => extendTrial(tenant.id, 7)}
                                                            className="text-xs h-8 px-2"
                                                        >
                                                            +7 Days
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => extendTrial(tenant.id, 30)}
                                                            className="text-xs h-8 px-2"
                                                        >
                                                            +30 Days
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => resetTrial(tenant.id, 14)}
                                                            className="text-xs h-8 px-2 col-span-2 sm:col-span-1"
                                                        >
                                                            Reset Trial
                                                        </Button>
                                                    </div>

                                                    {/* Advanced Actions Row */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant={tenant.trialOverride ? "default" : "outline"}
                                                            onClick={() => setTrialOverride(tenant.id, !tenant.trialOverride)}
                                                            className="text-xs h-8 px-2"
                                                        >
                                                            {tenant.trialOverride ? "Remove Override" : "Unlimited Trial"}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => resetFeatures(tenant.id, tenant.assignedPlanId)}
                                                            className="text-xs h-8 px-2"
                                                        >
                                                            Reset Features
                                                        </Button>
                                                    </div>

                                                    {/* Danger Action */}
                                                    <div className="pt-1 border-t border-muted">
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => expireTrial(tenant.id)}
                                                            className="text-xs h-8 px-2 w-full sm:w-auto"
                                                        >
                                                            Expire Now
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs text-muted-foreground mt-3 pt-3 border-t">
                                      <div className="flex items-center gap-2">
                                          <Mail className="w-3.5 h-3.5" />
                                          {tenant.contactEmail ? (<a href={`mailto:${tenant.contactEmail}`} className="text-primary hover:underline">{tenant.contactEmail}</a>) : (<span>Not available</span>)}
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <Phone className="w-3.5 h-3.5" />
                                          {tenant.contactPhone ? (<a href={`tel:${tenant.contactPhone}`} className="text-primary hover:underline">{tenant.contactPhone}</a>) : (<span>Not available</span>)}
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <MessageCircle className="w-3.5 h-3.5" />
                                          {whatsappLink ? (<a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Open WhatsApp <ExternalLink className="w-3 h-3"/></a>) : (<span>Not available</span>)}
                                      </div>
                                      <div className="flex items-center gap-2 col-span-full sm:col-span-1 mt-1">
                                          {isFreePlan ? (<span className="text-green-600 font-medium">On Free Plan (No Renewal)</span>) : (<><CalendarCheck className="w-3.5 h-3.5" /><span>Next Renewal: {renewalDateText}</span></>)}
                                      </div>
                                    </div>
                                  </Card>
                              );
                          })
                        ) : (
                          <div className="text-center text-muted-foreground py-8"><p>No tenants match your criteria.</p></div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div className="flex items-center"><DollarSign className="w-5 h-5 mr-2 text-primary"/>Subscription Plans Overview &amp; Management</div>
                        <Button variant="outline" size="sm" className="mt-2 sm:mt-0 sm:ml-auto" onClick={() => toast({title: "Add New Plan (Placeholder)", description:"This would open a form to create a new plan."})}>
                            <PlusCircle className="w-4 h-4 mr-2" /> Add New Plan
                        </Button>
                    </CardTitle>
                    <CardDescription>
                      View, edit, and manage payment links for subscription plans. Super admin sets prices in both USD and INR.
                      <br />
                      <span className="text-xs text-primary flex items-center gap-1 mt-1">
                        <Sparkles className="w-3 h-3" /> New Admins receive a {defaultTrialDays}-day free trial of the Premium Plan.
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {displayedPlans?.map(plan => (
                      <Card key={plan.id} className={`flex flex-col ${plan.isPremiumTrial ? 'border-primary shadow-lg' : ''}`}>
                        <CardHeader>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              {plan.id === 'free' ? <Zap className="w-5 h-5 text-muted-foreground" /> : <Zap className="w-5 h-5 text-primary" />}
                               <Input value={plan.name} onChange={(e) => handlePlanDetailChange(plan.id, 'name', e.target.value)} className="text-xl font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto" />
                              {plan.isPremiumTrial && <span className="text-xs font-semibold text-primary">(Used for Free Trial)</span>}
                            </CardTitle>
                            <Edit3 className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary mt-2 sm:mt-0" onClick={() => toast({title: "Edit Mode Active (Visual only)", description: "Inputs are editable, save is simulated."})} />
                          </div>
                          <Textarea value={plan.description} onChange={(e) => handlePlanDetailChange(plan.id, 'description', e.target.value)} className="text-sm text-muted-foreground mt-1" rows={2}/>
                        </CardHeader>
                        <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                             <div className="flex items-center gap-2">
                                <Label htmlFor={`priceUSD-${plan.id}`} className="w-28 sm:w-24">Monthly Price (USD)</Label>
                                $<Input id={`priceUSD-${plan.id}`} type="number" value={plan.priceUSD || ''} onChange={(e) => handlePlanDetailChange(plan.id, 'priceUSD', e.target.value)} className="h-8 text-sm w-24" />
                            </div>
                            <div className="flex items-center gap-2">
                               <Label htmlFor={`priceINR-${plan.id}`} className="w-28 sm:w-24">Monthly Price (INR)</Label>
                               ₹<Input id={`priceINR-${plan.id}`} type="number" value={plan.priceINR || ''} onChange={(e) => handlePlanDetailChange(plan.id, 'priceINR', e.target.value)} className="h-8 text-sm w-24" />
                            </div>
                             <div className="flex items-center gap-2">
                                <Label htmlFor={`yearlyDiscount-${plan.id}`} className="w-28 sm:w-24">Yearly Discount</Label>
                                <Input id={`yearlyDiscount-${plan.id}`} type="number" value={plan.yearlyDiscountPercentage ?? 0} onChange={(e) => handlePlanDetailChange(plan.id, 'yearlyDiscountPercentage', e.target.value)} className="h-8 text-sm w-24" />%
                            </div>
                            <p className="text-xs text-muted-foreground">Billed Annually. {(plan.yearlyDiscountPercentage ?? 0) > 0 ? `${plan.yearlyDiscountPercentage}% discount applied to annual total.` : 'No annual discount.'}</p>
                            <div className="flex items-center gap-2">
                                <Label htmlFor={`convLimit-${plan.id}`} className="w-28 sm:w-24">Conversation Limit</Label>
                                <Input id={`convLimit-${plan.id}`} type="number" value={plan.conversationLimit ?? 0} onChange={(e) => handlePlanDetailChange(plan.id, 'conversationLimit', e.target.value)} className="h-8 text-sm w-24" placeholder="e.g., 50" />
                            </div>
                             <div className="flex items-center gap-2">
                                <Label htmlFor={`leadLimit-${plan.id}`} className="w-28 sm:w-24">Lead Limit</Label>
                                <Input id={`leadLimit-${plan.id}`} type="number" value={plan.leadLimit ?? 0} onChange={(e) => handlePlanDetailChange(plan.id, 'leadLimit', e.target.value)} className="h-8 text-sm w-24" placeholder="e.g., 5" />
                            </div>
                             <div className="flex items-center gap-2">
                                <Label htmlFor={`agentLimit-${plan.id}`} className="w-28 sm:w-24">Agent Limit</Label>
                                <Input id={`agentLimit-${plan.id}`} type="number" value={plan.agentLimit ?? 0} onChange={(e) => handlePlanDetailChange(plan.id, 'agentLimit', e.target.value)} className="h-8 text-sm w-24" placeholder="e.g., 1 or 999" />
                            </div>
                             <div className="flex items-center gap-2">
                                <Label htmlFor={`languageLimit-${plan.id}`} className="w-28 sm:w-24">Language Limit</Label>
                                <Input id={`languageLimit-${plan.id}`} type="number" value={plan.languageLimit ?? 0} onChange={(e) => handlePlanDetailChange(plan.id, 'languageLimit', e.target.value)} className="h-8 text-sm w-24" placeholder="e.g., 1 or 999" />
                            </div>
                             <div className="flex items-center gap-2">
                                <Label htmlFor={`contextLimit-${plan.id}`} className="w-28 sm:w-24">Context Limit</Label>
                                <Input id={`contextLimit-${plan.id}`} type="number" value={plan.contextLimit ?? 0} onChange={(e) => handlePlanDetailChange(plan.id, 'contextLimit', e.target.value)} className="h-8 text-sm w-24" placeholder="e.g., 1 or 999" />
                            </div>
                             <div className="flex items-center gap-2">
                                <Label htmlFor={`tokenLimit-${plan.id}`} className="w-28 sm:w-24">Token Limit</Label>
                                <Input id={`tokenLimit-${plan.id}`} type="number" value={plan.tokenLimit ?? 0} onChange={(e) => handlePlanDetailChange(plan.id, 'tokenLimit', e.target.value)} className="h-8 text-sm w-24" placeholder="e.g., 50000" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id={`customBranding-${plan.id}`} checked={plan.allowsCustomBranding} onCheckedChange={(checked) => handlePlanDetailChange(plan.id, 'allowsCustomBranding', !!checked)} />
                                <label htmlFor={`customBranding-${plan.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Allow Custom Branding</label>
                            </div>
                            <div className="space-y-2 mt-3">
                                <Label className="font-medium text-sm">Features:</Label>
                                {plan.features?.map((feature) => (
                                    <div key={feature.id} className="flex items-center gap-2">
                                        <Checkbox id={`${plan.id}-feature-${feature.id}-check`} checked={feature.included} onCheckedChange={(checked) => handleFeatureChange(plan.id, feature.id, 'included', !!checked)} />
                                        <Input id={`${plan.id}-feature-${feature.id}-text`} value={feature.text} onChange={(e) => handleFeatureChange(plan.id, feature.id, 'text', e.target.value)} className="h-8 text-xs flex-grow" />
                                    </div>
                                ))}
                                <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => toast({title:"Add Feature (Placeholder)", description:"This would allow adding a new feature line."})}>+ Add feature</Button>
                            </div>
                          </div>
                          <div className="space-y-2 pt-2 border-t md:border-t-0 md:border-l md:pl-4">
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-foreground">Annual Billing</h4>
                                <div>
                                    <Label htmlFor={`razorpayLinkUSD-${plan.id}`} className="text-xs">Razorpay Link (USD - Annual)</Label>
                                    <Input id={`razorpayLinkUSD-${plan.id}`} value={plan.razorpayLinkUSD || ''} onChange={(e) => handlePlanDetailChange(plan.id, 'razorpayLinkUSD', e.target.value)} placeholder="https://rzp.io/..." className="h-8 text-xs" />
                                </div>
                                <div>
                                    <Label htmlFor={`razorpayLinkINR-${plan.id}`} className="text-xs">Razorpay Link (INR - Annual)</Label>
                                    <Input id={`razorpayLinkINR-${plan.id}`} value={plan.razorpayLinkINR || ''} onChange={(e) => handlePlanDetailChange(plan.id, 'razorpayLinkINR', e.target.value)} placeholder="https://rzp.io/..." className="h-8 text-xs" />
                                </div>
                              </div>
                              <div className="space-y-2 pt-2 border-t">
                                <h4 className="text-sm font-medium text-foreground">Monthly Billing</h4>
                                <div>
                                    <Label htmlFor={`razorpayLinkUSDMonthly-${plan.id}`} className="text-xs">Razorpay Link (USD - Monthly)</Label>
                                    <Input id={`razorpayLinkUSDMonthly-${plan.id}`} value={plan.razorpayLinkUSDMonthly || ''} onChange={(e) => handlePlanDetailChange(plan.id, 'razorpayLinkUSDMonthly', e.target.value)} placeholder="https://rzp.io/..." className="h-8 text-xs" />
                                </div>
                                <div>
                                    <Label htmlFor={`razorpayLinkINRMonthly-${plan.id}`} className="text-xs">Razorpay Link (INR - Monthly)</Label>
                                    <Input id={`razorpayLinkINRMonthly-${plan.id}`} value={plan.razorpayLinkINRMonthly || ''} onChange={(e) => handlePlanDetailChange(plan.id, 'razorpayLinkINRMonthly', e.target.value)} placeholder="https://rzp.io/..." className="h-8 text-xs" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                           <Button variant="outline" className="w-full mt-2" onClick={() => handleSavePlanChanges(plan.id)}>Save Changes to "{plan.name}"</Button>
                           {userRole === 'superadmin' && (
                             <>
                               {platformSettings.defaultTrialPlanId === plan.id ? (
                                 <Badge variant="default" className="w-full justify-center py-2 text-sm">
                                   <CheckCircle className="w-4 h-4 mr-2" />
                                   Default Trial Plan
                                 </Badge>
                               ) : (
                                 <Button 
                                   variant="secondary" 
                                   size="sm" 
                                   className="w-full" 
                                   onClick={() => handleSetDefaultTrialPlan(plan.id)}
                                 >
                                   <Sparkles className="w-4 h-4 mr-2" />
                                   Set as Default Trial Plan
                                 </Button>
                               )}
                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                   <Button variant="destructive" size="sm" className="w-full">
                                     <Trash2 className="w-4 h-4 mr-2" />
                                     Delete Plan
                                   </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                   <AlertDialogHeader>
                                     <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                     <AlertDialogDescription>
                                       This will permanently delete the plan "{plan.name}". This action cannot be undone.
                                       {plan.id === 'free' && <span className="block mt-2 text-destructive font-semibold">Warning: This is the free plan. Deleting it may cause issues for users.</span>}
                                       {platformSettings.defaultTrialPlanId === plan.id && <span className="block mt-2 text-destructive font-semibold">Warning: This is the default trial plan. Set another plan as default before deleting.</span>}
                                     </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                     <AlertDialogCancel>Cancel</AlertDialogCancel>
                                     <AlertDialogAction onClick={() => handleDeletePlan(plan.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                       Delete
                                     </AlertDialogAction>
                                   </AlertDialogFooter>
                                 </AlertDialogContent>
                               </AlertDialog>
                             </>
                           )}
                        </CardFooter>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}

            {(userRole === 'admin' || isViewingAsSuperAdmin) && adminManagedTenant && (
              <>
                {isViewingAsSuperAdmin && (
                    <Alert variant="default" className="mb-4">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Super Admin View</AlertTitle>
                        <AlertDescription>
                            You are viewing the dashboard for <strong>{adminManagedTenant.name}</strong>. All controls are disabled.
                            <Link href="/dashboard" className="font-semibold underline ml-2">Return to your dashboard</Link>
                        </AlertDescription>
                    </Alert>
                )}
                <Tabs defaultValue={(typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab')) || 'subscription'}
                      onValueChange={(val) => {
                        if (typeof window !== 'undefined') {
                          const params = new URLSearchParams(window.location.search);
                          params.set('tab', val);
                          window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
                        }
                      }}
                      className="w-full md:grid md:grid-cols-[300px_1fr] md:gap-8">
                  {/* Modern Sidebar - Desktop */}
                  <TabsList className="hidden md:flex md:col-start-1 md:sticky md:top-6 md:h-fit z-10 modern-sidebar w-full flex-col items-stretch justify-start bg-background p-5 rounded-md border shadow-lg shadow-primary/10 gap-2">
                    <TabsTrigger 
                      value="subscription"
                      className="modern-sidebar-button w-full justify-start p-4 rounded-full font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-purple-600 data-[state=active]:text-white hover:bg-primary/10 hover:shadow-inner transition-all ease-linear group"
                    >
                      <svg
                        className="size-6 group-data-[state=active]:fill-white group-data-[state=active]:stroke-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C13.1 2 14 2.9 14 4V6H16C17.1 6 18 6.9 18 8V19C18 20.1 17.1 21 16 21H8C6.9 21 6 20.1 6 19V8C6 6.9 6.9 6 8 6H10V4C10 2.9 10.9 2 12 2ZM12 4V6H12V4ZM8 8V19H16V8H8ZM10 11H14V13H10V11ZM10 15H14V17H10V15Z"/>
                      </svg>
                      Subscription
                    </TabsTrigger>
                    <TabsTrigger 
                      value="settings"
                      className="modern-sidebar-button w-full justify-start p-4 rounded-full font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-purple-600 data-[state=active]:text-white hover:bg-primary/10 hover:shadow-inner transition-all ease-linear group"
                    >
                      <svg
                        className="size-6 group-data-[state=active]:fill-white group-data-[state=active]:stroke-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M14.2788 2.15224C13.9085 2 13.439 2 12.5 2C11.561 2 11.0915 2 10.7212 2.15224C10.2274 2.35523 9.83509 2.74458 9.63056 3.23463C9.53719 3.45834 9.50065 3.7185 9.48635 4.09799C9.46534 4.65568 9.17716 5.17189 8.69017 5.45093C8.20318 5.72996 7.60864 5.71954 7.11149 5.45876C6.77318 5.2813 6.52789 5.18262 6.28599 5.15102C5.75609 5.08178 5.22018 5.22429 4.79616 5.5472C4.47814 5.78938 4.24339 6.1929 3.7739 6.99993C3.30441 7.80697 3.06967 8.21048 3.01735 8.60491C2.94758 9.1308 3.09118 9.66266 3.41655 10.0835C3.56506 10.2756 3.77377 10.437 4.0977 10.639C4.57391 10.936 4.88032 11.4419 4.88029 12C4.88026 12.5581 4.57386 13.0639 4.0977 13.3608C3.77372 13.5629 3.56497 13.7244 3.41645 13.9165C3.09108 14.3373 2.94749 14.8691 3.01725 15.395C3.06957 15.7894 3.30432 16.193 3.7738 17C4.24329 17.807 4.47804 18.2106 4.79606 18.4527C5.22008 18.7756 5.75599 18.9181 6.28589 18.8489C6.52778 18.8173 6.77305 18.7186 7.11133 18.5412C7.60852 18.2804 8.2031 18.27 8.69012 18.549C9.17714 18.8281 9.46533 19.3443 9.48635 19.9021C9.50065 20.2815 9.53719 20.5417 9.63056 20.7654C9.83509 21.2554 10.2274 21.6448 10.7212 21.8478C11.0915 22 11.561 22 12.5 22C13.439 22 13.9085 22 14.2788 21.8478C14.7726 21.6448 15.1649 21.2554 15.3694 20.7654C15.4628 20.5417 15.4994 20.2815 15.5137 19.902C15.5347 19.3443 15.8228 18.8281 16.3098 18.549C16.7968 18.2699 17.3914 18.2804 17.8886 18.5412C18.2269 18.7186 18.4721 18.8172 18.714 18.8488C19.2439 18.9181 19.7798 18.7756 20.2038 18.4527C20.5219 18.2105 20.7566 17.807 21.2261 16.9999C21.6956 16.1929 21.9303 15.7894 21.9827 15.395C22.0524 14.8691 21.9088 14.3372 21.5835 13.9164C21.4349 13.7243 21.2262 13.5628 20.9022 13.3608C20.4261 13.0639 20.1197 12.558 20.1197 11.9999C20.1197 11.4418 20.4261 10.9361 20.9022 10.6392C21.2263 10.4371 21.435 10.2757 21.5836 10.0835C21.9089 9.66273 22.0525 9.13087 21.9828 8.60497C21.9304 8.21055 21.6957 7.80703 21.2262 7C20.7567 6.19297 20.522 5.78945 20.2039 5.54727C19.7799 5.22436 19.244 5.08185 18.7141 5.15109C18.4722 5.18269 18.2269 5.28136 17.8887 5.4588C17.3915 5.71959 16.7969 5.73002 16.3099 5.45096C15.8229 5.17191 15.5347 4.65566 15.5136 4.09794C15.4993 3.71848 15.4628 3.45833 15.3694 3.23463C15.1649 2.74458 14.7726 2.35523 14.2788 2.15224ZM12.5 15C14.1695 15 15.5228 13.6569 15.5228 12C15.5228 10.3431 14.1695 9 12.5 9C10.8305 9 9.47716 10.3431 9.47716 12C9.47716 13.6569 10.8305 15 12.5 15Z" clipRule="evenodd" fillRule="evenodd"/>
                      </svg>
                      General
                    </TabsTrigger>
                    <TabsTrigger 
                      value="agents"
                      className="modern-sidebar-button w-full justify-start p-4 rounded-full font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-purple-600 data-[state=active]:text-white hover:bg-primary/10 hover:shadow-inner transition-all ease-linear group"
                    >
                      <svg
                        className="size-6 group-data-[state=active]:fill-white group-data-[state=active]:stroke-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        <path d="M20 8a2 2 0 11-4 0 2 2 0 014 0zM18 15a5 5 0 014 5h-4v-5zM8 8a2 2 0 11-4 0 2 2 0 014 0zM6 15v5H2a5 5 0 014-5z"/>
                      </svg>
                      Agents
                    </TabsTrigger>
                    <TabsTrigger 
                      value="languages"
                      className="modern-sidebar-button w-full justify-start p-4 rounded-full font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-purple-600 data-[state=active]:text-white hover:bg-primary/10 hover:shadow-inner transition-all ease-linear group"
                    >
                      <svg
                        className="size-6 group-data-[state=active]:fill-white group-data-[state=active]:stroke-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                      Languages
                    </TabsTrigger>
                    <TabsTrigger 
                      value="training"
                      className="modern-sidebar-button w-full justify-start p-4 rounded-full font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-purple-600 data-[state=active]:text-white hover:bg-primary/10 hover:shadow-inner transition-all ease-linear group"
                    >
                      <svg
                        className="size-6 group-data-[state=active]:fill-white group-data-[state=active]:stroke-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm0 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
                      </svg>
                      Training
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analytics"
                      className="modern-sidebar-button w-full justify-start p-4 rounded-full font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-purple-600 data-[state=active]:text-white hover:bg-primary/10 hover:shadow-inner transition-all ease-linear group"
                    >
                      <svg
                        className="size-6 group-data-[state=active]:fill-white group-data-[state=active]:stroke-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3 3v18h18v-2H5V3H3zm4 14h2V9H7v8zm4 0h2V7h-2v10zm4 0h2v-4h-2v4z"/>
                      </svg>
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger 
                      value="embed"
                      className="modern-sidebar-button w-full justify-start p-4 rounded-full font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-purple-600 data-[state=active]:text-white hover:bg-primary/10 hover:shadow-inner transition-all ease-linear group"
                    >
                      <svg
                        className="size-6 group-data-[state=active]:fill-white group-data-[state=active]:stroke-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                      </svg>
                      Embed
                    </TabsTrigger>
                    <TabsTrigger 
                      value="help"
                      className="modern-sidebar-button w-full justify-start p-4 rounded-full font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-purple-600 data-[state=active]:text-white hover:bg-primary/10 hover:shadow-inner transition-all ease-linear group"
                    >
                      <svg
                        className="size-6 group-data-[state=active]:fill-white group-data-[state=active]:stroke-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                      </svg>
                      Help
                    </TabsTrigger>
                  </TabsList>

                  {/* Mobile TabsList - Keep existing for mobile */}
                  <TabsList className="md:hidden w-full flex items-stretch justify-start bg-background/50 p-1.5 rounded-md border shadow-lg shadow-primary/10 gap-1 overflow-x-auto snap-x snap-mandatory">
                    <TabsTrigger className="justify-start w-auto flex-shrink-0 snap-start px-2.5 py-2 text-xs whitespace-nowrap" value="subscription">
                      <DollarSign className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      Sub
                    </TabsTrigger>
                    <TabsTrigger className="justify-start w-auto flex-shrink-0 snap-start px-2.5 py-2 text-xs whitespace-nowrap" value="settings">
                      <Settings className="w-4 h-4 mr-1.5 flex-shrink-0"/>
                      Gen
                    </TabsTrigger>
                    <TabsTrigger className="justify-start w-auto flex-shrink-0 snap-start px-2.5 py-2 text-xs whitespace-nowrap" value="agents">
                      <Users className="w-4 h-4 mr-1.5 flex-shrink-0"/>
                      Agents
                    </TabsTrigger>
                    <TabsTrigger className="justify-start w-auto flex-shrink-0 snap-start px-2.5 py-2 text-xs whitespace-nowrap" value="languages">
                      <Languages className="w-4 h-4 mr-1.5 flex-shrink-0"/>
                      Lang
                    </TabsTrigger>
                    <TabsTrigger className="justify-start w-auto flex-shrink-0 snap-start px-2.5 py-2 text-xs whitespace-nowrap" value="training">
                      <Brain className="w-4 h-4 mr-1.5 flex-shrink-0"/>
                      Train
                    </TabsTrigger>
                    <TabsTrigger className="justify-start w-auto flex-shrink-0 snap-start px-2.5 py-2 text-xs whitespace-nowrap" value="analytics">
                      <BarChart3 className="w-4 h-4 mr-1.5 flex-shrink-0"/>
                      Stats
                    </TabsTrigger>
                    <TabsTrigger className="justify-start w-auto flex-shrink-0 snap-start px-2.5 py-2 text-xs whitespace-nowrap" value="embed">
                      <Code className="w-4 h-4 mr-1.5 flex-shrink-0"/>
                      Code
                    </TabsTrigger>
                    <TabsTrigger className="justify-start w-auto flex-shrink-0 snap-start px-2.5 py-2 text-xs whitespace-nowrap" value="help">
                      <MessageSquareQuote className="w-4 h-4 mr-1.5 flex-shrink-0"/>
                      Help
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="subscription" className="md:col-start-2">
                      {adminCurrentPlan && (
                           <Card modern className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Gauge className="w-5 h-5 text-primary"/> This Month's Usage</CardTitle>
                                <CardDescription>Your usage resets monthly. Exceeding limits may require an upgrade.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {adminManagedTenant.status === "Disabled (Usage Limit Reached)" && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Usage Limit Reached</AlertTitle>
                                        <AlertDescription>You have exceeded your monthly conversation limit. The chatbot has been temporarily disabled. Please upgrade your plan to continue service.</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <Label htmlFor="conv-progress">Conversations</Label>
                                        <span className="font-medium">{conversationUsage} / {conversationLimit >= 99999 ? 'Unlimited' : conversationLimit}</span>
                                    </div>
                                    <Progress id="conv-progress" value={conversationProgress} className="h-2" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <Label htmlFor="lead-progress">Leads Captured</Label>
                                        <span className="font-medium">{leadUsage} / {leadLimit >= 99999 ? 'Unlimited' : leadLimit}</span>
                                    </div>
                                    <Progress id="lead-progress" value={leadProgress} className="h-2" />
                                </div>
                            </CardContent>
                           </Card>
                      )}
                      
                      <Card>
                          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /> Your Trial &amp; Plan Information</CardTitle></CardHeader>
                          <CardContent className="space-y-3 text-sm">
                              <p className="flex items-start gap-2"><Info className="w-4 h-4 text-blue-500 mt-1 shrink-0" /><span><strong>Welcome!</strong> New administrators start with a <strong>{defaultTrialDays}-day free trial of our Premium Plan</strong> to explore all features. This allows you to experience unlimited agents, unlimited languages, and custom branding.</span></p>
                              <p className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="w-4 h-4 text-blue-500 shrink-0" /><span>Your trial approximately ends on: <strong>{trialEndDateForAdmin}</strong>.</span></p>
                              <p className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-orange-500 mt-1 shrink-0" /><span>After the trial, if no paid plan is selected, your account will automatically be downgraded to the <strong>Free Forever plan</strong>, which has limitations on agents, languages, and uses default platform branding.</span></p>
                               {adminManagedTenant.status === "Disabled (Payment Due)" && (<p className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive rounded-md"><ShieldAlert className="w-5 h-5 shrink-0" /><strong>Your account is currently disabled. Please complete payment to re-activate.</strong></p>)}
                          </CardContent>
                      </Card>
                      {adminCurrentPlan && (
                          <Card modern className="mt-6">
                              <CardHeader>
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                      <div>
                                          <CardTitle>Your Current Subscription Plan</CardTitle>
                                          <CardDescription>(Managing for: {adminManagedTenant.name}) {adminManagedTenant.status !== "Active" && <span className="text-destructive font-semibold">({adminManagedTenant.status})</span>}</CardDescription>
                                      </div>
                                      <div className="mt-2 sm:mt-0 text-sm text-muted-foreground">Displaying prices in your country&apos;s currency: <strong className="text-foreground">{currencyForAdmin}</strong></div>
                                  </div>
                              </CardHeader>
                              <CardContent>
                                  <h3 className="text-xl font-semibold text-primary mb-2">{adminCurrentPlan.name}</h3>
                                  <p className="text-lg font-bold mb-1">{displayPrice(adminCurrentPlan, currencyForAdmin)} <span className="text-sm font-normal text-muted-foreground">/mo (currently on yearly billing{adminCurrentPlan.yearlyDiscountPercentage > 0 ? `, ${adminCurrentPlan.yearlyDiscountPercentage}% off` : ''})</span></p>
                                  <div className="mt-4 space-y-2">
                                  <div className="flex items-center gap-2 text-sm"><MessageSquareQuote className="w-4 h-4 text-muted-foreground" /><span>Conversation Limit: <span className="font-semibold">{adminCurrentPlan.conversationLimit >= 99999 ? 'Unlimited' : adminCurrentPlan.conversationLimit} / month</span></span></div>
                                  <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-muted-foreground" /><span>Lead Capture Limit: <span className="font-semibold">{adminCurrentPlan.leadLimit >= 99999 ? 'Unlimited' : adminCurrentPlan.leadLimit} / month</span></span></div>
                                  <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-muted-foreground" /><span>Agent Limit: <span className="font-semibold">{adminCurrentPlan.agentLimit >= 999 ? 'Unlimited' : adminCurrentPlan.agentLimit}</span> (You can create up to {adminCurrentPlan.agentLimit >= 999 ? 'unlimited' : adminCurrentPlan.agentLimit} sales/support agents)</span></div>
                                  <div className="flex items-center gap-2 text-sm"><Languages className="w-4 h-4 text-muted-foreground" /><span>Language Limit: <span className="font-semibold">{adminCurrentPlan.languageLimit >= 999 ? 'Unlimited' : adminCurrentPlan.languageLimit}</span> {languageLimitDescription(adminCurrentPlan)}</span></div>
                                  <div className="flex items-center gap-2 text-sm"><Brain className="w-4 h-4 text-muted-foreground" /><span>Training Context Limit: <span className="font-semibold">{adminCurrentPlan.contextLimit >= 999 ? 'Unlimited' : adminCurrentPlan.contextLimit}</span> (You can provide {adminCurrentPlan.contextLimit} website(s) for context)</span></div>
                                  <p className="text-sm mt-2"><strong>Branding:</strong> {adminCurrentPlan.allowsCustomBranding ? 'This plan allows custom branding (your logo on the chatbot). Configure in General Settings.' : 'This plan uses default platform branding on the chatbot.'}</p>
                                   <ul className="space-y-1 text-sm mt-2">{adminCurrentPlan.features?.map(feature => (<li key={feature.id} className={`flex items-center gap-2 ${feature.included ? '' : 'text-muted-foreground line-through'}`}><CheckCircle className={`w-4 h-4 ${feature.included ? 'text-green-500' : 'text-muted-foreground'}`} />{feature.text}</li>))}</ul>
                                  </div>
                              </CardContent>
                          </Card>
                      )}
                      <Card className="mt-6">
                          <CardHeader>
                              <CardTitle>Available Plans &amp; Upgrades</CardTitle>
                              <CardDescription>Select a plan to proceed with payment via Razorpay. Choose your billing period below. Plan changes are updated by Super Admin post-payment.</CardDescription>
                              <div className="flex items-center gap-4 mt-4 p-3 bg-muted/30 rounded-lg">
                                  <Label className="text-sm font-medium">Billing Period:</Label>
                                  <div className="flex items-center space-x-2">
                                      <input
                                          type="radio"
                                          id="monthly-billing"
                                          name="billing-period"
                                          value="monthly"
                                          checked={billingPeriod === 'monthly'}
                                          onChange={() => setBillingPeriod('monthly')}
                                          className="w-4 h-4"
                                      />
                                      <Label htmlFor="monthly-billing" className="text-sm cursor-pointer">Monthly</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <input
                                          type="radio"
                                          id="yearly-billing"
                                          name="billing-period"
                                          value="yearly"
                                          checked={billingPeriod === 'yearly'}
                                          onChange={() => setBillingPeriod('yearly')}
                                          className="w-4 h-4"
                                      />
                                      <Label htmlFor="yearly-billing" className="text-sm cursor-pointer">Yearly {billingPeriod === 'yearly' && '(Save up to 50%)'}</Label>
                                  </div>
                              </div>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {displayedPlans.map(plan => {
                                  if (plan.id === adminCurrentPlan?.id && plan.id !== 'free') return null;
                                  if (plan.id === 'free' && adminCurrentPlan?.id === 'free') return null;
                                  
                                  // Get payment links for all gateways
                                  const paymentLinks = getPaymentLinks(plan, billingPeriod, currencyForAdmin);
                                  const hasAnyPaymentLink = Object.values(paymentLinks).some(link => link && link.startsWith('http'));
                                  
                                  return (
                                      <Card key={`upgrade-${plan.id}`} className="p-4 flex flex-col justify-between">
                                          <div>
                                              <h4 className="font-semibold">{plan.name}</h4>
                                              <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                                              <p className="text-lg font-bold">
                                                  {displayPrice(plan, currencyForAdmin)} 
                                                  <span className="text-sm font-normal text-muted-foreground">
                                                      /mo {billingPeriod === 'yearly' ? `(billed annually${plan.yearlyDiscountPercentage > 0 ? `, ${plan.yearlyDiscountPercentage}% off` : ''})` : '(billed monthly)'}
                                                  </span>
                                              </p>
                                               <ul className="space-y-1 text-xs mt-2 text-muted-foreground">{plan.features?.filter(f => f.included).slice(0,3).map(feature => (<li key={feature.id} className={`flex items-center gap-1`}><CheckCircle className={`w-3 h-3 text-green-500`} />{feature.text}</li>))}</ul>
                                          </div>
                                          {hasAnyPaymentLink ? (
                                            <div className="mt-3 flex flex-col gap-2">
                                              <p className="text-xs font-medium text-center">Choose payment method:</p>
                                              <div className="grid grid-cols-2 gap-2">
                                                {paymentLinks.razorpay && paymentLinks.razorpay.startsWith('http') && (
                                                  <Button variant="outline" size="sm" asChild disabled={isViewingAsSuperAdmin}>
                                                    <a href={paymentLinks.razorpay} target="_blank" rel="noopener noreferrer">Razorpay</a>
                                                  </Button>
                                                )}
                                                {paymentLinks.paypal && paymentLinks.paypal.startsWith('http') && (
                                                  <Button variant="outline" size="sm" asChild disabled={isViewingAsSuperAdmin}>
                                                    <a href={paymentLinks.paypal} target="_blank" rel="noopener noreferrer">PayPal</a>
                                                  </Button>
                                                )}
                                                {paymentLinks.stripe && paymentLinks.stripe.startsWith('http') && (
                                                  <Button variant="outline" size="sm" asChild disabled={isViewingAsSuperAdmin}>
                                                    <a href={paymentLinks.stripe} target="_blank" rel="noopener noreferrer">Stripe</a>
                                                  </Button>
                                                )}
                                                {paymentLinks.payoneer && paymentLinks.payoneer.startsWith('http') && (
                                                  <Button variant="outline" size="sm" asChild disabled={isViewingAsSuperAdmin}>
                                                    <a href={paymentLinks.payoneer} target="_blank" rel="noopener noreferrer">Payoneer</a>
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <Button disabled className="mt-3 w-full">{adminCurrentPlan?.id === 'free' && plan.id !== 'free' ? 'Upgrade to ' : (plan.id !== 'free' ? 'Switch to ' : '')} {plan.name}</Button>
                                              <p className="text-xs text-muted-foreground mt-1 text-center">Payment link not configured.</p>
                                            </>
                                          )}
                                      </Card>
                                  );
                              })}
                          </CardContent>
                      </Card>
                  </TabsContent>

                  <TabsContent value="settings" className="md:col-start-2">
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><Building className="w-5 h-5" />General Tenant Settings</CardTitle><CardDescription>Configure your company's details and branding for the chatbot.</CardDescription></CardHeader>
                      <CardContent className="space-y-4">
                        <div><Label htmlFor="companyName">Company Name</Label><Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Company LLC" disabled={isViewingAsSuperAdmin} /></div>
                         <div>
                          <Label htmlFor="companyCountry" className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> Country</Label>
                          <Select value={companyCountry} onValueChange={setCompanyCountry} disabled={isViewingAsSuperAdmin}>
                              <SelectTrigger id="companyCountry"><SelectValue placeholder="Select your country" /></SelectTrigger>
                              <SelectContent className="max-h-[300px] overflow-y-auto">
                                {ALL_COUNTRIES.map(country => (
                                  <SelectItem key={country.code} value={country.name}>
                                    {country.name} ({country.currencySymbol})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">Select your primary country of operation. This determines the currency displayed in the subscription tab.</p>
                        </div>
                        <div>
                          <Label htmlFor="companyLogoUrl">Company Logo URL</Label>
                          <Input id="companyLogoUrl" value={companyLogoUrl} onChange={(e) => setCompanyLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" disabled={isViewingAsSuperAdmin} />
                          {companyLogoUrl && adminCurrentPlan?.allowsCustomBranding && <img data-ai-hint="company logo" src={companyLogoUrl || undefined} alt="Company Logo Preview" className="mt-2 h-24 w-auto max-w-full object-contain border rounded-md p-2 bg-white" />}
                          {!adminCurrentPlan?.allowsCustomBranding && <p className="text-xs text-muted-foreground mt-1">Your current plan ({adminCurrentPlan?.name}) does not allow custom branding.</p>}
                        </div>
                        <div>
                            <Label htmlFor="brandColor" className="flex items-center gap-2"><Palette className="w-4 h-4 text-muted-foreground" /> Brand Color</Label>
                             <div className="flex items-center gap-2">
                                <Input id="brandColor" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} placeholder="#A54599" disabled={isViewingAsSuperAdmin} />
                                <div className="h-8 w-8 rounded-md border" style={{ backgroundColor: brandColor }}></div>
                                {companyLogoUrl && (
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={async () => {
                                      if (!companyLogoUrl) return;
                                      
                                      toast({ title: "Extracting Color...", description: "Analyzing your logo to extract the dominant color..." });
                                      
                                      let extractedColor = null;
                                      
                                      // Try AI extraction first
                                      try {
                                        const aiResult = await extractColorFromImage({ imageUrl: companyLogoUrl });
                                        if (aiResult && aiResult.hexColor) {
                                          extractedColor = aiResult.hexColor;
                                          toast({ title: "AI Color Extracted!", description: `Brand color set to ${extractedColor}` });
                                        }
                                      } catch (error) {
                                        console.error("AI color extraction failed:", error);
                                      }
                                      
                                      // If AI failed, try client-side extraction
                                      if (!extractedColor) {
                                        try {
                                          extractedColor = await extractColorFromImageClient(companyLogoUrl);
                                          if (extractedColor) {
                                            toast({ title: "Color Extracted!", description: `Brand color set to ${extractedColor} (fallback method)` });
                                          }
                                        } catch (error) {
                                          console.error("Client-side color extraction failed:", error);
                                        }
                                      }
                                      
                                      if (extractedColor) {
                                        setBrandColor(extractedColor);
                                      } else {
                                        toast({ 
                                          title: "Extraction Failed", 
                                          description: "Could not extract color from the logo. Please set manually.", 
                                          variant: "destructive" 
                                        });
                                      }
                                    }}
                                    disabled={isViewingAsSuperAdmin || !companyLogoUrl}
                                  >
                                    Extract Color
                                  </Button>
                                )}
                             </div>
                            <p className="text-xs text-muted-foreground mt-1">Enter a hex color or update your logo URL and save. The AI will try to extract the dominant color automatically.</p>
                        </div>
                        <div><Label htmlFor="companyDetails">Company Details (for AI context)</Label><Textarea id="companyDetails" value={companyDetails} onChange={(e) => setCompanyDetails(e.target.value)} placeholder="Briefly describe your company, its main products/services." disabled={isViewingAsSuperAdmin} /></div>
                        
                        <Separator className="my-6" />
                        <h3 className="text-md font-medium flex items-center gap-2">
                          <Palette className="w-5 h-5" />
                          Launcher Button Designer
                        </h3>
                        <p className="text-sm text-muted-foreground -mt-2 mb-4">
                          Customize the appearance and behavior of your chat widget launcher button.
                        </p>

                        {/* Launcher Button Preview */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 rounded-lg border">
                          <div className="flex items-center justify-between mb-4">
                            <Label className="text-sm font-semibold">Live Preview</Label>
                            <div className="text-xs text-muted-foreground">
                              How your button will appear to visitors
                            </div>
                          </div>
                          <div className="flex items-center justify-center min-h-[100px] relative">
                            {/* Preview Button */}
                            <div
                              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                              style={{
                                backgroundColor: brandColor || '#7c3aed',
                                color: '#ffffff',
                                fontSize: launcherButtonSize === 'small' ? '14px' : launcherButtonSize === 'large' ? '18px' : '16px',
                                fontWeight: launcherButtonStyle === 'bold' ? '700' : launcherButtonStyle === 'light' ? '400' : '600'
                              }}
                            >
                              {launcherButtonIcon === 'mic' && (
                                <Mic className="w-4 h-4" />
                              )}
                              {launcherButtonIcon === 'chat' && (
                                <MessageCircle className="w-4 h-4" />
                              )}
                              {launcherButtonIcon === 'help' && (
                                <HelpCircle className="w-4 h-4" />
                              )}
                              {launcherButtonIcon === 'phone' && (
                                <Phone className="w-4 h-4" />
                              )}
                              {launcherButtonIcon === 'none' ? null : null}
                              {launcherButtonText && <span>{launcherButtonText}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Launcher Button Configuration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label htmlFor="launcherButtonText" className="flex items-center gap-2">
                              <Type className="w-4 h-4 text-muted-foreground" />
                              Button Text
                            </Label>
                            <Input
                              id="launcherButtonText"
                              value={launcherButtonText}
                              onChange={(e) => setLauncherButtonText(e.target.value)}
                              placeholder="Leave empty for icon only"
                              disabled={isViewingAsSuperAdmin}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Text displayed on the launcher button. Leave empty to show only the icon.
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="launcherButtonIcon" className="flex items-center gap-2">
                              <Smile className="w-4 h-4 text-muted-foreground" />
                              Button Icon
                            </Label>
                            <Select value={launcherButtonIcon || 'mic'} onValueChange={setLauncherButtonIcon} disabled={isViewingAsSuperAdmin}>
                              <SelectTrigger id="launcherButtonIcon">
                                <SelectValue placeholder="Select icon" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mic">🎤 Microphone</SelectItem>
                                <SelectItem value="chat">💬 Chat Bubble</SelectItem>
                                <SelectItem value="help">❓ Help Circle</SelectItem>
                                <SelectItem value="phone">📞 Phone</SelectItem>
                                <SelectItem value="none">🚫 No Icon</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="launcherButtonSize" className="flex items-center gap-2">
                              <Maximize className="w-4 h-4 text-muted-foreground" />
                              Button Size
                            </Label>
                            <Select value={launcherButtonSize || 'medium'} onValueChange={setLauncherButtonSize} disabled={isViewingAsSuperAdmin}>
                              <SelectTrigger id="launcherButtonSize">
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="launcherButtonStyle" className="flex items-center gap-2">
                              <Bold className="w-4 h-4 text-muted-foreground" />
                              Text Style
                            </Label>
                            <Select value={launcherButtonStyle || 'normal'} onValueChange={setLauncherButtonStyle} disabled={isViewingAsSuperAdmin}>
                              <SelectTrigger id="launcherButtonStyle">
                                <SelectValue placeholder="Select style" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Advanced Options */}
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Settings className="w-4 h-4 text-muted-foreground" />
                            <Label className="text-sm font-semibold">Advanced Options</Label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="launcherButtonAnimation" className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-muted-foreground" />
                                Animation
                              </Label>
                              <Select value={launcherButtonAnimation || 'pulse'} onValueChange={setLauncherButtonAnimation} disabled={isViewingAsSuperAdmin}>
                                <SelectTrigger id="launcherButtonAnimation">
                                  <SelectValue placeholder="Select animation" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No Animation</SelectItem>
                                  <SelectItem value="pulse">Gentle Pulse</SelectItem>
                                  <SelectItem value="bounce">Bounce</SelectItem>
                                  <SelectItem value="glow">Glow Effect</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="launcherButtonPosition" className="flex items-center gap-2">
                                <Move className="w-4 h-4 text-muted-foreground" />
                                Position
                              </Label>
                              <Select value={launcherButtonPosition || 'bottom-right'} onValueChange={setLauncherButtonPosition} disabled={isViewingAsSuperAdmin}>
                                <SelectTrigger id="launcherButtonPosition">
                                  <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                  <SelectItem value="top-right">Top Right</SelectItem>
                                  <SelectItem value="top-left">Top Left</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="mt-4">
                            <Label htmlFor="launcherAutoOpenDelay" className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              Auto-Open Delay
                            </Label>
                            <Select value={launcherAutoOpenDelay || 'none'} onValueChange={setLauncherAutoOpenDelay} disabled={isViewingAsSuperAdmin}>
                              <SelectTrigger id="launcherAutoOpenDelay">
                                <SelectValue placeholder="Select auto-open delay" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Never Auto-Open</SelectItem>
                                <SelectItem value="10">After 10 seconds</SelectItem>
                                <SelectItem value="20">After 20 seconds</SelectItem>
                                <SelectItem value="30">After 30 seconds</SelectItem>
                                <SelectItem value="60">After 1 minute</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Automatically open the chat widget after users spend time on the page.
                            </p>
                          </div>
                        </div>
                        
                        {/* Save Launcher Button Settings */}
                        <div className="mt-6 flex justify-center">
                          <Button 
                            onClick={() => handleAdminSaveChanges('general', 'launcher-button')} 
                            disabled={isSaving || isViewingAsSuperAdmin}
                            className="w-full max-w-md"
                          >
                            {isSaving ? 'Saving...' : 'Save Launcher Button Settings'}
                          </Button>
                        </div>
                        
                        <Separator className="my-6" />
                        <h3 className="text-md font-medium">Contact &amp; Billing Information</h3>
                        <p className="text-sm text-muted-foreground -mt-3">Provide contact details for communication and invoicing.</p>
                        <div className="space-y-4">
                           <div><Label htmlFor="contactEmail" className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> Contact Email</Label><Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="billing@yourcompany.com" disabled={isViewingAsSuperAdmin} /></div>
                           <div><Label htmlFor="contactPhone" className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> Contact Phone</Label><Input id="contactPhone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1-555-123-4567" disabled={isViewingAsSuperAdmin} /></div>
                           <div>
                              <Label htmlFor="contactWhatsapp" className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-muted-foreground" /> WhatsApp Number</Label>
                              <Input id="contactWhatsapp" type="tel" value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)} placeholder="e.g., 919876543210 or wa.me/919876543210" disabled={isViewingAsSuperAdmin} />
                              <p className="text-xs text-muted-foreground mt-1">Enter number with country code, or a full wa.me link.</p>
                           </div>
                           <div><Label htmlFor="billingAddress" className="flex items-center gap-2"><Home className="w-4 h-4 text-muted-foreground" /> Billing Address</Label><Textarea id="billingAddress" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="123 Main St, Suite 4B, Anytown, ST 12345, USA" disabled={isViewingAsSuperAdmin} /></div>
                        </div>
                        
                        <Separator className="my-6" />
                        <h3 className="text-md font-medium">Integrations</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="leadWebhookUrl" className="flex items-center gap-2"><Share2 className="w-4 h-4 text-muted-foreground" /> Lead Notification Webhook URL</Label>
                                <Input id="leadWebhookUrl" value={leadWebhookUrl} onChange={(e) => setLeadWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." disabled={isViewingAsSuperAdmin} />
                                <p className="text-xs text-muted-foreground mt-1">Send captured lead data to your CRM or Google Sheet. See Help tab for setup guides.</p>
                            </div>
                        </div>

                        <Separator className="my-6" />
                        <h3 className="text-md font-medium">Data Retention Settings</h3>
                        <p className="text-sm text-muted-foreground -mt-3">Automatically clean up old leads and conversations (Recent Interactions from Analytics). Your account, agents, and training data will NOT be affected.</p>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="retentionDays" className="flex items-center gap-2">
                                    <DatabaseZap className="w-4 h-4 text-muted-foreground" />
                                    Data Retention Period
                                </Label>
                                <Select value={retentionDays.toString()} onValueChange={(val) => setRetentionDays(Number(val))} disabled={isViewingAsSuperAdmin}>
                                    <SelectTrigger id="retentionDays">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30">30 days</SelectItem>
                                        <SelectItem value="60">60 days</SelectItem>
                                        <SelectItem value="90">90 days (Recommended)</SelectItem>
                                        <SelectItem value="180">180 days</SelectItem>
                                        <SelectItem value="365">1 year</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Leads and conversations older than this period will be automatically deleted. Default: 90 days.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCleanupPreview}
                                    disabled={isCleanupPreviewing || isViewingAsSuperAdmin}
                                    className="flex-1"
                                >
                                    {isCleanupPreviewing ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
                                    ) : (
                                        <><Search className="w-4 h-4 mr-2" /> Preview What Will Be Deleted</>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleCleanupExecute}
                                    disabled={isCleaningUp || !cleanupPreview || isViewingAsSuperAdmin}
                                    className="flex-1"
                                >
                                    {isCleaningUp ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
                                    ) : (
                                        <><Trash2 className="w-4 h-4 mr-2" /> Delete Old Data Now</>
                                    )}
                                </Button>
                            </div>

                            {cleanupPreview && (
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Preview Results</AlertTitle>
                                    <AlertDescription>
                                        <div className="mt-2 space-y-1 text-sm">
                                            <p><strong>{cleanupPreview.leadsToDelete}</strong> leads will be deleted</p>
                                            <p><strong>{cleanupPreview.conversationsToDelete}</strong> conversations will be deleted</p>
                                            <p><strong>{cleanupPreview.messagesToDelete}</strong> messages will be deleted</p>
                                            <p className="text-muted-foreground pt-2">Data older than {new Date(cleanupPreview.cutoffDate).toLocaleDateString()} will be permanently removed.</p>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    <strong>Note:</strong> Data retention only deletes old leads and conversations from your platform database (Recent Interactions in Analytics). Your tenant settings, agents, training data, and <strong>CRM data remain completely safe</strong>. Any data already sent to your CRM through webhooks is permanent and unaffected.
                                </AlertDescription>
                            </Alert>
                        </div>

                         <Button onClick={() => handleAdminSaveChanges('general')} disabled={isSaving || isViewingAsSuperAdmin}>{isSaving ? 'Saving...' : 'Save General Settings'}</Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="agents" className="md:col-start-2">
                      <Card>
                          <CardHeader>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                  <div className="space-y-1"><CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" />Agent Management</CardTitle><CardDescription>Customize your chatbot agents. Changes are saved locally and will be reflected on the chatbot page.</CardDescription></div>
                                  <Button className="w-full sm:w-auto touch-target" onClick={handleAddNewAgent} disabled={isViewingAsSuperAdmin || !adminCurrentPlan || (adminManagedTenant.agents?.length ?? 0) >= adminCurrentPlan.agentLimit}><PlusCircle className="w-4 h-4 mr-2" />Add Agent</Button>
                              </div>
                          </CardHeader>
                          <CardContent className="space-y-4 overflow-x-hidden">
                              {(adminManagedTenant.agents?.length ?? 0) > 0 ? (
                                  <Accordion type="single" collapsible className="w-full" defaultValue={(adminManagedTenant.agents?.[0]) ? `agent-${adminManagedTenant.agents[0].id}` : undefined}>
                                      {(adminManagedTenant.agents || []).map((agent) => (
                                          <AccordionItem key={agent.id} value={`agent-${agent.id}`} disabled={isViewingAsSuperAdmin}>
                                              <AccordionTrigger className="min-h-[48px]" disabled={isViewingAsSuperAdmin}>
                                                  <div className="flex items-center gap-3 flex-grow min-w-0"><Avatar className="h-8 w-8"><AvatarImage src={agent.avatarUrl || undefined} alt={agent.name} data-ai-hint={agent.avatarHint} className="object-contain" /><AvatarFallback>{getInitials(agent.name)}</AvatarFallback></Avatar><span className="font-semibold truncate">{agent.name}</span></div>
                                              </AccordionTrigger>
                                              <AccordionContent className="space-y-4 p-4 bg-muted/50 rounded-b-md">
                                                  <div><Label htmlFor={`agent-name-${agent.id}`}>Agent Name</Label><Input id={`agent-name-${agent.id}`} value={agent.name} onChange={(e) => handleAgentFieldChange(agent.id, 'name', e.target.value)} disabled={isViewingAsSuperAdmin} /></div>
                                                  <div>
                                                      <Label htmlFor={`agent-desc-${agent.id}`}>Agent Description (for AI)</Label>
                                                      <div className="flex flex-wrap gap-2 mt-2 mb-2">
                                                          <Button
                                                              type="button"
                                                              variant="outline"
                                                              size="sm"
                                                              onClick={() => {
                                                                  const template = `You are a professional Sales Agent representing ${companyName || 'our company'}. Your goal is to engage potential customers, understand their needs, and present solutions that match their requirements. You are persuasive, friendly, and knowledgeable about our products/services. Always aim to collect contact information (name, email, phone) for follow-up. Guide interested customers towards scheduling a demo or making a purchase.`;
                                                                  handleAgentFieldChange(agent.id, 'description', template);
                                                              }}
                                                              disabled={isViewingAsSuperAdmin}
                                                              className="text-xs"
                                                          >
                                                              <Bot className="w-3 h-3 mr-1" /> Sales Bot
                                                          </Button>
                                                          <Button
                                                              type="button"
                                                              variant="outline"
                                                              size="sm"
                                                              onClick={() => {
                                                                  const template = `You are a helpful Support Agent for ${companyName || 'our company'}. Your mission is to assist customers with their questions, troubleshoot issues, and provide timely solutions. You are patient, empathetic, and knowledgeable about our products/services. If you cannot resolve an issue immediately, collect the customer's contact information (name, email, phone) so our team can follow up. Always maintain a friendly and professional tone.`;
                                                                  handleAgentFieldChange(agent.id, 'description', template);
                                                              }}
                                                              disabled={isViewingAsSuperAdmin}
                                                              className="text-xs"
                                                          >
                                                              <HelpCircle className="w-3 h-3 mr-1" /> Support Bot
                                                          </Button>
                                                          <Button
                                                              type="button"
                                                              variant="outline"
                                                              size="sm"
                                                              onClick={() => {
                                                                  const template = `You are an FAQ Bot for ${companyName || 'our company'}. Your role is to answer frequently asked questions quickly and accurately. You have comprehensive knowledge about our products, services, pricing, policies, and procedures. Provide clear, concise answers based on the training data provided. If a question requires human assistance, politely collect the customer's contact information (name, email, phone) for follow-up by our team.`;
                                                                  handleAgentFieldChange(agent.id, 'description', template);
                                                              }}
                                                              disabled={isViewingAsSuperAdmin}
                                                              className="text-xs"
                                                          >
                                                              <MessageSquareQuote className="w-3 h-3 mr-1" /> FAQ Bot
                                                          </Button>
                                                      </div>
                                                      <Textarea id={`agent-desc-${agent.id}`} value={agent.description} onChange={(e) => handleAgentFieldChange(agent.id, 'description', e.target.value)} placeholder="What should this chatbot help with? For example: answer questions, help customers, or sell products. Pick a template above for easy setup!" rows={3} disabled={isViewingAsSuperAdmin} />
                                                      <p className="text-xs text-muted-foreground mt-1">💡 Click a template above to get started, then adjust the text as you like.</p>
                                                  </div>
                                                  <div>
                                                    <Label htmlFor={`agent-greeting-${agent.id}`}>Greeting Message</Label>
                                                    <Textarea id={`agent-greeting-${agent.id}`} value={agent.greeting || ''} onChange={(e) => handleAgentFieldChange(agent.id, 'greeting', e.target.value)} placeholder="Hello! How can I help you today?" rows={2} disabled={isViewingAsSuperAdmin} />
                                                    {agent.greeting && agent.greeting.trim() && (
                                                      <div className="mt-2 p-3 bg-muted/30 rounded-md border">
                                                        <p className="text-sm font-medium mb-2">Greeting Preview:</p>
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                          {agent.greeting}
                                                        </p>
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div>
                                                      <Label htmlFor={`agent-website-${agent.id}`}>Agent-Specific Website URL (Optional)</Label>
                                                      <Input className="h-11" id={`agent-website-${agent.id}`} value={agent.websiteUrl || ''} onChange={(e) => handleAgentFieldChange(agent.id, 'websiteUrl', e.target.value)} placeholder="e.g. https://sales.example.com" disabled={isViewingAsSuperAdmin} />
                                                      <p className="text-xs text-muted-foreground mt-1">If provided, this URL will be used for context instead of the general training URLs.</p>
                                                  </div>
                                                  <div>
                                                      <Label htmlFor={`agent-avatar-${agent.id}`}>Avatar URL</Label>
                                                      <div className="flex flex-col sm:flex-row items-stretch gap-2">
                                                          <Input className="flex-1 min-w-0 h-11" id={`agent-avatar-${agent.id}`} value={agent.avatarUrl || ''} onChange={(e) => handleAgentFieldChange(agent.id, 'avatarUrl', e.target.value)} placeholder="Enter URL or generate one" disabled={isViewingAsSuperAdmin} />
                                                          <Button className="w-full sm:w-auto h-11" variant="outline" onClick={() => handleGenerateAvatar(agent.id)} disabled={isViewingAsSuperAdmin} title="Generate random avatar">
                                                              <Sparkles className="h-4 w-4 mr-2" />
                                                              Generate
                                                          </Button>
                                                      </div>
                                                      <p className="text-xs text-muted-foreground mt-1">Provide a URL, or generate a unique bot avatar. Suggested size: 100x100px.</p>
                                                      {agent.avatarUrl && (<div className="mt-2 flex items-center gap-2"><span className="text-xs text-muted-foreground">Preview:</span><Avatar className="h-10 w-10"><AvatarImage src={agent.avatarUrl || undefined} alt="Avatar Preview" className="object-contain" /><AvatarFallback>{getInitials(agent.name)}</AvatarFallback></Avatar></div>)}
                                                  </div>
                                                  <div>
                                                      <Label htmlFor={`agent-voice-${agent.id}`} className="flex items-center gap-2"><Voicemail className="w-4 h-4 text-muted-foreground" /> Agent Voice</Label>
                                                      <div className="flex flex-col sm:flex-row items-stretch gap-2">
                                                        <Select value={(agent.voice?.startsWith('male-') ? 'male-us' : 'female-us')} onValueChange={(value) => handleAgentFieldChange(agent.id, 'voice', value)} disabled={isViewingAsSuperAdmin}>
                                                          <SelectTrigger id={`agent-voice-${agent.id}`} className="w-full sm:flex-grow h-11"><SelectValue placeholder="Select voice" /></SelectTrigger>
                                                          <SelectContent>
                                                              <SelectItem value="female-us">Female</SelectItem>
                                                              <SelectItem value="male-us">Male</SelectItem>
                                                          </SelectContent>
                                                        </Select>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-11 w-11 self-end sm:self-auto"
                                                            onClick={() => handlePlaySampleVoice((agent.voice?.startsWith('male-') ? 'male-us' : 'female-us'))}
                                                            disabled={isViewingAsSuperAdmin}
                                                            title="Play sample voice"
                                                        >
                                                            <Volume2 className="h-5 w-5" />
                                                        </Button>
                                                      </div>
                                                  </div>

                                                  {/* Professional Training Options */}
                                                  <div className="space-y-4 pt-4 border-t">
                                                      <div className="flex items-center justify-between mb-3">
                                                          <div className="flex items-center gap-2">
                                                              <Brain className="w-4 h-4 text-muted-foreground" />
                                                              <Label className="text-sm font-semibold">Professional Training Options</Label>
                                                          </div>
                                                          <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded">
                                                              ⚠️ Lead capture always takes priority
                                                          </div>
                                                      </div>

                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                          <div>
                                                              <Label htmlFor={`agent-tone-${agent.id}`}>Tone & Personality</Label>
                                                              <Select value={agent.tone || 'professional'} onValueChange={(value) => handleAgentFieldChange(agent.id, 'tone', value)} disabled={isViewingAsSuperAdmin}>
                                                                  <SelectTrigger id={`agent-tone-${agent.id}`}>
                                                                      <SelectValue placeholder="Select tone" />
                                                                  </SelectTrigger>
                                                                  <SelectContent>
                                                                      <SelectItem value="professional">Professional</SelectItem>
                                                                      <SelectItem value="friendly">Friendly</SelectItem>
                                                                      <SelectItem value="casual">Casual</SelectItem>
                                                                      <SelectItem value="formal">Formal</SelectItem>
                                                                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                                                                  </SelectContent>
                                                              </Select>
                                                          </div>

                                                          <div>
                                                              <Label htmlFor={`agent-style-${agent.id}`}>Response Style</Label>
                                                              <Select value={agent.responseStyle || 'conversational'} onValueChange={(value) => handleAgentFieldChange(agent.id, 'responseStyle', value)} disabled={isViewingAsSuperAdmin}>
                                                                  <SelectTrigger id={`agent-style-${agent.id}`}>
                                                                      <SelectValue placeholder="Select style" />
                                                                  </SelectTrigger>
                                                                  <SelectContent>
                                                                      <SelectItem value="concise">Concise & Brief</SelectItem>
                                                                      <SelectItem value="detailed">Detailed & Thorough</SelectItem>
                                                                      <SelectItem value="conversational">Conversational</SelectItem>
                                                                      <SelectItem value="technical">Technical & Precise</SelectItem>
                                                                  </SelectContent>
                                                              </Select>
                                                          </div>

                                                          <div>
                                                              <Label htmlFor={`agent-expertise-${agent.id}`}>Expertise Level</Label>
                                                              <Select value={agent.expertiseLevel || 'intermediate'} onValueChange={(value) => handleAgentFieldChange(agent.id, 'expertiseLevel', value)} disabled={isViewingAsSuperAdmin}>
                                                                  <SelectTrigger id={`agent-expertise-${agent.id}`}>
                                                                      <SelectValue placeholder="Select expertise" />
                                                                  </SelectTrigger>
                                                                  <SelectContent>
                                                                      <SelectItem value="beginner-friendly">Beginner-Friendly</SelectItem>
                                                                      <SelectItem value="intermediate">Intermediate</SelectItem>
                                                                      <SelectItem value="expert">Expert Level</SelectItem>
                                                                      <SelectItem value="technical">Technical Specialist</SelectItem>
                                                                  </SelectContent>
                                                              </Select>
                                                          </div>
                                                      </div>

                                                      <div>
                                                          <Label htmlFor={`agent-instructions-${agent.id}`}>Custom Instructions</Label>
                                                          <Textarea
                                                              id={`agent-instructions-${agent.id}`}
                                                              value={agent.customInstructions || ''}
                                                              onChange={(e) => handleAgentFieldChange(agent.id, 'customInstructions', e.target.value)}
                                                              placeholder="Additional behavioral guidelines, specific rules, or custom instructions for this agent... Remember to include lead capture instructions!"
                                                              rows={3}
                                                              disabled={isViewingAsSuperAdmin}
                                                          />
                                                          <p className="text-xs text-muted-foreground mt-1">
                                                              Provide specific instructions about how this agent should behave, respond, or handle certain situations.
                                                              <strong>Tip:</strong> Include instructions to collect contact information (name, email, phone) for lead capture.
                                                          </p>
                                                      </div>
                                                  </div>

                                                   <Button variant="destructive" size="sm" onClick={() => handleDeleteAgent(agent.id)} disabled={isViewingAsSuperAdmin}><Trash2 className="w-4 h-4 mr-2" /> Delete Agent</Button>
                                              </AccordionContent>
                                          </AccordionItem>
                                      ))}
                                  </Accordion>
                              ) : ( <p className="text-muted-foreground text-center py-4">No agents found for this tenant. Click "Add Agent" to create one.</p>)}
                              <div className="pt-4 border-t">
                                  <p className="text-sm text-muted-foreground mb-2">Agent count: {adminManagedTenant.agents?.length ?? 0} / {adminCurrentPlan ? (adminCurrentPlan.agentLimit >= 999 ? 'Unlimited' : adminCurrentPlan.agentLimit) : '...'}</p>
                                  <Button onClick={handleSaveAgentChanges} className="w-full" disabled={isSaving || isViewingAsSuperAdmin}>{isSaving ? 'Saving...' : 'Save Agent Changes'}</Button>
                              </div>
                          </CardContent>
                      </Card>
                  </TabsContent>

                  <TabsContent value="languages" className="md:col-start-2">
                      <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center gap-2"><Languages className="w-5 h-5" /> Language Settings</CardTitle>
                              <CardDescription>Select the languages your chatbot will support, based on your current plan.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                              {adminCurrentPlan && adminManagedTenant ? (() => {
                                  const freePlan = displayedPlans.find(p => p.id === 'free');
                                  if (!freePlan) return <p>Loading plan information...</p>;

                                  const trialStatus = checkTrialStatus(adminManagedTenant, adminCurrentPlan, defaultTrialDays);
                                  const effectivePlan = getEffectivePlanLimits(adminManagedTenant, adminCurrentPlan, freePlan, trialStatus);
                                  const effectivePlanName = trialStatus.shouldDowngrade || trialStatus.isExpired ? 'Free (Trial Expired)' : adminCurrentPlan.name;

                                  return (
                                      <>
                                          <Alert variant={trialStatus.isExpired ? "destructive" : "default"}>
                                              <Info className="h-4 w-4" />
                                              <AlertTitle>Plan Limit: {effectivePlanName}</AlertTitle>
                                              <AlertDescription>
                                                  You have selected <span className="font-bold">{supportedLanguages.length}</span> of <span className="font-bold">{effectivePlan.languageLimit >= 999 ? 'Unlimited' : effectivePlan.languageLimit}</span> available language(s).
                                                  {trialStatus.isExpired && <span className="block mt-1 text-sm">Your trial has expired and language selection is now limited to the Free plan.</span>}
                                              </AlertDescription>
                                          </Alert>
                                          <div className="space-y-2">
                                              {ALL_AVAILABLE_LANGUAGES.map((lang) => {
                                                  const isChecked = supportedLanguages.some(l => l.code === lang.code);
                                                  const isUnlimited = effectivePlan.languageLimit >= 999;
                                                  const isDisabled = isViewingAsSuperAdmin || (lang.code === 'en-US') || (!isChecked && !isUnlimited && supportedLanguages.length >= effectivePlan.languageLimit);
                                              return (
                                                  <div key={lang.code} className="flex items-center space-x-2">
                                                      <Checkbox
                                                          id={`lang-${lang.code}`}
                                                          checked={isChecked}
                                                          disabled={isDisabled}
                                                          onCheckedChange={() => handleLanguageToggle(lang.code, lang.name)}
                                                          aria-label={`Select ${lang.name}`}
                                                      />
                                                      <Label htmlFor={`lang-${lang.code}`} className={isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}>
                                                          {lang.name}
                                                      </Label>
                                                  </div>
                                              );
                                              })}
                                          </div>
                                      </>
                                  );
                              })() : (
                                  <p>Loading plan information...</p>
                              )}
                          </CardContent>
                          <CardFooter>
                              <Button onClick={handleSaveLanguageChanges} disabled={isSaving || isViewingAsSuperAdmin} className="w-full">
                                  {isSaving ? 'Saving...' : 'Save Language Settings'}
                              </Button>
                          </CardFooter>
                      </Card>
                  </TabsContent>

                  <TabsContent value="training" className="md:col-start-2">
                      <Card>
                          <CardHeader>
                               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                  <div><CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" />Agent-Specific Training</CardTitle><CardDescription>Configure training data and context for each individual agent.</CardDescription></div>
                              </div>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              {/* Agent Selection */}
                              <div className="space-y-3">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                      <Label className="text-sm font-semibold">Select Agent to Train</Label>
                                      <div className="text-xs text-muted-foreground">
                                          {(adminManagedTenant?.agents || []).length} agent(s) available
                                      </div>
                                  </div>
                                  <Select value={activeAgentContextAgentId || ''} onValueChange={setActiveAgentContextAgentId} disabled={isViewingAsSuperAdmin}>
                                      <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Choose an agent to configure training data" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {(adminManagedTenant?.agents || []).map(agent => (
                                              <SelectItem key={agent.id} value={agent.id}>
                                                  <div className="flex items-center gap-2">
                                                      <Avatar className="h-6 w-6">
                                                          <AvatarImage src={agent.avatarUrl || undefined} alt={agent.name} />
                                                          <AvatarFallback className="text-xs">{getInitials(agent.name)}</AvatarFallback>
                                                      </Avatar>
                                                      <div className="flex flex-col">
                                                          <span>{agent.name}</span>
                                                          <span className="text-xs text-muted-foreground">
                                                              {(() => {
                                                                  const validContexts = (agent.trainingContexts || []).filter((ctx: any) => {
                                                                      const isNewFormat = ctx.id && ctx.sourceInfo;
                                                                      if (isNewFormat) return true;
                                                                      const hasWebsite = ctx.websiteUrl && ctx.websiteUrl.trim() !== '';
                                                                      const hasDoc = ctx.docInfo && ctx.docInfo.trim() !== '';
                                                                      return hasWebsite || hasDoc;
                                                                  });
                                                                  return validContexts.length;
                                                              })()} context(s)
                                                          </span>
                                                      </div>
                                                  </div>
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                                  <div className="text-xs text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                      <div className="flex items-start gap-2">
                                          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                          <div>
                                              <p className="font-medium text-blue-900 dark:text-blue-100">How Agent Training Works:</p>
                                              <ul className="mt-1 space-y-1 text-blue-800 dark:text-blue-200">
                                                  <li>• Agent-specific training data takes highest priority</li>
                                                  <li>• Global training data is used as fallback</li>
                                                  <li>• Each agent can have unique knowledge sources</li>
                                              </ul>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* Training Content for Selected Agent */}
                              {activeAgentContextAgentId && (() => {
                                  const selectedAgent = (adminManagedTenant?.agents || []).find(a => a.id === activeAgentContextAgentId);
                                  const agentContexts = selectedAgent?.trainingContexts || [];

                                  return (
                                      <div className="space-y-4">
                                          <div className="flex flex-col gap-3">
                                              <div>
                                                  <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 flex-wrap">
                                                      <Avatar className="h-8 w-8">
                                                          <AvatarImage src={selectedAgent?.avatarUrl || undefined} alt={selectedAgent?.name} />
                                                          <AvatarFallback className="text-xs">{getInitials(selectedAgent?.name || '')}</AvatarFallback>
                                                      </Avatar>
                                                      <span className="break-words">Training Data for {selectedAgent?.name}</span>
                                                  </h3>
                                                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Configure specific knowledge sources for this agent</p>
                                              </div>
                                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                  <Button
                                                      onClick={() => handleAddWebsiteContext(activeAgentContextAgentId)}
                                                      disabled={isViewingAsSuperAdmin}
                                                      size="sm"
                                                      variant="outline"
                                                      className="min-h-[48px] w-full"
                                                  >
                                                      <Globe className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Add Website</span><span className="sm:hidden text-xs ml-1">Website</span>
                                                  </Button>
                                                  <Button
                                                      onClick={() => handleAddFileContext(activeAgentContextAgentId)}
                                                      disabled={isViewingAsSuperAdmin}
                                                      size="sm"
                                                      className="min-h-[48px] w-full"
                                                  >
                                                      <FileUp className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Upload File</span><span className="sm:hidden text-xs ml-1">File</span>
                                                  </Button>
                                                  <Button
                                                      onClick={() => {
                                                          setCrawlAgentId(activeAgentContextAgentId);
                                                          setCrawlUrl('');
                                                          setCrawlMaxPages(10);
                                                          setCrawlResults([]);
                                                          setCrawlProgress({ current: 0, total: 0, status: '' });
                                                          setCrawlModalOpen(true);
                                                      }}
                                                      disabled={isViewingAsSuperAdmin}
                                                      size="sm"
                                                      variant="secondary"
                                                      className="min-h-[48px] w-full sm:col-span-1 col-span-2"
                                                  >
                                                      <Download className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Crawl Website</span><span className="sm:hidden text-xs ml-1">Crawl</span>
                                                  </Button>
                                              </div>
                                          </div>

                                          {agentContexts.length > 0 ? (
                                              <div className="space-y-4">
                                                  {/* Bulk selection controls */}
                                                  {(() => {
                                                      const selectableContexts = agentContexts.filter((ctx: any) => ctx.id);
                                                      const selectableCount = selectableContexts.length;
                                                      const selectedCount = selectedTrainingIds.size;
                                                      const allSelected = selectableCount > 0 && selectedCount === selectableCount;
                                                      
                                                      if (selectableCount > 0) {
                                                          return (
                                                              <div className="flex items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg border">
                                                                  <div className="flex items-center gap-3">
                                                                      <Button
                                                                          variant="outline"
                                                                          size="sm"
                                                                          onClick={() => allSelected ? handleDeselectAllTraining() : handleSelectAllTraining(activeAgentContextAgentId!)}
                                                                          disabled={isViewingAsSuperAdmin}
                                                                          className="h-8"
                                                                      >
                                                                          {allSelected ? 'Deselect All' : 'Select All'}
                                                                      </Button>
                                                                      {selectedCount > 0 && (
                                                                          <span className="text-sm text-muted-foreground">
                                                                              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
                                                                          </span>
                                                                      )}
                                                                  </div>
                                                                  {selectedCount > 0 && (
                                                                      <Button
                                                                          variant="destructive"
                                                                          size="sm"
                                                                          onClick={() => handleBulkDeleteTraining(activeAgentContextAgentId!)}
                                                                          disabled={isViewingAsSuperAdmin || isBulkDeleting}
                                                                          className="h-8"
                                                                      >
                                                                          {isBulkDeleting ? (
                                                                              <>
                                                                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                                  Deleting...
                                                                              </>
                                                                          ) : (
                                                                              <>
                                                                                  <Trash2 className="w-4 h-4 mr-2" />
                                                                                  Delete Selected ({selectedCount})
                                                                              </>
                                                                          )}
                                                                      </Button>
                                                                  )}
                                                              </div>
                                                          );
                                                      }
                                                      return null;
                                                  })()}
                                                  
                                                  {agentContexts.map((context, index) => {
                                                      // Handle both old format (websiteUrl/docInfo) and new format (id/sourceInfo)
                                                      const isNewFormat = context.id && context.sourceInfo;
                                                      
                                                      // Determine type from sourceInfo prefix
                                                      const isWebsiteType = isNewFormat 
                                                        ? (context.sourceInfo?.startsWith('Website:') || false)
                                                        : (context.websiteUrl && !context.docInfo);
                                                      const isFileType = isNewFormat 
                                                        ? (context.sourceInfo?.includes('Document:') || context.sourceInfo?.includes('Text File:') || false)
                                                        : (context.docInfo && !context.websiteUrl);
                                                      
                                                      // Skip ONLY truly empty contexts (both websiteUrl AND docInfo are empty)
                                                      if (!isNewFormat && 
                                                          (!context.websiteUrl || context.websiteUrl.trim() === '') && 
                                                          (!context.docInfo || context.docInfo.trim() === '')) {
                                                        return null;
                                                      }
                                                      
                                                      return (
                                                          <Card key={context.id || index} className="p-4 bg-muted/50 relative">
                                                              <div className="space-y-3">
                                                                  {isNewFormat ? (
                                                                      // New enhanced format - show processed training data
                                                                      <div className="space-y-3">
                                                                          <div className="flex items-start justify-between gap-2 pr-8">
                                                                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                                                                  {/* Checkbox for selection */}
                                                                                  {context.id && (
                                                                                      <Checkbox
                                                                                          checked={selectedTrainingIds.has(context.id)}
                                                                                          onCheckedChange={() => handleToggleTrainingSelection(context.id!)}
                                                                                          disabled={isViewingAsSuperAdmin || isBulkDeleting}
                                                                                          className="mt-1"
                                                                                      />
                                                                                  )}
                                                                                  {isWebsiteType ? (
                                                                                      <Globe className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                                                  ) : (
                                                                                      <FileIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                                                                  )}
                                                                                  <div className="flex-1 min-w-0">
                                                                                      <h4 className="font-medium text-sm break-words">{context.sourceInfo}</h4>
                                                                                      <p className="text-xs text-muted-foreground">
                                                                                          {context.wordCount?.toLocaleString()} words • {context.characterCount?.toLocaleString()} characters
                                                                                      </p>
                                                                                  </div>
                                                                              </div>
                                                                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                                                                  Processed
                                                                              </Badge>
                                                                          </div>
                                                                          
                                                                          {context.extractedText && (
                                                                              <div className="bg-muted/30 rounded p-3">
                                                                                  <p className="text-xs font-medium mb-2">Content Preview:</p>
                                                                                  <p className="text-xs text-muted-foreground leading-relaxed break-words">
                                                                                      {context.extractedText.substring(0, 200)}
                                                                                      {context.extractedText.length > 200 && '...'}
                                                                                  </p>
                                                                              </div>
                                                                          )}
                                                                          
                                                                          <div className="flex items-center justify-between">
                                                                              <div className="text-xs text-muted-foreground">
                                                                                  Added: {new Date(context.createdAt!).toLocaleDateString()}
                                                                              </div>
                                                                              <Button
                                                                                  variant="outline"
                                                                                  size="sm"
                                                                                  onClick={() => {
                                                                                      const newContent = prompt('Edit content:', context.extractedText || context.uploadedDocContent);
                                                                                      if (newContent !== null && newContent.trim()) {
                                                                                          handleUpdateTrainingContext(activeAgentContextAgentId, context.id!, context.sourceInfo!, newContent.trim());
                                                                                      }
                                                                                  }}
                                                                                  disabled={isViewingAsSuperAdmin || isSaving}
                                                                                  className="h-7 text-xs"
                                                                              >
                                                                                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                                                                              </Button>
                                                                          </div>
                                                                      </div>
                                                                  ) : (
                                                                      // Legacy format - show what exists
                                                                      <div className="space-y-3">
                                                                          {context.websiteUrl && (
                                                                              <div>
                                                                                  <div className="flex items-center gap-2 mb-2">
                                                                                      <Globe className="w-4 h-4 text-green-500" />
                                                                                      <Label>Website (Legacy Format)</Label>
                                                                                  </div>
                                                                                  <div className="flex gap-2">
                                                                                      <Input
                                                                                          value={context.websiteUrl}
                                                                                          onChange={(e) => handleAgentTrainingContextChange(activeAgentContextAgentId, index, 'websiteUrl', e.target.value)}
                                                                                          disabled={isViewingAsSuperAdmin}
                                                                                          className="flex-1"
                                                                                      />
                                                                                  </div>
                                                                              </div>
                                                                          )}
                                                                          {context.docInfo && (
                                                                              <div>
                                                                                  <div className="flex items-center gap-2 mb-2">
                                                                                      <FileIcon className="w-4 h-4 text-blue-500" />
                                                                                      <Label>Document (Legacy Format)</Label>
                                                                                  </div>
                                                                                  <div className="bg-muted/30 rounded p-3">
                                                                                      <p className="text-sm font-medium">{context.docInfo}</p>
                                                                                      {(() => {
                                                                                          const content = context.uploadedDocContent || context.extractedText || '';
                                                                                          const trimmedContent = content?.trim();
                                                                                          if (trimmedContent) {
                                                                                              return (
                                                                                                  <div>
                                                                                                      <p className="text-xs text-muted-foreground mt-2">
                                                                                                          {trimmedContent.substring(0, 150)}
                                                                                                          {trimmedContent.length > 150 && '...'}
                                                                                                      </p>
                                                                                                      <p className="text-xs text-muted-foreground mt-1">
                                                                                                          ({trimmedContent.split(/\s+/).filter(Boolean).length} words)
                                                                                                      </p>
                                                                                                  </div>
                                                                                              );
                                                                                          }
                                                                                          return (
                                                                                              <div className="mt-2">
                                                                                                  <p className="text-xs text-amber-600">
                                                                                                      ⚠️ No text content stored
                                                                                                  </p>
                                                                                                  <p className="text-xs text-muted-foreground mt-1">
                                                                                                      This context has metadata only. To add content, delete this context and re-upload the file or add a website URL.
                                                                                                  </p>
                                                                                              </div>
                                                                                          );
                                                                                      })()}
                                                                                  </div>
                                                                              </div>
                                                                          )}
                                                                          {!context.websiteUrl && !context.docInfo && (
                                                                              <div>
                                                                                  <div className="flex items-center gap-2 mb-2">
                                                                                      <Globe className="w-4 h-4 text-muted-foreground" />
                                                                                      <Label>Website URL for Processing</Label>
                                                                                  </div>
                                                                                  <div className="flex gap-2">
                                                                                      <Input
                                                                                          value={context.websiteUrl || ''}
                                                                                          onChange={(e) => handleAgentTrainingContextChange(activeAgentContextAgentId, index, 'websiteUrl', e.target.value)}
                                                                                          placeholder="https://example.com/knowledge-source"
                                                                                          disabled={isViewingAsSuperAdmin}
                                                                                          className="flex-1"
                                                                                      />
                                                                                      <Button
                                                                                          onClick={() => handleAddWebsiteTraining(activeAgentContextAgentId, context.websiteUrl || '')}
                                                                                          disabled={!context.websiteUrl?.trim() || isViewingAsSuperAdmin || isSaving}
                                                                                          size="sm"
                                                                                      >
                                                                                          {isSaving ? 'Processing...' : 'Process'}
                                                                                      </Button>
                                                                                  </div>
                                                                              </div>
                                                                          )}
                                                                          <Badge variant="outline" className="text-xs">
                                                                              Legacy Format - Consider migrating to new format
                                                                          </Badge>
                                                                      </div>
                                                                  )}
                                                              </div>
                                                              
                                                              <Button
                                                                  variant="outline"
                                                                  size="icon"
                                                                  className="absolute top-2 right-2 h-9 w-9 sm:h-8 sm:w-8 border-destructive/20 bg-background/95 text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-sm backdrop-blur-sm"
                                                                  onClick={() => isNewFormat 
                                                                      ? handleDeleteTrainingContext(activeAgentContextAgentId, context.id!)
                                                                      : handleRemoveAgentTrainingContext(activeAgentContextAgentId, index)
                                                                  }
                                                                  disabled={isViewingAsSuperAdmin || isSaving}
                                                                  title="Delete training data"
                                                              >
                                                                  <Trash2 className="w-4 h-4" />
                                                              </Button>
                                                          </Card>
                                                      );
                                                  }).filter(Boolean)}
                                              </div>
                                          ) : (
                                              <div className="text-center text-muted-foreground py-8 border-dashed border-2 rounded-lg">
                                                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                  <p className="font-medium">No training data for {selectedAgent?.name}</p>
                                                  <p className="text-sm">Upload files or add websites to train this agent with specific knowledge.</p>
                                              </div>
                                          )}

                                          <div className="pt-4 border-t mt-6">
                                              <div className="flex items-center justify-between mb-3">
                                                  <p className="text-sm text-muted-foreground">
                                                      Contexts for {selectedAgent?.name}: {(() => {
                                                          const validContexts = agentContexts.filter((ctx: any) => {
                                                              const isNewFormat = ctx.id && ctx.sourceInfo;
                                                              if (isNewFormat) return true;
                                                              const hasWebsite = ctx.websiteUrl && ctx.websiteUrl.trim() !== '';
                                                              const hasDoc = ctx.docInfo && ctx.docInfo.trim() !== '';
                                                              return hasWebsite || hasDoc;
                                                          });
                                                          return validContexts.length;
                                                      })()} / {adminCurrentPlan ? (adminCurrentPlan.contextLimit >= 999 ? 'Unlimited' : adminCurrentPlan.contextLimit) : '...'}
                                                  </p>
                                                  <div className="text-xs text-muted-foreground">
                                                      Agent-specific training takes priority over global training
                                                  </div>
                                              </div>
                                              <Button
                                                  onClick={handleSaveAgentChanges}
                                                  disabled={isSaving || isViewingAsSuperAdmin}
                                                  className="w-full"
                                              >
                                                  {isSaving ? 'Saving...' : `Update Training Data for ${selectedAgent?.name}`}
                                              </Button>
                                          </div>
                                      </div>
                                  );
                              })()}


                          </CardContent>
                      </Card>
                  </TabsContent>

                  <TabsContent value="analytics" className="md:col-start-2">
                      <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                              <BarChart3 className="w-5 h-5 flex-shrink-0" />
                              <span className="break-words">Conversation Insights &amp; Lead Data</span>
                            </CardTitle>
                            <CardDescription className="text-sm leading-relaxed">
                              View conversation summaries and access details for follow-up and integration.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4 sm:space-y-6">
                              {false ? (
                                  <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Feature Not Available</AlertTitle><AlertDescription>Advanced analytics and reporting are not included in your current <strong>{adminCurrentPlan?.name}</strong> plan. Upgrade to a Standard or Premium plan to access these features.</AlertDescription></Alert>
                              ) : (
                                  <>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                                          <Card modern className="min-h-[120px]">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                              <CardTitle className="text-sm font-medium leading-tight">Total Conversations</CardTitle>
                                              <MessageSquareQuote className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            </CardHeader>
                                            <CardContent>
                                              <div className="text-2xl font-bold">{analyticsLoading ? '...' : totalConversations.toLocaleString()}</div>
                                              <p className="text-xs text-muted-foreground">All chats this month</p>
                                            </CardContent>
                                          </Card>
                                          <Card modern className="min-h-[120px]">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                              <CardTitle className="text-sm font-medium leading-tight">Anonymous Chats</CardTitle>
                                              <MessageSquareQuote className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            </CardHeader>
                                            <CardContent>
                                              <div className="text-2xl font-bold">{analyticsLoading ? '...' : totalAnonymousConversations.toLocaleString()}</div>
                                              <p className="text-xs text-muted-foreground">No contact info provided</p>
                                            </CardContent>
                                          </Card>
                                          <Card modern className="min-h-[120px]">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                              <CardTitle className="text-sm font-medium leading-tight">Leads Captured</CardTitle>
                                              <UsersRound className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            </CardHeader>
                                            <CardContent>
                                              <div className="text-2xl font-bold">{analyticsLoading ? '...' : totalLeadsThisMonth.toLocaleString()}</div>
                                              <p className="text-xs text-muted-foreground">With contact info</p>
                                            </CardContent>
                                          </Card>
                                          <Card modern className="min-h-[120px]">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                              <CardTitle className="text-sm font-medium leading-tight">Tokens Used</CardTitle>
                                              <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            </CardHeader>
                                            <CardContent>
                                              <div className="text-2xl font-bold">{analyticsLoading ? '...' : (totalTokensUsed || 0).toLocaleString()}</div>
                                              <p className="text-xs text-muted-foreground">Total tokens this month</p>
                                            </CardContent>
                                          </Card>
                                      </div>
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                        <Card modern className="w-full">
                                          <CardHeader>
                                            <CardTitle className="text-base sm:text-lg">Conversations Over Last 7 Days</CardTitle>
                                          </CardHeader>
                                          <CardContent className="pl-1 sm:pl-2">
                                            <ChartContainer config={analyticsChartConfig} className="h-[200px] sm:h-[250px] w-full">
                                              <BarChart accessibilityLayer data={analyticsData}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                  dataKey="date"
                                                  tickLine={false}
                                                  tickMargin={10}
                                                  axisLine={false}
                                                  fontSize={12}
                                                  tick={{ fontSize: 12 }}
                                                />
                                                <YAxis fontSize={12} tick={{ fontSize: 12 }} />
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                                <Bar dataKey="conversations" fill="var(--color-conversations)" radius={4} />
                                              </BarChart>
                                            </ChartContainer>
                                          </CardContent>
                                        </Card>
                                        <Card modern className="w-full">
                                          <CardHeader>
                                            <CardTitle className="text-base sm:text-lg">Leads Captured Per Month</CardTitle>
                                          </CardHeader>
                                          <CardContent className="pl-1 sm:pl-2">
                                            <ChartContainer config={analyticsChartConfig} className="h-[200px] sm:h-[250px] w-full">
                                              <BarChart accessibilityLayer data={(() => {
                                                const map: Record<string, number> = {};
                                                // capturedLeads is now already filtered by tenant via API
                                                const list = capturedLeads || [];
                                                for (const l of list) {
                                                  const key = l.periodMonth || (l.date ? `${new Date(l.date).getUTCFullYear()}-${String(new Date(l.date).getUTCMonth() + 1).padStart(2,'0')}` : 'unknown');
                                                  map[key] = (map[key] || 0) + 1;
                                                }
                                                return Object.keys(map).sort().map(k => ({ date: k, conversations: map[k] }));
                                              })()}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                  dataKey="date"
                                                  tickLine={false}
                                                  tickMargin={10}
                                                  axisLine={false}
                                                  fontSize={12}
                                                  tick={{ fontSize: 12 }}
                                                />
                                                <YAxis fontSize={12} tick={{ fontSize: 12 }} />
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                                <Bar dataKey="conversations" fill="var(--color-conversations)" radius={4} />
                                              </BarChart>
                                            </ChartContainer>
                                          </CardContent>
                                        </Card>
                                      </div>
                                      <Card>
                                          <CardHeader>
                                              <div className="flex justify-between items-start mb-2">
                                                <div>
                                                  <CardTitle>Recent Interactions ({filteredAndSortedLeads.length})</CardTitle>
                                                  <CardDescription>Qualified leads with contact information (name, email, or phone). Search, filter, and view complete chat logs.</CardDescription>
                                                </div>
                                                <Button 
                                                  onClick={exportLeadsToCSV} 
                                                  variant="outline" 
                                                  size="sm"
                                                  className="flex items-center gap-2"
                                                  disabled={!filteredAndSortedLeads || filteredAndSortedLeads.length === 0}
                                                >
                                                  <Download className="w-4 h-4" />
                                                  Export CSV
                                                </Button>
                                              </div>
                                              <div className="flex flex-col gap-3 pt-4 border-t">
                                                <div className="relative w-full">
                                                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                  <Input
                                                    placeholder="Search leads by info, summary..."
                                                    value={leadSearchTerm}
                                                    onChange={(e) => {setLeadSearchTerm(e.target.value); setLeadCurrentPage(1);}}
                                                    className="pl-8 h-10"
                                                  />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <Select value={leadWebsiteFilter} onValueChange={(value) => {setLeadWebsiteFilter(value); setLeadCurrentPage(1);}}>
                                                      <SelectTrigger className="h-10">
                                                        <SelectValue placeholder="Filter by website" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                          {uniqueLeadWebsites.map(site => (
                                                              <SelectItem key={site} value={site}>{site === 'all' ? 'All Websites' : site}</SelectItem>
                                                          ))}
                                                      </SelectContent>
                                                    </Select>
                                                    <Select value={leadAgentFilter} onValueChange={(value) => {setLeadAgentFilter(value); setLeadCurrentPage(1);}}>
                                                        <SelectTrigger className="h-10">
                                                          <SelectValue placeholder="Filter by agent" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {uniqueLeadAgents.map(agent => (
                                                                <SelectItem key={agent} value={agent}>{agent === 'all' ? 'All Agents' : agent}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Select value={leadDateFilter} onValueChange={(value) => {setLeadDateFilter(value); setLeadCurrentPage(1);}}>
                                                        <SelectTrigger className="h-10">
                                                          <SelectValue placeholder="Filter by date" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Time</SelectItem>
                                                            <SelectItem value="7days">Last 7 Days</SelectItem>
                                                            <SelectItem value="30days">Last 30 Days</SelectItem>
                                                            <SelectItem value="90days">Last 90 Days</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <Select value={leadContactTypeFilter} onValueChange={(value) => {setLeadContactTypeFilter(value); setLeadCurrentPage(1);}}>
                                                      <SelectTrigger className="h-10">
                                                        <SelectValue placeholder="Filter by contact type" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                          <SelectItem value="all">All Contact Types</SelectItem>
                                                          <SelectItem value="with_contact">With Contact Info</SelectItem>
                                                          <SelectItem value="anonymous">Anonymous Only</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                    <Select value={leadStatusFilter} onValueChange={(value) => {setLeadStatusFilter(value); setLeadCurrentPage(1);}}>
                                                        <SelectTrigger className="h-10">
                                                          <SelectValue placeholder="Filter by status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {uniqueLeadStatuses.map(status => (
                                                                <SelectItem key={status} value={status}>{status === 'all' ? 'All Statuses' : status}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Select value={leadMonthFilter} onValueChange={(value) => {setLeadMonthFilter(value); setLeadCurrentPage(1);}}>
                                                        <SelectTrigger className="h-10">
                                                          <SelectValue placeholder="Filter by month" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {uniqueLeadMonths.map(month => (
                                                                <SelectItem key={month} value={month}>{month === 'all' ? 'All Months' : month}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                              </div>
                                              {/* Filter Results Summary */}
                                              <div className="pt-3 border-t">
                                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                  <span>Showing {filteredAndSortedLeads.length} lead(s)</span>
                                                  <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1">
                                                      <UsersRound className="w-3 h-3" />
                                                      {filteredAndSortedLeads.filter(l => {
                                                        const hasDirectContact = l.customerName || l.customerEmail || l.customerPhone;
                                                        const hasParsedEmail = l?.customerInfo?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
                                                        const hasParsedPhone = l?.customerInfo?.replace(/[^0-9+]/g, '').match(/\+?[0-9]{6,}/);
                                                        const hasParsedName = l?.customerInfo?.split(/[,@]|phone|tel|mobile/i)[0]?.trim();
                                                        const hasValidName = hasParsedName && hasParsedName.length > 0 && hasParsedName.toLowerCase() !== 'anonymous person' && !hasParsedName.toLowerCase().includes('no contact');
                                                        return hasDirectContact || hasParsedEmail || hasParsedPhone || hasValidName;
                                                      }).length} with contact
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                      <MessageSquareQuote className="w-3 h-3" />
                                                      {filteredAndSortedLeads.filter(l => {
                                                        const hasDirectContact = l.customerName || l.customerEmail || l.customerPhone;
                                                        const hasParsedEmail = l?.customerInfo?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
                                                        const hasParsedPhone = l?.customerInfo?.replace(/[^0-9+]/g, '').match(/\+?[0-9]{6,}/);
                                                        const hasParsedName = l?.customerInfo?.split(/[,@]|phone|tel|mobile/i)[0]?.trim();
                                                        const hasValidName = hasParsedName && hasParsedName.length > 0 && hasParsedName.toLowerCase() !== 'anonymous person' && !hasParsedName.toLowerCase().includes('no contact');
                                                        return l.isAnonymous || (!hasDirectContact && !hasParsedEmail && !hasParsedPhone && !hasValidName);
                                                      }).length} anonymous
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                          </CardHeader>
                                          <CardContent className="space-y-2">
                                              {paginatedLeads.length > 0 ? (
                                                  <div className="space-y-2">
                                                    {paginatedLeads.map(lead => (
                                                      <LeadItem key={lead.id} lead={lead} />
                                                    ))}
                                                  </div>
                                              ) : (
                                                  <div className="text-center text-muted-foreground py-4 border rounded-md">
                                                      <p>No leads match your current filters.</p>
                                                  </div>
                                              )}
                                              {totalLeadPages > 1 && (
                                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setLeadCurrentPage(p => p - 1)}
                                                    disabled={leadCurrentPage === 1}
                                                    className="min-h-[44px] w-full sm:w-auto"
                                                  >
                                                    Previous
                                                  </Button>
                                                  <span className="text-sm text-muted-foreground order-first sm:order-none">
                                                    Page {leadCurrentPage} of {totalLeadPages}
                                                  </span>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setLeadCurrentPage(p => p + 1)}
                                                    disabled={leadCurrentPage === totalLeadPages}
                                                    className="min-h-[44px] w-full sm:w-auto"
                                                  >
                                                    Next
                                                  </Button>
                                                </div>
                                              )}
                                          </CardContent>
                                      </Card>
                                      <Card>
                                          <CardHeader>
                                              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                                  <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                                  <span className="break-words">Knowledge Base Opportunities</span>
                                              </CardTitle>
                                              <CardDescription className="text-sm leading-relaxed">
                                                  This list shows questions the AI could not answer. Use these insights to update your website content or training documents, making your agent smarter.
                                              </CardDescription>
                                          </CardHeader>
                                          <CardContent>
                                              {filteredKnowledgeGaps.length > 0 ? (
                                                  <ScrollArea className="h-[200px] sm:h-[240px] w-full pr-2 sm:pr-4">
                                                      <ul className="space-y-3">
                                                          {filteredKnowledgeGaps.map((gap) => {
                                                            const category = gap.category || 'missing_knowledge';
                                                            const categoryConfig = {
                                                              missing_knowledge: { 
                                                                label: 'Missing Knowledge', 
                                                                color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
                                                                icon: BookOpen,
                                                                hint: 'Add this to your knowledge base'
                                                              },
                                                              out_of_scope: { 
                                                                label: 'Out of Scope', 
                                                                color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
                                                                icon: AlertTriangle,
                                                                hint: 'Outside agent\'s purpose'
                                                              },
                                                              unclear_question: { 
                                                                label: 'Unclear Question', 
                                                                color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
                                                                icon: HelpCircle,
                                                                hint: 'User question was ambiguous'
                                                              }
                                                            };
                                                            const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.missing_knowledge;
                                                            const CategoryIcon = config.icon;
                                                            
                                                            return (
                                                              <li key={gap.id} className="text-sm p-3 sm:p-4 border rounded-md bg-muted/50 hover:bg-muted/70 transition-colors">
                                                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                                                      <Badge variant="outline" className={`${config.color} border flex items-center gap-1 w-fit`}>
                                                                        <CategoryIcon className="w-3 h-3" />
                                                                        <span>{config.label}</span>
                                                                      </Badge>
                                                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                          <Clock className="w-3 h-3 flex-shrink-0"/>
                                                                          <span className="break-words">{format(new Date(gap.date), 'MMM d, yyyy')}</span>
                                                                      </p>
                                                                  </div>
                                                                  <div className="bg-background/50 rounded-md p-3 border mb-2">
                                                                      <TranslatableText
                                                                        text={gap.query}
                                                                        className="text-sm leading-relaxed break-words"
                                                                        compact={true}
                                                                        bottomRightControls={true}
                                                                      />
                                                                  </div>
                                                                  <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                                                                    <Info className="w-3 h-3 flex-shrink-0" />
                                                                    {config.hint}
                                                                  </p>
                                                              </li>
                                                            );
                                                          })}
                                                      </ul>
                                                  </ScrollArea>
                                              ) : (
                                                  <div className="text-center text-muted-foreground py-6 sm:py-8 border-dashed border-2 rounded-lg">
                                                      <p className="break-words">No knowledge gaps have been recorded yet.</p>
                                                      <p className="text-xs break-words">When users ask questions the AI can't answer, they will appear here.</p>
                                                  </div>
                                              )}
                                          </CardContent>
                                      </Card>
                                      <div className="flex items-center gap-2 mt-6 p-3 border-t"><DatabaseZap className="w-5 h-5 text-primary" /><p className="text-sm text-muted-foreground">Data from paid plans can be connected to tools like Zapier, Pabbly Connect, or n8n.io for advanced sales and support automation workflows. Premium plans allow per-website data segregation for more targeted automation.</p></div>
                                  </>
                              )}
                          </CardContent>
                      </Card>
                  </TabsContent>

                  <TabsContent value="embed" className="md:col-start-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Code className="w-5 h-5" /> Embed Widget on Your Website</CardTitle>
                                <CardDescription>Copy and paste this code snippet into your website's HTML just before the closing `&lt;/body&gt;` tag to make the chatbot appear.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex flex-col gap-2 mb-2">
                                            <div className="flex justify-between items-center">
                                                <Label htmlFor="embedCode" className="font-semibold">Copy Embed Code</Label>
                                                <Button variant="outline" size="sm" onClick={copyEmbedCode} disabled={isViewingAsSuperAdmin}>
                                                    <Copy className="w-3.5 h-3.5 mr-2" /> Copy
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-muted-foreground">Select Agent for Users</Label>
                                                <Select value={embedAgentId} onValueChange={setEmbedAgentId} disabled={isViewingAsSuperAdmin}>
                                                    <SelectTrigger className="h-8 w-[220px]"><SelectValue placeholder="First agent (default)" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">First agent (default)</SelectItem>
                                                        {(adminManagedTenant?.agents || []).map(a => (
                                                            <SelectItem key={a.id} value={a.id}>Only {a.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <Textarea
                                            id="embedCode"
                                            readOnly
                                            value={embedCode}
                                            className="h-40 font-mono text-xs bg-muted"
                                            aria-label="Embed code snippet"
                                            disabled={isViewingAsSuperAdmin}
                                        />
                                    </div>
                                        <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Installation Instructions</AlertTitle>
                                        <AlertDescription>
                                            Paste this code snippet just before the closing &lt;/body&gt; tag on pages where you want the chatbot. The widget automatically uses your brand colors and settings from the General tab. It loads as a secure iframe that won't interfere with your website's design.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                                <div className="space-y-4">
                                    <Label className="font-semibold">Live Preview</Label>
                                    <div className="relative w-full md:max-w-[480px] mx-auto min-h-[420px] md:min-h-[620px] md:max-h-[620px] rounded-lg border bg-muted/30 overflow-hidden p-2 md:p-3">
                                        <div className="space-y-2">
                                            <h3 className="text-base md:text-lg font-semibold">Your Website Page</h3>
                                            <p className="text-xs md:text-sm text-muted-foreground">This is a simulation of your site. The widget will appear over this content.</p>
                                            <Skeleton className="h-3 md:h-4 w-1/2 md:w-[250px]" />
                                            <Skeleton className="h-3 md:h-4 w-1/3 md:w-[200px]" />
                                        </div>

                                        {adminManagedTenant && widgetBaseUrl ? (
                                            <LivePreviewIframe
                                                adminManagedTenant={adminManagedTenant}
                                                widgetBaseUrl={widgetBaseUrl}
                                                widgetPosition={widgetPosition}
                                                previewIframeRef={previewIframeRef}
                                                previewRefreshKey={previewRefreshKey}
                                                embedAgentId={embedAgentId}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <p>Loading preview...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                  <TabsContent value="help" className="md:col-start-2">
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquareQuote className="w-5 h-5" />AI Powered Help</CardTitle><CardDescription>Ask our AI assistant for help with setting up your account and chatbots.</CardDescription></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="aiHelpQuery">Your Question:</Label>
                          <Textarea 
                            id="aiHelpQuery" 
                            value={aiHelpQuery} 
                            onChange={(e) => setAiHelpQuery(e.target.value)} 
                            placeholder="e.g., How do I change my chatbot's welcome message?" 
                            disabled={isViewingAsSuperAdmin || isAskingAiHelp}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAskAiHelp();
                              }
                            }}
                          />
                          <Button 
                            onClick={handleAskAiHelp} 
                            disabled={isViewingAsSuperAdmin || isAskingAiHelp || !aiHelpQuery.trim()}
                          >
                            {isAskingAiHelp ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Thinking...
                              </>
                            ) : (
                              'Ask AI Assistant'
                            )}
                          </Button>
                        </div>
                        {aiHelpResponse && (<div className="p-3 bg-muted rounded-md"><p className="text-sm font-semibold">AI Response:</p><p className="text-sm text-muted-foreground">{aiHelpResponse}</p></div>)}
                         <div className="pt-4"><Button variant="outline" className="w-full" onClick={() => setHelpDocumentationOpen(true)} disabled={isViewingAsSuperAdmin}><BookOpen className="w-4 h-4 mr-2"/> View Full Help Documentation</Button></div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
           <CardFooter className="mt-auto">
             <p className="text-xs text-muted-foreground">Logged in as: {userRole} {userTenantId ? `(Tenant: ${userTenantId})` : ''}</p>
           </CardFooter>
        </Card>
      </main>

      {/* Help Documentation Modal */}
      <Dialog open={helpDocumentationOpen} onOpenChange={setHelpDocumentationOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Help & Documentation
            </DialogTitle>
            <DialogDescription>
              Comprehensive guide to setting up and managing your AI chatbots
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto">
            <HelpDocumentation />
          </div>
        </DialogContent>
      </Dialog>

      {/* Crawl Website Modal */}
      <Dialog open={crawlModalOpen} onOpenChange={setCrawlModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Crawl Website
            </DialogTitle>
            <DialogDescription>
              Automatically crawl and extract content from multiple pages of a website for training your agent.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="crawl-url">Website URL</Label>
              <Input
                id="crawl-url"
                placeholder="https://example.com"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                disabled={isCrawling}
              />
              <p className="text-xs text-muted-foreground">
                Enter the starting URL. The crawler will follow links from this page.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="crawl-max-pages">Maximum Pages</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="crawl-max-pages"
                  min={1}
                  max={50}
                  step={1}
                  value={[crawlMaxPages]}
                  onValueChange={(value) => setCrawlMaxPages(value[0])}
                  disabled={isCrawling}
                  className="flex-1"
                />
                <div className="w-12 text-center font-medium">{crawlMaxPages}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Limit the number of pages to crawl (1-50). More pages take longer.
              </p>
            </div>
            
            {isCrawling && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{crawlProgress.current}/{crawlProgress.total}</span>
                </div>
                <Progress value={(crawlProgress.current / Math.max(crawlProgress.total, 1)) * 100} />
                <p className="text-xs text-muted-foreground">{crawlProgress.status}</p>
              </div>
            )}
            
            {crawlResults.length > 0 && !isCrawling && (
              <div className="space-y-2">
                <Label>Crawl Results</Label>
                <ScrollArea className="h-[200px] rounded-md border p-3">
                  <div className="space-y-2">
                    {crawlResults.map((result: any, index: number) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        {result.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : result.status === 'skipped' ? (
                          <Info className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.url}</p>
                          {result.title && <p className="text-muted-foreground">{result.title}</p>}
                          {result.error && <p className="text-red-500">{result.error}</p>}
                          {result.wordCount && <p className="text-muted-foreground">{result.wordCount} words</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCrawlModalOpen(false);
                setCrawlResults([]);
                setCrawlProgress({ current: 0, total: 0, status: '' });
              }}
              disabled={isCrawling}
            >
              {crawlResults.length > 0 ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handleCrawlWebsite}
              disabled={isCrawling || !crawlUrl.trim()}
            >
              {isCrawling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Crawling...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Start Crawl
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Selection Modal for Trial Expiration */}
      <Dialog open={showPlanSelectionModal} onOpenChange={setShowPlanSelectionModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Your Trial Has Expired
            </DialogTitle>
            <DialogDescription>
              Your {platformSettings.trialLengthDays}-day trial period has ended. Please select a plan to continue using our service.
              {platformSettings.gracePeriodDays > 0 && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  You have {platformSettings.gracePeriodDays} days grace period to select a plan.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {displayedPlans.slice(0, 3).map((plan) => {
              const isCurrentPlan = adminManagedTenant?.assignedPlanId === plan.id;
              const isFree = plan.id === 'free';
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative ${isCurrentPlan ? 'border-primary' : ''} ${!isFree ? 'hover:border-primary transition-colors' : ''}`}
                >
                  {plan.id === platformSettings.defaultTrialPlanId && (
                    <Badge className="absolute -top-2 -right-2" variant="secondary">
                      Recommended
                    </Badge>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-2xl font-bold">
                      {plan.id === 'free' ? 'Free' : `$${plan.priceUSD}/mo`}
                    </p>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <ul className="space-y-2 text-sm">
                      {plan.features?.slice(0, 4).map((feature) => (
                        feature.included && (
                          <li key={feature.id} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-xs">{feature.text}</span>
                          </li>
                        )
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      className="w-full" 
                      variant={isFree ? 'outline' : 'default'}
                      onClick={() => {
                        if (adminManagedTenant?.id) {
                          handlePlanChangeForTenant(adminManagedTenant.id, plan.id);
                          setShowPlanSelectionModal(false);
                          toast({
                            title: "Plan Selected",
                            description: `Successfully switched to ${plan.name} plan.`
                          });
                        }
                      }}
                    >
                      {isCurrentPlan ? 'Current Plan' : isFree ? 'Select Free' : `Select ${plan.name}`}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Need help choosing? Contact support for assistance.
            </p>
            {platformSettings.gracePeriodDays > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPlanSelectionModal(false)}
              >
                Decide Later
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tenant ID Footer - Always visible on desktop */}
      {(userRole === 'admin' || isViewingAsSuperAdmin) && adminManagedTenant && (
        <footer className="hidden md:flex fixed bottom-0 left-0 right-0 h-10 items-center justify-center bg-background/80 backdrop-blur-xl border-t border-primary/10 z-20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building className="w-3 h-3" />
            <span className="font-mono">Tenant ID: <span className="font-semibold text-foreground/70">{adminManagedTenant.id}</span></span>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Navigation - Futuristic Tab Bar */}
      {(userRole === 'admin' || isViewingAsSuperAdmin) && adminManagedTenant && (
        <nav className="mobile-bottom-nav md:hidden" role="navigation" aria-label="Mobile navigation">
          <div className="flex items-center justify-around safe-area-bottom">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const tabTrigger = document.querySelector('[value="subscription"]') as HTMLButtonElement;
                  if (tabTrigger) {
                    tabTrigger.click();
                  }
                }
              }}
              className="mobile-tab-item"
              data-active={(typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'subscription') || (!new URLSearchParams(window.location.search).get('tab'))}
              aria-label="Dashboard"
              aria-current={(typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'subscription') || (!new URLSearchParams(window.location.search).get('tab')) ? 'page' : undefined}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="mobile-tab-label hidden sm:block">Dashboard</span>
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const tabTrigger = document.querySelector('[value="analytics"]') as HTMLButtonElement;
                  if (tabTrigger) {
                    tabTrigger.click();
                  }
                }
              }}
              className="mobile-tab-item"
              data-active={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'analytics'}
              aria-label="Leads and Analytics"
              aria-current={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'analytics' ? 'page' : undefined}
            >
              <UserCheck className="w-5 h-5" />
              <span className="mobile-tab-label hidden sm:block">Leads</span>
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const tabTrigger = document.querySelector('[value="help"]') as HTMLButtonElement;
                  if (tabTrigger) {
                    tabTrigger.click();
                  }
                }
              }}
              className="mobile-tab-item"
              data-active={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'help'}
              aria-label="Chat and Help"
              aria-current={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'help' ? 'page' : undefined}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="mobile-tab-label hidden sm:block">Chat</span>
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const tabTrigger = document.querySelector('[value="settings"]') as HTMLButtonElement;
                  if (tabTrigger) {
                    tabTrigger.click();
                  }
                }
              }}
              className="mobile-tab-item"
              data-active={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'settings'}
              aria-label="Settings"
              aria-current={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'settings' ? 'page' : undefined}
            >
              <Settings className="w-5 h-5" />
              <span className="mobile-tab-label hidden sm:block">Settings</span>
            </button>
          </div>
        </nav>
      )}
    </div>
    </ErrorBoundary>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading dashboard...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
