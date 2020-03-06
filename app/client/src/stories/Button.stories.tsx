import React from "react";
import Button from "components/editorComponents/Button";
import { withKnobs, text, boolean, select } from "@storybook/addon-knobs";
import Centered from "components/designSystems/appsmith/CenteredWrapper";
import { withDesign } from "storybook-addon-designs";
import { IntentColors } from "constants/DefaultTheme";
import { Directions } from "utils/helpers";
import { IconNames } from "@blueprintjs/icons";

export default {
  title: "Button",
  component: Button,
  decorators: [withKnobs, withDesign],
};

const Intents = Object.keys(IntentColors);
const IconDirections = Object.values(Directions);
const iconNames = Object.values({ ...IconNames });
iconNames.unshift();

export const withDynamicProps = () => (
  <Centered style={{ height: "100vh" }}>
    <div
      style={{
        width: "500px",
        background: "white",
        height: "300px",
        padding: "20px",
      }}
    >
      <Button
        intent={select("Intent", Intents, "primary")}
        text={text("Button Text", "Button")}
        outline={boolean("Show outline?", false)}
        filled={boolean("Fill with intent color?", true)}
        loading={boolean("Is loading?", false)}
        disabled={boolean("Is disabled?", false)}
        size={select("Button size", ["large", "small"], undefined)}
        type={select("Button type", ["button", "submit", "reset"], "button")}
        iconAlignment={select("Icon alignment", IconDirections, "right")}
        icon={select("Icon", iconNames, "chevron-down")}
      />
    </div>
  </Centered>
);
