/**
 * Base LLM Provider Interface
 * All LLM providers must extend this class and implement the analyze method.
 */
export class BaseLLMProvider {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error(`API key is required for ${this.constructor.name}`);
    }
    this.apiKey = apiKey;
  }

  /**
   * Analyze an issue using the LLM
   * @param {string} prompt - The constructed prompt with issue details
   * @param {object} context - Additional context (codebase structure, etc.)
   * @returns {Promise<TriageResult>} The triage result
   */
  async analyze(prompt, context = {}) {
    throw new Error('analyze() must be implemented by subclass');
  }

  /**
   * Get the provider name
   * @returns {string}
   */
  getName() {
    return this.constructor.name;
  }

  /**
   * Parse the LLM response into a structured TriageResult
   * @param {string} response - Raw LLM response
   * @returns {TriageResult}
   */
  parseResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to parse the entire response as JSON
      const parsed = JSON.parse(response);
      return this.validateTriageResult(parsed);
    } catch (error) {
      console.error('Failed to parse LLM response:', error.message);
      // Return a fallback result
      return {
        complexity: 'high',
        confidence: 0.3,
        files: [],
        reasoning: 'Failed to parse LLM response. Manual review recommended.',
        error: error.message
      };
    }
  }

  /**
   * Validate and normalize a triage result
   * @param {object} result - Raw parsed result
   * @returns {TriageResult}
   */
  validateTriageResult(result) {
    const validComplexities = ['low', 'medium', 'high'];
    const complexity = validComplexities.includes(result.complexity?.toLowerCase())
      ? result.complexity.toLowerCase()
      : 'high';

    return {
      complexity,
      confidence: Math.min(1, Math.max(0, parseFloat(result.confidence) || 0.5)),
      files: Array.isArray(result.files) ? result.files.slice(0, 10) : [],
      reasoning: result.reasoning || 'No reasoning provided',
      suggestedLabels: Array.isArray(result.suggestedLabels) ? result.suggestedLabels : [],
      estimatedEffort: result.estimatedEffort || null
    };
  }
}

/**
 * @typedef {Object} TriageResult
 * @property {'low' | 'medium' | 'high'} complexity - Issue complexity rating
 * @property {number} confidence - Confidence score (0-1)
 * @property {string[]} files - Relevant file paths
 * @property {string} reasoning - Explanation of the assessment
 * @property {string[]} [suggestedLabels] - Additional label suggestions
 * @property {string} [estimatedEffort] - Effort estimate (e.g., "2-4 hours")
 * @property {string} [error] - Error message if parsing failed
 */

