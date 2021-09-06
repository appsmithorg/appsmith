import React from "react";
import { withDesign } from "storybook-addon-designs";
import TableDropdown, { DropdownProps } from "components/ads/TableDropdown";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import { StoryWrapper } from "components/ads/common";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";
import { action } from "@storybook/addon-actions";

export default {
  title: storyName.platform.tables.tableDropdown.PATH,
  component: TableDropdown,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function TableDropdownStory(args: DropdownProps) {
  return (
    <StoryWrapper
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <TableDropdown {...args} onSelect={action("option-selected")} />
    </StoryWrapper>
  );
}

TableDropdownStory.args = {
  options: [
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
  ],
  selectedIndex: 0,
  position: Position.BOTTOM,
};

TableDropdownStory.argTypes = {
  position: {
    control: controlType.SELECT,
    options: Object.values(Position),
  },
  fill: { control: controlType.BOOLEAN },
  options: { control: controlType.ARRAY },
  selectedIndex: { control: controlType.NUMBER },
};

TableDropdownStory.storyName = storyName.platform.tables.tableDropdown.NAME;
