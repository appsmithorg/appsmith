import React from "react";
import { withKnobs, select } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import TableDropdown from "components/ads/TableDropdown";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import { StoryWrapper } from "components/ads/common";

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
  <StoryWrapper
    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
  >
    <TableDropdown
      position={select("position", Object.values(Position), Position.BOTTOM)}
      options={options}
      onSelect={(selectedValue) => console.log(selectedValue)}
      selectedIndex={0}
    ></TableDropdown>
  </StoryWrapper>
);
