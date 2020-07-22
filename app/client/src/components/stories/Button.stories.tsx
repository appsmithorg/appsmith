import React from "react";
import Button from "components/ads/Button";
import { withKnobs, select } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";

export default {
  title: "Button",
  component: Button,
  decorators: [withKnobs, withDesign],
};

export const withDynamicProps = () => (
  <Button
    size={select("Intent", ["small", "medium", "large"], undefined)}
    text={"button"}
  ></Button>
);
