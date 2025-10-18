# VoiceChat AI Platform

## Overview
VoiceChat AI is a multi-tenant SaaS platform designed for businesses to create and deploy AI-powered voice and text chat agents. It provides a comprehensive solution with features like tenant isolation, subscription management, embeddable widgets, and AI-driven conversational capabilities supporting 109 languages. The platform focuses on customizable AI agents for lead capture and customer interaction, leveraging Google Gemini API and optional OpenAI services for high-quality, natural voice interactions. Its ambition is to offer a robust, scalable, and globally accessible conversational AI solution.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with Next.js 15 (App Router), leveraging React Server Components, shadcn/ui, Radix UI, and Tailwind CSS for a responsive design. It utilizes React hooks for state management, Zod and React Hook Form for validation, and implements a production-ready Progressive Web App (PWA) with offline support. The UI emphasizes a professional, brand-driven color system, with neutral palettes and dynamic brand color integration, enhanced by smooth transitions, subtle hover effects, and accessible focus states. Key UI elements include quick reply suggestions, professional widget launchers, and polished message bubble designs with frosted glass effects and rounded corners. Visual feedback is enhanced through improved drag-and-drop animations and a professional loading screen with fade-in and zoom effects. A sound effects system and an onboarding tour enhance user experience. Theme presets and a confetti animation system are also integrated. The logo system uses theme-aware components with 3D protruded effects and magical gradient glows, adapting for light and dark modes to ensure optimal visibility and a futuristic aesthetic.

### Backend Architecture
The backend uses Next.js API Routes, written in TypeScript, for a unified and serverless deployment. It incorporates JWT-based authentication, role-based access control, tenant-based data isolation, and a subscription/trial system with plan-based feature limits. Comprehensive IP address tracking is implemented for security.

### AI/ML Architecture
The core AI uses Google Gemini (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.5-pro`) via the Genkit framework, providing conversational responses, multimodal capabilities, and multilingual support. Features include context-aware responses, knowledge base integration, image analysis, and user query summarization. A multi-tier Text-to-Speech system prioritizes Gemini TTS, falls back to optional OpenAI TTS, and then to browser-native TTS, ensuring consistent gendered voices. Speech input is handled by the browser's Speech Recognition API.

### Data Storage
MongoDB serves as the primary database, chosen for its flexible schema and multi-tenant SaaS suitability. Tenant isolation is enforced using `tenantId` indexes and middleware. Automated data retention policies manage lead and conversation cleanup.

### API Design
The platform offers public APIs for widget interaction and protected APIs for authentication, tenant management, and administration. All APIs are RESTful, use JSON, include rate limiting, CORS validation, and robust error handling.

### Widget Embedding System
A vanilla JavaScript widget allows embedding on any website, featuring configurable positioning, lazy-loaded iframe for style isolation, customizable launcher buttons, and brand theming. Security is maintained through origin validation and iframe sandboxing.

### File Processing
`pdf-parse` is used for PDF content extraction, and Gemini vision capabilities handle image processing, such as brand logo color extraction.

### Global Platform Features
The platform supports 204 countries, 139+ currencies, and 109 languages (including RTL support). It integrates with various payment gateways (Razorpay, PayPal, Stripe, Payoneer) and provides a multi-tier TTS system for broad language coverage.

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