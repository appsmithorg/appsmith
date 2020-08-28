import React from "react";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import Dropdown from "../ads/Dropdown";
import { action } from "@storybook/addon-actions";

export default {
  title: "Dropdown",
  component: Dropdown,
  decorators: [withKnobs, withDesign],
};

export const DropdownStory = () => (
  <div
    style={{ background: "#2B2B2B", padding: "50px 100px", height: "700px" }}
  >
    <Dropdown
      options={[
        {
          id: "111abc",
          value: text("First Option", "First Option"),
          icon: select(
            "First Icon",
            ["Select icon", "delete", "user", "general"],
            undefined,
          ),
        },
        {
          id: "222abc",
          value: text("Second Option", "Second Option"),
          icon: select(
            "Second Icon",
            ["Select icon", "delete", "user", "general"],
            undefined,
          ),
        },
        {
          id: "322abc",
          value: text("Third Option", "Third Option"),
          icon: select(
            "Third Icon",
            ["Select icon", "delete", "user", "general"],
            undefined,
          ),
        },
      ]}
      selectHandler={action("selected-value")}
      selected={{
        value: text("Selected Value", "First Option"),
      }}
    ></Dropdown>
  </div>
);
