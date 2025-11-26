import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider } from './base.js';

/**
 * Anthropic Claude Provider
 */
export class AnthropicProvider extends BaseLLMProvider {
  constructor(apiKey) {
    super(apiKey);
    this.client = new Anthropic({ apiKey });
    this.model = 'claude-sonnet-4-20250514';
  }

  /**
   * Analyze an issue using Anthropic Claude
   * @param {string} prompt - The constructed prompt
   * @param {object} context - Additional context
   * @returns {Promise<import('./base.js').TriageResult>}
   */
  async analyze(prompt, context = {}) {
    const systemPrompt = this.buildSystemPrompt(context);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      const content = response.content[0]?.text;
      if (!content) {
        throw new Error('Empty response from Anthropic');
      }

      return this.parseResponse(content);
    } catch (error) {
      console.error(`Anthropic API error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build the system prompt for Anthropic
   * @param {object} context - Context including codebase structure
   * @returns {string}
   */
  buildSystemPrompt(context) {
    return `You are an expert software engineer helping triage GitHub issues for the Appsmith open-source project.

Appsmith is a low-code platform for building internal tools. The codebase consists of:
- Frontend (React/TypeScript): app/client/src/
- Backend (Java/Spring): app/server/
- Widgets: app/client/src/widgets/
- Plugins: app/server/appsmith-plugins/

Your task is to analyze GitHub issues and determine:
1. **Complexity**: How difficult is this issue to fix?
   - "low": Simple fixes, typos, minor UI changes, clear single-file changes
   - "medium": Moderate complexity, may touch multiple files, requires understanding of a subsystem
   - "high": Complex architectural changes, cross-cutting concerns, requires deep system knowledge

2. **Relevant Files**: Which files in the codebase are likely involved?

3. **Reasoning**: Brief explanation of your assessment.

IMPORTANT: Issues marked "high" complexity will NOT be shown to community contributors.

${context.codebaseStructure ? `\nCodebase structure:\n${context.codebaseStructure}` : ''}

Respond ONLY with valid JSON in this exact format:
{
  "complexity": "low" | "medium" | "high",
  "confidence": 0.0-1.0,
  "files": ["path/to/file1.ts", "path/to/file2.java"],
  "reasoning": "Brief explanation",
  "suggestedLabels": ["optional", "additional", "labels"],
  "estimatedEffort": "1-2 hours" | "2-4 hours" | "4-8 hours" | "1-2 days" | "2+ days"
}`;
  }
}

