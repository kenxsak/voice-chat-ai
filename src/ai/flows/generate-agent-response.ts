'use server';

/**
 * @fileOverview An AI agent that generates a response, captures lead information,
 * summarizes conversations, and sends lead data to a webhook.
 *
 * - generateAgentResponse - A function that handles the agent response generation process.
 * - GenerateAgentResponseInput - The input type for the generateAgentResponse function.
 * - GenerateAgentResponseOutput - The return type for the generateAgentResponse function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { GoogleGenerativeAI } from "@google/generative-ai";

const KnowledgeContextSchema = z.object({
  websiteUrl: z.string().url().optional().describe("A website URL for context."),
  documentInfo: z.string().optional().describe("Information about a document (e.g., filename or summary) for context."),
  uploadedDocContent: z.string().optional().describe("The full text content of a document uploaded by the user."),
});

const GenerateAgentResponseInputSchema = z.object({
  query: z.string().describe('The user query.'),
  agentName: z.string().describe('The name of the agent.'),
  agentDescription: z.string().describe('The detailed description and primary role of the agent.'),
  agentVoice: z.string().optional().describe('The selected voice for the agent, e.g., "female-us". This hints at the desired persona.'),
  languageCode: z.string().default('en-US').describe('The language code for the response.'),
  knowledgeContexts: z.array(KnowledgeContextSchema).optional().describe('Optional list of knowledge sources, including websites and document information.'),
  history: z.array(z.object({
    role: z.enum(['user', 'agent', 'system']),
    content: z.union([z.string(), z.array(z.any())]),
  })).optional().describe('The conversation history between the user and the agent.'),
  leadWebhookUrl: z.string().url().optional().describe('The webhook URL to send lead data to.'),
  imageDataUri: z.string().optional().describe("An optional image provided by the user, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  // Professional training options
  agentTone: z.enum(['professional', 'friendly', 'casual', 'formal', 'enthusiastic']).optional().describe('The tone and personality the agent should use.'),
  agentResponseStyle: z.enum(['concise', 'detailed', 'conversational', 'technical']).optional().describe('The response style the agent should adopt.'),
  agentExpertiseLevel: z.enum(['beginner-friendly', 'intermediate', 'expert', 'technical']).optional().describe('The expertise level the agent should communicate at.'),
  agentCustomInstructions: z.string().optional().describe('Additional custom instructions for agent behavior.'),
});
export type GenerateAgentResponseInput = z.infer<typeof GenerateAgentResponseInputSchema>;

const GenerateAgentResponseOutputSchema = z.object({
  response: z.string().describe("The agent's response to the user query. NEVER ask for name/email/phone if history shows you already asked."),
  leadName: z.string().nullable().optional().describe("REQUIRED: Extract user's full name if provided in THIS message (e.g., 'my name is John Smith' → 'John Smith'). Return null ONLY if no name is provided."),
  leadEmail: z.string().nullable().optional().describe("REQUIRED: Extract exact email address if provided in THIS message (e.g., 'email john@example.com' → 'john@example.com'). Return null ONLY if no email is provided."),
  leadPhone: z.string().nullable().optional().describe("REQUIRED: Extract phone number exactly as written if provided in THIS message, including country code (e.g., 'number +91 9876543210' → '+91 9876543210'). Return null ONLY if no phone is provided."),
  conversationSummary: z.string().describe("ALWAYS provide a brief 1-sentence summary of this conversation turn."),
  knowledgeGapQuery: z.string().nullable().optional().describe("Query if you lack information."),
  knowledgeGapCategory: z.enum(['missing_knowledge', 'out_of_scope', 'unclear_question']).nullable().optional().describe("REQUIRED if knowledgeGapQuery is set: Categorize the gap as 'missing_knowledge' (info not in knowledge base), 'out_of_scope' (outside agent's purpose), or 'unclear_question' (question is vague/ambiguous)."),
});
export type GenerateAgentResponseOutput = z.infer<typeof GenerateAgentResponseOutputSchema>;

// Shared helpers
async function scrapeWebsites(websiteUrls: string[], query: string): Promise<string> {
  console.log('[Website Context] Scraping websites:', { count: websiteUrls.length });
  let combinedText = '';
  const controller = new AbortController();
  const timeoutMs = 8000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  
  for (const url of websiteUrls) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 VoiceChatAI-Bot/1.0' },
        signal: controller.signal,
      });
      
      if (!response.ok) {
        combinedText += `[Failed to fetch content from ${url}. Status: ${response.status}]\n`;
        continue;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/html')) {
        combinedText += `[Skipped non-HTML content from ${url}]\n`;
        continue;
      }
      
      const html = await response.text();
      let text = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (text.length > 8000) text = text.slice(0, 8000) + '... [truncated]';
      combinedText += `[Content from ${url}]:\n${text}\n\n`;
    } catch (error: any) {
      console.error(`[Website Context] Error scraping ${url}:`, error.message);
      combinedText += `[Could not retrieve information from ${url}]\n`;
    }
  }
  
  clearTimeout(timer);
  
  // Limit total context length
  const maxLength = 20000;
  if (combinedText.length > maxLength) {
    combinedText = combinedText.substring(0, maxLength) + '... [content truncated]';
  }
  
  return combinedText;
}

async function performWebSearch(query: string): Promise<string> {
  try {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return '';
    
    const resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        api_key: apiKey, 
        query, 
        search_depth: 'basic', 
        max_results: 5 
      })
    });
    
    if (!resp.ok) return '';
    
    const data = await resp.json();
    const results: Array<{ title?: string; url?: string; content?: string }> = data?.results || [];
    const lines = results.map((r: any, i: number) => 
      `(${i+1}) ${r.title || 'Result'}\n${(r.content || '').slice(0, 500)}\nSource: ${r.url || 'unknown'}`
    );
    
    return lines.join('\n\n');
  } catch (e) {
    console.warn('[Web Search] Failed:', e);
    return '';
  }
}

const getWebsiteContextTool = ai.defineTool(
  {
    name: 'getWebsiteContextTool',
    description: 'Fetches relevant context from website URLs when the user asks questions that require specific information from those sites.',
    inputSchema: z.object({
      websiteUrls: z.array(z.string().url()).describe('The list of website URLs to fetch context from.'),
      query: z.string().describe('The user query to find relevant context for.')
    }),
    outputSchema: z.object({
      context: z.string().describe('Text extracted from the websites that is relevant to the user query.'),
    }),
  },
  async ({ websiteUrls, query }) => {
    console.log(`[Tool] getWebsiteContextTool scraping:`, websiteUrls);
    const combinedText = await scrapeWebsites(websiteUrls, query);
    console.log(`[Tool] Extracted ${combinedText.length} characters`);
    return { context: combinedText };
  }
);

const getWebSearchResultsTool = ai.defineTool(
  {
    name: 'getWebSearchResultsTool',
    description: 'Performs a web search for up-to-date information when no specific website URL is provided.',
    inputSchema: z.object({
      query: z.string().describe('The user query to search for.')
    }),
    outputSchema: z.object({
      resultsText: z.string().describe('Search results with summaries and sources.')
    }),
  },
  async ({ query }) => {
    const resultsText = await performWebSearch(query);
    return { resultsText };
  }
);

// Helper function to estimate token count (rough approximation: ~4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Parse a data URI into inline data format for Genkit
 * Expected format: data:<mimeType>;base64,<base64Data>
 */
