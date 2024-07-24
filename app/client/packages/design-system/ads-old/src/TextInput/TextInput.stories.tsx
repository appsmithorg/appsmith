import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import TextInput from "./index";

export default {
  title: "Design System/TextInput",
  component: TextInput,
} as ComponentMeta<typeof TextInput>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof TextInput> = (args) => {
  return <TextInput {...args} />;
};

export const TextInputExample = Template.bind({}) as StoryObj;
TextInputExample.storyName = "Text Input";
TextInputExample.args = {
  $padding: "8px",
  autoFocus: true,
  className: "t--commit-comment-input",
  height: "36px",
  onChange: () => console.log("input has changed"),
  placeholder: "Enter text",
  readOnly: true,
  trimValue: false,
  value: () => console.log("This is the value"),
  disabled: false,
};
