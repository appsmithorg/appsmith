import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import RectangularSwitcherComponent from "./index";

export default {
  title: "Design System/RectangularSwitcher",
  component: RectangularSwitcherComponent,
} as ComponentMeta<typeof RectangularSwitcherComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof RectangularSwitcherComponent> = (
  args,
) => {
  return <RectangularSwitcherComponent {...args} />;
};

export const RectangularSwitcher = Template.bind({});
RectangularSwitcher.args = {
  value: false,
  onSwitch: (v) => {
    // eslint-disable-next-line no-console
    console.log(v);
  },
};