function parseDataUri(dataUri: string): { data: string; mimeType: string } | null {
  try {
    const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.warn('[parseDataUri] Invalid data URI format:', dataUri.substring(0, 50));
      return null;
    }
    return {
      mimeType: matches[1],
      data: matches[2],
    };
  } catch (error) {
    console.error('[parseDataUri] Error parsing data URI:', error);
    return null;
  }
}

/**
 * Check if a message contains important lead information
 * (email, phone, name mentions, or problem descriptions)
 */
function isImportantMessage(msg: any): boolean {
  const msgText = JSON.stringify(msg.parts).toLowerCase();
  
  // Check for contact information patterns
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i.test(msgText);
  const hasPhone = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}/.test(msgText);
  const hasName = /(my name is|i'm|i am|call me)\s+[a-z]+/i.test(msgText);
  
  // Check for important business context
  const hasProblem = /(problem|issue|help|need|want|looking for|interested)/i.test(msgText);
  const hasSolution = /(solution|fix|resolve|recommend|suggest)/i.test(msgText);
  const hasLeadIntent = /(contact|schedule|book|appointment|demo|pricing|quote)/i.test(msgText);
  
  return hasEmail || hasPhone || hasName || hasProblem || hasSolution || hasLeadIntent;
}

/**
 * Check if contact information has been collected or asked for in the conversation
 * This scans ALL messages (both user and bot) to determine if:
 * 1. The bot already asked for contact info in ANY previous message
 * 2. The user already provided contact info in ANY previous message
 * 
 * @param history - Array of conversation messages
 * @returns Object with flags indicating if contact was asked or provided
 */
function checkContactInfoStatus(history: any[]): { 
  alreadyAsked: boolean; 
  alreadyProvided: boolean;
  details: { hasName: boolean; hasEmail: boolean; hasPhone: boolean }
} {
  let alreadyAsked = false;
  let hasName = false;
  let hasEmail = false;
  let hasPhone = false;
  
  if (!history || history.length === 0) {
    return { alreadyAsked: false, alreadyProvided: false, details: { hasName, hasEmail, hasPhone } };
  }
  
  // Check all messages in history
  for (const msg of history) {
    const msgText = JSON.stringify(msg.parts).toLowerCase();
    
    // Check if bot asked for contact info (check model/agent messages)
    if (msg.role === 'model') {
      if (msgText.match(/(what.*name|your name|may i (have|know|get) your name|can i (have|know|get) your name)/i) ||
          msgText.match(/(what.*email|your email|may i (have|know|get) your email|can i (have|know|get) your email)/i) ||
          msgText.match(/(what.*phone|your phone|phone number|contact number|may i (have|know|get) your (phone|number))/i) ||
          msgText.match(/(provide.*contact|share.*contact|leave.*contact|give.*contact)/i)) {
        alreadyAsked = true;
      }
    }
    
    // Check if user provided contact info (check user messages)
    if (msg.role === 'user') {
      // Check for email pattern
      if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i.test(msgText)) {
        hasEmail = true;
      }
      
      // Check for phone pattern
      if (/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}|\d{10,}/.test(msgText)) {
        hasPhone = true;
      }
      
      // Check for name introduction patterns
      if (/(my name is|i'm|i am|call me|this is|name.*is)\s+[A-Z][a-z]+/i.test(msgText)) {
        hasName = true;
      }
    }
  }
  
  const alreadyProvided = hasName || hasEmail || hasPhone;
  
  if (alreadyAsked || alreadyProvided) {
    console.log('[Contact Info Check] Status:', { 
      alreadyAsked, 
      alreadyProvided, 
      details: { hasName, hasEmail, hasPhone } 
    });
  }
  
  return { alreadyAsked, alreadyProvided, details: { hasName, hasEmail, hasPhone } };
}

