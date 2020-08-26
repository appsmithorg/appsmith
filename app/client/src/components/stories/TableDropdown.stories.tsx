import React from "react";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import TableDropdown from "../ads/TableDropdown";

export default {
  title: "Dropdown",
  component: TableDropdown,
  decorators: [withKnobs, withDesign],
};

const options = [
  {
    label: "Admin",
    value: "Can edit, view and invite other user to an app",
  },
  {
    label: "Developer",
    value: "Can view and invite other user to an app",
  },
  {
    label: "User",
    value: "Can view and invite other user to an app and...",
  },
];

export const TableDropdownStory = () => (
  <div
    style={{ padding: "50px 200px", height: "500px", background: "#1A191C" }}
  >
    <TableDropdown
      options={options}
      onSelect={(selectedValue: string) => console.log(selectedValue)}
      selectedOption={options[0]}
    ></TableDropdown>
  </div>
);
