// ChatComponent.tsx
import React, { useState, useEffect } from "react";
import styled from "styled-components";
// import Markdown from "markdown-to-jsx";
import {
  type Conversation,
  type Message,
  getConversationHistory,
  getConversation,
  sendMessage,
} from "./api";
import { Button, Tooltip, Text, Flex, Input, toast } from "@appsmith/ads";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ReactComponent as SupportBotSVG } from "./supportbot.svg";
import moment from "moment";
import SyntaxHighlighter from "react-syntax-highlighter";
import Markdown from "react-markdown";

interface ChatComponentProps {
  onClose: () => void;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({ onClose }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const lastChildRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch conversation history when component mounts
    getConversationHistory().then(setConversations);
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      getConversation().then(setMessages);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  const handleHamburgerClick = () => {
    setShowHistory(!showHistory);
  };

  const handleConversationSelect = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setShowHistory(false);
    scrollToBottom();
  };

  const handleStartNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowHistory(false);
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() !== "") {
      const newMessage = await sendMessage(inputMessage);

      setMessages([...messages, newMessage]);
      setInputMessage("");
      // Simulate bot response
      const botResponse: Message = {
        id: Date.now().toString(),
        sender: "bot",
        content: "This is a bot response.",
        date: new Date().toISOString(),
      };

      setMessages((currentMessages) => [...currentMessages, botResponse]);
      // Scroll to the bottom of the chat container
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      lastChildRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <ChatContainer>
      <Header>
        <Button
          color="#4C5664"
          data-testid="t--help-button"
          kind="tertiary"
          onClick={handleHamburgerClick}
          size="sm"
          startIcon="hamburger"
        />
        <CloseButton>
          <Button
            color="#4C5664"
            data-testid="t--close-button"
            kind="tertiary"
            onClick={onClose}
            size="sm"
            startIcon="close-x"
          />
        </CloseButton>
      </Header>
      {showHistory ? (
        <HistoryPanel>
          <Text kind="heading-m">Messages</Text>
          <HistoryList>
            {conversations.map((convo) => (
              <HistoryItem
                key={convo.id}
                onClick={() => handleConversationSelect(convo.id)}
              >
                <SupportBotSVG height="32px" />
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {convo.lastMessage}
                  </div>

                  <div>{moment(convo.date).fromNow()}</div>
                </div>
              </HistoryItem>
            ))}
          </HistoryList>
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              display: "flex",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <Button
              endIcon="message-2-line"
              onClick={handleStartNewConversation}
              size="md"
            >
              Send us a message
            </Button>
          </div>
        </HistoryPanel>
      ) : (
        <>
          <MessagesContainer>
            {messages.length > 0 ? (
              messages.map(({ content, date, id, sender }) => {
                return (
                  <>
                    <MessageItem key={id} sender={sender}>
                      {sender === "bot" && (
                        <div
                          style={{
                            display: "flex",
                            marginBottom: "5px",
                          }}
                        >
                          <SupportBotSVG height="24px" width="24px" />
                          <div style={{ marginLeft: "auto" }}>
                            {moment(date).format("h:mm a")}
                          </div>
                        </div>
                      )}
                      <Markdown
                        // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
                        components={{
                          code(props) {
                            const { children, className, ...rest } = props;
                            const match = /language-(\w+)/.exec(
                              className ?? "",
                            );

                            return match ? (
                              <div
                                style={{
                                  padding: "15px 0",
                                  position: "relative",
                                }}
                              >
                                <div
                                  style={{
                                    position: "absolute",
                                    right: "0px",
                                    bottom: "0px",
                                    background: "#ffff22 !important",
                                  }}
                                >
                                  <Tooltip content="Copy to clipboard">
                                    <Button
                                      kind="tertiary"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          String(children),
                                        );
                                        toast.show("Copied to clipboard", {
                                          kind: "success",
                                        });
                                      }}
                                      size="sm"
                                      startIcon="copy-control"
                                    />
                                  </Tooltip>
                                </div>
                                <SyntaxHighlighter
                                  PreTag="div"
                                  language={match[1]}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code {...rest} className={className}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {content}
                      </Markdown>
                    </MessageItem>
                    <div ref={lastChildRef} />
                  </>
                );
              })
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  maxWidth: "60%",
                  alignSelf: "center",
                }}
              >
                <SupportBotSVG height={"36px"} width={"36px"} />
                <Text
                  kind="heading-m"
                  style={{
                    marginTop: "10px",
                  }}
                >
                  I&apos;m AppBot 👋🏽
                </Text>
                <Text
                  kind="body-m"
                  style={{
                    textAlign: "center",
                    maxWidth: "80%",
                    marginTop: "10px",
                  }}
                >
                  Ask me anything about building dashboards, workflows, or
                  internal tools.
                </Text>
              </div>
            )}
          </MessagesContainer>
          <InputContainer>
            <Input
              onChange={setInputMessage}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              ref={inputRef}
              renderAs="textarea"
              type="text"
              value={inputMessage}
            />
          </InputContainer>
          <Flex
            justifyContent="center"
            style={{
              padding: "5px",
            }}
          >
            <SupportBotSVG height={"16px"} width={"16px"} />
            <Text kind="action-s" style={{ marginLeft: "5px" }}>
              Powered by Appsmith AI
            </Text>
          </Flex>
        </>
      )}
    </ChatContainer>
  );
};

// Styled Components
const ChatContainer = styled.div`
  width: 500px;
  height: 80vh;
  background-color: #ffffff;
  border: 1px solid #ccc;
  display: flex;
  flex-direction: column;
  position: fixed;
  right: 10px;
  bottom: 10px;
  z-index: 10;
  border-radius: 10px;
  overflow: hidden;
`;

const Header = styled.div`
  background-color: #e3e8ef;
  padding: 4px;
  display: flex;
  align-items: center;
`;

const CloseButton = styled.div`
  margin-left: auto;
`;

const HistoryPanel = styled.div`
  background-color: #ffffff;
  overflow-y: auto;
  flex: 1;
  padding: 10px;
`;

const HistoryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const HistoryItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 5px;
  cursor: pointer;
  border-bottom: 1px solid #efefef;
  &:hover {
    background-color: #efefef;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: white;
  display: flex;
  flex-direction: column;
`;

interface MessageItemProps {
  sender: "user" | "bot";
}

const MessageItem = styled.div<MessageItemProps>`
  background-color: ${(props) =>
    props.sender === "user" ? "#E3E8EF" : "#FFFFFF"};
  color: ${(props) => (props.sender === "user" ? "#4C5664" : "#000000")};
  align-self: ${(props) =>
    props.sender === "user" ? "flex-end" : "flex-start"};
  margin: 5px 0;
  padding: 10px;
  border-radius: 7.5px;
  max-width: ${(props) => (props.sender === "user" ? "80%" : "100%")};
  border: 1px solid #e3e8ef;

  & * {
    text-wrap: unset;
    background-color: ${(props) =>
      props.sender === "bot" ? "#ffffff !important" : ""};
  }

  pre {
    background-color: white;
    border: 1px solid #ccc;
  }
`;

const InputContainer = styled.div`
  display: flex;
  padding: 10px 10px 0 10px;
`;
