import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import StatusbarComponent from "./index";

export default {
  title: "Design System/Statusbar",
  component: StatusbarComponent,
} as ComponentMeta<typeof StatusbarComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof StatusbarComponent> = (args) => {
  return <StatusbarComponent {...args} />;
};

export const Statusbar = Template.bind({});
Statusbar.args = {
  percentage: 40,
  active: true,
  message: "Loading",
};
