import React from "react";
import { withDesign } from "storybook-addon-designs";
import EditableText, {
  EditInteractionKind,
  EditableTextProps,
  SavingState,
} from "components/ads/EditableText";
import { action } from "@storybook/addon-actions";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.form.editableText.PATH,
  component: EditableText,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

const errorFunction = (name: string) => {
  if (name === "") {
    return "Name cannot be empty";
  } else {
    return false;
  }
};

export function Primary(args: EditableTextProps) {
  return (
    <EditableText
      {...args}
      isInvalid={(name) => errorFunction(name)}
      onBlur={action("blured-on-text")}
      onTextChanged={action("text-changed")}
    />
  );
}

Primary.args = {
  defaultValue: "Product design app",
  editInteractionKind: EditInteractionKind.SINGLE,
  savingState: SavingState.NOT_STARTED,
  placeholder: "Edit input",
  isEditingDefault: false,
  forceDefault: false,
  updating: false,
  hideEditIcon: false,
  fill: false,
  underline: false,
  isError: false,
  valueTransform: (value: string) => value.toUpperCase(),
};

Primary.argTypes = {
  fill: { control: controlType.BOOLEAN },
  defaultValue: { control: controlType.TEXT },
  editInteractionKind: {
    control: controlType.SELECT,
    options: Object.values(EditInteractionKind),
  },
  hideEditIcon: { control: controlType.BOOLEAN },
  isEditingDefault: { control: controlType.BOOLEAN },
  placeholder: { control: controlType.TEXT },
};

Primary.storyName = storyName.platform.form.editableText.NAME;
