import React from "react";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import TableDropdown from "components/ads/TableDropdown";
import { StoryWrapper } from "./Tabs.stories";

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
  <StoryWrapper>
    <TableDropdown
      options={options}
      onSelect={(selectedValue: string) => console.log(selectedValue)}
      selectedOption={options[0]}
    ></TableDropdown>
  </StoryWrapper>
);
