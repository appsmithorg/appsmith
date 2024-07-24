import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

// change ThisComponentName to the name of the component you are writing a story for
import EditableText from "./index";
import { EditInteractionKind } from "../EditableTextSubComponent";

export default {
  // change ComponentDisplay to the name of the component you are writing a story for
  title: "Design System/EditableText",
  component: EditableText,
} as ComponentMeta<typeof EditableText>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof EditableText> = (args) => {
  return <EditableText {...args} />;
};

export const EditableTextExample = Template.bind({}) as StoryObj;
EditableTextExample.storyName = "EditableText";
EditableTextExample.args = {
  defaultValue: "Some Editable Text",
  editInteractionKind: EditInteractionKind.SINGLE,
  fill: true,
  hideEditIcon: false,
  isError: true,
  isInvalid: true,
  placeholder: "Edit text input",
  underline: false,
};