/**
 * Create a summary of multiple old messages to preserve context while reducing tokens
 */
function summarizeOldMessages(messages: any[]): string {
  if (messages.length === 0) return '';
  
  const userMessages = messages.filter(m => m.role === 'user');
  const agentMessages = messages.filter(m => m.role === 'model');
  
  const topics: string[] = [];
  
  // Extract key topics from user messages
  userMessages.forEach(msg => {
    const text = JSON.stringify(msg.parts).toLowerCase();
    if (text.includes('price') || text.includes('cost')) topics.push('pricing');
    if (text.includes('feature') || text.includes('how')) topics.push('features');
    if (text.includes('problem') || text.includes('issue')) topics.push('issues');
    if (text.includes('contact') || text.includes('email')) topics.push('contact info');
  });
  
  const uniqueTopics = [...new Set(topics)];
  const summary = `[Earlier conversation: ${userMessages.length} user messages, ${agentMessages.length} bot responses${uniqueTopics.length > 0 ? ` about ${uniqueTopics.join(', ')}` : ''}]`;
  
  return summary;
}

/**
 * Smart token-aware history trimming with context preservation
 * 
 * Memory Management Strategy:
 * - Gemini 1.5 Flash supports large context windows (up to 1M tokens)
 * - We use 100,000 tokens to maintain comprehensive conversation history
 * - This provides excellent context retention while maintaining performance
 * 
 * Prioritization Strategy:
 * 1. Keep recent messages (last 50 messages) - most relevant to current context
 *    - Safety guard: If recent messages exceed maxTokens, trim from oldest of recent block
 * 2. Prioritize messages with lead information (email, phone, name, problems) - critical business data
 * 3. Summarize actually dropped messages instead of dropping them - preserves context without tokens
 * 4. Keep within maxTokens limit (default 100000 for comprehensive context)
 * 
 * @param history - Array of conversation messages
 * @param maxTokens - Maximum tokens to keep (default: 100000)
 * @returns Trimmed history with smart prioritization
 */
function trimHistoryByTokens(history: any[], maxTokens: number = 100000): any[] {
  if (history.length === 0) return [];
  
  const recentMessageCount = 50; // Try to keep last 50 messages for better context
  let totalTokens = 0;
  const trimmedHistory: any[] = [];
  const keptIndices: Set<number> = new Set(); // Track which message indices we keep
  
  console.log(`[Memory] Starting history trim: ${history.length} messages, max tokens: ${maxTokens}`);
  
  // Step 1: Process recent messages (last N messages) with safety guard
  const recentMessages = history.slice(-recentMessageCount);
  const recentStartIndex = history.length - recentMessageCount;
  
  // Calculate tokens for recent messages and track their original indices
  const recentWithTokens = recentMessages.map((msg, idx) => {
    const msgText = JSON.stringify(msg.parts);
    const msgTokens = estimateTokens(msgText);
    return { msg, tokens: msgTokens, originalIndex: recentStartIndex + idx };
  });
  
  // Safety guard: Check if recent messages alone exceed maxTokens
  const recentTotalTokens = recentWithTokens.reduce((sum, item) => sum + item.tokens, 0);
  
  if (recentTotalTokens > maxTokens) {
    console.log(`[Memory] ⚠️ Safety guard activated: Recent messages (${recentTotalTokens} tokens) exceed limit (${maxTokens}). Trimming from oldest.`);
    // Trim from the oldest of the recent block to fit within maxTokens
    for (let i = recentWithTokens.length - 1; i >= 0; i--) {
      const item = recentWithTokens[i];
      if (totalTokens + item.tokens <= maxTokens) {
        trimmedHistory.unshift(item.msg);
        keptIndices.add(item.originalIndex);
        totalTokens += item.tokens;
      } else {
        break;
      }
    }
    console.log(`[Memory] Kept ${trimmedHistory.length}/${recentMessages.length} recent messages after safety trim (~${totalTokens} tokens)`);
  } else {
    // Keep all recent messages
    for (let i = recentWithTokens.length - 1; i >= 0; i--) {
      const item = recentWithTokens[i];
      trimmedHistory.unshift(item.msg);
      keptIndices.add(item.originalIndex);
      totalTokens += item.tokens;
    }
    console.log(`[Memory] Kept all ${recentMessages.length} recent messages (~${totalTokens} tokens)`);
  }
  
  // Step 2: Process older messages, prioritizing important ones
  const olderMessages = history.slice(0, -recentMessageCount);
  const importantOldMessages: Array<{ msg: any; tokens: number; originalIndex: number }> = [];
  const unimportantOldMessages: Array<{ msg: any; tokens: number; originalIndex: number }> = [];
  
  olderMessages.forEach((msg, idx) => {
    const msgText = JSON.stringify(msg.parts);
    const msgTokens = estimateTokens(msgText);
    const item = { msg, tokens: msgTokens, originalIndex: idx };
    
    if (isImportantMessage(msg)) {
      importantOldMessages.push(item);
    } else {
      unimportantOldMessages.push(item);
    }
  });
  
  console.log(`[Memory] Found ${importantOldMessages.length} important messages in older history`);
  
  // Add important old messages if space allows
  let addedImportantCount = 0;
  for (let i = importantOldMessages.length - 1; i >= 0; i--) {
    const item = importantOldMessages[i];
    
    // Use 90% of limit to leave room for summary
    if (totalTokens + item.tokens <= maxTokens * 0.9) {
      trimmedHistory.unshift(item.msg);
      keptIndices.add(item.originalIndex);
      totalTokens += item.tokens;
      addedImportantCount++;
    } else {
      break;
    }
  }
  
  if (addedImportantCount > 0) {
    console.log(`[Memory] Added ${addedImportantCount} important older messages (~${totalTokens} tokens total)`);
  }
  
  // Step 3: Add summary of actually dropped messages (not assumed dropped)
  const droppedMessages: any[] = [];
  for (let i = 0; i < history.length; i++) {
    if (!keptIndices.has(i)) {
      droppedMessages.push(history[i]);
    }
  }
  
  if (droppedMessages.length > 0) {
    const summary = summarizeOldMessages(droppedMessages);
    const summaryTokens = estimateTokens(summary);
    
    if (totalTokens + summaryTokens <= maxTokens) {
      // Add summary as a model message at the beginning with isSummary flag
      trimmedHistory.unshift({
        role: 'model',
        parts: [{ text: summary }],
        isSummary: true
      });
      totalTokens += summaryTokens;
      console.log(`[Memory] Added summary for ${droppedMessages.length} actually dropped messages`);
    }
  }
  
  const compressionRatio = history.length > 0 ? ((trimmedHistory.length / history.length) * 100).toFixed(1) : '100';
  console.log(`[Memory] ✓ Final: ${trimmedHistory.length}/${history.length} messages (~${totalTokens} tokens, ${compressionRatio}% retained)`);
  
  return trimmedHistory;
}

