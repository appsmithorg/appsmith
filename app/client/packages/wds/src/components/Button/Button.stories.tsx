import React from "react";
import { ComponentMeta } from "@storybook/react";

import { Button } from "./index";

const HIDDEN_ARGS = [
  "theme",
  "forwardedAs",
  "as",
  "boxShadow",
  "borderRadius",
  "ref",
  "tooltip",
];

export default {
  title: "Design System/Button",
  component: Button,
  argTypes: {
    variant: {
      defaultValue: "filled",
      options: ["filled", "outline", "subtle", "light"],
      control: { type: "radio" },
    },
    ...HIDDEN_ARGS.reduce((acc: any, arg) => {
      acc[arg] = { table: { disable: true } };
      return acc;
    }, {}),
  },
  args: {
    children: "Button",
    isLoading: false,
    isDisabled: false,
  },
} as ComponentMeta<typeof Button>;

// eslint-disable-next-line react/function-component-definition
const Template = (args) => {
  return <Button {...args} />;
};

export const TextStory = Template.bind({});
TextStory.storyName = "Button";
TextStory.args = {
  children: "Button",
  isLoading: false,
  isDisabled: false,
  variant: "filled",
};

TextStory.parameters = {
  height: "32px",
  width: "120px",
};
