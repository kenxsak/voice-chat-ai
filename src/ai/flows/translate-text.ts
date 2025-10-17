'use server';

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { ALL_LANGUAGES, isRTLLanguage } from '@/lib/global-data';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  languageCode: z.string().describe('Target BCP-47 locale code, e.g., "es-ES", "hi-IN".'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text, or the original if already in target language.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  try {
    return await translateTextFlow(input);
  } catch (error) {
    console.error('[DEBUG] Translation error, returning original text:', error);
    return { translatedText: input.text };
  }
}

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async ({ text, languageCode }) => {
    if (!text || !text.trim()) {
      return { translatedText: '' };
    }

    const language = ALL_LANGUAGES.find(lang => lang.code === languageCode);
    const targetName = language?.name || languageCode;
    const isRTL = isRTLLanguage(languageCode);
    const rtlNote = isRTL ? ' (This is a right-to-left language; use appropriate script direction)' : '';

    // First try the official Google Generative AI SDK if API key is present
    try {
      const apiKey = (process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY) as string | undefined;
      if (apiKey) {
        const mod: any = await import('@google/generative-ai');
        const genAI = new mod.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Translate this text to ${targetName} (${languageCode}).${rtlNote} Respond ONLY with the translation, using native script when applicable.\n\nText:\n${text}`;
        const result = await model.generateContent(prompt as any);
        const out = (result as any)?.response?.text?.() || '';
        if (out && String(out).trim()) {
          return { translatedText: String(out).trim() };
        }
      }
    } catch (directError) {
      console.log('[Translation] Direct API failed, trying Genkit fallback:', directError);
    }

    // Fallback to Genkit Gemini
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: [
        {
          text: `Translate the following into ${targetName} (${languageCode}).${rtlNote}\nRules:\n- Respond ONLY with the translation (no quotes, no commentary).\n- Use the native script of the target language when applicable.\n- Preserve tone and formality.`,
        },
        { text },
      ],
    });

    let translatedText = (typeof output === 'string' ? output : (output as any)?.text) ?? '';
    translatedText = translatedText.replace(/^"|"$/g, '').replace(/^`{3}[a-zA-Z]*\n?|`{3}$/g, '');
    if (!translatedText.trim()) translatedText = text;
    return { translatedText };
  }
);