/**
 * Create a contextual fallback response when AI returns empty
 * Acknowledges the user's question and maintains conversation flow
 */
function createContextualFallback(query: string, agentName?: string): string {
  // Extract topic from query (max 60 chars, break at word boundary)
  let topic = query.trim();
  const maxLength = 60;
  
  if (topic.length > maxLength) {
    const lastSpace = topic.lastIndexOf(' ', maxLength);
    topic = topic.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
  }
  
  // Remove trailing punctuation for cleaner display
  topic = topic.replace(/[?!.,;]+$/, '');
  
  // Create contextual response
  return `I'd like to help you with "${topic}". Could you provide more details or rephrase your question? That will help me give you the most accurate answer.`;
}

export async function generateAgentResponse(input: GenerateAgentResponseInput): Promise<GenerateAgentResponseOutput> {
  try {
    // 1) Normalize and compress history: user/model/system roles, drop empties
    let historyForApi = (input.history || [])
      .filter(msg => (msg.role === 'user' || msg.role === 'agent' || msg.role === 'system'))
      .map(msg => {
        // Map roles: agent -> model, user/system -> user (API only accepts user/model)
        const role = (msg.role === 'agent' ? 'model' : 'user') as 'user' | 'model';
        const parts: Array<{ text?: string; media?: { url: string } }> = [];
        
        if (typeof msg.content === 'string') {
          const trimmed = msg.content.trim();
          if (trimmed) parts.push({ text: trimmed });
        } else if (Array.isArray(msg.content)) {
          msg.content.forEach(part => {
            if (part.text && String(part.text).trim()) {
              parts.push({ text: String(part.text).trim() });
            } else if (part.media && part.media.url) {
              parts.push({ media: { url: part.media.url } });
            }
          });
        }
        
        return { role, parts };
      })
      .filter(msg => msg.parts.length > 0);

    // 2) Remove consecutive duplicate messages
    const deduped: typeof historyForApi = [];
    for (const h of historyForApi) {
      const last = deduped[deduped.length - 1];
      const thisText = JSON.stringify(h.parts);
      const lastText = last ? JSON.stringify(last.parts) : '';
      if (thisText !== lastText) deduped.push(h);
    }
    
    // 3) Token-aware trimming: keep full history within ~50000 tokens (balanced for context & speed)
    historyForApi = trimHistoryByTokens(deduped, 50000);

    const apiInput = { ...input, history: historyForApi };

    if (apiInput.leadWebhookUrl === '') {
      delete (apiInput as Partial<typeof apiInput>).leadWebhookUrl;
    }
    
    // Ensure imageDataUri is not null, only undefined if not present
    if (apiInput.imageDataUri === null) {
      delete apiInput.imageDataUri;
    }

    console.log('[AI] Processing request with', {
      query: apiInput.query.substring(0, 100),
      knowledgeContexts: apiInput.knowledgeContexts?.length || 0,
      historyLength: historyForApi.length,
    });

    const AI_TIMEOUT_MS = 30000;
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('AI_TIMEOUT: Response took longer than 30 seconds')), AI_TIMEOUT_MS);
    });

    let out: Awaited<ReturnType<typeof generateAgentResponseFlow>>;
    try {
      out = await Promise.race([
        generateAgentResponseFlow(apiInput as any),
        timeoutPromise
      ]).catch((error) => {
        if (error.message?.includes('AI_TIMEOUT')) {
          console.error('[AI] Timeout after 30s - using fallback response');
          return {
            response: `I apologize for the delay. I'm having trouble processing your request right now. Could you please rephrase your question or try again?`,
            leadName: null,
            leadEmail: null,
            leadPhone: null,
            conversationSummary: `Request timed out after 30 seconds`,
            knowledgeGapQuery: null
          };
        }
        throw error;
      }) as Awaited<ReturnType<typeof generateAgentResponseFlow>>;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
    
    // 3) Regex fallback: If AI didn't extract contact info, try regex patterns
    const userQuery = input.query.toLowerCase();
    
    // Extract email if AI missed it
    if (!out.leadEmail) {
      const emailMatch = input.query.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      if (emailMatch) {
        out.leadEmail = emailMatch[0];
        console.log('[AI Fallback] Extracted email via regex:', out.leadEmail);
      }
    }
    
    // Extract phone if AI missed it
    if (!out.leadPhone) {
      // Match patterns like: 9876543210, +91 9876543210, (555) 123-4567, etc.
      const phoneMatch = input.query.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}|\d{10,}/);
      if (phoneMatch) {
        out.leadPhone = phoneMatch[0].trim();
        console.log('[AI Fallback] Extracted phone via regex:', out.leadPhone);
      }
    }
    
    // Extract name if AI missed it
    if (!out.leadName) {
      // Match patterns like: "my name is X", "I'm X", "call me X", "this is X"
      const namePatterns = [
        /(?:my name is|i'm|i am|call me|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        /(?:name|called)\s*[:=-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
      ];
      
      for (const pattern of namePatterns) {
        const nameMatch = input.query.match(pattern);
        if (nameMatch && nameMatch[1]) {
          out.leadName = nameMatch[1].trim();
          console.log('[AI Fallback] Extracted name via regex:', out.leadName);
          break;
        }
      }
    }
    
    // 4) Guard against empty responses with contextual fallback
    if (!out.response || out.response.trim().length === 0) {
      const contextualResponse = createContextualFallback(input.query, input.agentName);
      const contextualSummary = `Agent requested clarification about: "${input.query.substring(0, 50)}${input.query.length > 50 ? '...' : ''}"`;
      
      console.log('[AI Fallback] Empty response detected, using contextual fallback for query:', input.query.substring(0, 100));
      
      return { 
        ...out, 
        response: contextualResponse,
        conversationSummary: out.conversationSummary || contextualSummary
      } as any;
    }
    
    return out;
  } catch (error: any) {
    console.error("[AI] Error in generateAgentResponse:", error);
    
    if (error.cause && error.cause.status === 'INVALID_ARGUMENT') {
      return {
        response: "Sorry, I couldn't process the provided image or content. It might be in a format I don't understand. Please try a different one.",
        conversationSummary: "User provided unsupported image or content format",
      };
    }
    
    throw new Error(`Failed to generate agent response: ${error.message || error}`);
  }
}

