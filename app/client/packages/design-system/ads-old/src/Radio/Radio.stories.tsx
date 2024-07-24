import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import RadioComponent from "./index";

export default {
  title: "Design System/RadioComponent",
  component: RadioComponent,
} as ComponentMeta<typeof RadioComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof RadioComponent> = (args) => (
  <RadioComponent {...args} />
);

export const Radio = Template.bind({}) as StoryObj;
Radio.args = {
  className: "",
  defaultValue: "default",
  onSelect: () => console.log("selected"),
  options: [
    {
      label: "Label",
      value: "value",
      onSelect: (value) => console.log(value),
    },
  ],
  rows: 2,
  disabled: false,
};
