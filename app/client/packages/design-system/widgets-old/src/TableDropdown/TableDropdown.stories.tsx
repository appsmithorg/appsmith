import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import TableDropdownComponent from "./index";

export default {
  title: "Design System/widgets-old/TableDropdown",
  component: TableDropdownComponent,
} as ComponentMeta<typeof TableDropdownComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof TableDropdownComponent> = (args: any) => {
  return <TableDropdownComponent {...args} />;
};

export const TableDropdown = Template.bind({});
TableDropdown.args = {
  options: [
    {
      name: "Option 1",
      desc: "Option 1 description",
    },
    {
      name: "Option 2",
      desc: "Option 2 description",
    },
    {
      name: "Option 3",
      desc: "Option 3 description",
    },
  ],
  selectedIndex: 0,
  onSelect: (option: any) => {
    // eslint-disable-next-line no-console
    console.log(option);
  },
};
