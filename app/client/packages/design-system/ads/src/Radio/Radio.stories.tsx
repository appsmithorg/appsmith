import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Radio } from "./Radio";

export default {
  title: "ADS/Radio",
  component: Radio,
  parameters: { controls: { sort: "requiredFirst" } },
} as ComponentMeta<typeof Radio>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Radio> = (args) => {
  const { children, ...rest } = args;
  return <Radio {...rest}>{children}</Radio>;
};

export const RadioStory = Template.bind({});
RadioStory.storyName = "Radio";
RadioStory.args = {
  children: "Radio",
  value: "Radio",
};
