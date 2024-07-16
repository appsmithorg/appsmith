import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Button } from "./Button";

export default {
  title: "ADS/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          "A button component with different variants and sizes. It can be used as a button or an anchor. Other than the defined props button component accepts all the props of the button and a elements. ",
      },
    },
  },
} as ComponentMeta<typeof Button>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Button> = ({ children, ...args }) => {
  return <Button {...args}>{children}</Button>;
};

export const ButtonStory = Template.bind({});
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

export const ButtonPrimaryStory = Template.bind({});
ButtonPrimaryStory.args = {
  ...ButtonStory.args,
  kind: "primary",
};

export const ButtonSecondaryStory = Template.bind({});
ButtonSecondaryStory.args = {
  ...ButtonStory.args,
  kind: "secondary",
};

export const ButtonTertiaryStory = Template.bind({});
ButtonTertiaryStory.args = {
  ...ButtonStory.args,
  kind: "tertiary",
};

export const ButtonErrorStory = Template.bind({});
ButtonErrorStory.args = {
  ...ButtonStory.args,
  kind: "error",
};

export const ButtonDisabledStory = Template.bind({});
ButtonDisabledStory.args = {
  ...ButtonStory.args,
  isDisabled: true,
};

export const ButtonLoadingStory = Template.bind({});
ButtonLoadingStory.args = {
  ...ButtonStory.args,
  isLoading: true,
};

export const IconButtonStory = Template.bind({});
IconButtonStory.storyName = "Icon Button";
IconButtonStory.args = {
  onClick: () => alert("Button clicked!"),
  startIcon: "arrow-left-line",
  size: "md",
  kind: "primary",
  isIconButton: true,
  type: "button",
};
