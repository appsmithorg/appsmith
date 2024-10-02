import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import React, { type FormEvent, type ReactNode } from "react";
import styles from "./styles.module.css";
import Markdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { monokai } from "react-syntax-highlighter/dist/esm/styles/hljs";

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
  text: string;
  role: "bot" | "user";
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
        text: "Hello! How can I help you?",
        role: "bot" as const,
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
        setData: {
          path: "messages",
          type: "array",
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getAnvilConfig(): AnvilConfig | null {
    return anvilConfig;
  }

  static getStylesheetConfig(): Stylesheet {
    return {};
  }

  componentDidUpdate(prevProps: WDSAIChatWidgetProps, prevState: State): void {
    if (prevState.messages.length < this.state.messages.length) {
      const lastMessage: Message =
        this.state.messages[this.state.messages.length - 1];

      if (lastMessage.role === "user") {
        this.sendBotMessage(lastMessage.text);
      }
    }
  }

  async sendBotMessage(message: string): Promise<void> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer YOUR_TOKEN_HERE`,
      },
      // We need to send the body as a string, so we use JSON.stringify.
      body: JSON.stringify({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "system",
            content:
              "Answer in a bro style. For markdown use only lists and bold text. Headers should be bold paragraphs. You can use html in your answer.",
          },
          ...this.state.messages.map((message) => ({
            role: message.role === "bot" ? "assistant" : "user",
            content: message.text,
          })),
          {
            role: "user",
            content: message,
          },
        ],
        stream: true,
      }),
    });

    const reader = response.body
      ?.pipeThrough(new TextDecoderStream())
      .getReader();

    this.setState((state) => {
      return {
        messages: [
          ...state.messages,
          {
            id: Math.random().toString(),
            text: "",
            role: "bot",
          },
        ],
      };
    });

    while (reader) {
      const stream = await reader.read();

      if (stream.done) break;

      const chunks = stream.value
        .replaceAll(/^data: /gm, "")
        .split("\n")
        .filter((c: string) => Boolean(c.length) && c !== "[DONE]")
        .map((c: string) => JSON.parse(c));

      if (chunks) {
        for (const chunk of chunks) {
          const content = chunk.choices[0].delta.content;

          if (!content) continue;

          this.setState((state) => {
            const lastMessage: Message =
              state.messages[state.messages.length - 1];
            const prevMessages = state.messages.slice(0, -1);

            return {
              messages: [
                ...prevMessages,
                {
                  id: lastMessage.id,
                  text: lastMessage.text + content,
                  role: "bot",
                },
              ],
            };
          });
        }
      }

      this.setState({ isWaitingForResponse: false });
    }
  }

  handleMessageSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    this.setState((state) => ({
      messages: [
        ...state.messages,
        {
          id: String(Date.now()),
          text: formData.get("message") as string,
          role: "user",
        },
      ],
      prompt: "",
      isWaitingForResponse: true,
    }));
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
              {message.role === "bot" ? (
                <div>
                  {this.props.assistantName}
                  <Markdown
                    // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
                    components={{
                      //   h1: ({ children }) => (
                      //     <Text size="heading">{children}</Text>
                      //   ),
                      //   h2: ({ children }) => (
                      //     <Text size="heading">{children}</Text>
                      //   ),
                      //   h3: ({ children }) => (
                      //     <Text size="heading">{children}</Text>
                      //   ),
                      code(props) {
                        const { children, className, ...rest } = props;
                        const match = /language-(\w+)/.exec(className || "");

                        return match ? (
                          <SyntaxHighlighter
                            PreTag="div"
                            language={match[1]}
                            style={monokai}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code {...rest} className={className}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.text}
                  </Markdown>
                </div>
              ) : (
                message.text
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
