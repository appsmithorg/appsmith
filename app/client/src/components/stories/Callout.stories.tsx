import React from "react";
import Callout, { CalloutProps } from "components/ads/Callout";
import { withDesign } from "storybook-addon-designs";
import { Variant } from "components/ads/common";
import { action } from "@storybook/addon-actions";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.form.callout.PATH,
  component: Callout,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function CalloutStory(args: CalloutProps) {
  return <Callout {...args} onClose={action("closed-callout")} />;
}

CalloutStory.args = {
  variant: Variant.success,
  fill: true,
  closeButton: true,
  text: "Callout",
};

CalloutStory.argTypes = {
  closeButton: { control: controlType.BOOLEAN },
  fill: { control: controlType.BOOLEAN },
  text: { control: controlType.TEXT },
  variant: {
    control: controlType.SELECT,
    options: Object.values(Variant),
  },
};

CalloutStory.storyName = storyName.platform.form.callout.NAME;
