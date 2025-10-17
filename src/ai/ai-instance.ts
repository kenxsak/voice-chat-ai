import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Load the API key from environment variables.
const apiKey = process.env.GEMINI_API_KEY;

// Optional: Add a check and a log to help with debugging.
if (!apiKey) {
  console.warn("GEMINI_API_KEY environment variable not set. AI features will not work.");
}

// Configure Genkit with the Google AI plugin.
// The plugin will handle the case where the API key is missing.
export const ai = genkit({
  plugins: [
    googleAI({ apiKey }),
  ],
});
