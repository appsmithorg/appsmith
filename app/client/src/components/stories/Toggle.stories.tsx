import React from "react";
import Toggle, { ToggleProps } from "components/ads/Toggle";
import { withDesign } from "storybook-addon-designs";
import { action } from "@storybook/addon-actions";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.form.toggle.PATH,
  component: Toggle,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function Primary(args: ToggleProps) {
  return <Toggle {...args} onToggle={action("Toggled")} />;
}

Primary.args = {
  value: false,
};

Primary.argTypes = {
  value: { control: controlType.BOOLEAN },
};

Primary.storyName = storyName.platform.form.toggle.NAME;
