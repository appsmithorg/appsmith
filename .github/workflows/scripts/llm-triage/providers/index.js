import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';
import { AnthropicProvider } from './anthropic.js';

/**
 * Factory function to create an LLM provider
 * @param {string} providerName - Name of the provider (openai, gemini, anthropic)
 * @param {object} apiKeys - Object containing API keys
 * @returns {import('./base.js').BaseLLMProvider}
 */
export function createProvider(providerName, apiKeys) {
  const normalizedName = providerName.toLowerCase().trim();

  switch (normalizedName) {
    case 'openai':
      if (!apiKeys.openai) {
        throw new Error('OPENAI_API_KEY is required for OpenAI provider');
      }
      return new OpenAIProvider(apiKeys.openai);

    case 'gemini':
      if (!apiKeys.gemini) {
        throw new Error('GEMINI_API_KEY is required for Gemini provider');
      }
      return new GeminiProvider(apiKeys.gemini);

    case 'anthropic':
      if (!apiKeys.anthropic) {
        throw new Error('ANTHROPIC_API_KEY is required for Anthropic provider');
      }
      return new AnthropicProvider(apiKeys.anthropic);

    default:
      throw new Error(
        `Unknown LLM provider: ${providerName}. Supported: openai, gemini, anthropic`
      );
  }
}

export { OpenAIProvider, GeminiProvider, AnthropicProvider };

