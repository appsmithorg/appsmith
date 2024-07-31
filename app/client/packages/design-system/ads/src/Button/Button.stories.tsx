import React from "react";
import type { StoryObj } from "@storybook/react";
import { Button } from "./Button";
import type { ButtonProps } from "./Button.types";

export default {
  title: "ADS/Components/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          "A button component with different variants and sizes. It can be used as a button or an anchor. Other than the defined props button component accepts all the props of the button and a elements. ",
      },
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const Template = ({ children, ...args }: ButtonProps) => {
  return <Button {...args}>{children}</Button>;
};

export const ButtonStory = Template.bind({}) as StoryObj;
ButtonStory.storyName = "Button";
ButtonStory.args = {
  children: "Click me",
  onClick: () => alert("Button clicked!"),
  startIcon: "arrow-left-line",
  endIcon: "arrow-right-line",
  size: "md",
  kind: "primary",
  type: "button",
};

export const ButtonPrimaryStory = Template.bind({}) as StoryObj;
ButtonPrimaryStory.args = {
  ...ButtonStory.args,
  kind: "primary",
};

export const ButtonSecondaryStory = Template.bind({}) as StoryObj;
ButtonSecondaryStory.args = {
  ...ButtonStory.args,
  kind: "secondary",
};

export const ButtonTertiaryStory = Template.bind({}) as StoryObj;
ButtonTertiaryStory.args = {
  ...ButtonStory.args,
  kind: "tertiary",
};

export const ButtonErrorStory = Template.bind({}) as StoryObj;
ButtonErrorStory.args = {
  ...ButtonStory.args,
  kind: "error",
};

export const ButtonDisabledStory = Template.bind({}) as StoryObj;
ButtonDisabledStory.args = {
  ...ButtonStory.args,
  isDisabled: true,
};

export const ButtonLoadingStory = Template.bind({}) as StoryObj;
ButtonLoadingStory.args = {
  ...ButtonStory.args,
  isLoading: true,
};

export const IconButtonStory = Template.bind({}) as StoryObj;
IconButtonStory.storyName = "Icon Button";
IconButtonStory.args = {
  onClick: () => alert("Button clicked!"),
  startIcon: "arrow-left-line",
  size: "md",
  kind: "primary",
  isIconButton: true,
  type: "button",
};
