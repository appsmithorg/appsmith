import { AIChat, type ChatMessage } from "@appsmith/wds";
import {
  EventType,
  type ExecutionResult,
} from "constants/AppsmithActionConstants/ActionConstants";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import React, { type FormEvent, type ReactNode } from "react";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
  WidgetBaseConfiguration,
  WidgetDefaultProps,
} from "WidgetProvider/constants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import {
  anvilConfig,
  autocompleteConfig,
  defaultsConfig,
  metaConfig,
  methodsConfig,
  propertyPaneContent,
  propertyPaneStyle,
} from "./config";

export interface WDSAIChatWidgetProps
  extends ContainerWidgetProps<WidgetProps> {}

export interface Message {
  id: string;
  content: string;
  role: "assistant" | "user" | "system";
  promptSuggestions?: string[];
}

interface State extends WidgetState {
  messages: Message[];
  prompt: string;
  isWaitingForResponse: boolean;
}

class WDSAIChatWidget extends BaseWidget<WDSAIChatWidgetProps, State> {
  static type = "WDS_AI_CHAT_WIDGET";

  state = {
    messages: [] as Message[],
    prompt: "",
    isWaitingForResponse: false,
  };

  static getConfig(): WidgetBaseConfiguration {
    return metaConfig;
  }

  static getDefaults(): WidgetDefaultProps {
    return defaultsConfig;
  }

  static getPropertyPaneConfig() {
    return [];
  }
  static getPropertyPaneContentConfig() {
    return propertyPaneContent;
  }

  static getPropertyPaneStyleConfig() {
    return propertyPaneStyle;
  }

  static getMethods() {
    return methodsConfig;
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return autocompleteConfig;
  }

  static getSetterConfig(): SetterConfig | null {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
      },
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, unknown> {
    return {};
  }

  static getAnvilConfig(): AnvilConfig | null {
    return anvilConfig;
  }

  static getStylesheetConfig(): Stylesheet {
    return {};
  }

  componentDidMount() {
    // Add initial assistant message with suggestions if they were configured
    if (this.props.initialAssistantMessage.length > 0) {
      this.setState((state) => ({
        ...state,
        messages: [
          {
            id: Math.random().toString(),
            content: this.props.initialAssistantMessage,
            role: "assistant",
            promptSuggestions: this.props.initialAssistantSuggestions || [],
          },
        ],
      }));
    }
  }

  componentDidUpdate(prevProps: WDSAIChatWidgetProps): void {
    // Track changes in the widget's properties and update the local state accordingly

    // Update the initial assistant message
    if (
      prevProps.initialAssistantMessage !==
        this.props.initialAssistantMessage ||
      prevProps.initialAssistantSuggestions !==
        this.props.initialAssistantSuggestions
    ) {
      let updatedMessage: Message | null;

      //
      if (this.props.initialAssistantMessage.length > 0) {
        const currentMessage = this.state.messages[0];

        updatedMessage = {
          // If the initial assistant message is set, update it
          // Otherwise, create a new one
          ...(currentMessage || {
            id: Math.random().toString(),
            role: "assistant",
          }),
          content: this.props.initialAssistantMessage,
          promptSuggestions: this.props.initialAssistantSuggestions,
        };
      } else {
        updatedMessage = null;
      }

      this.setState((state) => ({
        ...state,
        messages: updatedMessage ? [updatedMessage] : [],
      }));
    }
  }

  updatePrompt = (prompt: string) => {
    this.setState({ prompt });
  };

  adaptMessages = (messages: Message[]): ChatMessage[] => {
    const chatMessages: ChatMessage[] = messages.map((message) => {
      if (message.role === "assistant") {
        return {
          id: message.id,
          content: message.content,
          isAssistant: true,
          promptSuggestions: message.promptSuggestions || [],
        };
      }

      return {
        id: message.id,
        content: message.content,
        isAssistant: false,
      };
    });

    return chatMessages;
  };

  handleMessageSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    this.setState(
      (state) => ({
        messages: [
          ...state.messages,
          {
            id: String(Date.now()),
            content: this.state.prompt,
            role: "user",
          },
        ],
        prompt: "",
        isWaitingForResponse: true,
      }),
      () => {
        const messages: Message[] = [...this.state.messages];
        const params = { messages };

        this.executeAction({
          triggerPropertyName: "onClick",
          dynamicString: `{{${this.props.queryRun}.run(${JSON.stringify(params)})}}`,
          event: {
            type: EventType.ON_CLICK,
            callback: this.handleActionComplete,
          },
        });
      },
    );
  };

  handleActionComplete = (result: ExecutionResult) => {
    if (result.success) {
      this.setState((state) => ({
        messages: [
          ...state.messages,
          {
            id: Math.random().toString(),
            content: this.props.queryData.choices[0].message.content,
            role: "assistant",
            // TODO: Add prompt suggestions from the query data, if any
            promptSuggestions: [],
          },
        ],
        isWaitingForResponse: false,
      }));
    }
  };

  handlePromptChange = (prompt: string) => {
    this.updatePrompt(prompt);
  };

  handleApplyAssistantSuggestion = (suggestion: string) => {
    this.updatePrompt(suggestion);
  };

  getWidgetView(): ReactNode {
    return (
      <AIChat
        assistantName={this.props.assistantName}
        chatDescription={this.props.chatDescription}
        chatTitle={this.props.chatTitle}
        isWaitingForResponse={this.state.isWaitingForResponse}
        onApplyAssistantSuggestion={this.handleApplyAssistantSuggestion}
        onPromptChange={this.handlePromptChange}
        onSubmit={this.handleMessageSubmit}
        prompt={this.state.prompt}
        promptInputPlaceholder={this.props.promptInputPlaceholder}
        thread={this.adaptMessages(this.state.messages)}
        username={this.props.username || ""}
      />
    );
  }
}

export default WDSAIChatWidget;
