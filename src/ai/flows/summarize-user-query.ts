
// SummarizeUserQuery.ts
'use server';
/**
 * @fileOverview An AI agent that summarizes the user query.
 *
 * - summarizeUserQuery - A function that handles the user query summarization process.
 * - SummarizeUserQueryInput - The input type for the summarizeUserQuery function.
 * - SummarizeUserQueryOutput - The return type for the summarizeUserQuery function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SummarizeUserQueryInputSchema = z.object({
  query: z.string().describe('The user query to summarize.'),
});
export type SummarizeUserQueryInput = z.infer<typeof SummarizeUserQueryInputSchema>;

const SummarizeUserQueryOutputSchema = z.object({
  summary: z.string().describe('The summary of the user query.'),
});
export type SummarizeUserQueryOutput = z.infer<typeof SummarizeUserQueryOutputSchema>;

export async function summarizeUserQuery(input: SummarizeUserQueryInput): Promise<SummarizeUserQueryOutput> {
  return summarizeUserQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeUserQueryPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {
    schema: z.object({
      query: z.string().describe('The user query to summarize.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('The summary of the user query.'),
    }),
  },
  prompt: `You are an AI expert in understanding user queries.

You will summarize the user's query to ensure that the AI agent understands the user's intent correctly. 

User Query: {{{query}}}`,
});

const summarizeUserQueryFlow = ai.defineFlow<
  typeof SummarizeUserQueryInputSchema,
  typeof SummarizeUserQueryOutputSchema
>({
  name: 'summarizeUserQueryFlow',
  inputSchema: SummarizeUserQueryInputSchema,
  outputSchema: SummarizeUserQueryOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
