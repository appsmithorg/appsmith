import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import Checkbox from "./index";

export default {
  title: "Design System/Checkbox",
  component: Checkbox,
} as ComponentMeta<typeof Checkbox>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Checkbox> = (args) => {
  return <Checkbox {...args} />;
};

export const CheckboxRegular = Template.bind({});
CheckboxRegular.args = {
  info: "Here is some Info",
  isDefaultChecked: true,
  label: "This is a label",
  onCheckChange: () => console.log("Status of check was changed,"),
};
