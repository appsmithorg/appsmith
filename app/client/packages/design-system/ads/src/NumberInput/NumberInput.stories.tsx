import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { NumberInput } from "./NumberInput";

export default {
  title: "ADS/Input/NumberInput",
  component: NumberInput,
  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "250px", margin: "0 auto" }}>
        {Story()}
      </div>
    ),
  ],
} as ComponentMeta<typeof NumberInput>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof NumberInput> = (args) => {
  return <NumberInput {...args} />;
};

export const NumberInputStory = Template.bind({});
NumberInputStory.storyName = "NumberInput";
NumberInputStory.args = {
  prefix: "$",
  suffix: "",
  isValid: true,
};
