import React from "react";
import Button, { Size, Category, Variant } from "components/ads/Button";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";

export default {
  title: "Button",
  component: Button,
  decorators: [withKnobs, withDesign],
};

export const withDynamicProps = () => (
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
    icon={select("iconName", ["delete", "user"], undefined)}
    isLoading={boolean("Loading", false)}
    disabled={boolean("Disabled", false)}
    text={text("text", "Get")}
  ></Button>
);
