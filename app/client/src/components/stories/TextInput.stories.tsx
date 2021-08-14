import React from "react";
import { action } from "@storybook/addon-actions";
import TextInput, { TextInputProps } from "components/ads/TextInput";
import { withDesign } from "storybook-addon-designs";
import { IconCollection, IconName } from "components/ads/Icon";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.form.textInput.PATH,
  component: TextInput,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function Primary(args: TextInputProps) {
  const validator = () => {
    return args.validator
      ? { isValid: true, message: "" }
      : {
          isValid: false,
          message: "This is a warning text for the above field.",
        };
  };
  return (
    <TextInput
      {...args}
      onChange={action("value changed")}
      validator={validator}
    />
  );
}

Primary.args = {
  placeholder: "Placeholder",
  fill: false,
  defaultValue: "",
  readOnly: false,
  dataType: "text",
  leftIcon: undefined,
  helperText: "",
  disabled: false,
  validator: true,
};

Primary.argTypes = {
  defaultValue: {
    control: controlType.TEXT,
    description: "string",
    defaultValue: "",
  },
  placeholder: {
    control: controlType.TEXT,
    description: "string",
    defaultValue: "Placeholder",
  },
  disabled: {
    control: controlType.BOOLEAN,
    description: "boolean",
    defaultValue: false,
  },
  fill: {
    control: controlType.BOOLEAN,
    description: "boolean",
    defaultValue: false,
  },
  leftIcon: {
    control: controlType.SELECT,
    options: ["Select icon" as IconName, ...IconCollection],
    description: "Icon",
    defaultValue: undefined,
  },
  readOnly: {
    control: controlType.BOOLEAN,
    description: "boolean",
    defaultValue: false,
  },
  dataType: {
    control: controlType.SELECT,
    options: ["text", "email", "number", "password", "url"],
    description: ["text", "email", "number", "password", "url"].join(", "),
    defaultValue: "text",
  },
  helperText: {
    control: controlType.TEXT,
    description: "string",
  },
  validator: {
    control: controlType.BOOLEAN,
    description: "function",
    defaultValue: true,
  },
};

Primary.storyName = storyName.platform.form.textInput.NAME;
