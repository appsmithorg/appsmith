import React from "react";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import TableDropdown from "../ads/TableDropdown";
import { Position } from "@blueprintjs/core/lib/esm/common/position";

export default {
  title: "Dropdown",
  component: TableDropdown,
  decorators: [withKnobs, withDesign],
};

const options = [
  {
    name: "Admin",
    desc: "Can edit, view and invite other user to an app",
  },
  {
    name: "Developer",
    desc: "Can view and invite other user to an app",
  },
  {
    name: "User",
    desc: "Can view and invite other user to an app and...",
  },
];

export const TableDropdownStory = () => (
  <div style={{ height: "1000px", background: "#1A191C" }}>
    <TableDropdown
      position={select(
        "position",
        [Position.RIGHT, Position.LEFT, Position.BOTTOM, Position.TOP],
        Position.BOTTOM,
      )}
      options={options}
      onSelect={selectedValue => console.log(selectedValue)}
      selectedIndex={0}
    ></TableDropdown>
  </div>
);
