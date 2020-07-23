import React from "react";
import Button from "components/ads/Button";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";

export default {
  title: "Button",
  component: Button,
  decorators: [withKnobs, withDesign],
};

export const withDynamicProps = () => (
  <Button
    size={select("size", ["small", "medium", "large"], undefined)}
    category={select("category", ["primary", "secondary"], undefined)}
    variant={select(
      "variant",
      ["info", "success", "warning", "danger"],
      undefined,
    )}
    text={"button"}
    icon={select("iconName", ["delete", "user"], undefined)}
    isLoading={boolean("Loading", false)}
  ></Button>
);
