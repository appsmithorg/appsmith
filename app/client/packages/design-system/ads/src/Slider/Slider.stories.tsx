import React, { useState } from "react";
import { Slider } from "./Slider";
import { type Meta, type StoryObj } from "@storybook/react";
import type { SliderProps } from "./Slider.types";

export default {
  title: "ADS/Components/Slider",
  component: Slider,
} as Meta;

const Template = (args: SliderProps) => {
  const [value, setValue] = useState(args.value || 50);

  return <Slider {...args} onChange={setValue} value={value} />;
};

export const SliderStory = Template.bind({}) as StoryObj;
SliderStory.args = {
  maxValue: 100,
  minValue: 0,
  step: 1,
  value: 50,
  label: "Donuts to buy",
  getValueLabel: (donuts: string) => `${donuts} of 100 Donuts`,
};
