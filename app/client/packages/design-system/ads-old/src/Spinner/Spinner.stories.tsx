import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import SpinnerComponent from "./index";

export default {
  title: "Design System/Spinner",
  component: SpinnerComponent,
} as ComponentMeta<typeof SpinnerComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof SpinnerComponent> = (args) => (
  <SpinnerComponent {...args} />
);

export const Spinner = Template.bind({});

Spinner.args = {
  size: "small",
};
