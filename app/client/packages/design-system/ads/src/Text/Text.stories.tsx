import React, { useMemo } from "react";
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
    const inputProps = useMemo(
      () => ({
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          setText(e.target.value);
        },
      }),
      [],
    );

    return (
      <Text inputProps={inputProps} {...args}>
        {text}
      </Text>
    );
  },
};
