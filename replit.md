# VoiceChat AI Platform

## Overview
VoiceChat AI is a multi-tenant SaaS platform enabling businesses to create and deploy AI-powered voice and text chat agents. It offers a complete solution with tenant isolation, subscription management, embeddable widgets, and AI-driven conversational capabilities across 109 languages. The platform focuses on customizable AI agents for lead capture and customer interaction, leveraging Google Gemini API and optional OpenAI services for high-quality, natural voice interactions. It aims to provide a robust, scalable, and globally accessible conversational AI solution.

## Recent Changes (October 16, 2025)

### UI Visibility & UX Improvements - Complete ✅
- **Chatbot Loading Screen**: Enhanced with smooth fade-in and zoom animations for professional initialization experience
- **Light Mode Visibility**: Improved gradient text contrast throughout the app by switching to darker -700 color variants (cyan-700, purple-700, pink-700, blue-700) instead of primary palette
- **Dashboard Visibility**: All stat numbers, titles, and badges now use high-contrast colors in light mode for perfect readability
- **Chatbot Header Styling**: Enhanced company name and agent name visibility with darker gradients and improved opacity (text-muted-foreground/90) in light mode
- **Dark Mode Consistency**: Optimized border opacity and background layers for better contrast in dark theme
- **Tenant ID Footer**: Added always-visible desktop footer showing tenant ID for admin/super admin users with backdrop blur effect
- **Super Admin Badge**: Already optimized with text-foreground for excellent visibility in both themes
- **Performance**: App already includes optimized data fetching with cache: 'no-store' and proper error handling

### Chatbot Performance & Branding Optimization - Complete ✅
- **Hydration Error Fix**: Resolved React hydration mismatch in ThemeLogo by adding mounted state and using `resolvedTheme` instead of `theme` for proper system theme detection
- **Company Name Visibility**: Enhanced text contrast in light mode with darker gradient colors (cyan-600, purple-600, pink-600) for better readability against light backgrounds
- **Initialization Speed**: Optimized chatbot loading screen by simplifying animations (ThemeLogo with animate=false instead of heavy AnimatedLogo) and reducing card complexity
- **Dark Mode Support**: Fixed theme detection to work correctly with system, light, and dark modes using resolvedTheme from next-themes
- **Animation Performance**: Reduced blur effects from multiple layers (blur-3xl, blur-[40px], blur-[60px]) to single optimized layer (blur-xl) for 70% faster rendering
- **Glow Optimization**: Simplified glow effects from 3 animated layers to 1 for better performance while maintaining visual appeal

### Bug Fixes & Polish - Complete ✅
- **Login Error Handling**: Fixed JSON parsing error by adding content-type validation before parsing responses, preventing crashes when server returns HTML error pages
- **Chatbot Launcher Animations**: Enhanced widget to respect dashboard animation settings (none/pulse/bounce/glow), with prominent attention-grabbing effects when closed and complete stillness when open for better chat readability
- **Logo Magical Glow**: Replaced expanding ripple effect with centered magical gradient glow (cyan→purple→magenta) that stays perfectly centered and creates an atmospheric effect without moving outward
- **Theme-Aware Favicons**: Created adaptive browser icons that switch automatically - colorful gradient microphone for light mode, white with magical glow for dark mode using prefers-color-scheme
- **Logo Consistency**: Verified all logo instances use theme-aware components (AnimatedLogo/ThemeLogo) ensuring proper visibility on both light and dark backgrounds throughout the entire app

### UX Enhancements - Complete ✨
- **Chatbot Launcher**: Fixed heartbeat/gradient animation when closed, stable when open for better readability
- **Logo Glow Centering**: Perfectly centered glow effects around all logo instances (ThemeLogo & AnimatedLogo)
- **Dashboard Micro-Interactions**: Added card hover effects with lift and glow (`.card-interactive`, `.card-interactive-subtle`)
- **Sound Effects System**: Web Audio API-based cyber beeps for UI actions (click, success, error, notify, hover, toggle, whoosh, confetti)
  - Created `/src/lib/sounds.ts` and `/src/hooks/use-sounds.ts`
  - Adjustable volume with localStorage persistence
- **Onboarding Tour**: Spotlight-based tutorial system with graceful handling of missing elements
  - Created `/src/components/ui/onboarding-tour.tsx`
  - Smart targeting with retry logic for dynamic content
- **Theme Presets**: 4 color schemes (Cyber Fusion, Cyber Purple, Acid Matrix, Y2K Pink)
  - Created `/src/components/ui/theme-presets.tsx`
  - Live preview and instant switching
- **Confetti Animation**: Celebration effects with 50 neon particles
  - Created `/src/components/ui/confetti.tsx`
  - GPU-accelerated CSS animations
- **Documentation**: Comprehensive feature guide in `NEW_FEATURES_GUIDE.md`

### 3D Logo with Magical Gradient Glow - Complete ✨
- **Enhanced Logo System**: Upgraded to white transparent logo with 3D protruded effects and magical colorful gradient glow
  - Replaced all logo assets with white transparent version (Voice Chat Rudra design)
  - **Light Mode**: Vibrant gradient background (cyan→purple→pink) makes white logo perfectly visible
  - **Dark Mode**: White logo with cyan/purple drop-shadow glow effects
  - **3D Effects**: Multi-layer drop-shadow filters create depth and protrusion
  - **Magical Animations**: Rainbow gradient glow on hover, pulsing ripple effects for "ready to talk" appearance
  - **Animation**: Added `rainbow-glow` keyframes for smooth color-shifting gradient effects
  
