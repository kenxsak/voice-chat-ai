
'use client';

import React, {useState, useRef, useEffect, useCallback, Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
import Image from 'next/image';
import { Card, CardDescription, CardTitle, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button, buttonVariants} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {translateText} from '@/ai/flows/translate-text';
import {textToSpeech} from '@/ai/flows/text-to-speech';
import {generateConversationSummary} from '@/ai/flows/generate-conversation-summary';
import {useToast} from "@/hooks/use-toast";
import {Mic, Square, Building, Send, X as CloseIcon, Bot, Languages as LanguageIcon, MessageSquare, ExternalLink, Volume2, VolumeX, Copy, Paperclip, MessageCircle, HelpCircle, Phone } from "lucide-react";
import { cn, hexToHsl } from "@/lib/utils";
import { differenceInMonths } from 'date-fns';
import { checkTrialStatus, getEffectivePlanLimits, type TrialStatus } from '@/lib/trial-management';
import { ThemeLogo, AnimatedLogo } from '@/components/ui/theme-logo';
import MonochromeLoader from '@/components/ui/loading/monochrome-loader';

// Minimal browser speech recognition typings to satisfy TypeScript in the client
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}
type SpeechRecognition = any;
type SpeechRecognitionEvent = any;
type SpeechRecognitionErrorEvent = any;

// --- DATA TYPES & INITIAL DATA (Mirrors dashboard/page.tsx) ---
type Agent = {
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

type TrainingContext = {
  websiteUrl: string;
  docInfo?: string;
  uploadedDocContent?: string;
};
type SupportedLanguage = { code: string; name: string };

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
  description: string;
  features: PlanFeature[];
  agentLimit: number;
  languageLimit: number;
  contextLimit: number;
  conversationLimit: number;
  leadLimit: number;
  allowsCustomBranding: boolean;
};

type Tenant = {
  id: string;
  name: string;
  companyLogoUrl?: string;
  brandColor?: string;
  companyDetails?: string;
  trainingWebsiteUrl?: string;
  trainingContexts?: TrainingContext[];
  trainingDocInfo?: string;
  logoHint?: string;
  companyWebsiteUrl?: string;
  assignedPlanId: string;
  status: "Active" | "Disabled (Payment Due)" | "Disabled (Usage Limit Reached)";
  supportedLanguages?: SupportedLanguage[];
  agents: Agent[];
  leadWebhookUrl?: string;
  launcherButtonText?: string;
  // Subscription / trial fields used by trial-management helpers
  subscriptionStartDate: Date | string;
  trialOverride?: boolean;
  trialExtendedUntil?: Date | string;
  // Launcher customization used by the floating button
  launcherButtonIcon?: 'mic' | 'chat' | 'help' | 'phone' | 'none';
  launcherButtonSize?: 'small' | 'medium' | 'large';
  launcherButtonStyle?: 'light' | 'normal' | 'bold';
  launcherButtonAnimation?: 'none' | 'pulse' | 'bounce' | 'glow';
  launcherButtonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  conversationCount?: number;
  leadCount?: number;
  usageLastReset?: string;
};

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
        conversationLimit: 50,
        leadLimit: 5,
        allowsCustomBranding: false,
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
        conversationLimit: 500,
        leadLimit: 50,
        allowsCustomBranding: true,
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
            { id: 'p6', text: 'Advanced document parsing (PDF, DOCX)', included: false },
            { id: 'p7', text: 'Premium AI Voices (via API)', included: true },
            { id: 'p8', text: 'Advanced analytics & reporting', included: true },
            { id: 'p9', text: 'Priority email & chat support', included: true },
            { id: 'p10', text: 'Full data export/integration hooks', included: true },
            { id: 'p11', text: 'Full data export/integration hooks', included: true },
        ],
        agentLimit: 999,
        languageLimit: 999,
        contextLimit: 999,
        conversationLimit: 2000,
        leadLimit: 99999,
        allowsCustomBranding: true,
    },
];

const INITIAL_TENANTS_DATA: Tenant[] = [
  {
    id: 'tenant_acme_corp',
    name: 'Acme Corp',
    companyLogoUrl: 'https://placehold.co/150x50.png',
    brandColor: '#4C51BF',
    subscriptionStartDate: new Date().toISOString(),
    companyDetails: 'Leading provider of innovative solutions.',
    trainingContexts: [
        { websiteUrl: 'https://en.wikipedia.org/wiki/Dog', docInfo: 'Canine_Behavior_Guide.pdf', uploadedDocContent: '' },
        { websiteUrl: 'https://en.wikipedia.org/wiki/Cat', docInfo: 'Feline_Care_Manual.docx', uploadedDocContent: '' }
    ],
    logoHint: 'corporation logo',
    companyWebsiteUrl: 'https://acme-corp-example.com',
    assignedPlanId: 'standard',
    status: 'Active',
    supportedLanguages: [
        { code: 'en-US', name: 'English (US)' },
        { code: 'es-ES', name: 'Español' },
    ],
    leadWebhookUrl: 'https://hooks.zapier.com/hooks/catch/123/abc/',
    launcherButtonText: 'Chat with Acme',
    launcherButtonIcon: 'mic',
    launcherButtonStyle: 'normal',
    launcherButtonSize: 'medium',
    launcherButtonAnimation: 'pulse',
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
    companyLogoUrl: 'https://placehold.co/140x60.png',
    brandColor: '#F50057',
    subscriptionStartDate: new Date().toISOString(),
    companyDetails: 'Software development and consultancy.',
    trainingWebsiteUrl: 'https://beta-support.dev',
    trainingDocInfo: 'API_Documentation.md',
    trainingContexts: [
      { websiteUrl: 'https://beta-support.dev', docInfo: 'API_Documentation.md', uploadedDocContent: '' }
    ],
    logoHint: 'software company',
    companyWebsiteUrl: 'https://beta-solutions-example.com',
    assignedPlanId: 'free',
    status: 'Active',
    supportedLanguages: [{ code: 'en-US', name: 'English (US)' }],
    launcherButtonText: 'Get Support',
    launcherButtonIcon: 'mic',
    launcherButtonStyle: 'normal',
    launcherButtonSize: 'medium',
    launcherButtonAnimation: 'pulse',
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
    id: 'default_tenant',
    name: 'Helpful Platform',
    companyLogoUrl: 'https://placehold.co/160x40.png',
    logoHint: 'saas platform logo voice chat ai',
    brandColor: '#A54599',
    subscriptionStartDate: new Date().toISOString(),
    assignedPlanId: 'free',
    status: 'Active',
    supportedLanguages: [
        { code: 'en-US', name: 'English (US)' },
        { code: 'en-GB', name: 'English (UK)' },
        { code: 'en-AU', name: 'English (Australia)' },
        { code: 'en-CA', name: 'English (Canada)' },
        { code: 'en-IN', name: 'English (India)' },
        { code: 'hi-IN', name: 'हिन्दी (Hindi)' },
        { code: 'bn-IN', name: 'বাংলা (Bengali)' },
        { code: 'te-IN', name: 'తెలుగు (Telugu)' },
        { code: 'mr-IN', name: 'मराठी (Marathi)' },
        { code: 'ta-IN', name: 'தமிழ் (Tamil)' },
        { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)' },
        { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)' },
        { code: 'ml-IN', name: 'മലയാളം (Malayalam)' },
        { code: 'pa-IN', name: 'ਪੰਜਾਬੀ (Punjabi)' },
        { code: 'es-ES', name: 'Español (España)' },
        { code: 'es-MX', name: 'Español (México)' },
        { code: 'fr-FR', name: 'Français' },
        { code: 'de-DE', name: 'Deutsch' },
        { code: 'it-IT', name: 'Italiano' },
        { code: 'ja-JP', name: '日本語 (Japanese)' },
        { code: 'ko-KR', name: '한국어 (Korean)' },
        { code: 'pt-BR', name: 'Português (Brasil)' },
        { code: 'pt-PT', name: 'Português (Portugal)' },
        { code: 'ru-RU', name: 'Русский (Russian)' },
        { code: 'zh-CN', name: '中文 (Mandarin, Simplified)' },
        { code: 'zh-TW', name: '中文 (Mandarin, Traditional)' },
        { code: 'ar-SA', name: 'العربية (Arabic)' },
        { code: 'nl-NL', name: 'Nederlands (Dutch)' },
        { code: 'pl-PL', name: 'Polski (Polish)' },
        { code: 'tr-TR', name: 'Türkçe (Turkish)' },
        { code: 'vi-VN', name: 'Tiếng Việt (Vietnamese)' },
        { code: 'id-ID', name: 'Bahasa Indonesia' },
    ],
    launcherButtonText: 'Help?',
    launcherButtonIcon: 'mic',
    launcherButtonStyle: 'normal',
    launcherButtonSize: 'medium',
    launcherButtonAnimation: 'pulse',
    agents: [
      {
        id: 'general_agent',
        name: 'Helpful Assistant',
        description: 'A general purpose AI assistant ready to help with your queries. I can answer general questions, provide information, and assist with tasks based on the context given. I understand both sales and support related queries and will try to collect your contact information if needed for follow-up.',
        avatarUrl: 'https://placehold.co/100x100.png',
        avatarHint: 'ai assistant bot',
        websiteUrl: undefined,
        greeting: "Hello! I'm your Helpful Assistant. What can I do for you?",
        voice: 'female-us',
        tone: 'friendly',
        responseStyle: 'conversational',
        expertiseLevel: 'beginner-friendly',
        customInstructions: 'Be helpful and approachable. Explain things clearly and ask follow-up questions to better understand user needs. IMPORTANT: Always collect contact information (name, email, phone) when users need follow-up assistance.',
      },
    ],
    conversationCount: 0,
    leadCount: 0,
    usageLastReset: new Date().toISOString(),
  },
];

