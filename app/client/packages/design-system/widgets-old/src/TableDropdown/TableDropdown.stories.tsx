import * as React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { TableDropdown as TableDropdownComponent } from "@design-system/widgets-old";

export default {
  title: "Design System/Widgets-old/TableDropdown",
  component: TableDropdownComponent,
} as ComponentMeta<typeof TableDropdownComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof TableDropdownComponent> = (args) => {
  return <TableDropdownComponent {...args} />;
};

export const TableDropdown = Template.bind({});
TableDropdown.args = {
  options: [
    {
      id: "1",
      name: "Option 1",
      desc: "Option 1 description",
    },
    {
      id: "2",
      name: "Option 2",
      desc: "Option 2 description",
    },
    {
      id: "3",
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
