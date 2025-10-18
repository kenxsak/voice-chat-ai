'use client';

import React, {useState, useRef, useEffect, useCallback, Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
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
import {Mic, Square, Building, Send, X as CloseIcon, Bot, Languages as LanguageIcon, MessageSquare, ExternalLink, Volume2, VolumeX, Copy, Paperclip, MessageCircle, HelpCircle, Phone, ChevronDown, Minimize2, ThumbsUp, ThumbsDown, RotateCcw, Download, Sparkles, Plus } from "lucide-react";
import { cn, hexToHsl } from "@/lib/utils";
import { differenceInMonths } from 'date-fns';
import { checkTrialStatus, getEffectivePlanLimits, type TrialStatus } from '@/lib/trial-management';

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

// Suggested quick replies for users
const QUICK_REPLIES = [
  "How can I get started?",
  "Tell me about pricing",
  "I need technical support",
  "Talk to a human agent",
];

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
            className="text-blue-500 hover:text-blue-600 underline underline-offset-2 hover:underline-offset-4 transition-all"
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

const ChatMessage = React.memo(({role, content, agentAvatarUrl, agentAvatarHint, agentName, onCopy, onFeedback, messageId, imageDataUri }: { 
  role: 'user' | 'agent' | 'system'; 
  content: string | React.ReactNode; 
  agentAvatarUrl?: string; 
  agentAvatarHint?: string; 
  agentName?: string; 
  onCopy: (text: string) => void;
  onFeedback?: (messageId: string, isPositive: boolean) => void;
  messageId?: string;
  imageDataUri?: string;
}) => {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  
  // Process content to make links clickable for agent messages
  // Ensure content is always a string or valid React node
  const safeContent = typeof content === 'object' && content !== null && !React.isValidElement(content)
    ? ((content as any).text || JSON.stringify(content))
    : content;
  
  const processedContent = role === 'agent' && typeof safeContent === 'string' 
    ? linkifyText(safeContent)
    : safeContent;

  const handleFeedback = (isPositive: boolean) => {
    setFeedback(isPositive ? 'positive' : 'negative');
    if (onFeedback && messageId) {
      onFeedback(messageId, isPositive);
    }
  };

  return (
    <div className={`group flex items-start mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {role === 'agent' && (
        <div className="flex flex-col gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-7 h-7 rounded-full hover:bg-muted/80" 
            onClick={() => typeof safeContent === 'string' && onCopy(safeContent)}
            title="Copy message"
          >
            <Copy size={14} />
          </Button>
          {onFeedback && messageId && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "w-7 h-7 rounded-full hover:bg-green-50",
                  feedback === 'positive' && "bg-green-100 text-green-600"
                )}
                onClick={() => handleFeedback(true)}
                title="Helpful"
              >
                <ThumbsUp size={14} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "w-7 h-7 rounded-full hover:bg-red-50",
                  feedback === 'negative' && "bg-red-100 text-red-600"
                )}
                onClick={() => handleFeedback(false)}
                title="Not helpful"
              >
                <ThumbsDown size={14} />
              </Button>
            </>
          )}
        </div>
      )}
      <div className={`flex items-end max-w-[85%] ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        {role === 'agent' && (
          <Avatar className="h-8 w-8 mr-2.5 shrink-0 ring-2 ring-primary/10 shadow-sm">
            <AvatarImage 
              src={agentAvatarUrl && agentAvatarUrl.trim() !== '' ? agentAvatarUrl : '/logo.png'} 
              alt={agentName || 'Agent'} 
              data-ai-hint={agentAvatarHint || 'agent avatar'} 
              className="object-cover" 
              loading="lazy"
              onError={(e) => {
                console.log('Avatar image failed to load:', agentAvatarUrl);
                e.currentTarget.src = '/logo.png';
              }}
            />
            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
              <Bot size={16}/>
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex flex-col gap-1">
          {role === 'agent' && (
            <span className="text-xs font-medium text-muted-foreground ml-0.5">{agentName || 'Assistant'}</span>
          )}
          <div
            className={cn(
              "rounded-2xl py-2.5 px-4 shadow-sm transition-all hover:shadow-md",
              role === 'user' 
                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md' 
                : role === 'agent' 
                ? 'bg-card text-card-foreground border border-border/50 rounded-bl-md backdrop-blur-sm'
                : 'bg-muted/50 text-muted-foreground text-center w-full mx-auto max-w-md text-xs p-3 rounded-xl'
            )}
          >
            <div className="text-sm leading-relaxed">
              {role === 'user' && imageDataUri && (
                <img src={imageDataUri} alt="User upload" className="max-w-xs rounded-lg mb-2 border border-border/30" data-ai-hint="user image upload" />
              )}
              {processedContent}
            </div>
          </div>
          {role === 'agent' && (
            <span className="text-[10px] text-muted-foreground/70 ml-0.5">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
      {role === 'user' && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-7 h-7 ml-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted/80" 
          onClick={() => {
            let textToCopy = '';
            if (typeof content === 'string') {
              textToCopy = content;
            } else if (React.isValidElement(content) && content.props.children) {
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
          }}
          title="Copy message"
        >
          <Copy size={14} />
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(undefined);
  const [hasMultipleAgents, setHasMultipleAgents] = useState(false);
  const [isTenantDisabled, setIsTenantDisabled] = useState(false);
  const [tenantDisabledReason, setTenantDisabledReason] = useState('');

  const [messages, setMessages] = useState<{ role: 'user' | 'agent' | 'system'; content: string | React.ReactNode; agentAvatarUrl?: string; agentAvatarHint?: string; agentName?: string; id?: string; imageDataUri?: string; }[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [languageCode, setLanguageCode] = useState('en-US');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [premiumVoicesAvailable, setPremiumVoicesAvailable] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  const [premiumAudioDataUri, setPremiumAudioDataUri] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImageDataUri, setAttachedImageDataUri] = useState<string | null>(null);
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Load conversation messages from localStorage
  const loadConversationMessages = useCallback(async (convId: string) => {
    try {
      if (typeof window !== 'undefined') {
        const storedMessages = localStorage.getItem('vcai_messages');
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages);
          if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
            setMessages(parsedMessages);
            console.log('🎤 Loaded messages from localStorage:', parsedMessages.length);
            return;
          }
        }
      }
      
      // No messages found, show greeting instead
      if (selectedAgent) {
        const greeting = selectedAgent.greeting || `Hello! I'm ${selectedAgent.name}. How can I help you today?`;
        setMessages([{
          role: 'agent', 
          content: greeting, 
          agentAvatarUrl: selectedAgent.avatarUrl, 
          agentAvatarHint: selectedAgent.avatarHint, 
          agentName: selectedAgent.name,
          id: `msg_${Date.now()}`
        }]);
      }
    } catch (error) {
      console.error('Failed to load messages from localStorage:', error);
      // Fallback to greeting on error
      if (selectedAgent) {
        const greeting = selectedAgent.greeting || `Hello! I'm ${selectedAgent.name}. How can I help you today?`;
        setMessages([{
          role: 'agent', 
          content: greeting, 
          agentAvatarUrl: selectedAgent.avatarUrl, 
          agentAvatarHint: selectedAgent.avatarHint, 
          agentName: selectedAgent.name,
          id: `msg_${Date.now()}`
        }]);
      }
    }
  }, [selectedAgent]);

  // Save messages to localStorage whenever messages change
  const saveMessagesToLocalStorage = useCallback((messagesToSave: any[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vcai_messages', JSON.stringify(messagesToSave));
        console.log('💾 Saved messages to localStorage:', messagesToSave.length);
      } catch (error) {
        console.error('Failed to save messages to localStorage:', error);
      }
    }
  }, []);

  // Clear conversation and start new chat
  const startNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setInput('');
    setAttachedImageDataUri(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vcai_conversation_id');
      localStorage.removeItem('vcai_last_chat_time');
      localStorage.removeItem('vcai_messages');
      // Generate new session ID to ensure fresh conversation
      const newSessionId = `sid_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      sessionStorage.setItem('vcai_session_id', newSessionId);
    }
    // Show greeting message
    if (selectedAgent) {
      const greeting = selectedAgent.greeting || `Hello! I'm ${selectedAgent.name}. How can I help you today?`;
      setMessages([{
        role: 'agent', 
        content: greeting, 
        agentAvatarUrl: selectedAgent.avatarUrl, 
        agentAvatarHint: selectedAgent.avatarHint, 
        agentName: selectedAgent.name,
        id: `msg_${Date.now()}`
      }]);
    }
  }, [selectedAgent]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToLocalStorage(messages);
    }
  }, [messages, saveMessagesToLocalStorage]);
  
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

    unlockAudio();
    window.speechSynthesis.cancel();
    if ((window.speechSynthesis as any).paused) {
      (window.speechSynthesis as any).resume?.();
    }
    
    const start = (resolve: () => void) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const allVoices = window.speechSynthesis.getVoices();

      const langLower = lang.toLowerCase();
      const baseLang = langLower.split('-')[0];
      const isFemalePref = (voicePref || '').startsWith('female-');
      const isMalePref = (voicePref || '').startsWith('male-');
      
      const voiceIsFemale = (v: SpeechSynthesisVoice) => /female|woman|girl|zira|samantha|susan|hazel|heera|veena|salma|meera|aish|sonia|neha|ava|victoria|sangeeta|kanya|lekha|heba|tessa|karen|moira|serena|allison|salli/i.test(v.name);
      const voiceIsMale = (v: SpeechSynthesisVoice) => /male|man|boy|david|mark|ravi|rishi|rahul|amit|raj|arvind|sagar|alex|fred|daniel|oliver|thomas|maged|xander|arthur|george|hindi male/i.test(v.name);
      const voicesByLang = allVoices.filter(v => v.lang && (v.lang.toLowerCase() === langLower || v.lang.toLowerCase().startsWith(baseLang + '-')));
      
      const pickByGender = (voices: SpeechSynthesisVoice[]) => {
        if (isFemalePref) {
          return voices.find(voiceIsFemale);
        }
        if (isMalePref) {
          return voices.find(voiceIsMale);
        }
        return undefined;
      };
      let selectedVoice: SpeechSynthesisVoice | undefined;
      
      selectedVoice = pickByGender(voicesByLang);
      
      if (!selectedVoice && (isFemalePref || isMalePref)) {
        selectedVoice = pickByGender(allVoices);
        if (selectedVoice) {
          console.log(`[Browser TTS] Gender priority: Using ${isFemalePref ? 'female' : 'male'} voice from ${selectedVoice.lang} to maintain gender consistency for ${lang}`);
        }
      }
      
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

      utterance.onstart = () => {
        resolve();
      };
      utterance.onend = () => {};
      utterance.onerror = (e) => console.warn('Speech synthesis error:', e);
      
      if (isMalePref) {
        utterance.pitch = 0.7;
        utterance.rate = 0.95;
      } else if (isFemalePref) {
        utterance.pitch = 1.2;
        utterance.rate = 1.02;
      } else {
        utterance.pitch = 1.1;
        utterance.rate = 0.98;
      }
      
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);

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
    
    return new Promise<void>((resolve) => setTimeout(() => start(resolve), 100));
  }, [isMuted, voicesLoaded, unlockAudio]);

  // Play premium audio when its data URI is set
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

  const handleFeedback = useCallback((messageId: string, isPositive: boolean) => {
    console.log(`Feedback for message ${messageId}: ${isPositive ? 'positive' : 'negative'}`);
    toast({ 
      title: "Thank you for your feedback!", 
      description: isPositive ? "We're glad this was helpful." : "We'll work on improving our responses.",
    });
  }, [toast]);

  const handleQuickReply = useCallback((reply: string) => {
    setInput(reply);
    setShowQuickReplies(false);
    setTimeout(() => handleSendMessage(reply), 100);
  }, []);

  const handleRestartConversation = useCallback(() => {
    setMessages([]);
    setInput('');
    setAttachedImageDataUri(null);
    setCurrentLeadId(null);
    setConversationId(null);
    setShowQuickReplies(true);
    
    // Clear localStorage messages
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vcai_messages');
    }
    
    if (selectedAgent) {
      const greeting = selectedAgent.greeting || `Hello! I'm ${selectedAgent.name}. How can I help you today?`;
      setMessages([{
        role: 'agent', 
        content: greeting, 
        agentAvatarUrl: selectedAgent.avatarUrl, 
        agentAvatarHint: selectedAgent.avatarHint, 
        agentName: selectedAgent.name,
        id: `msg_${Date.now()}`
      }]);
    }
    
    toast({ title: "Conversation Restarted", description: "Starting fresh! How can I help you?" });
  }, [selectedAgent, toast]);

  const handleDownloadTranscript = useCallback(() => {
    const transcript = messages.map(msg => {
      const role = msg.role === 'user' ? 'You' : msg.agentName || 'Assistant';
      const content = typeof msg.content === 'string' ? msg.content : '[Rich content]';
      return `${role}: ${content}`;
    }).join('\n\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Transcript Downloaded", description: "Your conversation has been saved." });
  }, [messages, toast]);

  const handleSendMessage = useCallback(async (text?: string) => {
    let currentTenant = selectedTenant;
    const currentPlan = allPlans.find(p => p.id === currentTenant?.assignedPlanId);
    if (!selectedAgent || !currentTenant || !currentPlan || isGeneratingResponse) return;

    let tenantFromStorage: any = currentTenant;

    if (tenantFromStorage) {
      tenantFromStorage.conversationCount = tenantFromStorage.conversationCount ?? 0;
      tenantFromStorage.leadCount = tenantFromStorage.leadCount ?? 0;
      tenantFromStorage.usageLastReset = tenantFromStorage.usageLastReset ?? new Date().toISOString();

      const lastReset = new Date(tenantFromStorage.usageLastReset);
      if (differenceInMonths(new Date(), lastReset) >= 1) {
          tenantFromStorage.conversationCount = 0;
          tenantFromStorage.leadCount = 0;
          tenantFromStorage.usageLastReset = new Date().toISOString();
      }

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

      tenantFromStorage.conversationCount += 1;
      currentTenant = tenantFromStorage;
      setSelectedTenant(currentTenant);
    }

    const currentInputVal = (text ?? input).trim();
    if (!currentInputVal && !attachedImageDataUri) return;

    unlockAudio();
    setIsGeneratingResponse(true);
    setIsTyping(true);
    setPremiumAudioDataUri(null);
    setShowQuickReplies(false);

    // Store user message as plain text for localStorage compatibility
    const userMessageForState = {
      role: 'user' as const, 
      content: currentInputVal || '',
      id: `msg_${Date.now()}`,
      imageDataUri: attachedImageDataUri || undefined
    };
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
        agentTone: selectedAgent.tone,
        agentResponseStyle: selectedAgent.responseStyle,
        agentExpertiseLevel: selectedAgent.expertiseLevel,
        agentCustomInstructions: selectedAgent.customInstructions,
      };

      if (attachedImageDataUri) {
        apiInput.imageDataUri = attachedImageDataUri;
      }

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

      if (agentResponse.conversationId) {
        setConversationId(agentResponse.conversationId);
        // Store conversation ID and timestamp in localStorage for persistence
        localStorage.setItem('vcai_conversation_id', agentResponse.conversationId);
        localStorage.setItem('vcai_last_chat_time', Date.now().toString());
        console.log('[DEBUG] Conversation ID tracked:', agentResponse.conversationId);
      }

      let displayText = agentResponse.response;
      try {
        console.log('[DEBUG] Translating text:', {
          originalText: agentResponse.response?.substring(0, 100) + '...',
          languageCode
        });
        const { translatedText } = await translateText({ text: agentResponse.response, languageCode });
        if (translatedText && translatedText.trim()) displayText = translatedText.trim();
      } catch {}

      if (!isMuted && displayText) {
        lastUtteranceTextRef.current = displayText;
        lastUtteranceLangRef.current = languageCode;
        lastUtteranceVoiceRef.current = selectedAgent.voice || '';
        
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
            
            await new Promise<void>((resolve) => {
              const audioEl = premiumAudioRef.current;
              if (!audioEl) { resolve(); return; }
              const onStart = () => { audioEl.removeEventListener('playing', onStart); resolve(); };
              audioEl.addEventListener('playing', onStart, { once: true });
              setPremiumAudioDataUri(ttsResponse.audioDataUri);
            });
            const newAgentMessage = { 
              role: 'agent' as const, 
              content: displayText, 
              agentAvatarUrl: selectedAgent.avatarUrl, 
              agentAvatarHint: selectedAgent.avatarHint, 
              agentName: selectedAgent.name,
              id: `msg_${Date.now()}`
            };
            setMessages(prev => [...prev, newAgentMessage]);
          } else {
            await playBrowserTTS(displayText, languageCode, selectedAgent.voice);
            const newAgentMessage = { 
              role: 'agent' as const, 
              content: displayText, 
              agentAvatarUrl: selectedAgent.avatarUrl, 
              agentAvatarHint: selectedAgent.avatarHint, 
              agentName: selectedAgent.name,
              id: `msg_${Date.now()}`
            };
            setMessages(prev => [...prev, newAgentMessage]);
          }
         } catch (ttsError: any) {
          console.error("Server TTS failed.", ttsError);
          setPremiumVoicesAvailable(false);
          await playBrowserTTS(displayText, languageCode, selectedAgent.voice);
          const newAgentMessage = { 
            role: 'agent' as const, 
            content: displayText, 
            agentAvatarUrl: selectedAgent.avatarUrl, 
            agentAvatarHint: selectedAgent.avatarHint, 
            agentName: selectedAgent.name,
            id: `msg_${Date.now()}`
          };
          setMessages(prev => [...prev, newAgentMessage]);
        }
      } else {
        const newAgentMessage = { 
          role: 'agent' as const, 
          content: displayText, 
          agentAvatarUrl: selectedAgent.avatarUrl, 
          agentAvatarHint: selectedAgent.avatarHint, 
          agentName: selectedAgent.name,
          id: `msg_${Date.now()}`
        };
        setMessages(prev => [...prev, newAgentMessage]);
      }

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

      const hasName = !!(finalLeadName && finalLeadName !== 'null' && finalLeadName.trim());
      const hasEmail = !!(finalLeadEmail && finalLeadEmail !== 'null' && finalLeadEmail.trim());
      const hasPhone = !!(finalLeadPhone && finalLeadPhone !== 'null' && finalLeadPhone.trim());
      
      const hasAnyContactInfo = hasName || hasEmail || hasPhone;
      const shouldSaveLead = hasAnyContactInfo || currentLeadId || messages.length > 0;
      
      console.log('[DEBUG] Contact info check:', { hasName, hasEmail, hasPhone, hasAnyContactInfo, shouldSaveLead });
      console.log('[DEBUG] Current lead ID:', currentLeadId);
      console.log('[DEBUG] Tenant from storage:', tenantFromStorage);
      console.log('[DEBUG] Lead limit check:', tenantFromStorage?.leadCount, '<', currentPlan.leadLimit);
      
      if (shouldSaveLead) {
        console.log('[DEBUG] Entering lead save section');
        if (tenantFromStorage && tenantFromStorage.leadCount < currentPlan.leadLimit) {
            console.log('[DEBUG] Lead limit check passed, proceeding with save');
            try {
              const userMessageForLogParts: Array<{ text?: string; media?: { url: string } }> = [];
              if (textToSend) userMessageForLogParts.push({ text: textToSend });
              if (attachedImageDataUri) userMessageForLogParts.push({ media: { url: attachedImageDataUri } });

              const historyForLog: ApiMessage[] = [
                ...cleanedHistoryForApi,
                ...(userMessageForLogParts.length > 0 ? [{ role: 'user' as const, content: userMessageForLogParts }] : []),
                { role: 'agent', content: agentResponse.response }
              ];

              const conversationHistoryForSummary = historyForLog.map(msg => {
                let contentString = '';
                if (typeof msg.content === 'string') {
                  contentString = msg.content;
                } else if (Array.isArray(msg.content)) {
                  const textParts = msg.content
                    .map(part => {
                      if (part.text) return part.text;
                      if (part.media?.url) return '[Image attached]';
                      return '';
                    })
                    .filter(Boolean)
                    .join(' ');
                  contentString = textParts || '';
                }
                return {
                  role: msg.role,
                  content: contentString,
                  timestamp: new Date().toISOString(),
                };
              });

              let comprehensiveSummary = agentResponse?.conversationSummary || 'No summary available';
              let summaryData: any = null;
              try {
                summaryData = await generateConversationSummary({
                  conversationHistory: conversationHistoryForSummary,
                  agentName: selectedAgent.name,
                  businessContext: uniqueContexts.map(c => c.websiteUrl).filter(Boolean).join(', '),
                });
                if (summaryData && summaryData.conversationSummary) {
                  comprehensiveSummary = summaryData.conversationSummary;
                }
                console.log('[DEBUG] Generated comprehensive summary:', {
                  summary: comprehensiveSummary,
                  customerName: summaryData?.customerName,
                  customerEmail: summaryData?.customerEmail,
                  customerPhone: summaryData?.customerPhone,
                  problemsCount: summaryData?.problemsDiscussed?.length || 0,
                  solutionsCount: summaryData?.solutionsProvided?.length || 0,
                });
              } catch (summaryError) {
                console.error('[DEBUG] Failed to generate comprehensive summary:', summaryError);
              }

              const isNewLead = !currentLeadId && (hasAnyContactInfo || messages.length > 0);
              const stableLeadId = currentLeadId || (isNewLead ? `lead_${Date.now()}` : null);
              if (!stableLeadId) {
                console.log('[DEBUG] Skipping lead save: no existing lead and no contact captured yet.');
              } else {
                if (isNewLead) {
                  setCurrentLeadId(stableLeadId);
                  tenantFromStorage.leadCount += 1;
                  setSelectedTenant(tenantFromStorage);
                }

                const isAnonymous = !hasAnyContactInfo;
                const displayName = finalLeadName || summaryData?.customerName || (isAnonymous ? 'Anonymous Person' : undefined);
                const customerInfoText = hasAnyContactInfo 
                  ? [finalLeadName, finalLeadEmail, finalLeadPhone].filter(Boolean).join(', ')
                  : 'Anonymous Person - No contact info';

                const leadPayload = {
                  id: stableLeadId!,
                  date: new Date().toISOString(),
                  customerInfo: customerInfoText,
                  customerName: displayName,
                  customerEmail: summaryData?.customerEmail || finalLeadEmail,
                  customerPhone: summaryData?.customerPhone || finalLeadPhone,
                  status: isAnonymous ? 'Anonymous conversation' : 'Follow-up needed',
                  reference: `Chat with ${selectedAgent.name}`,
                  websiteContext: uniqueContexts.map(c => c.websiteUrl).filter(Boolean).join(', ') || 'N/A',
                  summary: comprehensiveSummary,
                  history: historyForLog,
                  tenantId: currentTenant!.id,
                  imageUrl: attachedImageDataUri || undefined,
                  sessionId,
                  summaryData: summaryData || undefined,
                  isAnonymous,
                } as any;

                console.log('[DEBUG] Saving lead (create/update):', { isNewLead, id: leadPayload.id });
                const resp = await fetch('/api/leads', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(leadPayload),
                });
                console.log('[DEBUG] API response status:', resp.status);
                const saved = await resp.json().catch(() => ({}));
                console.log('[DEBUG] API response data:', saved);
                if (!resp.ok) {
                  console.error('[DEBUG] Lead save failed - HTTP not OK', { status: resp.status, body: saved });
                } else {
                  try {
                    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                      window.parent.postMessage({ source: 'vcai-widget', leadCreated: saved.lead || leadPayload, tenantId: currentTenant!.id }, '*');
                    }
                  } catch {}

                  if (currentTenant?.leadWebhookUrl) {
                    const webhookUrl = currentTenant.leadWebhookUrl;
                    const timestamp = new Date().toISOString();
                    
                    const webhookPayload = {
                      leadId: stableLeadId,
                      customerName: finalLeadName || '',
                      customerEmail: finalLeadEmail || '',
                      customerPhone: finalLeadPhone || '',
                      conversationSummary: comprehensiveSummary,
                      problemsDiscussed: summaryData?.problemsDiscussed || [],
                      solutionsProvided: summaryData?.solutionsProvided || [],
                      suggestionsGiven: summaryData?.suggestionsGiven || [],
                      fullConversationHistory: historyForLog,
                      capturedAt: timestamp,
                      agentName: selectedAgent.name,
                      agentDescription: selectedAgent.description,
                      status: 'Follow-up needed',
                      websiteContext: uniqueContexts.map(c => c.websiteUrl).filter(Boolean).join(', ') || 'N/A',
                    };

                    console.log('[WEBHOOK] Sending lead data to webhook:', webhookUrl);
                    
                    fetch(webhookUrl, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(webhookPayload),
                    })
                      .then(webhookResp => {
                        if (webhookResp.ok) {
                          console.log('[WEBHOOK] Successfully sent lead data to webhook');
                        } else {
                          console.warn('[WEBHOOK] Webhook responded with non-OK status:', webhookResp.status);
                        }
                      })
                      .catch(webhookError => {
                        console.error('[WEBHOOK] Failed to send lead data to webhook:', webhookError);
                      });
                  } else {
                    console.log('[WEBHOOK] No webhook URL configured for this tenant');
                  }
                }
              }
            } catch (e) {
              console.error("Failed to save/update lead to local storage", e);
            }
        } else {
          console.log('[DEBUG] Lead limit exceeded or missing tenant data');
          console.log('[DEBUG] TenantFromStorage:', tenantFromStorage);
          console.log('[DEBUG] Lead count:', tenantFromStorage?.leadCount);
          console.log('[DEBUG] Lead limit:', currentPlan.leadLimit);
        }
      } else {
        console.log('[DEBUG] No conversation to save (should not reach here with new logic)');
      }

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
      setAttachedImageDataUri(null);
    }
  }, [input, attachedImageDataUri, selectedAgent, selectedTenant, isGeneratingResponse, messages, languageCode, toast, playBrowserTTS, isListening, unlockAudio, allPlans, isMuted, premiumVoicesAvailable, currentLeadId, isEmbedded]);

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
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

  useEffect(() => {
    if (selectedTenant?.brandColor && typeof document !== 'undefined') {
      const brandColor = selectedTenant.brandColor;

      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 162, g: 89, b: 255 };
      };

      const rgb = hexToRgb(brandColor);
      const hsl = hexToHsl(brandColor);

      document.documentElement.style.setProperty('--brand-pulse-color-60', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);
      document.documentElement.style.setProperty('--brand-pulse-color-30', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
      document.documentElement.style.setProperty('--brand-pulse-color-90', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`);
      document.documentElement.style.setProperty('--brand-pulse-color-80', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);

      document.documentElement.style.setProperty('--accent', hsl);
      document.documentElement.style.setProperty('--primary', hsl);
    }
  }, [selectedTenant?.brandColor]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sessionId = sessionStorage.getItem('vcai_session_id') || undefined;
    
    const handleUnload = () => {
      if (conversationId && selectedTenant && sessionId && messages.length > 1 && !closeRequestInProgressRef.current) {
        console.log('[Conversation Close] Initiating conversation close - triggered by page unload/visibility change');
        closeRequestInProgressRef.current = true;
        
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
        
        const blob = new Blob([JSON.stringify(closeData)], { type: 'application/json' });
        const sent = navigator.sendBeacon('/api/conversations/close', blob);
        
        if (!sent) {
          fetch('/api/conversations/close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(closeData),
            keepalive: true,
          })
          .then(() => console.log('[Conversation Close] Close request completed'))
          .catch(err => console.error('[Unload] Failed to close conversation:', err))
          .finally(() => {
            closeRequestInProgressRef.current = false;
            console.log('[Conversation Close] Reset close flag');
          });
        } else {
          setTimeout(() => {
            closeRequestInProgressRef.current = false;
            console.log('[Conversation Close] Reset close flag after sendBeacon');
          }, 1000);
        }
      } else if (closeRequestInProgressRef.current && conversationId) {
        console.log('[Conversation Close] Skipping duplicate close request - already in progress');
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      closeRequestInProgressRef.current = false;
    };
  }, [conversationId, selectedTenant, selectedAgent, messages.length]);

  useEffect(() => {
    const refreshDataOnVisible = async () => {
      if (document.visibilityState === 'visible' && selectedTenant && selectedAgent) {
        console.log('[Data Refresh] Page became visible, refreshing agent/tenant data...');
        try {
          const tenantIdFromUrl = searchParams.get('tenantId');
          
          if (isEmbedded && tenantIdFromUrl) {
            const res = await fetch(`/api/public/tenant-config?id=${encodeURIComponent(tenantIdFromUrl)}&t=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) {
              const json = await res.json();
              const freshTenant = json?.tenant;
              if (freshTenant) {
                setAllTenants([freshTenant]);
                if (freshTenant.id === selectedTenant.id) {
                  setSelectedTenant(freshTenant);
                  const freshAgent = freshTenant.agents?.find((a: Agent) => a.id === selectedAgent.id);
                  if (freshAgent) {
                    setSelectedAgent(freshAgent);
                    console.log('[Data Refresh] Agent training contexts updated:', freshAgent.trainingContexts?.length || 0);
                  }
                }
              }
            }
          } else {
            const tenantsRes = await fetch('/api/tenants?t=' + Date.now(), { cache: 'no-store' });
            if (tenantsRes.ok) {
              const tenantsJson = await tenantsRes.json();
              const freshTenants = tenantsJson.tenants ?? [];
              setAllTenants(freshTenants);
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

    const currentPlan = allPlans.find(p => p.id === (currentTenant as Tenant).assignedPlanId);
    const freePlan = allPlans.find(p => p.id === 'free');

    if (currentPlan && freePlan) {
        const trialStatus = checkTrialStatus(currentTenant, currentPlan, 14);

        if (trialStatus.shouldDowngrade) {
            try {
                await fetch('/api/tenants', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: currentTenant.id,
                        updates: {
                            assignedPlanId: 'free',
                            supportedLanguages: [{ code: 'en-US', name: 'English' }]
                        }
                    })
                });

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
    setShowQuickReplies(true);

    // Check localStorage for existing messages (no database loading)
    if (typeof window !== 'undefined') {
      const storedMessages = localStorage.getItem('vcai_messages');
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
            setMessages(parsedMessages);
            console.log('🎤 Loaded messages from localStorage:', parsedMessages.length);
            return;
          }
        } catch (error) {
          console.error('Failed to parse stored messages:', error);
          localStorage.removeItem('vcai_messages');
        }
      }
    }

    if (agentIdFromUrl) {
      const byId = currentTenant.agents?.find(a => a.id === agentIdFromUrl);
      if (byId) {
        setHasMultipleAgents(false);
        setSelectedAgent(byId);
        const greeting = byId.greeting || `Hello! I'm ${byId.name}. How can I help you today?`;
        setMessages([{
          role: 'agent', 
          content: greeting, 
          agentAvatarUrl: byId.avatarUrl, 
          agentAvatarHint: byId.avatarHint, 
          agentName: byId.name,
          id: `msg_${Date.now()}`
        }]);
        return;
      }
    }

    setHasMultipleAgents(false);
    const agentToSelect = currentTenant.agents?.[0];
    if (agentToSelect) {
      setSelectedAgent(agentToSelect);
      const greeting = agentToSelect.greeting || `Hello! I'm ${agentToSelect.name}. How can I help you today?`;
      setMessages([{
        role: 'agent', 
        content: greeting, 
        agentAvatarUrl: agentToSelect.avatarUrl, 
        agentAvatarHint: agentToSelect.avatarHint, 
        agentName: agentToSelect.name,
        id: `msg_${Date.now()}`
      }]);
    } else {
      setSelectedAgent(undefined);
      toast({ title: "Configuration Issue", description: "This tenant has no agents configured.", variant: "destructive" });
      setMessages([{role: 'system', content: 'Sorry, there are no agents available to chat with at the moment.'}]);
    }
  }, [allTenants, toast, isLoading, allPlans, isEmbedded, searchParams, loadConversationMessages]);

  useEffect(() => {
    if (!isLoading && allTenants.length > 0) {
      void handleTenantAndAgentSetup(searchParams.get('tenantId'), searchParams.get('agentId'));
    }
  }, [searchParams, handleTenantAndAgentSetup, isLoading, allTenants]);

  const handleAgentSelection = (agent: Agent) => {
    setSelectedAgent(agent);
    setAttachedImageDataUri(null);
    setCurrentLeadId(null);
    setShowQuickReplies(true);
    const greeting = agent.greeting || `Hello! I'm ${agent.name}. How can I help you today?`;
    setMessages([{
      role: 'agent', 
      content: greeting, 
      agentAvatarUrl: agent.avatarUrl, 
      agentAvatarHint: agent.avatarHint, 
      agentName: agent.name,
      id: `msg_${Date.now()}`
    }]);
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
          <div className="flex items-center justify-center min-h-screen bg-transparent p-4">
            <Card className="p-6 text-center">
              <CardTitle>Initializing Chatbot...</CardTitle>
              <CardDescription>Loading configuration. Please wait.</CardDescription>
              <Bot className="w-12 h-12 text-primary mx-auto mt-4 animate-pulse" />
            </Card>
          </div>
      );
  }

  const chatInputDisabled = isTenantDisabled || isGeneratingResponse || (!selectedAgent && hasMultipleAgents) || !selectedTenant;
  const showMicButton = input.trim() === '';

  const handleWidgetClose = () => {
    setIsWidgetOpen(false);
    setIsMinimized(false);
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
            {isWidgetOpen && !isMinimized && (
                <div className={cn(
                  "widget-open w-[90vw] h-[calc(100vh-120px)] max-w-[420px] max-h-[600px] sm:w-[calc(100vw-40px)] sm:h-[calc(100vh-100px)] sm:max-w-[440px] sm:max-h-[680px]", 
                  isEmbedded && "w-full h-full max-w-none max-h-none"
                )}>
                    <Card className={cn(
                      "w-full h-full bg-card/98 backdrop-blur-md text-card-foreground rounded-3xl flex flex-col overflow-hidden border-2 border-border/30",
                      isEmbedded ? "shadow-none" : "shadow-2xl"
                    )}>
                        <header className="p-4 border-b-2 border-border/30 bg-gradient-to-r from-card via-muted/10 to-card flex items-center justify-between gap-3 shrink-0">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {displayLogoUrl && (
                                  <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden ring-2 ring-primary/20 shadow-sm">
                                    <img src={displayLogoUrl} alt="Logo" data-ai-hint="company logo" className="h-full w-full object-contain bg-white/5"/>
                                  </div>
                                )}
                                <div className="flex flex-col justify-center overflow-hidden">
                                    <h1 className="text-base font-bold truncate text-foreground flex items-center gap-2">
                                        <span>{displayTenantNameNode}</span>
                                        {selectedAgent && <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />}
                                    </h1>
                                    {selectedAgent && (
                                      <div className="flex items-center gap-1.5 -mt-0.5">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50"></div>
                                        <p className="text-xs text-muted-foreground truncate font-medium">
                                          {selectedAgent.name}
                                        </p>
                                      </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-8 h-8 rounded-full hover:bg-muted/60 transition-all" 
                                  onClick={handleRestartConversation}
                                  title="Restart conversation"
                                >
                                    <RotateCcw size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-8 h-8 rounded-full hover:bg-muted/60 transition-all" 
                                  onClick={() => setIsMinimized(true)}
                                  title="Minimize"
                                >
                                    <Minimize2 size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-8 h-8 rounded-full hover:bg-muted/60 transition-all" 
                                  onClick={handleWidgetClose}
                                  title="Close chat"
                                >
                                    <CloseIcon size={16} />
                                </Button>
                            </div>
                        </header>

                        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 pb-2 bg-gradient-to-b from-background/10 via-background/20 to-background/30">
                            <div className="space-y-4 pb-20 sm:pb-8">
                            {messages.map((message, index) => (
                                <ChatMessage
                                    key={message.id || index}
                                    role={message.role}
                                    content={message.content}
                                    agentAvatarUrl={message.role === 'agent' ? selectedAgent?.avatarUrl : undefined}
                                    agentAvatarHint={message.role === 'agent' ? selectedAgent?.avatarHint : undefined}
                                    agentName={message.role === 'agent' ? selectedAgent?.name : undefined}
                                    onCopy={handleCopyMessage}
                                    onFeedback={message.role === 'agent' ? handleFeedback : undefined}
                                    messageId={message.id}
                                    imageDataUri={message.imageDataUri}
                                />
                            ))}
                            {(isGeneratingResponse || isTyping) && messages.length > 0 && (
                                <div className="flex justify-start items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/10 shadow-sm">
                                        <AvatarImage 
                                          src={selectedAgent?.avatarUrl && selectedAgent.avatarUrl.trim() !== '' ? selectedAgent.avatarUrl : '/logo.png'} 
                                          alt={selectedAgent?.name || 'Agent'} 
                                          data-ai-hint={selectedAgent?.avatarHint} 
                                          className="object-cover"
                                          onError={(e) => {
                                            console.log('Typing indicator avatar failed to load:', selectedAgent?.avatarUrl);
                                            e.currentTarget.src = '/logo.png';
                                          }}
                                        />
                                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                                          <Bot size={16}/>
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="rounded-2xl py-3 px-4 shadow-sm max-w-xs text-sm bg-card/90 backdrop-blur-sm text-muted-foreground border border-border/50">
                                        <span className="typing-indicator">
                                          <span className="typing-dot"></span>
                                          <span className="typing-dot"></span>
                                          <span className="typing-dot"></span>
                                        </span>
                                    </div>
                                </div>
                            )}
                            {showQuickReplies && messages.length === 1 && !isGeneratingResponse && (
                              <div className="flex flex-wrap gap-2 mt-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                                {QUICK_REPLIES.map((reply, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full text-xs hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105 shadow-sm"
                                    onClick={() => handleQuickReply(reply)}
                                  >
                                    {reply}
                                  </Button>
                                ))}
                              </div>
                            )}
                            </div>
                        </ScrollArea>

                        <div className="p-3 border-t-2 border-border/30 bg-card space-y-2">
                             {attachedImageDataUri && (
                                <div className="relative w-fit animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <img src={attachedImageDataUri} alt="Attachment preview" className="h-16 w-16 object-cover rounded-lg border-2 border-border/50 shadow-sm" data-ai-hint="image preview"/>
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full shadow-md hover:scale-110 transition-transform"
                                      onClick={clearImageAttachment}
                                    >
                                      <CloseIcon size={12} />
                                    </Button>
                                </div>
                            )}
                             <div className="flex items-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 hover:bg-muted/60 rounded-xl transition-all hover:scale-105"
                                  onClick={() => imageInputRef.current?.click()}
                                  disabled={chatInputDisabled}
                                  title="Attach image"
                                >
                                  <Paperclip size={18} />
                                </Button>
                                <Textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder={isListening ? "Listening..." : (isTenantDisabled ? tenantDisabledReason : "Type your message...")}
                                    className="flex-1 min-h-[44px] max-h-[100px] rounded-xl text-sm resize-none py-3 px-4 border-2 focus:border-primary/50 transition-all shadow-sm"
                                    disabled={chatInputDisabled}
                                    rows={1}
                                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                />
                                {showMicButton ? (
                                    <Button 
                                      onClick={handleMicClick} 
                                      disabled={chatInputDisabled} 
                                      variant={isListening ? "destructive" : "default"} 
                                      size="icon"
                                      className="rounded-xl transition-all hover:scale-105 shadow-sm"
                                      title={isListening ? "Stop listening" : "Start listening"}
                                    >
                                        {isListening ? <Square size={18}/> : <Mic size={18}/>}
                                    </Button>
                                ) : (
                                    <Button 
                                      onClick={() => handleSendMessage()} 
                                      disabled={chatInputDisabled || (!input.trim() && !attachedImageDataUri)} 
                                      size="icon"
                                      className="rounded-xl transition-all hover:scale-105 shadow-sm"
                                      title="Send message"
                                    >
                                        <Send size={18}/>
                                    </Button>
                                )}
                            </div>
                        </div>
                        <footer className="px-3 py-2 border-t border-border/30 bg-gradient-to-r from-card to-muted/5 text-xs text-muted-foreground flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              {messages.length > 1 && (
                                <>
                                  <Button 
                                    onClick={startNewChat} 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 px-2 rounded-lg hover:bg-muted/50 text-xs"
                                  >
                                    <Plus size={12} className="mr-1" />
                                    New Chat
                                  </Button>
                                  <Button 
                                    onClick={handleDownloadTranscript} 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 rounded-lg hover:bg-muted/50"
                                  title="Download transcript"
                                >
                                    <Download size={14} />
                                </Button>
                                </>
                              )}
                              {showBranding ? (
                                <a 
                                  href={SAAS_PLATFORM_WEBSITE_URL} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="hover:underline flex items-center gap-1 text-center hover:text-foreground transition-colors"
                                >
                                    {SAAS_BRANDING_NAME} <ExternalLink className="w-3 h-3"/>
                                </a>
                              ) : <div className="text-xs font-medium">{displayTenantNameNode}</div>}
                           </div>
                            <div className={cn("flex items-center gap-2")}>
                                <Button 
                                  onClick={handleMuteToggle} 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-lg hover:bg-muted/50" 
                                  title={isMuted ? "Unmute" : "Mute"}
                                >
                                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                </Button>
                                <div className="flex items-center gap-1">
                                    <LanguageIcon className="w-3.5 h-3.5"/>
                                    <Select
                                        value={languageCode}
                                        onValueChange={setLanguageCode}
                                        disabled={isListening || isGeneratingResponse || !selectedTenant}
                                    >
                                        <SelectTrigger
                                            className="h-auto w-auto border-0 bg-transparent p-0 text-muted-foreground hover:text-foreground focus:ring-0 focus:ring-offset-0 text-xs language-select-trigger transition-colors"
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
            
            {/* Minimized state */}
            {isWidgetOpen && isMinimized && !isEmbedded && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <Card className="w-80 bg-card/98 backdrop-blur-md border-2 border-border/30 shadow-xl rounded-2xl overflow-hidden">
                  <div className="p-3 flex items-center justify-between gap-3 bg-gradient-to-r from-card via-muted/10 to-card">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {displayLogoUrl && (
                        <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden ring-2 ring-primary/20">
                          <img src={displayLogoUrl} alt="Logo" className="h-full w-full object-contain bg-white/5"/>
                        </div>
                      )}
                      <div className="flex flex-col overflow-hidden">
                        <h2 className="text-sm font-bold truncate">{displayTenantNameNode}</h2>
                        {selectedAgent && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            {selectedAgent.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-7 h-7 rounded-full hover:bg-muted/60" 
                        onClick={() => setIsMinimized(false)}
                        title="Expand"
                      >
                        <ChevronDown size={16} className="rotate-180" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-7 h-7 rounded-full hover:bg-muted/60" 
                        onClick={handleWidgetClose}
                        title="Close"
                      >
                        <CloseIcon size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            
            {/* Launcher button */}
            {!isEmbedded && (
              <Button
                  onClick={() => { setIsWidgetOpen(!isWidgetOpen); setIsMinimized(false); }}
                  className={cn(
                      "rounded-full h-14 sm:h-16 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center gap-2 text-base sm:text-lg bg-gradient-to-br from-primary to-primary/80 hover:from-primary hover:to-primary/90 text-primary-foreground border-0 hover-lift group",
                      isWidgetOpen ? "w-14 sm:w-16" : "px-5 sm:px-6"
                  )}
                  style={{
                    animation: selectedTenant?.launcherButtonAnimation === 'pulse' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' :
                               selectedTenant?.launcherButtonAnimation === 'bounce' ? 'bounce 1s infinite' :
                               selectedTenant?.launcherButtonAnimation === 'glow' ? 'glow 2s ease-in-out infinite' : 'none'
                  }}
                  aria-label={isWidgetOpen ? "Close chat" : "Open chat"}
              >
                  {isWidgetOpen ? (
                      <CloseIcon size={24} className="transition-transform duration-200 group-hover:rotate-90" />
                  ) : (
                      <>
                          {selectedTenant?.launcherButtonIcon !== 'none' && (
                            <span className="inline-flex items-center justify-center rounded-full w-7 h-7 sm:w-8 sm:h-8 shadow-lg bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all" aria-hidden>
                              {selectedTenant?.launcherButtonIcon === 'chat' && <MessageCircle size={18} />}
                              {selectedTenant?.launcherButtonIcon === 'help' && <HelpCircle size={18} />}
                              {selectedTenant?.launcherButtonIcon === 'phone' && <Phone size={18} />}
                              {(!selectedTenant?.launcherButtonIcon || selectedTenant?.launcherButtonIcon === 'mic') && <Mic size={18} />}
                            </span>
                          )}
                          <span
                            className={cn(
                              "text-sm sm:text-base text-white drop-shadow-md whitespace-nowrap",
                              selectedTenant?.launcherButtonStyle === 'light' && "font-normal",
                              selectedTenant?.launcherButtonStyle === 'bold' && "font-bold",
                              (!selectedTenant?.launcherButtonStyle || selectedTenant?.launcherButtonStyle === 'normal') && "font-semibold"
                            )}
                          >
                            {selectedTenant?.launcherButtonText || 'Chat with us'}
                          </span>
                      </>
                  )}
              </Button>
            )}
        </div>
        
        <style jsx>{`
          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(var(--brand-pulse-color-60), 0.6);
            }
            50% {
              box-shadow: 0 0 40px rgba(var(--brand-pulse-color-90), 0.9);
            }
          }
          
          .typing-indicator {
            display: flex;
            gap: 4px;
            align-items: center;
          }
          
          .typing-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: currentColor;
            animation: typing 1.4s infinite;
          }
          
          .typing-dot:nth-child(2) {
            animation-delay: 0.2s;
          }
          
          .typing-dot:nth-child(3) {
            animation-delay: 0.4s;
          }
          
          @keyframes typing {
            0%, 60%, 100% {
              transform: translateY(0);
              opacity: 0.4;
            }
            30% {
              transform: translateY(-8px);
              opacity: 1;
            }
          }
          
          .hover-lift:hover {
            transform: translateY(-2px);
          }
          
          .widget-open {
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
    </div>
  );
}

export default function Home() {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const embedded = params.get('embed') === '1';
        setIsEmbedded(embedded);
        
        if (embedded) {
            try {
                const parentTheme = window.parent?.document?.documentElement?.classList?.contains('dark');
                if (parentTheme) {
                    document.documentElement.classList.add('dark');
                    document.body.style.background = 'hsl(222, 84%, 4.9%)';
                } else {
                    document.documentElement.classList.remove('dark');
                    document.body.style.background = 'hsl(0, 0%, 99%)';
                }
            } catch (e) {
                document.body.style.background = 'transparent';
            }
        }
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">Loading Chat...</div>
      </div>
    );
  }

  if (isEmbedded) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Suspense fallback={null}>
          <ChatPageContent />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <Suspense fallback={<div className="text-center">Loading Chat...</div>}>
        <ChatPageContent />
      </Suspense>
    </div>
  );
}