const prompt = ai.definePrompt({
  name: 'generateAgentResponsePrompt',
  model: 'googleai/gemini-2.5-flash',
  tools: [getWebsiteContextTool, getWebSearchResultsTool],
  config: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 800,
  },
  input: {
    schema: z.object({
      query: z.string(),
      agentName: z.string(),
      agentDescription: z.string(),
      agentVoice: z.string().optional(),
      languageCode: z.string(),
      websiteUrls: z.array(z.string().url()).optional(),
      knowledgeContexts: z.array(KnowledgeContextSchema).optional(),
      history: z.array(z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(z.any()),
      })).optional(),
      leadWebhookUrl: z.string().url().optional(),
      imageDataUri: z.string().optional(),
      imageInlineData: z.object({
        data: z.string(),
        mimeType: z.string(),
      }).optional(),
      agentTone: z.string().optional(),
      agentResponseStyle: z.string().optional(),
      agentExpertiseLevel: z.string().optional(),
      agentCustomInstructions: z.string().optional(),
      contactInfoCollected: z.boolean().optional(),
      contactDetails: z.object({
        hasName: z.boolean(),
        hasEmail: z.boolean(),
        hasPhone: z.boolean(),
      }).optional(),
    }),
  },
  output: {
    schema: GenerateAgentResponseOutputSchema,
  },
  prompt: `🎭 ROLE: You are {{{agentName}}} - {{{agentDescription}}}.{{#if agentTone}} Your tone is {{{agentTone}}}.{{/if}}{{#if agentExpertiseLevel}} Communicate at {{{agentExpertiseLevel}}} level.{{/if}}{{#if agentCustomInstructions}} {{{agentCustomInstructions}}}{{/if}}{{#if genderGrammarInstruction}} {{{genderGrammarInstruction}}}{{/if}} Never mention being AI or break character.

⚠️ CRITICAL CHARACTER CONSISTENCY: 
- Stay in character as {{{agentName}}} throughout the ENTIRE conversation
- Maintain the SAME personality, tone, and speaking style in EVERY response
- Follow your role description consistently - DO NOT become robotic or generic
- Keep the natural, human-like conversational flow you started with

{{#if knowledgeContexts}}
📚 KNOWLEDGE BASE - Use this information to answer questions:
{{#each knowledgeContexts}}
{{#if this.uploadedDocContent}}
{{{this.uploadedDocContent}}}
{{/if}}
{{#if this.websiteUrl}}
Website: {{{this.websiteUrl}}}
{{/if}}
{{/each}}
{{/if}}

{{#if imageInlineData}}
📷 Image: {{media inlineData=imageInlineData}}
{{/if}}

{{#if history}}
💬 Previous conversation:
{{#each history}}
{{#if this.isUser}}User: {{#each this.parts}}{{#if this.text}}{{{this.text}}}{{/if}}{{/each}}
{{else}}{{{../agentName}}}: {{#each this.parts}}{{#if this.text}}{{{this.text}}}{{/if}}{{/each}}
{{/if}}
{{/each}}
{{/if}}

User: {{{query}}}

📋 INSTRUCTIONS (Follow these in every single response):
1. STAY IN CHARACTER as {{{agentName}}}. Maintain consistent personality, tone, and speaking style from your first message.
2. Answer the user's CURRENT question directly using the knowledge base above
3. Keep responses to 2-4 sentences. Be engaging, natural, and conversational - NOT robotic or generic.
4. Reply in {{{languageCode}}}{{#if agentResponseStyle}}, {{{agentResponseStyle}}} style{{/if}}
5. NEVER repeat the same response twice - always provide new, relevant information
6. Be helpful, specific, and follow your persona's goals in the role description
7. CONSISTENCY: Your responses should sound like the same person throughout the conversation
8. 🔗 LINK SHARING RULES (CRITICAL):
   - ONLY share URLs that are EXACTLY listed in the knowledge base above (under "Website:" entries or explicitly mentioned in the content)
   - If the exact URL exists in the knowledge base, you may share it: "Learn more at https://example.com"
   - If NO exact URL is available, provide helpful section/topic guidance instead: "You can find more details in the Pricing section" or "Check the Products page on our website"
   - NEVER make up, generate, or guess URLs - this creates broken links and bad user experience

{{#if contactInfoCollected}}
🚫 DO NOT ASK FOR CONTACT INFORMATION - Contact details have already been collected in this conversation:
{{#if contactDetails.hasName}}- Name: Already provided ✓{{/if}}
{{#if contactDetails.hasEmail}}- Email: Already provided ✓{{/if}}
{{#if contactDetails.hasPhone}}- Phone: Already provided ✓{{/if}}
⚠️ NEVER ask for name, email, or phone again. Continue the conversation naturally without requesting contact info.
{{/if}}

🔍 CONTACT INFORMATION EXTRACTION (MANDATORY):
Carefully examine the user's CURRENT message for contact details. If they provide ANY of the following, you MUST extract them EXACTLY as written:

- leadName: Extract the person's full name if they say "my name is [name]", "I'm [name]", "call me [name]", or introduce themselves
  Example: "my name is Santosh Sharma" → leadName: "Santosh Sharma"
  
- leadEmail: Extract email address if present (format: text@domain.com)
  Example: "email santosh@gmail.com" → leadEmail: "santosh@gmail.com"
  
- leadPhone: Extract phone number including country code if present
  Example: "number 9876543210" or "+91 9876543210" → leadPhone: "9876543210" or "+91 9876543210"

⚠️ CRITICAL: When contact info is present, you MUST populate these fields with the EXACT values from the user's message. Set to null ONLY if truly not provided.

7. conversationSummary: ALWAYS provide a brief 1-sentence summary of what was discussed in this turn`,
});

