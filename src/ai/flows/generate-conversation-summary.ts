'use server';

/**
 * @fileOverview Generates comprehensive conversation summaries for CRM/Google Sheets integration.
 * Extracts customer information, problems, solutions, and suggestions from conversation history.
 *
 * - generateConversationSummary - Main function that generates structured conversation summaries
 * - GenerateConversationSummaryInput - Input schema for conversation history
 * - GenerateConversationSummaryOutput - Output schema with extracted information
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GenerateConversationSummaryInputSchema = z.object({
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'agent', 'system']),
    content: z.string(),
    timestamp: z.string().optional().describe('ISO timestamp of the message'),
  })).describe('The complete conversation history to summarize'),
  agentName: z.string().optional().describe('Name of the agent/assistant in the conversation'),
  businessContext: z.string().optional().describe('Additional business context or product information'),
});
export type GenerateConversationSummaryInput = z.infer<typeof GenerateConversationSummaryInputSchema>;

const GenerateConversationSummaryOutputSchema = z.object({
  customerName: z.string().nullable().describe('Customer name extracted from conversation, null if not found'),
  customerEmail: z.string().nullable().describe('Customer email extracted from conversation, null if not found'),
  customerPhone: z.string().nullable().describe('Customer phone number extracted from conversation, null if not found'),
  conversationSummary: z.string().describe('Professional narrative summary of the entire conversation'),
  problemsDiscussed: z.array(z.string()).describe('Array of main problems/questions discussed by the customer'),
  solutionsProvided: z.array(z.string()).describe('Array of solutions provided by the agent'),
  suggestionsGiven: z.array(z.string()).describe('Array of suggestions or recommendations made'),
});
export type GenerateConversationSummaryOutput = z.infer<typeof GenerateConversationSummaryOutputSchema>;

const promptConfig = {
  temperature: 0.3,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 1500,
};

const promptInputSchema = z.object({
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'agent', 'system']),
    content: z.string(),
    timestamp: z.string().optional(),
  })),
  agentName: z.string().optional(),
  businessContext: z.string().optional(),
});

const promptText = `📊 CONVERSATION SUMMARY TASK

You are an expert conversation analyst tasked with creating comprehensive summaries for CRM and sales follow-up purposes.

{{#if businessContext}}
🏢 BUSINESS CONTEXT:
{{{businessContext}}}
{{/if}}

💬 CONVERSATION TO ANALYZE:
{{#each conversationHistory}}
{{this.role}}: {{{this.content}}}
{{/each}}

📋 EXTRACTION INSTRUCTIONS:

1. **Customer Information** - Extract EXACTLY as stated in conversation:
   - customerName: Extract the EXACT full name when customer says "my name is [name]", "I'm [name]", etc.
     Example: User says "my name is Santosh Sharma" → customerName: "Santosh Sharma" (NOT "John Smith" or any other placeholder)
   - customerEmail: Extract the EXACT email address if provided
     Example: User says "email santosh@gmail.com" → customerEmail: "santosh@gmail.com"
   - customerPhone: Extract the EXACT phone number including country code if present
     Example: User says "number 9876543210" → customerPhone: "9876543210"
   - ⚠️ CRITICAL: Return null for any field NOT explicitly mentioned. NEVER invent or use placeholder data like "John Smith" or "john@example.com"

2. **conversationSummary** - Write a professional 2-4 sentence narrative that:
   - Provides context of who the customer is and what they needed
   - Summarizes the key discussion points and outcomes
   - Is actionable for sales teams to understand the conversation quickly
   - Uses professional business language

3. **problemsDiscussed** - List distinct problems/questions as array:
   - Each item is a clear, concise problem statement
   - Focus on customer pain points and questions
   - Include technical issues, business challenges, or information requests
   - Use customer's language when possible

4. **solutionsProvided** - List solutions/answers given as array:
   - Each item describes a specific solution or answer provided
   - Include product features mentioned, fixes suggested, or information shared
   - Be specific about what was offered or explained

5. **suggestionsGiven** - List recommendations as array:
   - Next steps suggested to customer
   - Product/service recommendations
   - Best practices or tips shared
   - Follow-up actions proposed

⚠️ CRITICAL RULES:
- Only extract information actually present in the conversation
- Do not infer or assume customer details not explicitly stated
- Keep all summaries professional and concise
- Focus on actionable information for sales follow-up
- If a field has no data, return null (for contact info) or empty array (for lists)`;

const prompt_gemini_2_5_flash = ai.definePrompt({
  name: 'generateConversationSummaryPrompt_gemini_2_5_flash',
  model: 'googleai/gemini-2.5-flash',
  config: promptConfig,
  input: { schema: promptInputSchema },
  output: { schema: GenerateConversationSummaryOutputSchema },
  prompt: promptText,
});

const prompt_gemini_2_0_flash = ai.definePrompt({
  name: 'generateConversationSummaryPrompt_gemini_2_0_flash',
  model: 'googleai/gemini-2.0-flash',
  config: promptConfig,
  input: { schema: promptInputSchema },
  output: { schema: GenerateConversationSummaryOutputSchema },
  prompt: promptText,
});

const prompt_gemini_2_5_pro = ai.definePrompt({
  name: 'generateConversationSummaryPrompt_gemini_2_5_pro',
  model: 'googleai/gemini-2.5-pro',
  config: promptConfig,
  input: { schema: promptInputSchema },
  output: { schema: GenerateConversationSummaryOutputSchema },
  prompt: promptText,
});

const generateConversationSummaryFlow = ai.defineFlow(
  {
    name: 'generateConversationSummaryFlow',
    inputSchema: GenerateConversationSummaryInputSchema,
    outputSchema: GenerateConversationSummaryOutputSchema,
  },
  async (input) => {
    console.log('[Conversation Summary] Processing conversation with', input.conversationHistory.length, 'messages');

    const promptInput = {
      conversationHistory: input.conversationHistory,
      agentName: input.agentName,
      businessContext: input.businessContext,
    };

    const genkitPrompts = [
      { name: 'gemini-2.5-flash', prompt: prompt_gemini_2_5_flash },
      { name: 'gemini-2.0-flash', prompt: prompt_gemini_2_0_flash },
      { name: 'gemini-2.5-pro', prompt: prompt_gemini_2_5_pro },
    ];

    for (const { name, prompt } of genkitPrompts) {
      try {
        console.log(`[Conversation Summary] Trying model: ${name}`);
        const res = await prompt(promptInput);
        const output = res.output;

        if (output) {
          console.log(`[Conversation Summary] ✓ Success with ${name}:`, {
            hasCustomerName: !!output.customerName,
            hasCustomerEmail: !!output.customerEmail,
            hasCustomerPhone: !!output.customerPhone,
            problemsCount: output.problemsDiscussed.length,
            solutionsCount: output.solutionsProvided.length,
            suggestionsCount: output.suggestionsGiven.length,
          });
          return output;
        }
      } catch (error: any) {
        console.warn(`[Conversation Summary] ⚠️ ${name} failed:`, error.message);
      }
    }

    console.log('[Conversation Summary] All Genkit models failed, trying direct GoogleGenerativeAI API');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not set and all Genkit models failed');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const directModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-pro',
    ];

    for (const modelName of directModels) {
      try {
        console.log(`[Conversation Summary] Trying direct API with: ${modelName}`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: promptConfig.temperature,
            topP: promptConfig.topP,
            topK: promptConfig.topK,
            maxOutputTokens: promptConfig.maxOutputTokens,
          },
        });

        let conversationText = '';
        for (const msg of input.conversationHistory) {
          conversationText += `${msg.role}: ${msg.content}\n`;
        }

        const fullPrompt = `${promptText.replace('{{#if businessContext}}🏢 BUSINESS CONTEXT:\n{{{businessContext}}}{{/if}}', input.businessContext ? `🏢 BUSINESS CONTEXT:\n${input.businessContext}` : '').replace('{{#each conversationHistory}}\n{{this.role}}: {{{this.content}}}\n{{/each}}', conversationText)}

RESPOND WITH VALID JSON ONLY:
{
  "customerName": "string or null",
  "customerEmail": "string or null", 
  "customerPhone": "string or null",
  "conversationSummary": "string",
  "problemsDiscussed": ["array of strings"],
  "solutionsProvided": ["array of strings"],
  "suggestionsGiven": ["array of strings"]
}`;

        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log(`[Conversation Summary] ✓ Success with direct API ${modelName}`);
          return parsed as GenerateConversationSummaryOutput;
        }
      } catch (error: any) {
        console.warn(`[Conversation Summary] ⚠️ Direct API ${modelName} failed:`, error.message);
      }
    }

    throw new Error('All models (Genkit and direct API) failed to generate conversation summary');
  }
);

export async function generateConversationSummary(
  input: GenerateConversationSummaryInput
): Promise<GenerateConversationSummaryOutput> {
  try {
    if (!input.conversationHistory || input.conversationHistory.length === 0) {
      return {
        customerName: null,
        customerEmail: null,
        customerPhone: null,
        conversationSummary: 'No conversation data available to summarize.',
        problemsDiscussed: [],
        solutionsProvided: [],
        suggestionsGiven: [],
      };
    }

    const result = await generateConversationSummaryFlow(input);
    return result;
  } catch (error: any) {
    console.error('[generateConversationSummary] Error:', error);
    throw new Error(`Failed to generate conversation summary: ${error.message || error}`);
  }
}
