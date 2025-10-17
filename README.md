# Voice Chat AI – Setup Notes

Environment variables to enable fast chat and TTS:

- GEMINI_API_KEY: Required for Gemini flows (existing behavior)
- OPENAI_API_KEY: Optional. If set, chat uses gpt-4o-mini for faster responses, and TTS uses gpt-4o-mini-tts when possible
- TAVILY_API_KEY: Optional. If set, web search results will be used to answer current/real-time queries

Widget embedding: see `public/widget.js`. Ensure your host allows autoplay for smoother audio playback
