import * as React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Dropdown } from "@design-system/widgets-old";

export default {
  title: "Design System/Widgets-old/Dropdown",
  component: Dropdown,
} as ComponentMeta<typeof Dropdown>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Dropdown> = (args) => {
  return <Dropdown {...args} />;
};

const options = [
  { label: "One", value: "one" },
  { label: "Two", value: "two" },
  { label: "Three", value: "three" },
  { label: "Four", value: "four" },
  { label: "Five", value: "five" },
  { label: "Six", value: "six" },
  { label: "Seven", value: "seven" },
  { label: "Eight", value: "eight" },
];
const selected = [
  {
    label: "One",
    value: "one",
  },
];

export const DropdownExample = Template.bind({});
DropdownExample.storyName = "Dropdown";
DropdownExample.args = {
  allowDeselection: true,
  containerClassName: "dropdown-container",
  isMultiSelect: true,
  // eslint-disable-next-line no-console
  onSelect: () => console.log("selected"),
  options,
  selected,
  showLabelOnly: true,
};
