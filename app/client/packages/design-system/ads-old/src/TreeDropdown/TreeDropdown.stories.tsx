import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import TreeDropdown from "./index";

export default {
  title: "Design System/Tree Dropdown",
  component: TreeDropdown,
} as ComponentMeta<typeof TreeDropdown>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof TreeDropdown> = (args) => {
  return <TreeDropdown {...args} />;
};

const options = [
  { label: "Primary", value: "PRIMARY" },
  { label: "Secondary", value: "SECONDARY" },
  {
    label: "Tertiary",
    value: "TERTIARY",
    children: [
      { label: "Tertiary 1", value: "TERTIARY_1" },
      { label: "Tertiary 2", value: "TERTIARY_2" },
      { label: "Tertiary 3", value: "TERTIARY_3" },
    ],
  },
];

export const TreeDropdownExample = Template.bind({});
TreeDropdownExample.storyName = "Tree Dropdown";
TreeDropdownExample.args = {
  defaultText: "Some default text here",
  onSelect: () => console.log("Selected"),
  optionTree: options,
};
