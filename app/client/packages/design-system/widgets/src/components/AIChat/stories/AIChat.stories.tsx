import React from "react";
import { AIChat } from "@appsmith/wds";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

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
    assistantName: "",
    isWaitingForResponse: false,
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [prompt, setPrompt] = useState(args.prompt);

    return <AIChat {...args} onPromptChange={setPrompt} prompt={prompt} />;
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
      {
        id: "5",
        content: `Here's an example of markdown code:

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');
\`\`\`

This code defines a function that greets the given name.`,
        isAssistant: true,
      },
    ],
    prompt: "",
    username: "John Doe",
    promptInputPlaceholder: "Type your message here",
    chatTitle: "Chat with Assistant",
  },
};
