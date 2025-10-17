
'use server';
/**
 * @fileOverview An AI agent that extracts the dominant color from an image.
 *
 * - extractColorFromImage - A function that handles the color extraction process.
 * - ExtractColorFromImageInput - The input type for the extractColorFromImage function.
 * - ExtractColorFromImageOutput - The return type for the extractColorFromImage function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ExtractColorFromImageInputSchema = z.object({
  imageUrl: z.string().url().describe('The URL of the logo image to analyze.'),
});
export type ExtractColorFromImageInput = z.infer<typeof ExtractColorFromImageInputSchema>;

const ExtractColorFromImageOutputSchema = z.object({
  hexColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('The dominant color from the image, returned as a 6-digit hex code.'),
});
export type ExtractColorFromImageOutput = z.infer<typeof ExtractColorFromImageOutputSchema>;

export async function extractColorFromImage(input: ExtractColorFromImageInput): Promise<ExtractColorFromImageOutput | null> {
  try {
    console.log('[DEBUG] Starting AI color extraction for URL:', input.imageUrl);
    const result = await extractColorFromImageFlow(input);
    console.log('[DEBUG] AI color extraction completed successfully:', result);
    return result;
  } catch (error: any) {
    console.error("Color extraction flow failed:", {
      message: error.message,
      stack: error.stack,
      input: input.imageUrl
    });
    // Return null on failure so the calling function knows it didn't work.
    return null;
  }
}

const prompt = ai.definePrompt({
  name: 'extractColorFromImagePrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {
    schema: ExtractColorFromImageInputSchema,
  },
  output: {
    schema: ExtractColorFromImageOutputSchema,
  },
  prompt: `You are an expert brand designer.
Your task is to analyze the following company logo and identify its single most dominant and representative color.
- Prioritize the most prominent color used in the main graphic or text of the logo.
- You MUST ignore background colors like white, off-white, or transparency.
- Return this color as a standard 6-digit hexadecimal code.

For example, for a logo that is mostly a shade of purple, you should return a value like "#A54599".

Image to analyze:
{{media url=imageUrl}}`,
});

const extractColorFromImageFlow = ai.defineFlow(
  {
    name: 'extractColorFromImageFlow',
    inputSchema: ExtractColorFromImageInputSchema,
    outputSchema: ExtractColorFromImageOutputSchema,
  },
  async (input) => {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error("AI did not return a valid color output.");
      }
      return output;
  }
);
