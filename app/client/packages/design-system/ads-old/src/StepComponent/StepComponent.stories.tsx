import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

// change ThisComponentName to the name of the component you are writing a story for
import StepComponent from "./index";

export default {
  // change ComponentDisplay to the name of the component you are writing a story for
  title: "Design System/Step Component",
  component: StepComponent,
} as ComponentMeta<typeof StepComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof StepComponent> = (args) => {
  return <StepComponent {...args} />;
};

export const StepComponentExample = Template.bind({});
StepComponentExample.storyName = "Step Component";
StepComponentExample.args = {
  displayFormat: () => {
    return 1;
  },
  max: 100,
  min: 0,
  onChange: () => console.log("changed"),
  // ref: React.createRef(),
  steps: 1,
  value: 1,
};
