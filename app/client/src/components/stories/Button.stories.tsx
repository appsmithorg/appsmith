import React from "react";
import Button, { Size, Category, ButtonProps } from "components/ads/Button";
import { withDesign } from "storybook-addon-designs";
import { Variant } from "components/ads/common";
import { IconCollection, IconName } from "components/ads/Icon";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.form.button.PATH,
  component: Button,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function Primary(args: ButtonProps) {
  return <Button {...args} />;
}

Primary.args = {
  category: Category.primary,
  disabled: false,
  fill: false,
  icon: "Select icon" as IconName,
  isLoading: false,
  size: Size.large,
  text: "Get",
  variant: Variant.info,
  tag: "button",
};

Primary.argTypes = {
  category: {
    control: controlType.SELECT,
    options: Object.values(Category),
  },
  disabled: { control: controlType.BOOLEAN },
  fill: { control: controlType.BOOLEAN },
  icon: {
    control: controlType.SELECT,
    options: ["Select icon" as IconName, ...IconCollection],
  },
  isLoading: { control: controlType.BOOLEAN },
  size: {
    control: controlType.SELECT,
    options: Object.values(Size),
  },
  text: { control: controlType.TEXT },
  variant: {
    control: controlType.SELECT,
    options: Object.values(Variant),
  },
};

Primary.storyName = storyName.platform.form.button.NAME;
