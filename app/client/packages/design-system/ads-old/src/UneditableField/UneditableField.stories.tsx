import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import UneditableField from "./index";

export default {
  title: "Design System/Uneditable Field",
  component: UneditableField,
} as ComponentMeta<typeof UneditableField>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof UneditableField> = (args) => {
  return <UneditableField {...args} />;
};

export const UneditableFieldExample = Template.bind({});
UneditableFieldExample.storyName = "Uneditable Field";
UneditableFieldExample.args = {
  disabled: true,
  handleCopy: () => console.log("copy handled"),
  helperText: "Some helper text",
  iscopy: "true",
  name: "Field name",
};