const generateAgentResponseFlow = ai.defineFlow(
  {
    name: 'generateAgentResponseFlow',
    inputSchema: z.object({
      query: z.string(),
      agentName: z.string(),
      agentDescription: z.string(),
      agentVoice: z.string().optional(),
      languageCode: z.string(),
      knowledgeContexts: z.array(KnowledgeContextSchema).optional(),
      history: z.array(z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(z.any()),
      })).optional(),
      leadWebhookUrl: z.string().url().optional(),
      imageDataUri: z.string().optional(),
      agentTone: z.string().optional(),
      agentResponseStyle: z.string().optional(),
      agentExpertiseLevel: z.string().optional(),
      agentCustomInstructions: z.string().optional(),
    }),
    outputSchema: GenerateAgentResponseOutputSchema,
  },
  async (input) => {
    try {
      // Detect gender from voice selection for proper grammar
      let genderGrammarInstruction = '';
      if (input.agentVoice) {
        if (input.agentVoice.includes('female')) {
          genderGrammarInstruction = 'Use feminine grammar in all languages (feminine pronouns, verb endings). NEVER mention your gender or voice.';
        } else if (input.agentVoice.includes('male')) {
          genderGrammarInstruction = 'Use masculine grammar in all languages (masculine pronouns, verb endings). NEVER mention your gender or voice.';
        }
      }
      
      // Add `isUser` boolean to history objects for easier templating
      const historyWithUserFlag = input.history?.map(msg => ({
        ...msg,
        isUser: msg.role === 'user',
      })) || [];

      // Check if contact info was already asked or provided in the conversation
      const contactStatus = checkContactInfoStatus(input.history || []);
      // FIXED: Only consider info as collected if user actually PROVIDED it, not just if bot ASKED for it
      const contactInfoCollected = contactStatus.alreadyProvided;
      
      if (contactInfoCollected) {
        console.log('[AI Flow] Contact info already collected - will not ask again:', contactStatus.details);
      }

      // Parse imageDataUri into inline data format if present
      let imageInlineData: { data: string; mimeType: string } | undefined;
      if (input.imageDataUri) {
        const parsed = parseDataUri(input.imageDataUri);
        if (parsed) {
          imageInlineData = parsed;
          console.log('[AI Flow] Parsed image data URI:', parsed.mimeType);
        }
      }

      // Use all knowledge contexts - Gemini 1.5 Flash supports large context windows
      // This ensures the AI can access all uploaded documents for accurate answers
      const limitedKnowledgeContexts = input.knowledgeContexts;
      
      // Log knowledge context for debugging
      if (input.knowledgeContexts && input.knowledgeContexts.length > 0) {
        const totalContexts = input.knowledgeContexts.length;
        console.log(`[AI Flow] Knowledge contexts: ${totalContexts} total (using all for comprehensive answers)`);
        
        limitedKnowledgeContexts?.forEach((ctx, idx) => {
          if (ctx.uploadedDocContent) {
            const preview = ctx.uploadedDocContent.substring(0, 200);
            console.log(`[AI Flow] Context ${idx + 1}: ${preview}...`);
          }
        });
      }

      const promptInput = {
        ...input,
        knowledgeContexts: limitedKnowledgeContexts,
        history: historyWithUserFlag,
        websiteUrls: limitedKnowledgeContexts
          ?.map(c => c.websiteUrl)
          .filter((url): url is string => !!url),
        imageInlineData,
        contactInfoCollected,
        contactDetails: contactStatus.details,
        genderGrammarInstruction,
      };

      // Try Genkit first, fallback to direct Google AI
      let output;
      try {
        const res = await prompt(promptInput);
        output = res.output;
        console.log('[AI Flow] Genkit response generated successfully');
      } catch (genkitError: any) {
        console.log('[AI Flow] Genkit failed, using direct Google AI fallback:', genkitError.message);
        
        // Build a comprehensive prompt including all training data
        // Use all contexts for complete knowledge base access
        const limitedContexts = input.knowledgeContexts;
        
        let contextText = '';
        if (limitedContexts && limitedContexts.length > 0) {
          contextText += '\n\n📚 KNOWLEDGE BASE - Use this to answer questions:\n';
          limitedContexts.forEach(ctx => {
            if (ctx.uploadedDocContent) {
              // Limit context size to 15000 chars per document to maintain reasonable performance
              // while ensuring comprehensive content access
              const content = ctx.uploadedDocContent.length > 15000 ? 
                ctx.uploadedDocContent.substring(0, 15000) + '... [truncated for length]' : 
                ctx.uploadedDocContent;
              contextText += `\n${content}\n`;
            }
          });
          contextText += '\n⚠️ Use the knowledge base above to answer questions accurately!\n';
        }
        
        // Check if contact info was already collected in fallback flow
        const fallbackContactStatus = checkContactInfoStatus(input.history || []);
        const fallbackContactCollected = fallbackContactStatus.alreadyAsked || fallbackContactStatus.alreadyProvided;
        
        let contactWarning = '';
        if (fallbackContactCollected) {
          contactWarning = '\n\n🚫 CRITICAL: DO NOT ASK FOR CONTACT INFORMATION AGAIN!\n';
          contactWarning += 'Contact details have already been collected in this conversation:\n';
          if (fallbackContactStatus.details.hasName) contactWarning += '- Name: Already provided ✓\n';
          if (fallbackContactStatus.details.hasEmail) contactWarning += '- Email: Already provided ✓\n';
          if (fallbackContactStatus.details.hasPhone) contactWarning += '- Phone: Already provided ✓\n';
          contactWarning += '⚠️ NEVER ask for name, email, or phone again. Continue the conversation naturally.\n';
          console.log('[AI Flow Fallback] Contact info already collected - will not ask again:', fallbackContactStatus.details);
        }
        
        let historyText = '';
        if (input.history && input.history.length > 0) {
          historyText = '\n\n💬 Previous conversation:\n';
          input.history.slice(-10).forEach(msg => {
            const textParts = msg.parts?.map((p: any) => p.text || '').filter(Boolean) || [];
            const hasImage = msg.parts?.some((p: any) => p.media?.url);
            const text = textParts.join(' ') || '';
            const imageNote = hasImage ? ' [Image shared]' : '';
            historyText += `${msg.role === 'user' ? 'User' : input.agentName}: ${text}${imageNote}\n`;
          });
        }
        
        const simplePrompt = `🎭 ROLE: You are ${input.agentName} - ${input.agentDescription || 'professional assistant'}. ${genderGrammarInstruction} Never mention being AI or break character.

⚠️ CRITICAL: Stay in character as ${input.agentName} throughout the ENTIRE conversation. Follow your role description above in EVERY response.
${contextText}${historyText}${contactWarning}
${input.imageDataUri ? '\n📷 IMAGE PROVIDED: The user has shared an image. Analyze it carefully and provide helpful insights based on what you see in the image.\n' : ''}

📋 INSTRUCTIONS:
- Keep responses to 2-4 sentences, engaging and natural
- When relevant, share website URLs to guide users (e.g., "Learn more at https://example.com")
- Never repeat responses - always provide new, relevant information

User: ${input.query}

📋 INSTRUCTIONS (Follow these in every single response):
1. STAY IN CHARACTER as ${input.agentName}. Follow your role description and training data consistently.
2. Answer the user's CURRENT question directly using the knowledge base above${input.imageDataUri ? ' and the image provided' : ''}
3. Keep responses to 2-4 sentences. Be engaging, natural, and conversational.
4. Reply in ${input.languageCode || 'en-US'}
5. NEVER repeat the same response twice - always provide new, relevant information
6. Be helpful, specific, and follow your persona's goals in the role description${input.imageDataUri ? '\n7. If an image is provided, analyze it and provide relevant information about what you see' : ''}`;
        
        console.log('[AI Flow] Fallback prompt length:', simplePrompt.length);
        
        // Try multiple models in order of preference (fast to advanced)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        
        // Use correct 2025 model names for Google AI SDK
        const modelsToTry = [
          'gemini-2.5-flash',           // Primary - Fast stable model with image support
          'gemini-2.0-flash',           // Fallback 1 - Fast model with 1M context
          'gemini-2.5-pro',             // Fallback 2 - Advanced reasoning model
        ];
        
        let result;
        let lastError;
        
        for (const modelName of modelsToTry) {
          try {
            console.log(`[AI Flow] Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ 
              model: modelName,
              generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 800,
              }
            });
            
            // If image is provided, use multimodal input format
            if (input.imageDataUri) {
              console.log('[AI Flow] Including image in request');
              
              // Parse data URI properly
              const dataUriParts = input.imageDataUri.match(/^data:([^;]+);base64,(.+)$/);
              if (!dataUriParts) {
                console.error('[AI Flow] Invalid data URI format');
                continue;
              }
              
              const imagePart = {
                inlineData: {
                  mimeType: dataUriParts[1], // Extract mime type (e.g., "image/png")
                  data: dataUriParts[2],      // Extract base64 data
                }
              };
              
              result = await model.generateContent([simplePrompt, imagePart]);
            } else {
              result = await model.generateContent(simplePrompt);
            }
            
            console.log(`[AI Flow] ✅ Success with model: ${modelName}`);
            break; // Success, exit loop
          } catch (modelError: any) {
            console.log(`[AI Flow] ❌ Model ${modelName} failed: ${modelError.message}`);
            lastError = modelError;
            continue; // Try next model
          }
        }
        
        if (!result) {
          throw new Error(`All models failed. Last error: ${lastError?.message}`);
        }
        
        const responseText = result.response.text();
        
        // Generate a simple summary for fallback responses
        const summaryText = `User asked about ${input.query.substring(0, 50)}${input.query.length > 50 ? '...' : ''}`;
        
        output = {
          response: responseText,
          leadName: null,
          leadEmail: null,
          leadPhone: null,
          conversationSummary: summaryText,
          knowledgeGapQuery: null,
        };
        
        console.log('[AI Flow] Fallback response generated successfully');
      }

      // Handle null output case
      if (!output) {
        console.error('[AI Flow] No output generated');
        return {
          response: "I'm experiencing a technical issue. Please try again.",
          leadName: null,
          leadEmail: null,
          leadPhone: null,
          conversationSummary: "Technical issue occurred during conversation",
          knowledgeGapQuery: null,
        };
      }

      // Send lead webhook ONLY for qualified leads (must have email OR phone)
      // This ensures we only send captured leads to CRM/Google Sheets, not anonymous conversations
      const hasQualifiedContact = output?.leadEmail || output?.leadPhone;
      
      if (input.leadWebhookUrl && output && hasQualifiedContact) {
        console.log('[AI Flow] ✓ Sending QUALIFIED lead to webhook:', {
          hasEmail: !!output.leadEmail,
          hasPhone: !!output.leadPhone,
          hasName: !!output.leadName,
          webhookUrl: input.leadWebhookUrl
        });
        
        fetch(input.leadWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadName: output.leadName || 'Not provided',
            leadEmail: output.leadEmail || 'Not provided',
            leadPhone: output.leadPhone || 'Not provided',
            conversationSummary: output.conversationSummary,
            fullHistory: input.history,
            capturedAt: new Date().toISOString(),
            agent: {
              name: input.agentName,
              description: input.agentDescription,
            },
            sourceWebsite: (promptInput.websiteUrls || []).join(', '),
          })
        }).then(response => {
          if (response.ok) {
            console.log('[AI Flow] ✅ Lead webhook sent successfully');
          } else {
            console.error('[AI Flow] ❌ Lead webhook failed:', response.status);
          }
        }).catch(error => {
          console.error('[AI Flow] ❌ Lead webhook error:', error);
        });
      } else if (input.leadWebhookUrl && output && (output.leadName && !hasQualifiedContact)) {
        console.log('[AI Flow] → Skipping webhook - Name only (no email/phone). Not a qualified lead.');
      }

      console.log('[AI Flow] Response generated:', {
        responseLength: output?.response?.length || 0,
        hasLeadInfo: !!(output?.leadName || output?.leadEmail || output?.leadPhone),
      });
      
      return output;
    } catch (error: any) {
      console.error("[AI Flow] Error:", error);
      throw new Error(`Prompt execution failed: ${error.message || error}`);
    }
  }
);