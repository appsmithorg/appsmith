import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Text } from "./Text";

export default {
  title: "ADS/Text",
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
          setText(e.target.value);
        }}
      >
        {text}
      </Text>
    );
  },
};
