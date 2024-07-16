import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import NumberedStepComponent from "./index";

export default {
  title: "Design System/NumberedStep",
  component: NumberedStepComponent,
} as ComponentMeta<typeof NumberedStepComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof NumberedStepComponent> = (args) => {
  return <NumberedStepComponent {...args} />;
};

export const NumberedStep = Template.bind({});
NumberedStep.args = {
  total: 10,
  current: 5,
};