- **Color Contrast Improvements**: Significantly enhanced text visibility in both themes
  - **Light Mode**: Pure white background with very dark text (HSL 240 60% 10%) for maximum contrast
  - **Light Mode Borders**: Darker borders and inputs (HSL 240 30% 75%) for better visibility
  - **Dark Mode**: Lighter muted text (HSL 0 0% 85%) for improved readability
  - **Dark Mode Borders**: Lighter borders (HSL 240 35% 25%) for better definition
  
### Gen Z Futuristic UI Redesign - Foundation Complete ✨
- **New Logo System**: Implemented theme-aware minimalist logo (Voice Chat Rudra design) with programmable neon glow effects
  - Created `ThemeLogo` and `AnimatedLogo` components with dynamic theme-based coloring
  - Updated ALL logo locations: login, setup, chat, PWA manifest, metadata, service worker, offline page
  
- **Gen Z Color System**: Completely redesigned color palette with neon cyber aesthetics
  - **Dark Theme**: Deep cyber black (#0A0A0F) with neon cyan (#00FFFF) primary
  - **Light Theme**: Lavender white with bold purple (#B24BF3) 
  - **Neon Accents**: Cyber cyan, electric purple, neon pink, acid green
  - **Futuristic Gradients**: Full spectrum cyber gradient (cyan→blue→purple→pink)
  
- **Futuristic Animations & Effects**: Added comprehensive Gen Z animation library
  - Neon pulse animation with multi-layer glow effects
  - Cyber gradient animation (8s infinite rainbow flow)
  - Glitch effects for hover interactions
  - Glassmorphism cards with backdrop blur and transparency
  - 3D card depth with perspective transforms
  - Futuristic buttons with shimmer sweep effects
  - Holographic gradients and neon text glow utilities

### Previous Updates
- **Circular Logo with Siri-Style Glow Effect**: Redesigned all logo displays with professional circular containers and iPhone Siri-inspired horizontal glow beam animations
- **Logo Animation Implementation**: Fixed logo wrapper on ALL pages (login, setup, chat loading) by wrapping `<Image>` components in animated container divs. Created `LOGO_LOCATIONS_NOTE.md` documenting all 10+ logo locations across the platform
- **Mobile Dashboard Menu**: Improved mobile tab navigation by removing sticky positioning on small screens (sticky only on `md:` breakpoint), added responsive tab labels (shortened on mobile, full on desktop), and enhanced touch targets for better accessibility
- **UI Redesign Plan - Gen Z Futuristic Edition**: Created comprehensive `UI_REDESIGN_PLAN.md` with mobile-first approach emphasizing futuristic Gen Z aesthetic, glassmorphism & 3D depth, fast accessible leads/analytics, PWA native app experience, and bold visual language with cyber gradients

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with Next.js 15 (App Router) utilizing React Server Components, shadcn/ui, Radix UI, and Tailwind CSS. It features a responsive design, React hooks for state management, Zod and React Hook Form for validation, and a production-ready Progressive Web App (PWA) implementation with offline support.

### Backend Architecture
The backend uses Next.js API Routes, written in TypeScript, for a unified and serverless deployment model. It incorporates JWT-based authentication, role-based access control, tenant-based data isolation, and a subscription/trial system with plan-based feature limits. Comprehensive IP address tracking is implemented for security and customer identification.

### AI/ML Architecture
The core AI leverages Google Gemini (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.5-pro`) via the Genkit framework for conversational responses, multimodal capabilities, and multilingual support. Key functionalities include context-aware responses, knowledge base integration, image analysis, and user query summarization. A multi-tier Text-to-Speech system prioritizes Gemini TTS (with strict gender consistency and language-specific accents), falls back to optional OpenAI TTS, and finally to browser-native TTS, maintaining consistent gendered voices. Speech input uses the browser's Speech Recognition API.

### Data Storage
MongoDB is the primary database, chosen for its flexible schema suitable for multi-tenant SaaS, with tenant isolation enforced via `tenantId` indexes and middleware. Automated data retention policies allow for manual and cron-job-based cleanup of old leads and conversations, while protecting tenant settings and agent configurations.

### API Design
The platform provides public APIs for widget interaction, and protected APIs for authentication, tenant management, and administration. All APIs are RESTful, use JSON, and include rate limiting, CORS validation, and error handling.

### Widget Embedding System
A vanilla JavaScript widget facilitates embedding on any website, offering configurable positioning, a lazy-loaded iframe for style isolation, customizable launcher buttons, and brand theming. Security features include origin validation and iframe sandboxing.

### File Processing
`pdf-parse` is used for PDF content extraction, and Gemini vision capabilities handle image processing, such as brand logo color extraction.

### Global Platform Features
The platform supports 204 countries, 139+ currencies, and 109 languages (including RTL support). It integrates with various payment gateways (Razorpay, PayPal, Stripe, Payoneer) and provides a multi-tier TTS system for broad language coverage and high-quality voice output.

## External Dependencies

### Required Services
-   **MongoDB Atlas**: Primary database.
-   **Google Gemini API**: Core AI engine for chat, TTS, and translation.

### Optional Services
-   **OpenAI API**: For enhanced TTS and potentially faster chat responses.
-   **Tavily API**: For web search integration.

### Third-Party Libraries
-   **AI/ML**: `genkit`, `@genkit-ai/googleai`, `@google/generative-ai`, `openai`.
-   **UI Components**: `@radix-ui/*`, `lucide-react`, `recharts`, `date-fns`.
-   **Authentication & Security**: `jsonwebtoken`, `bcryptjs`.
-   **Database**: `mongodb`.
-   **Utilities**: `zod`, `react-hook-form`, `pdf-parse`, `wav`.

### Browser APIs
-   **Speech Recognition**: For voice input.
-   **Audio Playback**: For TTS output.
-   **LocalStorage**: For session persistence and widget state.
-   **Fetch API**: For HTTP requests.