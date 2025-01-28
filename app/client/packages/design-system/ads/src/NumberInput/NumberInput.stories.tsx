import React from "react";
import { NumberInput } from "./NumberInput";
import type { NumberInputProps } from "./NumberInput.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Input/Number Input",
  component: NumberInput,
  decorators: [
    (Story: () => React.ReactNode) => (
      <div style={{ width: "100%", maxWidth: "250px", margin: "0 auto" }}>
        {Story()}
      </div>
    ),
  ],
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: NumberInputProps) => {
  return <NumberInput {...args} />;
};

export const NumberInputStory = Template.bind({}) as StoryObj;
NumberInputStory.storyName = "NumberInput";
NumberInputStory.args = {
  prefix: "$",
  suffix: "",
  isValid: true,
};
