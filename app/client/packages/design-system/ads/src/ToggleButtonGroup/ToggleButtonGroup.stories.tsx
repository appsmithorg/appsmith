import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { ToggleButtonGroup } from "./ToggleButtonGroup";

export default {
  title: "ADS/Toggle Button/Toggle Button Group",
  component: ToggleButtonGroup,
  parameters: {
    docs: {
      description: {
        component:
          "A button group component used for selecting multiple values. ",
      },
    },
  },
} as ComponentMeta<typeof ToggleButtonGroup>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof ToggleButtonGroup> = (args) => {
  return <ToggleButtonGroup {...args} />;
};

export const ToggleButtonGroupStory = Template.bind({});
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
