import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

// change ThisComponentName to the name of the component you are writing a story for
import EditableTextSubComponent, { SavingState } from "./index";

export default {
  // change ComponentDisplay to the name of the component you are writing a story for
  title: "Design System/EditableTextSubComponent",
  component: EditableTextSubComponent,
} as ComponentMeta<typeof EditableTextSubComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof EditableTextSubComponent> = (args) => {
  return <EditableTextSubComponent {...args} />;
};

export const EditableTextSubComponentExample = Template.bind({});
EditableTextSubComponentExample.storyName = "EditableTextSubComponent";
EditableTextSubComponentExample.args = {
  isEditing: false,
  setSavingState: () => {
    console.log("setting saving state");
    return undefined;
  },
  setIsEditing: () => {
    console.log("setting editing");
    return undefined;
  },
  setIsInvalid: () => {
    console.log("setting invalid");
    return undefined;
  },
  savingState: SavingState.NOT_STARTED,
  underline: false,
  defaultSavingState: SavingState.NOT_STARTED,
  defaultValue: "Here is an editable text sub component",
  isEditingDefault: false,
  isInvalid: false,
};
