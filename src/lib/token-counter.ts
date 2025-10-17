/**
 * Token counting utilities for tracking AI usage
 * 
 * This provides token estimation for text content.
 * For more accurate counting, integrate with the AI model's actual token counter.
 */

/**
 * Estimates token count from text using a simple heuristic
 * Average token is ~4 characters for English text
 * This is a rough approximation - actual count may vary by 10-20%
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  
  // Remove extra whitespace
  const cleanText = text.trim().replace(/\s+/g, ' ');
  
  // Average ~4 characters per token (common heuristic)
  const charCount = cleanText.length;
  const estimatedTokens = Math.ceil(charCount / 4);
  
  return estimatedTokens;
}

/**
 * Estimates token count for structured content (text + images)
 */
export function estimateContentTokens(content: string | any[]): number {
  if (typeof content === 'string') {
    return estimateTokenCount(content);
  }
  
  let totalTokens = 0;
  
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.text) {
        totalTokens += estimateTokenCount(part.text);
      }
      if (part.media) {
        // Images typically count as ~258 tokens for vision models
        totalTokens += 258;
      }
    }
  }
  
  return totalTokens;
}

/**
 * Calculates total tokens for a conversation
 */
export function calculateConversationTokens(messages: Array<{ content: string | any[] }>): number {
  return messages.reduce((total, msg) => {
    return total + estimateContentTokens(msg.content);
  }, 0);
}
