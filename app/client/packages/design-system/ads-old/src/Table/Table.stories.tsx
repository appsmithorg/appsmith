import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

// change ThisComponentName to the name of the component you are writing a story for
import Table from "./index";

export default {
  // change ComponentDisplay to the name of the component you are writing a story for
  title: "Design System/Table",
  component: Table,
} as ComponentMeta<typeof Table>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Table> = (args) => {
  return <Table {...args} />;
};

const columns = [
  {
    Header: "Name",
    accessor: "name",
  },
  {
    Header: "Email",
    accessor: "username",
  },
  {
    Header: "Role",
    accessor: "roleName",
  },
  {
    Header: "Status",
    accessor: "status",
  },
];

const data = [
  {
    username: "kumarselvam",
    name: "Kumar Selvam",
    roleName: "rolename",
    isDeleting: false,
    isChangingRole: false,
  },
  {
    username: "aishwaryakumari",
    name: "Aihwarya Kumari",
    roleName: "rolename",
    isDeleting: false,
    isChangingRole: false,
  },
];

export const TableExample = Template.bind({}) as StoryObj;
TableExample.storyName = "Table";
TableExample.args = {
  columns: columns,
  data: data,
};
