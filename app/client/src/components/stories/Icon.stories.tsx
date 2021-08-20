import React from "react";
import Icon, { IconSize, IconCollection, IconProps } from "components/ads/Icon";
import { action } from "@storybook/addon-actions";
import { withDesign } from "storybook-addon-designs";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.icons.icon.PATH,
  component: Icon,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function Primary(args: IconProps) {
  return <Icon {...args} onClick={action("icon-clicked")} />;
}

Primary.args = {
  size: IconSize.LARGE,
  name: "delete",
  invisible: false,
  className: "",
  fillColor: "",
  hoverFillColor: "",
  keepColors: false,
  loaderWithIconWrapper: false,
  clickable: true,
};

Primary.argTypes = {
  size: {
    control: controlType.SELECT,
    options: Object.values(IconSize),
  },
  name: {
    control: controlType.SELECT,
    options: IconCollection,
  },
  invisible: { control: controlType.BOOLEAN },
  className: { control: controlType.TEXT },
  fillColor: { control: controlType.COLOR },
  hoverFillColor: { control: controlType.COLOR },
  keepColors: { control: controlType.BOOLEAN },
  loaderWithIconWrapper: { control: controlType.BOOLEAN },
  clickable: { control: controlType.BOOLEAN },
};

Primary.storyName = storyName.platform.icons.icon.NAME;
