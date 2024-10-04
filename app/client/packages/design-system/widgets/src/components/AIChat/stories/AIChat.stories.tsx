import { AIChat } from "@appsmith/wds";
import type { Meta, StoryObj } from "@storybook/react";

/**
 * A button is a clickable element that is used to trigger an action.
 */
const meta: Meta<typeof AIChat> = {
  component: AIChat,
  title: "WDS/Widgets/AIChat",
};

export default meta;
type Story = StoryObj<typeof AIChat>;

export const Main: Story = {
  args: {
    thread: [],
    prompt: "",
    username: "John Doe",
    promptInputPlaceholder: "Type your message here",
    chatTitle: "Chat with Assistant",
    description: "",
    assistantName: "",
    isWaitingForResponse: false,
  },
};

export const EmptyHistory: Story = {
  args: {
    thread: [],
    prompt: "",
    username: "John Doe",
    promptInputPlaceholder: "Type your message here",
    chatTitle: "Chat with Assistant",
  },
};

export const Loading: Story = {
  args: {
    thread: [],
    prompt: "",
    username: "John Doe",
    promptInputPlaceholder: "Type your message here",
    chatTitle: "Chat with Assistant",
    isWaitingForResponse: true,
  },
};

export const WithHistory: Story = {
  args: {
    thread: [
      {
        id: "1",
        content: "Hi, how can I help you?",
        isAssistant: true,
      },
      {
        id: "2",
        content: "Find stuck support requests",
        isAssistant: false,
      },
      {
        id: "3",
        content: `Certainly! Here's what I can do to help you:
* Search our customers database
* Find stuck support requests
* Provide advice on how to resolve customer issues
`,
        isAssistant: true,
      },
      {
        id: "4",
        content: "Thank you",
        isAssistant: false,
      },
    ],
    prompt: "",
    username: "John Doe",
    promptInputPlaceholder: "Type your message here",
    chatTitle: "Chat with Assistant",
  },
};
