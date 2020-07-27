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
  <div
    style={{
      width: "100%",
      height: "600px",
      backgroundColor: "#090707",
      padding: "100px",
    }}
  >
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
      text={select(
        "text",
        ["Get", "Delete", "Fetch Users from the Database"],
        undefined,
      )}
    ></Button>
  </div>
);
