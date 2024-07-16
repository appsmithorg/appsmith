import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import ButtonGroup from "./index";

export default {
  title: "Design System/ButtonGroup",
  component: ButtonGroup,
} as ComponentMeta<typeof ButtonGroup>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof ButtonGroup> = (args) => {
  return <ButtonGroup {...args} />;
};

export const ButtonGroupExample = Template.bind({});
ButtonGroupExample.storyName = "ButtonGroup";
ButtonGroupExample.args = {
  options: [
    {
      icon: "DELETE_CONTROL",
      value: "delete",
      width: 100,
    },
    {
      icon: "INCREASE_CONTROL",
      value: "edit",
      width: 100,
    },
  ],
  values: ["burgers"],
  selectButton: (value, isUpdatedViaKeyboard) => {
    // eslint-disable-next-line no-console
    console.log("value:", value, "isUpdatedViaKeyboard:", isUpdatedViaKeyboard);
  },
};

export const ButtonGroupWithLabel = Template.bind({});
ButtonGroupWithLabel.args = {
  options: [
    {
      label: "AUTO",
      value: "auto",
    },
    {
      label: "TOP",
      value: "top",
    },
    {
      label: "LEFT",
      value: "left",
    },
  ],
  values: ["left"],
  fullWidth: true,
  selectButton: (value, isUpdatedViaKeyboard) => {
    // eslint-disable-next-line no-console
    console.log("value:", value, "isUpdatedViaKeyboard:", isUpdatedViaKeyboard);
  },
};
