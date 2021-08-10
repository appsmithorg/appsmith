import React from "react";
import Button, { Size, Category, ButtonProps } from "components/ads/Button";
import { withDesign } from "storybook-addon-designs";
import { Variant } from "components/ads/common";
import { IconCollection, IconName } from "components/ads/Icon";

export default {
  title: "Form/Button",
  component: Button,
  decorators: [withDesign],
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
    control: "select",
    options: Object.values(Category),
  },
  disabled: { control: "boolean" },
  fill: { control: "boolean" },
  icon: {
    control: "select",
    options: ["Select icon" as IconName, ...IconCollection],
  },
  isLoading: { control: "boolean" },
  size: {
    control: "select",
    options: Object.values(Size),
  },
  text: { control: "text" },
  variant: {
    control: "select",
    options: Object.values(Variant),
  },
};
