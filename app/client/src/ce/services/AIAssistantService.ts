import type { AIEditorContext } from "ce/components/editorComponents/GPT";

export interface AIRequestPayload {
  prompt: string;
  context: AIEditorContext;
  currentValue: string;
  mode: string;
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
}

export interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  temperature?: number;
}

export class AIAssistantService {
  static async callClaudeAPI(
    prompt: string,
    context: AIEditorContext,
    apiKey: string,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(prompt, context);

    const requestBody: ClaudeRequest = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\n${userPrompt}`,
        },
      ],
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.error?.message || "Failed to get AI response";
      if (response.status === 401 || response.status === 403) {
        throw new Error("Invalid API key. Please check your API key in settings.");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else {
        throw new Error("Failed to get AI response. Please try again.");
      }
    }

    const data = await response.json();
    return data.content[0]?.text || "";
  }

  static async callOpenAIAPI(
    prompt: string,
    context: AIEditorContext,
    apiKey: string,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(prompt, context);

    const requestBody: OpenAIRequest = {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        throw new Error("Invalid API key. Please check your API key in settings.");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else {
        throw new Error("Failed to get AI response. Please try again.");
      }
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  private static buildSystemPrompt(context: AIEditorContext): string {
    if (context.mode === "javascript") {
      return `You are an expert JavaScript developer helping with Appsmith code. 
Appsmith is a low-code platform. Provide clean, efficient JavaScript code that follows best practices.
Focus on the specific function or code block the user is working on.`;
    } else {
      return `You are an expert SQL/query developer helping with database queries in Appsmith.
Provide optimized, correct SQL queries that follow best practices.
Consider the datasource type and ensure the query is syntactically correct.`;
    }
  }

  private static buildUserPrompt(
    prompt: string,
    context: AIEditorContext,
  ): string {
    let contextInfo = "";

    if (context.functionName) {
      contextInfo += `Function: ${context.functionName}\n`;
    }
    if (context.functionString) {
      contextInfo += `Current function code:\n\`\`\`\n${context.functionString}\n\`\`\`\n`;
    }
    if (context.cursorLineNumber !== undefined) {
      contextInfo += `Cursor at line: ${context.cursorLineNumber + 1}\n`;
    }

    return `${contextInfo}\nUser request: ${prompt}\n\nProvide the code solution:`;
  }
}
