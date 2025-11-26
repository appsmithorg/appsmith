import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseLLMProvider } from './base.js';

/**
 * Google Gemini Provider
 */
export class GeminiProvider extends BaseLLMProvider {
  constructor(apiKey) {
    super(apiKey);
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  /**
   * Analyze an issue using Google Gemini
   * @param {string} prompt - The constructed prompt
   * @param {object} context - Additional context
   * @returns {Promise<import('./base.js').TriageResult>}
   */
  async analyze(prompt, context = {}) {
    const systemPrompt = this.buildSystemPrompt(context);
    const fullPrompt = `${systemPrompt}\n\n---\n\n${prompt}`;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json'
        }
      });

      const response = result.response;
      const content = response.text();

      if (!content) {
        throw new Error('Empty response from Gemini');
      }

      return this.parseResponse(content);
    } catch (error) {
      console.error(`Gemini API error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build the system prompt for Gemini
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

