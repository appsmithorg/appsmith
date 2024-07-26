import React from "react";
import { Text } from "./Text";
import type { Meta, StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Text",
  component: Text,
} as Meta<typeof Text>;

type Story = StoryObj<typeof Text>;

export const TextStory: Story = {
  name: "Text",
  args: {
    children: "How vexingly quick daft zebras jump!",
  },
};

export const EditableTextStory: Story = {
  name: "Editable Text",
  args: {
    children: "How vexingly quick daft zebras jump!",
    isEditable: true,
    kind: "body-m",
  },
  render: function Render(args) {
    const [text, setText] = React.useState(args.children);

    return (
      <Text
        {...args}
        onChange={(e) => {
          // @ts-expect-error type error
          setText(e.target.value);
        }}
      >
        {text}
      </Text>
    );
  },
};
