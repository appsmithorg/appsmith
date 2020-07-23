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
    size={select("size", ["small", "medium", "large"], "large")}
    category={select("category", ["primary", "secondary"], "primary")}
    variant={select("variant", ["success", "warning", "danger"], "success")}
    text={"button"}
  ></Button>
);
