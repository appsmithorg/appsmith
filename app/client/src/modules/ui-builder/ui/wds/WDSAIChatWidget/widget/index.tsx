import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import React, { type FormEvent, type ReactNode } from "react";
import {
  EventType,
  type ExecutionResult,
} from "constants/AppsmithActionConstants/ActionConstants";
import styles from "./styles.module.css";
import Markdown from "react-markdown";
import { Text } from "@appsmith/wds";

import { Button, Spinner, TextArea } from "@appsmith/wds";
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

interface Message {
  id: string;
  content: string;
  role: "assistant" | "user";
}

interface State extends WidgetState {
  messages: Message[];
  prompt: string;
  isWaitingForResponse: boolean;
}

class WDSAIChatWidget extends BaseWidget<WDSAIChatWidgetProps, State> {
  static type = "WDS_AI_CHAT_WIDGET";

  state = {
    messages: [
      {
        id: "1",
        content: "Hello! How can I help you?",
        role: "assistant" as const,
      },
    ],
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

  handleMessageSubmit = (event?: FormEvent<HTMLFormElement>) => {
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

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
        pushBatchMetaUpdates("messages", this.state.messages);
        commitBatchMetaUpdates();

        super.executeAction({
          triggerPropertyName: "onClick",
          dynamicString: `{{${this.props.queryRun}.run()}}`,
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
          },
        ],
        isWaitingForResponse: false,
      }));
    }
  };

  onEnterPress = (e: {
    keyCode: number;
    shiftKey: boolean;
    preventDefault: () => void;
  }) => {
    if (e.keyCode == 13 && e.shiftKey) {
      e.preventDefault();
      this.handleMessageSubmit();
    }
  };

  getWidgetView(): ReactNode {
    return (
      <div className={styles.root}>
        <ul className={styles.messageList}>
          {(this.state.messages || []).map((message: Message) => (
            <li
              className={styles.message}
              data-role={message.role}
              key={message.id}
            >
              {message.role === "assistant" ? (
                <Markdown
                  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
                  components={{
                    h1: ({ children }) => (
                      <Text size="heading" wordBreak="break-word">
                        {children}
                      </Text>
                    ),
                    h2: ({ children }) => (
                      <Text size="title" wordBreak="break-word">
                        {children}
                      </Text>
                    ),
                    h3: ({ children }) => (
                      <Text size="subtitle" wordBreak="break-word">
                        {children}
                      </Text>
                    ),
                    p: ({ children }) => (
                      <Text size="body" wordBreak="break-word">
                        {children}
                      </Text>
                    ),
                  }}
                >
                  {message.content}
                </Markdown>
              ) : (
                message.content
              )}
            </li>
          ))}

          {this.state.isWaitingForResponse && (
            <li className={styles.message} data-role="bot">
              <Spinner />
            </li>
          )}
        </ul>

        <form className={styles.promptForm} onSubmit={this.handleMessageSubmit}>
          <TextArea
            name="message"
            // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
            onChange={(value) => {
              this.setState({ prompt: value });
            }}
            onKeyDown={this.onEnterPress}
            value={this.state.prompt}
          />
          <Button isDisabled={this.state.prompt.length < 3} type="submit">
            Send
          </Button>
        </form>
      </div>
    );
  }
}

export default WDSAIChatWidget;
