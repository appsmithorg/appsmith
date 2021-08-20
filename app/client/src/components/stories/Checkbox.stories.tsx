import React from "react";
import Checkbox, { CheckboxProps } from "components/ads/Checkbox";
import { withDesign } from "storybook-addon-designs";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.form.checkbox.PATH,
  component: Checkbox,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function Primary(args: CheckboxProps) {
  return <Checkbox {...args} />;
}

Primary.args = {
  label: "Checkbox",
  disabled: false,
  isDefaultChecked: true,
  info: "",
};

Primary.argTypes = {
  disabled: { control: controlType.BOOLEAN },
  label: { control: controlType.TEXT },
  isDefaultChecked: { control: controlType.BOOLEAN },
  info: { control: controlType.TEXT },
  backgroundColor: { control: controlType.COLOR },
};

Primary.storyName = storyName.platform.form.checkbox.NAME;
