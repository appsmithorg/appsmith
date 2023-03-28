import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { ButtonGroup } from "./index";
import { Button } from "../Button";

export default {
  title: "WDS/Button Group",
  component: ButtonGroup,
  argTypes: {
    variant: {
      defaultValue: "filled",
      options: ["filled", "outline", "subtle", "light"],
      control: { type: "radio" },
    },
  },
} as ComponentMeta<typeof Button>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Button> = ({ orientation, ...args }) => {
  return (
    <ButtonGroup orientation={orientation}>
      <Button {...args}>Option 1</Button>
      <Button {...args}>Option 2</Button>
      <Button {...args}>Option 3</Button>
    </ButtonGroup>
  );
};

export const TextStory = Template.bind({});
TextStory.storyName = "Button Group";
TextStory.args = {
  isLoading: false,
  isDisabled: false,
};

TextStory.parameters = {
  height: "32px",
  width: "300px",
};
