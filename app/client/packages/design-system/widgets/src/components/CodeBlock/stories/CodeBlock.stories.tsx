import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CodeBlock } from "@appsmith/wds";

/**
 * CodeBlock is a component that displays a code block.
 */
const meta: Meta<typeof CodeBlock> = {
  component: CodeBlock,
  title: "WDS/Widgets/Code Block",
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const Main: Story = {
  args: {
    code: "{ test: 123 }",
    language: "json",
  },
};

/**
 * The code block can render any code and will format based on the language
 *
 */
export const Sizes: Story = {
  render: (props) => (
    <CodeBlock language={props.language} {...props}>
      {props.code}
    </CodeBlock>
  ),
};