// Legacy keys removed; now server-backed via MongoDB

const SAAS_PRODUCT_NAME = "Voice Assistant";
const SAAS_BRANDING_NAME = "Powered by Voice Chat AI";
const SAAS_PLATFORM_WEBSITE_URL = "https://voicechatai.wmart.in/";

// A special type for messages passed to the API
type ApiMessage = {
  role: 'user' | 'agent' | 'system';
  content: string | Array<{ text?: string; media?: { url: string } }>;
};

// Helper function to convert URLs in text to clickable links
const linkifyText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      // Remove trailing punctuation and brackets from URLs
      const cleaned = part.replace(/[.,!?;:\)\]\}'"]+$/, '');
      const trailing = part.slice(cleaned.length);
      
      return (
        <React.Fragment key={index}>
          <a
            href={cleaned}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 underline underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            {cleaned}
          </a>
          {trailing}
        </React.Fragment>
      );
    }
    return part;
  });
};

const ChatMessage = React.memo(({role, content, agentAvatarUrl, agentAvatarHint, agentName, onCopy }: { role: 'user' | 'agent' | 'system'; content: string | React.ReactNode; agentAvatarUrl?: string; agentAvatarHint?: string; agentName?: string; onCopy: (text: string) => void; }) => {
  // Process content to make links clickable for agent messages
  const processedContent = role === 'agent' && typeof content === 'string' 
    ? linkifyText(content)
    : content;

  return (
    <div className={`group flex items-start mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {role === 'agent' && (
          <Button variant="ghost" size="icon" className="w-7 h-7 mr-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-500/10 hover:text-cyan-400" onClick={() => typeof content === 'string' && onCopy(content)}>
              <Copy size={14} />
              <span className="sr-only">Copy message</span>
          </Button>
      )}
      <div className={`flex items-end ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        {role === 'agent' && (
          <Avatar className="h-7 w-7 mr-2 shrink-0 ring-2 ring-cyan-500/20">
            <AvatarImage src={agentAvatarUrl || '/icon-192.png'} alt={agentName || 'Agent'} data-ai-hint={agentAvatarHint || 'voice chat ai assistant'} className="object-cover" loading="lazy" />
            <AvatarFallback className="bg-transparent p-0.5"><Image src="/icon-192.png" alt="Agent" width={24} height={24} className="w-full h-full object-contain" /></AvatarFallback>
          </Avatar>
        )}
        <div
          className={cn(
              "rounded-xl py-2 px-3 max-w-xs text-sm transition-all duration-200 group-hover:scale-[1.02]",
              role === 'user' 
                ? 'cyber-gradient text-white ml-8 shadow-[0_0_20px_rgba(0,212,255,0.3)] border border-cyan-400/30' 
                : role === 'agent' 
                ? 'bg-background/40 backdrop-blur-md text-card-foreground border border-cyan-500/20 mr-8 shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(0,255,255,0.2)]'
                : 'bg-muted/50 text-muted-foreground text-center w-full mx-auto max-w-md text-xs p-2 border border-muted/30'
          )}
        >
          {processedContent}
        </div>
      </div>
      {role === 'user' && (
           <Button variant="ghost" size="icon" className="w-7 h-7 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-purple-500/10 hover:text-purple-400" onClick={() => {
              let textToCopy = '';
              if (typeof content === 'string') {
                textToCopy = content;
              } else if (React.isValidElement(content) && content.props.children) {
                // Find the <p> tag within the content and extract its text
                const pElement = React.Children.toArray(content.props.children).find(
                  (child): child is React.ReactElement<React.HTMLProps<HTMLParagraphElement>> =>
                    React.isValidElement(child) && child.type === 'p'
                );
                if (pElement && typeof pElement.props.children === 'string') {
                  textToCopy = pElement.props.children;
                }
              }
              if (textToCopy) {
                onCopy(textToCopy);
              }
           }}>
              <Copy size={14} />
              <span className="sr-only">Copy message</span>
          </Button>
      )}
    </div>
  );
});

function ChatPageContent() {
  const searchParams = useSearchParams();
  const {toast} = useToast();
  const isEmbedded = (searchParams.get('embed') === '1');

  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(undefined);
  const [hasMultipleAgents, setHasMultipleAgents] = useState(false);
  const [isTenantDisabled, setIsTenantDisabled] = useState(false);
  const [tenantDisabledReason, setTenantDisabledReason] = useState('');

  const [messages, setMessages] = useState<{ role: 'user' | 'agent' | 'system'; content: string | React.ReactNode; agentAvatarUrl?: string; agentAvatarHint?: string; agentName?: string; }[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [languageCode, setLanguageCode] = useState('en-US');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [premiumVoicesAvailable, setPremiumVoicesAvailable] = useState(true);

  const [premiumAudioDataUri, setPremiumAudioDataUri] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImageDataUri, setAttachedImageDataUri] = useState<string | null>(null);
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  // Notify parent page (if embedded in an iframe) about widget open/close state so the parent can resize the iframe
  useEffect(() => {
    if (!isEmbedded) return;
    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage({ source: 'vcai-widget', open: isWidgetOpen }, '*');
      }
    } catch {}
  }, [isWidgetOpen, isEmbedded]);

  // Allow parent (widget.js) to control open/close inside iframe
  useEffect(() => {
    if (!isEmbedded || typeof window === 'undefined') return;
    const handler = (event: MessageEvent) => {
      try {
        const data: any = event.data || {};
        if (data && data.source === 'vcai-host' && typeof data.open === 'boolean') {
          setIsWidgetOpen(data.open);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isEmbedded]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const premiumAudioRef = useRef<HTMLAudioElement>(null);
  const lastUtteranceTextRef = useRef<string>('');
  const lastUtteranceLangRef = useRef<string>('en-US');
  const lastUtteranceVoiceRef = useRef<string>('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const closeRequestInProgressRef = useRef<boolean>(false);

  // Load browser voices and set a flag once they are loaded.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => {
        if (window.speechSynthesis.getVoices().length > 0) {
            setVoicesLoaded(true);
            window.speechSynthesis.onvoiceschanged = null;
        }
    };
    if (window.speechSynthesis.getVoices().length > 0) {
        setVoicesLoaded(true);
    } else {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = null;
        }
    };
  }, []);

  // One-time action to unlock audio on mobile browsers.
  const unlockAudio = useCallback(() => {
    if (audioUnlocked || typeof window === 'undefined') return;
    // Unlock browser TTS
    if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        window.speechSynthesis.speak(utterance);
    }
    // Unlock <audio> element
    if (premiumAudioRef.current) {
        premiumAudioRef.current.play().catch(() => {});
        premiumAudioRef.current.pause();
    }
    setAudioUnlocked(true);
    console.log("Audio context unlocked for this session.");
  }, [audioUnlocked]);

  const playBrowserTTS = useCallback((text: string, lang: string, voicePref?: string): Promise<void> => {
    if (isMuted || !text || typeof window === 'undefined' || !window.speechSynthesis) {
      return Promise.resolve();
    }

    // Ensure audio is unlocked for this interaction
    unlockAudio();

    // Stop any ongoing speech cleanly before starting a new one
    window.speechSynthesis.cancel();
    // Some browsers pause speech; make sure it's resumed
    if ((window.speechSynthesis as any).paused) {
      (window.speechSynthesis as any).resume?.();
    }
    // Small delay helps some engines properly reset between utterances
    // especially on mobile Safari and some Windows voices
    const start = (resolve: () => void) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const allVoices = window.speechSynthesis.getVoices();

      // Robust voice selection logic with gender preference
      const langLower = lang.toLowerCase();
      const baseLang = langLower.split('-')[0];
      const isFemalePref = (voicePref || '').startsWith('female-');
      const isMalePref = (voicePref || '').startsWith('male-');
      // Heuristics for common platform voices
      const voiceIsFemale = (v: SpeechSynthesisVoice) => /female|woman|girl|zira|samantha|susan|hazel|heera|veena|salma|meera|aish|sonia|neha|ava|victoria|sangeeta|kanya|lekha|heba|tessa|karen|moira|serena|allison|salli/i.test(v.name);
      const voiceIsMale = (v: SpeechSynthesisVoice) => /male|man|boy|david|mark|ravi|rishi|rahul|amit|raj|arvind|sagar|alex|fred|daniel|oliver|thomas|maged|xander|arthur|george|hindi male/i.test(v.name);
      const voicesByLang = allVoices.filter(v => v.lang && (v.lang.toLowerCase() === langLower || v.lang.toLowerCase().startsWith(baseLang + '-')));
      
      // STRICT gender-only selection - NEVER mix genders, NEVER allow wrong gender fallback
      const pickByGender = (voices: SpeechSynthesisVoice[]) => {
        if (isFemalePref) {
          // ONLY female voices - never male, never neutral if male voice exists
          return voices.find(voiceIsFemale);
        }
        if (isMalePref) {
          // ONLY male voices - never female, never neutral if female voice exists
          return voices.find(voiceIsMale);
        }
        return undefined;
      };
      let selectedVoice: SpeechSynthesisVoice | undefined;
      
      // STRICT GENDER ENFORCEMENT - Gender consistency is MANDATORY, accent is secondary
      // Step 1: Try gender match in target language (ideal: correct gender + correct accent)
      selectedVoice = pickByGender(voicesByLang);
      
      // Step 2: If no match in target language, try gender match in ANY language
      // Better to have correct gender with different accent than wrong gender with correct accent
      if (!selectedVoice && (isFemalePref || isMalePref)) {
        selectedVoice = pickByGender(allVoices);
        if (selectedVoice) {
          console.log(`[Browser TTS] Gender priority: Using ${isFemalePref ? 'female' : 'male'} voice from ${selectedVoice.lang} to maintain gender consistency for ${lang}`);
        }
      }
      
      // Step 3: ONLY if no gender match exists at all, use system default
      // This ensures we NEVER switch from female to male or vice versa
      if (!selectedVoice) {
        selectedVoice = allVoices.find(v => v.default) || allVoices[0];
        console.warn(`[Browser TTS] No ${isFemalePref ? 'female' : isMalePref ? 'male' : 'matching'} voice found for ${lang}. Using system default to avoid gender mismatch.`);
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        console.log(`[Browser TTS] Selected voice: ${selectedVoice.name} (${selectedVoice.lang}) for target: ${lang}`);
      } else {
        utterance.lang = lang;
        console.log(`[Browser TTS] No voice found, using default with lang: ${lang}`);
      }

      // Resolve when speech actually starts so UI can reveal the text
      utterance.onstart = () => {
        resolve();
      };
      // Ensure subsequent utterances can play
      utterance.onend = () => {};
      utterance.onerror = (e) => console.warn('Speech synthesis error:', e);
      
      // Enhanced voice quality settings for happy, joyful, excited sound (matched to GitHub)
      // Optimized pitch/rate for energetic, lively speech for sales and support
      if (isMalePref) {
        // Energetic male voice: pitch 0.7 for warmth, rate 0.95 for natural pace
        utterance.pitch = 0.7;
        utterance.rate = 0.95;
      } else if (isFemalePref) {
        // Happy, excited female voice: pitch 1.2 for joyful tone, rate 1.02 for energy
        utterance.pitch = 1.2;
        utterance.rate = 1.02;
      } else {
        // Default: neutral but friendly tone
        utterance.pitch = 1.1;
        utterance.rate = 0.98;
      }
      
      // Increase volume for better presence (some browsers support this)
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);

      // Safety retry if engine stalls
      setTimeout(() => {
        if (!window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          const retry = new SpeechSynthesisUtterance(text);
          if (selectedVoice) {
            retry.voice = selectedVoice;
            retry.lang = selectedVoice.lang;
          } else {
            retry.lang = lang;
          }
          
          // Apply same enhanced voice settings to retry
          if (isMalePref) {
            retry.pitch = 0.7;
            retry.rate = 0.95;
          } else if (isFemalePref) {
            retry.pitch = 1.2;
            retry.rate = 1.02;
          } else {
            retry.pitch = 1.1;
            retry.rate = 0.98;
          }
          retry.volume = 1.0;
          
          window.speechSynthesis.speak(retry);
        }
      }, 700);
    };
    // Delay ~100ms before starting the next utterance
    return new Promise<void>((resolve) => setTimeout(() => start(resolve), 100));
  }, [isMuted, voicesLoaded]);

  // Play premium audio when its data URI is set (after playBrowserTTS is defined)
  useEffect(() => {
    if (premiumAudioDataUri && premiumAudioRef.current) {
      if (!premiumAudioRef.current.paused && premiumAudioRef.current.src === premiumAudioDataUri) {
        return;
      }
      premiumAudioRef.current.currentTime = 0;
      premiumAudioRef.current.play().catch(e => {
        console.error("Premium audio playback failed:", e);
        const text = lastUtteranceTextRef.current;
        const lang = lastUtteranceLangRef.current;
        const vpref = lastUtteranceVoiceRef.current;
        if (text) { void playBrowserTTS(text, lang, vpref); }
      });
    }
  }, [premiumAudioDataUri, playBrowserTTS]);


  const handleSendMessage = useCallback(async (text?: string) => {
    let currentTenant = selectedTenant;
    const currentPlan = allPlans.find(p => p.id === currentTenant?.assignedPlanId);
    if (!selectedAgent || !currentTenant || !currentPlan || isGeneratingResponse) return;

    // --- Usage Limit Check (server backed) ---
    let tenantFromStorage: any = currentTenant;

      if (tenantFromStorage) {
      // Initialize usage fields if they don't exist
      tenantFromStorage.conversationCount = tenantFromStorage.conversationCount ?? 0;
      tenantFromStorage.leadCount = tenantFromStorage.leadCount ?? 0;
      tenantFromStorage.usageLastReset = tenantFromStorage.usageLastReset ?? new Date().toISOString();

      // Check if usage needs to be reset (monthly)
      const lastReset = new Date(tenantFromStorage.usageLastReset);
      if (differenceInMonths(new Date(), lastReset) >= 1) {
          tenantFromStorage.conversationCount = 0;
          tenantFromStorage.leadCount = 0;
          tenantFromStorage.usageLastReset = new Date().toISOString();
      }

      // Enforce conversation limit
      if (tenantFromStorage.conversationCount >= currentPlan.conversationLimit) {
        tenantFromStorage.status = 'Disabled (Usage Limit Reached)';
        setIsTenantDisabled(true);
        setTenantDisabledReason('Your monthly conversation limit has been reached. Please contact the administrator to upgrade your plan.');
        setMessages(prev => [...prev, { role: 'system', content: `This chatbot is disabled. Monthly conversation limit reached.` }]);
        if (!isEmbedded) {
          await fetch('/api/tenants', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: currentTenant!.id, updates: { status: 'Disabled (Usage Limit Reached)' } }) });
        }
        return;
      }

      // Update conversation count
      tenantFromStorage.conversationCount += 1;
      currentTenant = tenantFromStorage; // Use the updated tenant data
      setSelectedTenant(currentTenant);
    }

    const currentInputVal = (text ?? input).trim();
    if (!currentInputVal && !attachedImageDataUri) return;

    unlockAudio();
    setIsGeneratingResponse(true);
    setIsTyping(true);
    setPremiumAudioDataUri(null);

    const userMessageContentForState = (
      <>
        {attachedImageDataUri && (
          <img src={attachedImageDataUri} alt="User upload" className="max-w-xs rounded-lg mb-2" data-ai-hint="user image upload" />
        )}
        {currentInputVal && <p>{currentInputVal}</p>}
      </>
    );

    const userMessageForState = {role: 'user' as const, content: userMessageContentForState };
    setMessages(prev => [...prev, userMessageForState]);

    const textToSend = currentInputVal;
    setInput('');

    if (isListening) {
      recognitionRef.current?.stop();
    }

    const knowledgeContexts: { websiteUrl?: string, docInfo?: string, uploadedDocContent?: string }[] = [];
    if (selectedAgent.websiteUrl) {
        knowledgeContexts.push({ websiteUrl: selectedAgent.websiteUrl });
    }
    const tenantTrainingContexts = currentTenant?.trainingContexts ?? [];
    if (tenantTrainingContexts.length > 0) {
        knowledgeContexts.push(...tenantTrainingContexts);
    }
    const agentTrainingContexts = selectedAgent.trainingContexts ?? [];
    if (agentTrainingContexts.length > 0) {
        knowledgeContexts.push(...agentTrainingContexts);
    }

    console.log('[DEBUG] Knowledge contexts for chat:', {
      selectedAgentWebsite: selectedAgent.websiteUrl,
      tenantTrainingContextsCount: tenantTrainingContexts.length || 0,
      agentTrainingContextsCount: agentTrainingContexts.length || 0,
      tenantTrainingContexts,
      agentTrainingContexts,
      totalKnowledgeContexts: knowledgeContexts.length,
      knowledgeContexts,
      // Check if extractedText is present
      hasExtractedText: knowledgeContexts.some(ctx => ctx.uploadedDocContent || (ctx as any).extractedText)
    });
    const uniqueContexts = Array.from(
      knowledgeContexts
        .reduce((map, context) => {
          const key = context.websiteUrl || context.docInfo;
          if (key) {
            const existing = map.get(key);
            if (!existing || (!existing.docInfo && context.docInfo) || (!existing.uploadedDocContent && context.uploadedDocContent)) {
              map.set(key, context);
            }
          }
          return map;
        }, new Map<string, { websiteUrl?: string; docInfo?: string; uploadedDocContent?: string }>())
        .values()
    );

    try {
        const historyForApi: ApiMessage[] = messages
          .map(msg => {
            if (msg.role === 'user') {
                if (typeof msg.content === 'string') {
                    return { role: 'user', content: msg.content };
                }
                let textContent = '';
                let mediaContent: { url: string } | null = null;

                if (React.isValidElement(msg.content)) {
                    React.Children.forEach(msg.content.props.children, child => {
                        const el: any = child as any;
                        const props: any = el && el.props ? el.props : undefined;
                        if (React.isValidElement(el) && el.type === 'img' && props?.src) {
                            mediaContent = { url: String(props.src) };
                        }
                        if (React.isValidElement(el) && el.type === 'p' && typeof props?.children === 'string') {
                            textContent = props.children as string;
                        }
                    });
                }

                const parts: Array<{ text?: string; media?: { url: string } }> = [];
                if (textContent) parts.push({ text: textContent });
                if (mediaContent) parts.push({ media: mediaContent });

                return { role: 'user', content: parts.length > 0 ? parts : '' };
            } else if (msg.role === 'agent' && typeof msg.content === 'string') {
                return { role: 'agent', content: msg.content };
            }
            return null;
        }).filter((msg): msg is ApiMessage => msg !== null && msg.content !== '');

        const cleanedHistoryForApi = historyForApi.map(msg => {
            if (msg.role === 'agent' || (msg.role === 'user' && typeof msg.content === 'string')) {
                return { role: msg.role, content: msg.content };
            }
            return msg;
        });

      // Create or reuse a sessionId per widget session for de-dup
      if (typeof window !== 'undefined') {
        const existingSid = sessionStorage.getItem('vcai_session_id');
        if (!existingSid) sessionStorage.setItem('vcai_session_id', `sid_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
      }
      const sessionId = (typeof window !== 'undefined') ? (sessionStorage.getItem('vcai_session_id') || undefined) : undefined;

      const mappedKnowledgeContexts = uniqueContexts.map((context) => ({
        websiteUrl: context.websiteUrl,
        documentInfo: context.docInfo || (context as any).sourceInfo,
        uploadedDocContent: context.uploadedDocContent || (context as any).extractedText,
      }));

      console.log('[DEBUG] Mapped knowledge contexts being sent to AI:', {
        count: mappedKnowledgeContexts.length,
        contexts: mappedKnowledgeContexts,
        hasContent: mappedKnowledgeContexts.some(ctx => ctx.uploadedDocContent && ctx.uploadedDocContent.length > 0)
      });

      // CRITICAL DEBUG: Log the history being sent
      console.log('📜 [HISTORY CHECK] Sending history to AI:', {
        historyLength: cleanedHistoryForApi.length,
        lastFewMessages: cleanedHistoryForApi.slice(-3).map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content.substring(0, 100) : JSON.stringify(msg.content).substring(0, 100)
        }))
      });

      const apiInput: any = {
        tenantId: currentTenant!.id,
        sessionId,
        query: textToSend,
        agentName: selectedAgent.name,
        agentDescription: selectedAgent.description,
        agentVoice: selectedAgent.voice,
        languageCode: languageCode,
        knowledgeContexts: mappedKnowledgeContexts,
        history: cleanedHistoryForApi,
        leadWebhookUrl: currentTenant?.leadWebhookUrl,
        // Professional training options
        agentTone: selectedAgent.tone,
        agentResponseStyle: selectedAgent.responseStyle,
        agentExpertiseLevel: selectedAgent.expertiseLevel,
        agentCustomInstructions: selectedAgent.customInstructions,
      };

      if (attachedImageDataUri) {
        apiInput.imageDataUri = attachedImageDataUri;
      }

      // Call the chat API endpoint to get conversationId
      const chatResponse = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiInput),
      });

      if (!chatResponse.ok) {
        throw new Error(`Chat API error: ${chatResponse.status}`);
      }

      const agentResponse = await chatResponse.json();
      console.log('[DEBUG] Raw AI response:', JSON.stringify(agentResponse, null, 2));

      // Store conversationId for unload tracking
      if (agentResponse.conversationId) {
        setConversationId(agentResponse.conversationId);
        console.log('[DEBUG] Conversation ID tracked:', agentResponse.conversationId);
      }

      // Ensure on-screen text matches selected language
      let displayText = agentResponse.response;
      try {
        console.log('[DEBUG] Translating text:', {
          originalText: agentResponse.response?.substring(0, 100) + '...',
          languageCode
        });
        const { translatedText } = await translateText({ text: agentResponse.response, languageCode });
        if (translatedText && translatedText.trim()) displayText = translatedText.trim();
      } catch {}

      // Do not display agent text yet; wait for audio to start
      if (!isMuted && displayText) {
        // Stash for desktop fallback if autoplay is blocked
        lastUtteranceTextRef.current = displayText;
        lastUtteranceLangRef.current = languageCode;
        lastUtteranceVoiceRef.current = selectedAgent.voice || '';
        // Always try server TTS first for consistent quality across languages
        try {
          const ttsResponse = await textToSpeech({ text: displayText, voice: selectedAgent.voice, languageCode }).catch((error) => {
            console.log('[TTS] Error during TTS, falling back to browser TTS:', error.message);
            return { audioDataUri: '' };
          });
          
          if (ttsResponse && ttsResponse.audioDataUri) {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            if (premiumAudioRef.current) {
              premiumAudioRef.current.pause();
              premiumAudioRef.current.currentTime = 0;
            }
            // Play premium audio first, then show the text once playback actually starts
            await new Promise<void>((resolve) => {
              const audioEl = premiumAudioRef.current;
              if (!audioEl) { resolve(); return; }
              const onStart = () => { audioEl.removeEventListener('playing', onStart); resolve(); };
              audioEl.addEventListener('playing', onStart, { once: true });
              setPremiumAudioDataUri(ttsResponse.audioDataUri);
            });
            const newAgentMessage = { role: 'agent' as const, content: displayText, agentAvatarUrl: selectedAgent.avatarUrl, agentAvatarHint: selectedAgent.avatarHint, agentName: selectedAgent.name };
            setMessages(prev => [...prev, newAgentMessage]);
          } else {
            await playBrowserTTS(displayText, languageCode, selectedAgent.voice);
            const newAgentMessage = { role: 'agent' as const, content: displayText, agentAvatarUrl: selectedAgent.avatarUrl, agentAvatarHint: selectedAgent.avatarHint, agentName: selectedAgent.name };
            setMessages(prev => [...prev, newAgentMessage]);
          }
         } catch (ttsError: any) {
          console.error("Server TTS failed.", ttsError);
          setPremiumVoicesAvailable(false);
          await playBrowserTTS(displayText, languageCode, selectedAgent.voice);
          const newAgentMessage = { role: 'agent' as const, content: displayText, agentAvatarUrl: selectedAgent.avatarUrl, agentAvatarHint: selectedAgent.avatarHint, agentName: selectedAgent.name };
          setMessages(prev => [...prev, newAgentMessage]);
        }
      } else {
        const newAgentMessage = { role: 'agent' as const, content: displayText, agentAvatarUrl: selectedAgent.avatarUrl, agentAvatarHint: selectedAgent.avatarHint, agentName: selectedAgent.name };
        setMessages(prev => [...prev, newAgentMessage]);
      }

      // Lead Saving/Updating Logic (with robust client-side fallback extraction)
      // Fallback extraction from the user's latest message in case the model missed it
      const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
      const phoneFromText = (textToSend || '')
        .replace(/[^0-9+]/g, '')
        .replace(/\+{2,}/g, '+');
      const emailFromText = (emailRegex.exec(textToSend || '')?.[0] || '').toLowerCase();
      const nameFromText = (() => {
        const m = /(my name is|i am|i'm)\s+([a-z][a-z '\-]{1,50})/i.exec(textToSend || '');
        if (m && m[2]) {
          return m[2].trim().replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        }
        return '';
      })();

      const finalLeadName = (agentResponse.leadName && agentResponse.leadName !== 'null' ? agentResponse.leadName : '') || nameFromText;
      const finalLeadEmail = (agentResponse.leadEmail && agentResponse.leadEmail !== 'null' ? agentResponse.leadEmail : '') || emailFromText;
      const finalLeadPhone = (agentResponse.leadPhone && agentResponse.leadPhone !== 'null' ? agentResponse.leadPhone : '') || (phoneFromText.length >= 6 ? phoneFromText : '');

      console.log('[DEBUG] Agent response for lead capture:', {
        leadName: agentResponse?.leadName,
        leadEmail: agentResponse?.leadEmail,
        leadPhone: agentResponse?.leadPhone,
        fallbackFromText: { nameFromText, emailFromText, phoneFromText },
        finalLead: { name: finalLeadName, email: finalLeadEmail, phone: finalLeadPhone },
        conversationSummary: agentResponse?.conversationSummary
      });

      // Contact info extracted above will be tracked by the chat API.
      // Lead creation is handled by the conversation close API to prevent duplicates.
      console.log('[Lead Handling] Contact info extracted:', {
        name: finalLeadName || 'not provided',
        email: finalLeadEmail || 'not provided', 
        phone: finalLeadPhone || 'not provided',
        note: 'Lead will be created on conversation close'
      });

      if (agentResponse.knowledgeGapQuery) {
          try {
              const newGap = {
                  id: `gap_${Date.now()}`,
                  query: agentResponse.knowledgeGapQuery,
                  date: new Date().toISOString(),
                  tenantId: currentTenant!.id,
                  category: agentResponse.knowledgeGapCategory || undefined,
              };
              await fetch('/api/gaps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newGap) });
          } catch (e) { console.error("Failed to save knowledge gap to local storage", e); }
      }

      if (!isEmbedded) {
        await fetch('/api/tenants', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: currentTenant!.id, updates: { conversationCount: (tenantFromStorage.conversationCount ?? 0) } }) });
      }

    } catch (error: any) {
      const displayError = `Sorry, an error occurred: ${error.message || 'Please try again.'}`;
      setMessages(prev => [...prev, {role: 'agent', content: displayError, agentAvatarUrl: selectedAgent?.avatarUrl, agentAvatarHint: selectedAgent?.avatarHint, agentName: selectedAgent?.name}]);
      toast({ title: "Error", description: `Failed to get response: ${error.message}`, variant: "destructive"});
    } finally {
      setIsGeneratingResponse(false);
      setIsTyping(false);
      setAttachedImageDataUri(null); // Reset the image after sending
    }
  }, [input, attachedImageDataUri, selectedAgent, selectedTenant, isGeneratingResponse, messages, languageCode, toast, playBrowserTTS, isListening, unlockAudio, allPlans, isMuted, premiumVoicesAvailable, currentLeadId]);

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
          toast({ title: "File Too Large", description: "Please select an image smaller than 4MB.", variant: "destructive" });
          return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setAttachedImageDataUri(loadEvent.target?.result as string);
        toast({ title: "Image Attached", description: "Your image is ready to be sent with your next message." });
      };
      reader.readAsDataURL(file);
    }
    if (event.target) event.target.value = '';
  };


  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
        console.warn("Speech Recognition not supported by this browser.");
        return;
    }
    const recognitionInstance: any = new SR();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.onstart = () => setIsListening(true);
    recognitionInstance.onend = () => setIsListening(false);
    recognitionInstance.onresult = (event: any) => {
        const finalTranscript = Array.from(event.results as any).map((result: any) => result[0].transcript).join('');
        if (finalTranscript) handleSendMessage(finalTranscript);
    };
    recognitionInstance.onerror = (event: any) => {
        let description = "An unknown voice input error occurred.";
        switch (event.error) {
            case 'not-allowed':
            case 'service-not-allowed':
                description = "Microphone access was denied. Please enable it in your browser settings.";
                break;
            case 'no-speech':
                description = "Sorry, I didn't hear anything. Please try again.";
                break;
            case 'network':
                description = "A network error occurred. Please check your internet connection.";
                break;
            case 'audio-capture':
                description = "Could not capture audio. Please check your microphone.";
                break;
        }
        toast({ title: "Voice Input Error", description, variant: "destructive" });
        setIsListening(false);
    };
    recognitionRef.current = recognitionInstance;
  }, [handleSendMessage, toast]);

  const stopAllAudio = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    if (premiumAudioRef.current) {
        premiumAudioRef.current.pause();
        premiumAudioRef.current.currentTime = 0;
    }
    setPremiumAudioDataUri(null);
  };

  const handleMicClick = () => {
    unlockAudio();
    stopAllAudio();
    if (isListening) {
        recognitionRef.current?.stop();
    } else {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.lang = languageCode;
                recognitionRef.current.start();
            } catch (error) {
                console.error("Error starting speech recognition:", error);
                toast({ title: "Voice Error", description: "Could not start listening. Please check browser permissions.", variant: "destructive" });
            }
        } else {
            toast({ title: "Voice Not Supported", description: "Speech recognition is not available on this browser.", variant: "destructive" });
        }
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(current => {
        const newMutedState = !current;
        if (newMutedState) {
            stopAllAudio();
        }
        if (premiumAudioRef.current) {
            premiumAudioRef.current.muted = newMutedState;
        }
        return newMutedState;
    });
  };

  const handleCopyMessage = useCallback((textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        toast({ title: "Copied!", description: "Message copied to clipboard." });
    }).catch(err => {
        toast({ title: "Copy Failed", description: "Could not copy message.", variant: "destructive" });
        console.error("Copy failed", err);
    });
  }, [toast]);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableView) scrollableView.scrollTop = scrollableView.scrollHeight;
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Set brand color CSS variables for pulsing effect and language dropdown
  useEffect(() => {
    if (selectedTenant?.brandColor && typeof document !== 'undefined') {
      const brandColor = selectedTenant.brandColor;

      // Convert hex to RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 162, g: 89, b: 255 }; // fallback
      };

      const rgb = hexToRgb(brandColor);
      const hsl = hexToHsl(brandColor);

      // Update CSS custom properties for the pulsing animation
      document.documentElement.style.setProperty('--brand-pulse-color-60', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);
      document.documentElement.style.setProperty('--brand-pulse-color-30', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
      document.documentElement.style.setProperty('--brand-pulse-color-90', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`);
      document.documentElement.style.setProperty('--brand-pulse-color-80', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);

      // Update brand color for language dropdown hover/focus
      document.documentElement.style.setProperty('--accent', hsl);
      document.documentElement.style.setProperty('--primary', hsl);
    }
  }, [selectedTenant?.brandColor]);

  // Handle conversation close on browser unload/close
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sessionId = sessionStorage.getItem('vcai_session_id') || undefined;
    
    const handleUnload = () => {
      // Only close if we have an active conversation with messages AND no close request is in progress
      if (conversationId && selectedTenant && sessionId && messages.length > 1 && !closeRequestInProgressRef.current) {
        console.log('[Conversation Close] Initiating conversation close - triggered by page unload/visibility change');
        closeRequestInProgressRef.current = true; // Mark as in progress to prevent duplicates
        
        // API will fetch fresh training contexts from database, so no need to send cached data
        const closeData = {
          conversationId,
          tenantId: selectedTenant.id,
          sessionId,
          agentName: selectedAgent?.name || 'Assistant',
          businessContext: selectedTenant.companyDetails || selectedTenant.name || '',
          reference: `Chat with ${selectedAgent?.name || 'Support AI Agent'}`,
          agentAvatarUrl: selectedAgent?.avatarUrl || null
        };
        
        console.log('[Unload] Closing conversation:', closeData);
        
        // Use sendBeacon for reliable delivery even as page is closing
        const blob = new Blob([JSON.stringify(closeData)], { type: 'application/json' });
        const sent = navigator.sendBeacon('/api/conversations/close', blob);
        
        if (!sent) {
          // Fallback to fetch with keepalive if sendBeacon fails
          fetch('/api/conversations/close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(closeData),
            keepalive: true,
          })
          .then(() => console.log('[Conversation Close] Close request completed'))
          .catch(err => console.error('[Unload] Failed to close conversation:', err))
          .finally(() => {
            // Reset flag after request completes (success or failure)
            closeRequestInProgressRef.current = false;
            console.log('[Conversation Close] Reset close flag');
          });
        } else {
          // sendBeacon succeeded - reset flag after short delay (sendBeacon doesn't return Promise)
          setTimeout(() => {
            closeRequestInProgressRef.current = false;
            console.log('[Conversation Close] Reset close flag after sendBeacon');
          }, 1000);
        }
      } else if (closeRequestInProgressRef.current && conversationId) {
        console.log('[Conversation Close] Skipping duplicate close request - already in progress');
      }
    };

    // Listen for page unload (browser close, refresh, navigate away)
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      // Reset flag when dependencies change (new conversation started)
      closeRequestInProgressRef.current = false;
    };
  }, [conversationId, selectedTenant, selectedAgent, messages.length]);

  // Refresh agent/tenant data when page becomes visible (after returning from dashboard)
  useEffect(() => {
    const refreshDataOnVisible = async () => {
      if (document.visibilityState === 'visible' && selectedTenant && selectedAgent) {
        console.log('[Data Refresh] Page became visible, refreshing agent/tenant data...');
        try {
          const tenantIdFromUrl = searchParams.get('tenantId');
          
          if (isEmbedded && tenantIdFromUrl) {
            // Refresh embedded tenant config
            const res = await fetch(`/api/public/tenant-config?id=${encodeURIComponent(tenantIdFromUrl)}&t=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) {
              const json = await res.json();
              const freshTenant = json?.tenant;
              if (freshTenant) {
                setAllTenants([freshTenant]);
                // Update selected tenant if it matches
                if (freshTenant.id === selectedTenant.id) {
                  setSelectedTenant(freshTenant);
                  // Update selected agent if it exists in fresh tenant
                  const freshAgent = freshTenant.agents?.find((a: Agent) => a.id === selectedAgent.id);
                  if (freshAgent) {
                    setSelectedAgent(freshAgent);
                    console.log('[Data Refresh] Agent training contexts updated:', freshAgent.trainingContexts?.length || 0);
                  }
                }
              }
            }
          } else {
            // Refresh admin/app mode tenants
            const tenantsRes = await fetch('/api/tenants?t=' + Date.now(), { cache: 'no-store' });
            if (tenantsRes.ok) {
              const tenantsJson = await tenantsRes.json();
              const freshTenants = tenantsJson.tenants ?? [];
              setAllTenants(freshTenants);
              // Update selected tenant and agent with fresh data
              const freshTenant = freshTenants.find((t: Tenant) => t.id === selectedTenant.id);
              if (freshTenant) {
                setSelectedTenant(freshTenant);
                const freshAgent = freshTenant.agents?.find((a: Agent) => a.id === selectedAgent.id);
                if (freshAgent) {
                  setSelectedAgent(freshAgent);
                  console.log('[Data Refresh] Agent training contexts updated:', freshAgent.trainingContexts?.length || 0);
                }
              }
            }
          }
        } catch (error) {
          console.error('[Data Refresh] Failed to refresh data:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', refreshDataOnVisible);
    return () => document.removeEventListener('visibilitychange', refreshDataOnVisible);
  }, [selectedTenant, selectedAgent, isEmbedded, searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        // Plans are public; fetch regardless of embed mode
        const plansRes = await fetch('/api/plans', { cache: 'no-store' });
        if (plansRes.ok) {
          const plansJson = await plansRes.json();
          setAllPlans(plansJson.plans ?? INITIAL_PLANS_DATA);
        } else {
          console.error('Failed to fetch plans:', plansRes.status);
          setAllPlans(INITIAL_PLANS_DATA);
        }

        const tenantIdFromUrl = searchParams.get('tenantId');

        if (isEmbedded && tenantIdFromUrl) {
          // In embedded mode, fetch a public, sanitized tenant config
          try {
            const res = await fetch(`/api/public/tenant-config?id=${encodeURIComponent(tenantIdFromUrl)}`, { cache: 'no-store' });
            if (res.ok) {
              const json = await res.json();
              const tenant = json?.tenant;
              setAllTenants(tenant ? [tenant] : INITIAL_TENANTS_DATA);
            } else {
              setAllTenants(INITIAL_TENANTS_DATA);
            }
          } catch {
            setAllTenants(INITIAL_TENANTS_DATA);
          }
        } else {
          // Admin/app mode requires auth to fetch tenants
          try {
            const tenantsRes = await fetch('/api/tenants', { cache: 'no-store' });
            if (tenantsRes.ok) {
              const tenantsJson = await tenantsRes.json();
              setAllTenants(tenantsJson.tenants ?? INITIAL_TENANTS_DATA);
            } else {
              console.error('Failed to fetch tenants:', tenantsRes.status);
              setAllTenants(INITIAL_TENANTS_DATA);
            }
          } catch {
            setAllTenants(INITIAL_TENANTS_DATA);
          }
        }
      } catch (error) {
        console.error('Failed to load initial data from server.', error);
        setAllPlans(INITIAL_PLANS_DATA);
        setAllTenants(INITIAL_TENANTS_DATA);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isEmbedded, searchParams]);

  const handleTenantAndAgentSetup = useCallback(async (tenantIdFromUrl: string | null, agentIdFromUrl: string | null) => {
    if (isLoading || allTenants.length === 0) return;

    setIsTenantDisabled(false);
    setTenantDisabledReason('');
    setCurrentLeadId(null);

    let currentTenant = allTenants.find(t => t.id === tenantIdFromUrl);
    if (!currentTenant) {
      if (tenantIdFromUrl && !isEmbedded) {
        toast({ title: "Tenant Not Found", description: `Tenant ID "${tenantIdFromUrl}" is invalid. Loading default assistant.`, variant: "destructive" });
      } else if (tenantIdFromUrl) {
        console.warn(`Tenant ID "${tenantIdFromUrl}" not found; loading default assistant.`);
      }
      currentTenant = allTenants.find(t => t.id === 'default_tenant') || allTenants[0];
    }
    if (!currentTenant) { setIsLoading(false); return; }

    setSelectedTenant(currentTenant);

    if (currentTenant.status !== 'Active') {
        setIsTenantDisabled(true);
        const reason = currentTenant.status === 'Disabled (Payment Due)'
            ? 'This chatbot is currently disabled due to a pending payment. Please contact the administrator.'
            : 'This chatbot has reached its monthly usage limit and is temporarily disabled. Please contact the administrator.';
        setTenantDisabledReason(reason);
        setMessages([{ role: 'system', content: reason }]);
        setSelectedAgent(undefined);
        setHasMultipleAgents(false);
        return;
    }

    // Check trial status and auto-downgrade if expired
    const currentPlan = allPlans.find(p => p.id === (currentTenant as Tenant).assignedPlanId);
    const freePlan = allPlans.find(p => p.id === 'free');

    if (currentPlan && freePlan) {
        const trialStatus = checkTrialStatus(currentTenant, currentPlan, 14); // Default 14 days

        if (trialStatus.shouldDowngrade) {
            // Auto-downgrade expired trial
            try {
                await fetch('/api/tenants', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: currentTenant.id,
                        updates: {
                            assignedPlanId: 'free',
                            supportedLanguages: [{ code: 'en-US', name: 'English' }] // Reset to free plan language
                        }
                    })
                });

                // Update local tenant data
                currentTenant = {
                    ...currentTenant,
                    assignedPlanId: 'free',
                    supportedLanguages: [{ code: 'en-US', name: 'English' }]
                };
                setSelectedTenant(currentTenant as Tenant);

                toast({
                    title: "Trial Expired",
                    description: "Your trial has ended. The chatbot is now using the free plan with limited features.",
                    variant: "destructive"
                });
            } catch (error) {
                console.error('Failed to auto-downgrade expired trial:', error);
            }
        }
    }

    setMessages([]);
    setInput('');
    setLanguageCode(currentTenant.supportedLanguages?.[0]?.code || 'en-US');
    setAttachedImageDataUri(null);

    // If an agentId is provided in the URL and exists for this tenant, preselect it
    if (agentIdFromUrl) {
      const byId = currentTenant.agents?.find(a => a.id === agentIdFromUrl);
      if (byId) {
        setHasMultipleAgents(false);
        setSelectedAgent(byId);
        const greeting = byId.greeting || `Hello! I'm ${byId.name}. How can I help you today?`;
        setMessages([{role: 'agent', content: greeting, agentAvatarUrl: byId.avatarUrl, agentAvatarHint: byId.avatarHint, agentName: byId.name}]);
        return;
      }
    }

    // Always auto-select the first available agent (admin controls which agent via dashboard)
    setHasMultipleAgents(false);
    const agentToSelect = currentTenant.agents?.[0];
    if (agentToSelect) {
      setSelectedAgent(agentToSelect);
      const greeting = agentToSelect.greeting || `Hello! I'm ${agentToSelect.name}. How can I help you today?`;
      setMessages([{role: 'agent', content: greeting, agentAvatarUrl: agentToSelect.avatarUrl, agentAvatarHint: agentToSelect.avatarHint, agentName: agentToSelect.name}]);
    } else {
      setSelectedAgent(undefined);
      toast({ title: "Configuration Issue", description: "This tenant has no agents configured.", variant: "destructive" });
      setMessages([{role: 'system', content: 'Sorry, there are no agents available to chat with at the moment.'}]);
    }
  }, [allTenants, toast, isLoading]);

  useEffect(() => {
    if (!isLoading && allTenants.length > 0) {
      void handleTenantAndAgentSetup(searchParams.get('tenantId'), searchParams.get('agentId'));
    }
  }, [searchParams, handleTenantAndAgentSetup, isLoading, allTenants]);

  const handleAgentSelection = (agent: Agent) => {
    setSelectedAgent(agent);
    setAttachedImageDataUri(null);
    setCurrentLeadId(null);
    const greeting = agent.greeting || `Hello! I'm ${agent.name}. How can I help you today?`;
    setMessages([{role: 'agent', content: greeting, agentAvatarUrl: agent.avatarUrl, agentAvatarHint: agent.avatarHint, agentName: agent.name}]);
  };

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = languageCode;
  }, [languageCode]);

  const currentPlan = React.useMemo(() => 
    allPlans.find(p => p.id === selectedTenant?.assignedPlanId), 
    [allPlans, selectedTenant?.assignedPlanId]
  );
  
  const isPaidPlan = currentPlan?.allowsCustomBranding ?? false;
  const showBranding = !isPaidPlan;
  
  const displayLogoUrl = React.useMemo(() => 
    isPaidPlan ? (selectedTenant?.companyLogoUrl || undefined) : undefined,
    [isPaidPlan, selectedTenant?.companyLogoUrl]
  );
  
  const displayTenantNameNode = React.useMemo(() => 
    isPaidPlan ? (selectedTenant?.name) : SAAS_PRODUCT_NAME,
    [isPaidPlan, selectedTenant?.name]
  );
  
  const brandColor = selectedTenant?.brandColor || (isPaidPlan ? '#7c3aed' : '#2795f2');
  
  const availableLanguages = React.useMemo(() => 
    (selectedTenant?.supportedLanguages && selectedTenant.supportedLanguages.length > 0)
      ? selectedTenant.supportedLanguages
      : [{ code: 'en-US', name: 'English' }],
    [selectedTenant?.supportedLanguages]
  );

  if (isLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-transparent p-4 animate-in fade-in duration-500">
            <Card className="p-6 text-center border-cyan-500/20 bg-card/95 backdrop-blur-sm shadow-xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-center mb-4">
                <ThemeLogo 
                  size={64} 
                  animate={false}
                  glowIntensity="low"
                />
              </div>
              <CardTitle className="text-base font-semibold bg-gradient-to-r from-cyan-700 via-purple-700 to-pink-700 dark:from-cyan-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-1">Initializing...</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Loading chatbot</CardDescription>
            </Card>
          </div>
      );
  }

  const chatInputDisabled = isTenantDisabled || isGeneratingResponse || (!selectedAgent && hasMultipleAgents) || !selectedTenant;
  const showMicButton = input.trim() === '';

  const handleWidgetClose = () => {
    setIsWidgetOpen(false);
    stopAllAudio();
  }

  const clearImageAttachment = () => {
    setAttachedImageDataUri(null);
    toast({title: "Image Cleared", description: "The image attachment has been removed."});
  };

  return (
    <div className={cn("bg-transparent brand-themed")} style={{
      '--brand-primary': brandColor,
      '--brand-primary-hsl': brandColor ? hexToHsl(brandColor) : undefined,
      '--brand-primary-hsl-dark': brandColor ? hexToHsl(brandColor) : undefined
    } as React.CSSProperties}>
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageFileSelect}
          style={{ display: 'none' }}
          accept="image/*"
        />
        <audio ref={premiumAudioRef} src={premiumAudioDataUri ?? undefined} muted={isMuted} />
        <div className={cn(isEmbedded ? "fixed inset-0 z-0" : "fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50") }>
            {isWidgetOpen && (
                <div className={cn("widget-open w-[90vw] h-[calc(100vh-120px)] max-w-[420px] max-h-[520px] sm:w-[calc(100vw-40px)] sm:h-[calc(100vh-100px)] sm:max-w-[400px] sm:max-h-[600px]", isEmbedded && "w-full h-full max-w-none max-h-none") }>
                    <Card className={cn("w-full h-full text-card-foreground rounded-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700", isEmbedded ? "shadow-none" : "shadow-2xl") }>
                        <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between gap-3 shrink-0">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {displayLogoUrl && (
                                  <div className="h-10 w-10 shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 p-2">
                                    <img src={displayLogoUrl} alt="Logo" data-ai-hint="company logo" className="h-full w-full object-contain"/>
                                  </div>
                                )}
                                <div className="flex flex-col justify-center overflow-hidden">
                                    <h1 className="text-base font-semibold truncate text-gray-900 dark:text-white">
                                        <span>{displayTenantNameNode}</span>
                                    </h1>
                                    {selectedAgent && (
                                      <div className="flex items-center gap-2 -mt-0.5">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">with {selectedAgent.name}</p>
                                      </div>
                                    )}
                                </div>
                            </div>

                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full ml-auto hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={handleWidgetClose}>
                                <CloseIcon size={16} className="text-gray-500 dark:text-gray-400" />
                                <span className="sr-only">Close chat</span>
                            </Button>
                        </header>

                        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 pb-2 bg-white dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                            <div className="space-y-3 pb-20 sm:pb-8">
                            {messages.map((message, index) => (
                                <ChatMessage
                                    key={index}
                                    role={message.role}
                                    content={message.content}
                                    agentAvatarUrl={message.role === 'agent' ? selectedAgent?.avatarUrl : undefined}
                                    agentAvatarHint={message.role === 'agent' ? selectedAgent?.avatarHint : undefined}
                                    agentName={message.role === 'agent' ? selectedAgent?.name : undefined}
                                    onCopy={handleCopyMessage}
                                />
                            ))}
                            {(isGeneratingResponse || isTyping) && messages.length > 0 && (
                                <div className="flex justify-start items-end gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={selectedAgent?.avatarUrl || '/icon-192.png'} alt={selectedAgent?.name || 'Agent'} data-ai-hint={selectedAgent?.avatarHint || 'voice chat ai assistant'} className="object-cover"/>
                                        <AvatarFallback className="bg-gray-100 dark:bg-gray-800 p-1"><Image src="/icon-192.png" alt="Agent" width={24} height={24} className="w-full h-full object-contain" /></AvatarFallback>
                                    </Avatar>
                                    <div className="rounded-xl py-3 px-4 max-w-xs text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                        <span className="typing-indicator flex gap-1">
                                          <span className="typing-dot bg-gray-400"></span>
                                          <span className="typing-dot bg-gray-500"></span>
                                          <span className="typing-dot bg-gray-600"></span>
                                        </span>
                                    </div>
                                </div>
                            )}
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-3">
                             {attachedImageDataUri && (
                                <div className="relative w-fit">
                                    <img src={attachedImageDataUri} alt="Attachment preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" data-ai-hint="image preview"/>
                                    <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 text-white"
                                    onClick={clearImageAttachment}
                                    >
                                    <CloseIcon size={12} />
                                    </Button>
                                </div>
                            )}
                             <div className="flex items-end gap-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  onClick={() => imageInputRef.current?.click()}
                                  disabled={chatInputDisabled}
                                >
                                  <Paperclip size={18} className="text-gray-500 dark:text-gray-400" />
                                  <span className="sr-only">Attach image</span>
                                </Button>
                                <Textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder={isListening ? "Listening..." : (isTenantDisabled ? tenantDisabledReason : "Type or press mic...")}
                                    className="flex-1 min-h-[44px] max-h-[100px] rounded-xl text-sm resize-none py-3 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-all"
                                    disabled={chatInputDisabled}
                                    rows={1}
                                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                />
                                {showMicButton ? (
                                    <Button onClick={handleMicClick} disabled={chatInputDisabled} variant={isListening ? "destructive" : "default"} size="icon" className={cn("transition-all", isListening && "bg-red-500 hover:bg-red-600")} aria-label={isListening ? "Stop listening" : "Start listening"}>
                                        {isListening ? <Square size={18}/> : <Mic size={18}/>}
                                    </Button>
                                ) : (
                                    <Button onClick={() => handleSendMessage()} disabled={chatInputDisabled || (!input.trim() && !attachedImageDataUri)} size="icon" className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 transition-colors" aria-label="Send message">
                                        <Send size={18}/>
                                    </Button>
                                )}
                            </div>
                        </div>
                        <footer className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                           {showBranding ? (
                                <a href={SAAS_PLATFORM_WEBSITE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-1 text-center group">
                                    {SAAS_BRANDING_NAME} <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
                                </a>
                            ) : <div></div>}
                            <div className="flex items-center gap-3">
                                <Button onClick={handleMuteToggle} variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label={isMuted ? "Unmute" : "Mute"}>
                                    {isMuted ? <VolumeX size={14} className="text-gray-500 dark:text-gray-400" /> : <Volume2 size={14} className="text-gray-500 dark:text-gray-400" />}
                                </Button>
                                <div className="flex items-center gap-2">
                                    <LanguageIcon className="w-3 h-3 text-gray-500 dark:text-gray-400"/>
                                    <Select
                                        value={languageCode}
                                        onValueChange={setLanguageCode}
                                        disabled={isListening || isGeneratingResponse || !selectedTenant}
                                    >
                                        <SelectTrigger
                                            className="h-auto w-auto border-0 bg-transparent p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:ring-0 focus:ring-offset-0 text-xs transition-colors"
                                            title="Select Language"
                                        >
                                            <SelectValue placeholder="Language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableLanguages.map(lang => (
                                              <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </footer>
                    </Card>
                </div>
            )}
            {/* Launcher button (hidden when embedded: parent controls iframe size) */}
            {!isEmbedded && (
              <Button
                  onClick={() => setIsWidgetOpen(!isWidgetOpen)}
                  className={cn(
                      "rounded-full h-14 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 text-base font-medium bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 border border-gray-200 dark:border-gray-700",
                      isWidgetOpen ? "w-14" : "px-6"
                  )}
                  aria-label={isWidgetOpen ? "Close chat" : "Open chat"}
              >
                  {isWidgetOpen ? (
                      <CloseIcon size={24} className="transition-transform duration-200 hover:rotate-90" />
                  ) : (
                      <>
                          {selectedTenant?.launcherButtonIcon !== 'none' && (
                            <span className="inline-flex items-center justify-center rounded-full w-8 h-8 mr-2 bg-white/10 dark:bg-gray-800/20" aria-hidden>
                              {selectedTenant?.launcherButtonIcon === 'chat' && <MessageCircle size={18} />}
                              {selectedTenant?.launcherButtonIcon === 'help' && <HelpCircle size={18} />}
                              {selectedTenant?.launcherButtonIcon === 'phone' && <Phone size={18} />}
                              {(!selectedTenant?.launcherButtonIcon || selectedTenant?.launcherButtonIcon === 'mic') && <Mic size={18} />}
                            </span>
                          )}
                          <span
                            className={cn(
                              "text-sm sm:text-base",
                              selectedTenant?.launcherButtonStyle === 'light' && "font-normal",
                              selectedTenant?.launcherButtonStyle === 'bold' && "font-bold",
                              (!selectedTenant?.launcherButtonStyle || selectedTenant?.launcherButtonStyle === 'normal') && "font-medium"
                            )}
                          >
                            {selectedTenant?.launcherButtonText || 'Chat with us'}
                          </span>
                      </>
                  )}
              </Button>
            )}
        </div>
    </div>
  );
}

function HomeWrapper() {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embed') === '1';

  // Set proper background for embedded widget based on parent theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.has('embed')) {
            // Try to detect parent theme from iframe context
            try {
                const parentTheme = window.parent?.document?.documentElement?.classList?.contains('dark');
                if (parentTheme) {
                    document.documentElement.classList.add('dark');
                    document.body.style.background = 'hsl(222, 84%, 4.9%)'; // Dark theme background
                } else {
                    document.documentElement.classList.remove('dark');
                    document.body.style.background = 'hsl(0, 0%, 99%)'; // Light theme background
                }
            } catch (e) {
                // Fallback if we can't access parent (cross-origin)
                document.body.style.background = 'transparent';
            }
        }
    }
  }, []);

  if (isEmbedded) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <ChatPageContent />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <ChatPageContent />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <MonochromeLoader size="lg" title="Loading Chat..." subtitle="Preparing your conversation..." />
      </div>
    }>
      <HomeWrapper />
    </Suspense>
  );
}
