import React from "react";
import Button, { Size } from "components/ads/Button";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";

export default {
  title: "Button",
  component: Button,
  decorators: [withKnobs, withDesign],
};

export const withDynamicProps = () => (
  <Button
    size={select("size", ["small", "medium", "large"], "large")}
    category={select(
      "category",
      ["primary", "secondary", "tertiary"],
      "primary",
    )}
    variant={select(
      "variant",
      ["info", "success", "warning", "danger"],
      "info",
    )}
    icon={select("iconName", ["delete", "user"], undefined)}
    isLoading={boolean("Loading", false)}
    isDisabled={boolean("Disabled", false)}
    text={text("text", "Get")}
  ></Button>
);
