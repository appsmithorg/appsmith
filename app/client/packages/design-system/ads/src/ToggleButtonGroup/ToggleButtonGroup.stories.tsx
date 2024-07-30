import React from "react";
import { ToggleButtonGroup } from "./ToggleButtonGroup";
import type { ToggleGroupProps } from "./ToggleButtonGroup.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Toggle Button/Toggle Button Group",
  component: ToggleButtonGroup,
  parameters: {
    docs: {
      description: {
        component:
          "A button group component used for selecting multiple values. ",
      },
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: ToggleGroupProps) => {
  return <ToggleButtonGroup {...args} />;
};

export const ToggleButtonGroupStory = Template.bind({}) as StoryObj;
ToggleButtonGroupStory.storyName = "ToggleButtonGroup";
ToggleButtonGroupStory.args = {
  options: [
    {
      icon: "text-bold",
      value: "BOLD",
    },
    {
      icon: "text-italic",
      value: "ITALIC",
    },
  ],
  values: ["ITALIC"],
};
