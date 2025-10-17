/**
 * AI Pricing and Cost Calculation Utilities
 * 
 * This module provides rate constants and cost calculation functions for AI usage tracking.
 * Rates are based on Gemini model pricing as of October 2025.
 */

export type AIModel = 'gemini-2.0-flash' | 'gemini-1.5-pro';

/**
 * Gemini pricing rates per 1 million tokens
 * Source: IMPROVEMENTS_SUMMARY.md
 */
export const GEMINI_RATES = {
  'gemini-2.0-flash': {
    inputPerMillion: 0.075,    // $0.075 per 1M input tokens
    outputPerMillion: 0.30,    // $0.30 per 1M output tokens
  },
  'gemini-1.5-pro': {
    inputPerMillion: 1.25,     // $1.25 per 1M input tokens
    outputPerMillion: 5.00,    // $5.00 per 1M output tokens
  }
} as const;

/**
 * Calculate the AI cost for a given number of tokens
 * 
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens used
 * @param model - AI model used (defaults to gemini-2.0-flash)
 * @returns Total cost in USD
 */
export function calculateTokenCost(
  inputTokens: number,
  outputTokens: number,
  model: AIModel = 'gemini-2.0-flash'
): number {
  const rates = GEMINI_RATES[model];
  
  // Calculate cost: (tokens / 1,000,000) * rate per million
  const inputCost = (inputTokens / 1_000_000) * rates.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * rates.outputPerMillion;
  
  return inputCost + outputCost;
}

/**
 * Calculate total AI cost from conversation data
 * 
 * @param conversations - Array of conversations with token counts
 * @param model - AI model used
 * @returns Total AI cost in USD
 */
export function calculateTotalAICost(
  conversations: Array<{ inputTokens?: number; outputTokens?: number; tokenCount?: number }>,
  model: AIModel = 'gemini-2.0-flash'
): number {
  return conversations.reduce((total, conv) => {
    // If we have separate input/output counts, use those
    if (conv.inputTokens !== undefined && conv.outputTokens !== undefined) {
      return total + calculateTokenCost(conv.inputTokens, conv.outputTokens, model);
    }
    
    // Fallback: estimate 40% input, 60% output from total tokenCount
    // This is a reasonable heuristic for conversational AI
    if (conv.tokenCount) {
      const estimatedInput = Math.floor(conv.tokenCount * 0.4);
      const estimatedOutput = Math.floor(conv.tokenCount * 0.6);
      return total + calculateTokenCost(estimatedInput, estimatedOutput, model);
    }
    
    return total;
  }, 0);
}

/**
 * Calculate profit margin percentage
 * 
 * @param revenue - Total revenue in USD
 * @param cost - Total AI cost in USD
 * @returns Profit margin as a percentage (0-100)
 */
export function calculateProfitMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}

/**
 * Format currency value for display
 * 
 * @param amount - Amount in USD
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}
