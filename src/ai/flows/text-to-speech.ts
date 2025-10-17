'use server';

/**
 * @fileOverview A Genkit flow for synthesizing speech from text.
 *
 * - textToSpeech - A function that handles the text-to-speech conversion.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {ai} from '@/ai/ai-instance';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import {z} from 'genkit';
import wav from 'wav';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  voice: z.string().optional().describe('The voice preference, e.g., "female-us" or "male-gb".'),
  languageCode: z.string().optional().describe('BCP-47 language code to guide pronunciation, e.g., "en-US", "hi-IN".'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe("A data URI of the generated audio file. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

/**
 * Converts PCM audio data to a base64 encoded WAV data string.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({ text, voice, languageCode }) => {
    console.log('[TTS] Called with:', { textLength: text?.length, voice, languageCode });
    
    // Safeguard: Do not call the API for empty text.
    if (!text || !text.trim()) {
      console.log('[TTS] Empty text, returning empty audio');
      return { audioDataUri: '' };
    }

    // 0) Prefer OpenAI TTS if available for speed/quality
    try {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        console.log('[TTS] Trying OpenAI TTS...');
        const openai = new OpenAI({ apiKey: openaiKey });
        const sanitizedText = sanitizeForTts(text);
        const voiceName = chooseOpenAiVoice(voice || '');
        const modelCandidates = [ 'gpt-4o-mini-tts', 'gpt-4o-audio-preview' ];
        for (const model of modelCandidates) {
          try {
            const resp: any = await (openai as any).audio.speech.create({
              model,
              input: sanitizedText,
              voice: voiceName,
              format: 'wav',
            });
            const arrayBuffer = await resp.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            if (base64 && base64.length > 0) {
              console.log(`[TTS] ✅ OpenAI TTS SUCCESS with model ${model}`);
              return { audioDataUri: 'data:audio/wav;base64,' + base64 };
            }
          } catch (_err) {
            console.log(`[TTS] OpenAI model ${model} failed:`, _err);
          }
        }
      }
    } catch (e) {
      console.log('[TTS] OpenAI TTS not available or failed, using Gemini');
    }

    // Map to Gemini prebuilt voices (single speaker). Use clearer gender defaults.
    // Prefer clearer gender-mapped defaults
    const femaleDefault = 'Leda';
    const maleDefault = 'Gacrux';
    let voiceName = femaleDefault;
    if (voice && voice.startsWith('male-')) voiceName = maleDefault;

    const sanitizedText = sanitizeForTts(text);
    const isFemale = (voice || '').startsWith('female-');
    const styleHint = buildStyleHint(languageCode || 'en-US', isFemale ? 'female' : 'male');

    // STRICT gender enforcement: ONLY use gender-specific voices, NEVER mix
    const femaleVoices = [ 'Leda', 'Aoede', 'Umbriel', 'Enceladus', 'Callirrhoe', 'Autonoe', 'Erinome' ];
    const maleVoices   = [ 'Gacrux', 'Charon', 'Fenrir', 'Kore', 'Achernar', 'Alnilam', 'Algieba' ];
    
    // Use ONLY the selected gender voices - no fallback to neutral
    const voiceCandidates = isFemale ? femaleVoices : maleVoices;

    // 1) Try native Gemini 2.5 TTS via @google/genai first (Preview models)
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      console.log('[TTS] Trying Gemini TTS with voices:', voiceCandidates);
      const direct = new GoogleGenAI({ apiKey });
      const ttsModels = [
        'gemini-2.5-flash-preview-tts',
        'gemini-2.5-pro-preview-tts',
      ];
      for (const baseModel of ttsModels) {
        for (const candidate of voiceCandidates) {
          try {
            console.log(`[TTS] Trying Gemini model ${baseModel} with voice ${candidate}`);
            const speechConfig: any = {
              languageCode: (languageCode || 'en-US'),
              speakingRate: 1.0,
              pitch: 0.0,
              volumeGainDb: 0.0,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: candidate } },
            };

            const response = await (direct as any).models.generateContent({
              model: baseModel,
              contents: [{ parts: [{ text: styleHint + sanitizedText }] }],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig,
              },
            });

            const part = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
            const data: string | undefined = part?.data;
            const mime: string | undefined = part?.mimeType;
            if (data) {
              if (mime && /wav/i.test(mime)) {
                console.log(`[TTS] ✅ Gemini TTS SUCCESS with ${baseModel} / ${candidate} (wav)`);
                return { audioDataUri: 'data:audio/wav;base64,' + data };
              }
              const audioBuffer = Buffer.from(data, 'base64');
              const wavBase64 = await toWav(audioBuffer);
              console.log(`[TTS] ✅ Gemini TTS SUCCESS with ${baseModel} / ${candidate} (converted to wav)`);
              return { audioDataUri: 'data:audio/wav;base64,' + wavBase64 };
            }
          } catch (err) {
            console.log(`[TTS] Gemini ${baseModel} / ${candidate} failed:`, err);
          }
        }
      }
    }

    // 2) Fallback: attempt Genkit audio with broadly available models (may not produce audio)
    console.log('[TTS] Gemini direct failed, trying Genkit fallback...');
    try {
      const candidateModels = [
        'googleai/gemini-2.5-pro-preview-tts',
        'googleai/gemini-2.5-flash-preview-tts',
        'googleai/gemini-1.5-pro',
        'googleai/gemini-1.5-flash',
      ];
      for (const model of candidateModels) {
        for (const candidate of voiceCandidates) {
          try {
            console.log(`[TTS] Trying Genkit model ${model} with voice ${candidate}`);
            const speechConfig: any = {
              languageCode: (languageCode || 'en-US'),
              speakingRate: 1.0,
              pitch: 0.0,
              volumeGainDb: 0.0,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: candidate } },
            };

            const gen = await (ai as any).generate({
              model,
              config: {
                responseModalities: ['AUDIO'],
                speechConfig,
              },
              prompt: styleHint + sanitizedText,
            });
            const media = gen.media as { url?: string } | undefined;
            if (media?.url && media.url.startsWith('data:')) {
              const audioBuffer = Buffer.from(
                media.url.substring(media.url.indexOf(',') + 1),
                'base64'
              );
              const wavBase64 = await toWav(audioBuffer);
              console.log(`[TTS] ✅ Genkit TTS SUCCESS with ${model} / ${candidate}`);
              return { audioDataUri: 'data:audio/wav;base64,' + wavBase64 };
            }
          } catch (err) {
            console.log(`[TTS] Genkit ${model} / ${candidate} failed:`, err);
          }
        }
      }
    } catch (err) {
      console.log('[TTS] Genkit fallback failed:', err);
    }

    // 3) Final fallback: let client use browser TTS
    console.log('[TTS] ❌ All server TTS failed, returning empty (client will use browser TTS)');
    return { audioDataUri: '' };
  }
);

function getTTSPrompt(languageCode: string, text: string): string {
  const localeInstructions: Record<string, string> = {
    'hi-IN': 'Speak in Hindi using proper Devanagari pronunciation. Use natural Hindi intonation and rhythm.',
    'bn-IN': 'Speak in Bengali using proper Bengali pronunciation. Use natural Bengali intonation and rhythm.',
    'mr-IN': 'Speak in Marathi using proper Devanagari pronunciation. Use natural Marathi intonation and rhythm.',
    'ta-IN': 'Speak in Tamil using proper Tamil pronunciation. Use natural Tamil intonation and rhythm.',
    'te-IN': 'Speak in Telugu using proper Telugu pronunciation. Use natural Telugu intonation and rhythm.',
    'gu-IN': 'Speak in Gujarati using proper Gujarati pronunciation. Use natural Gujarati intonation and rhythm.',
    'kn-IN': 'Speak in Kannada using proper Kannada pronunciation. Use natural Kannada intonation and rhythm.',
    'ml-IN': 'Speak in Malayalam using proper Malayalam pronunciation. Use natural Malayalam intonation and rhythm.',
    'pa-IN': 'Speak in Punjabi using proper Gurmukhi pronunciation. Use natural Punjabi intonation and rhythm.',
    'es-ES': 'Speak in Spanish (Spain) using proper Castilian pronunciation.',
    'es-MX': 'Speak in Spanish (Mexico) using proper Mexican pronunciation.',
    'fr-FR': 'Speak in French using proper French pronunciation.',
    'de-DE': 'Speak in German using proper German pronunciation.',
    'it-IT': 'Speak in Italian using proper Italian pronunciation.',
    'pt-BR': 'Speak in Portuguese (Brazil) using proper Brazilian pronunciation.',
    'pt-PT': 'Speak in Portuguese (Portugal) using proper European Portuguese pronunciation.',
    'ja-JP': 'Speak in Japanese using proper Japanese pronunciation and intonation.',
    'ko-KR': 'Speak in Korean using proper Korean pronunciation and intonation.',
    'zh-CN': 'Speak in Mandarin Chinese (Simplified) using proper Mandarin pronunciation.',
    'zh-TW': 'Speak in Mandarin Chinese (Traditional) using proper Mandarin pronunciation.',
    'ar-SA': 'Speak in Arabic using proper Arabic pronunciation and rhythm.',
    'ru-RU': 'Speak in Russian using proper Russian pronunciation.',
    'nl-NL': 'Speak in Dutch using proper Dutch pronunciation.',
    'pl-PL': 'Speak in Polish using proper Polish pronunciation.',
    'tr-TR': 'Speak in Turkish using proper Turkish pronunciation.',
    'vi-VN': 'Speak in Vietnamese using proper Vietnamese pronunciation and tones.',
    'id-ID': 'Speak in Indonesian using proper Indonesian pronunciation.',
  };

  const instruction = localeInstructions[languageCode] || `Speak in ${languageCode} using proper native pronunciation.`;

  return `You are a text-to-speech engine. ${instruction}

Text to speak: "${text}"

Important: Speak naturally and clearly in the target language. Do not translate the text, just read it with correct pronunciation for ${languageCode}.`;
}

function sanitizeForTts(input: string): string {
  // Replace repeated punctuation and remove names that cause engines to spell them out
  let s = input
    .replace(/[!?]{2,}/g, '!')
    .replace(/[.]{3,}/g, '…')
    .replace(/\s*([?!.,;:])\s*/g, '$1 ')
    .replace(/["""]/g, '"')
    .replace(/['']/g, "'");
  // Compact spaces
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function buildStyleHint(languageCode: string, gender: 'male' | 'female'): string {
  // Strong gender and natural accent instructions for human-like speech
  const genderLine = gender === 'female' 
    ? 'IMPORTANT: Speak with a natural feminine voice, using female speech patterns and intonation.' 
    : 'IMPORTANT: Speak with a natural masculine voice, using male speech patterns and intonation.';
  
  // Language-specific gender hints for all major languages to ensure proper accent and gender
  const localizedGenderHint: Record<string, string> = {
    // Indian Languages
    'hi-IN': gender === 'female' ? ' कृपया स्त्री स्वर में प्राकृतिक रूप से बोलें। ' : ' कृपया पुरुष स्वर में प्राकृतिक रूप से बोलें। ',
    'bn-IN': gender === 'female' ? ' দয়া করে মহিলা কণ্ঠে কথা বলুন। ' : ' দয়া করে পুরুষ কণ্ঠে কথা বলুন। ',
    'mr-IN': gender === 'female' ? ' कृपया स्त्री स्वरात बोला. ' : ' कृपया पुरुष स्वरात बोला. ',
    'ta-IN': gender === 'female' ? ' பெண் குரலில் பேசுங்கள். ' : ' ஆண் குரலில் பேசுங்கள். ',
    'te-IN': gender === 'female' ? ' స్త్రీ స్వరంలో మాట్లాడండి. ' : ' పురుష స్వరంలో మాట్లాడండి. ',
    'gu-IN': gender === 'female' ? ' સ્ત્રી અવાજમાં બોલો. ' : ' પુરુષ અવાજમાં બોલો. ',
    'kn-IN': gender === 'female' ? ' ಮಹಿಳೆ ಧ್ವನಿಯಲ್ಲಿ ಮಾತನಾಡಿ. ' : ' ಪುರುಷ ಧ್ವನಿಯಲ್ಲಿ ಮಾತನಾಡಿ. ',
    'ml-IN': gender === 'female' ? ' സ്ത്രീ ശബ്ദത്തിൽ സംസാരിക്കുക. ' : ' പുരുഷ ശബ്ദത്തിൽ സംസാരിക്കുക. ',
    'pa-IN': gender === 'female' ? ' ਔਰਤ ਦੀ ਆਵਾਜ਼ ਵਿੱਚ ਬੋਲੋ। ' : ' ਆਦਮੀ ਦੀ ਆਵਾਜ਼ ਵਿੱਚ ਬੋਲੋ। ',
    // European Languages
    'es-ES': gender === 'female' ? ' Habla con voz femenina natural. ' : ' Habla con voz masculina natural. ',
    'es-MX': gender === 'female' ? ' Habla con voz femenina natural. ' : ' Habla con voz masculina natural. ',
    'fr-FR': gender === 'female' ? ' Parlez avec une voix féminine naturelle. ' : ' Parlez avec une voix masculine naturelle. ',
    'de-DE': gender === 'female' ? ' Sprechen Sie mit natürlicher weiblicher Stimme. ' : ' Sprechen Sie mit natürlicher männlicher Stimme. ',
    'it-IT': gender === 'female' ? ' Parla con voce femminile naturale. ' : ' Parla con voce maschile naturale. ',
    'pt-BR': gender === 'female' ? ' Fale com voz feminina natural. ' : ' Fale com voz masculina natural. ',
    'pt-PT': gender === 'female' ? ' Fale com voz feminina natural. ' : ' Fale com voz masculina natural. ',
    'nl-NL': gender === 'female' ? ' Spreek met een natuurlijke vrouwelijke stem. ' : ' Spreek met een natuurlijke mannelijke stem. ',
    'pl-PL': gender === 'female' ? ' Mów naturalnym kobiecym głosem. ' : ' Mów naturalnym męskim głosem. ',
    'ru-RU': gender === 'female' ? ' Говорите естественным женским голосом. ' : ' Говорите естественным мужским голосом. ',
    'tr-TR': gender === 'female' ? ' Doğal kadın sesiyle konuş. ' : ' Doğal erkek sesiyle konuş. ',
    // Asian Languages
    'ja-JP': gender === 'female' ? ' 自然な女性の声で話してください。 ' : ' 自然な男性の声で話してください。 ',
    'ko-KR': gender === 'female' ? ' 자연스러운 여성 목소리로 말하세요. ' : ' 자연스러운 남성 목소리로 말하세요. ',
    'zh-CN': gender === 'female' ? ' 请用自然的女声说话。 ' : ' 请用自然的男声说话。 ',
    'zh-TW': gender === 'female' ? ' 請用自然的女聲說話。 ' : ' 請用自然的男聲說話。 ',
    'vi-VN': gender === 'female' ? ' Nói bằng giọng nữ tự nhiên. ' : ' Nói bằng giọng nam tự nhiên. ',
    'ar-SA': gender === 'female' ? ' تحدث بصوت أنثوي طبيعي. ' : ' تحدث بصوت ذكوري طبيعي. ',
    'id-ID': gender === 'female' ? ' Bicara dengan suara wanita alami. ' : ' Bicara dengan suara pria alami. ',
  };
  const localeHint = localizedGenderHint[languageCode] || '';
  return `${localeHint}${genderLine} Use the natural accent and pronunciation for ${languageCode}.\n`;
}

function chooseOpenAiVoice(voicePref: string): string {
  const isFemale = (voicePref || '').startsWith('female-');
  // OpenAI common voices; 'verse' sounds more feminine, 'alloy' more neutral/male
  return isFemale ? 'verse' : 'alloy';
}
