import React from "react";
import { Icon } from "../ads/Icon";
import Button, { Size, Category, Variant } from "components/ads/Button";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";

export default {
  title: "Icon",
  component: Icon,
  decorators: [withKnobs, withDesign],
};

export const ButtonIcon = () => (
  <Button
    size={select("size", [Size.small, Size.medium, Size.large], Size.large)}
    category={select(
      "category",
      [Category.primary, Category.secondary, Category.tertiary],
      Category.primary,
    )}
    variant={select(
      "variant",
      [Variant.info, Variant.success, Variant.danger, Variant.warning],
      Variant.info,
    )}
    icon={select("iconName", ["delete", "user"], "delete")}
    isLoading={boolean("Loading", false)}
    isDisabled={boolean("Disabled", false)}
  ></Button>
);

export const BordelessIcon = () => (
  <div>
    <Icon
      size={select("size", [Size.small, Size.medium, Size.large], Size.large)}
      name={select("iconName", ["delete", "user"], "delete")}
    />
  </div>
);
