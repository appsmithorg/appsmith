import React from "react";
import AppIcon, {
  AppIconCollection,
  AppIconProps,
} from "components/ads/AppIcon";
import { Size } from "components/ads/Button";
import { withDesign } from "storybook-addon-designs";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.icons.appIcon.PATH,
  component: AppIcon,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function Primary(args: AppIconProps) {
  return <AppIcon {...args} />;
}

Primary.args = {
  size: Size.large,
  name: "bag",
};

Primary.argTypes = {
  size: {
    control: controlType.SELECT,
    options: Object.values(Size),
  },
  name: {
    control: controlType.SELECT,
    options: AppIconCollection,
  },
};

Primary.storyName = storyName.platform.icons.appIcon.NAME;
