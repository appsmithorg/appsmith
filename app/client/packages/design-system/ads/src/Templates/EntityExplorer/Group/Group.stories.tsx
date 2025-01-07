/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Group } from "./Group";
import type { GroupProps } from "./Group.types";
import { Icon } from "../../../Icon";

const meta: Meta<typeof Group> = {
  title: "ADS/Templates/Entity Explorer/Group",
  component: Group,
};

export default meta;

const Template = (props: GroupProps) => {
  const { className, groupTitle, items } = props;

  return <Group group={{ className, groupTitle, items }} />;
};

export const LongListWithAddNew = Template.bind({}) as StoryObj;

LongListWithAddNew.args = {
  groupTitle: "Datasources",
  className: "t--from-source-list",
  items: [
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasoucre-create-option-users",
      title: "Users",
      onClick: () => console.log("Users clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasoucre-create-option-movies",
      title: "Movies",
      onClick: () => console.log("Movies clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasoucre-create-option-untitled_datasource_1",
      title: "Untitled datasource 1",
      onClick: () => console.log("Untitled datasource 1 clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasoucre-create-option-untitled_datasource_2",
      title: "Untitled datasource 2",
      onClick: () => console.log("Untitled datasource 2 clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasoucre-create-option-untitled_datasource_3",
      title: "Untitled datasource 3",
      onClick: () => console.log("Untitled datasource 3 clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasoucre-create-option-untitled_datasource_4",
      title: "Untitled datasource 4",
      onClick: () => console.log("Untitled datasource 4 clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasoucre-create-option-users_(1)",
      title: "Users (1)",
      onClick: () => console.log("Users(1) clicked"),
    },
    {
      startIcon: <Icon name="plus" />,
      className: "t--datasoucre-create-option-new_datasource",
      title: "New datasource",
      onClick: () => console.log("New datasource clicked"),
    },
  ],
};

export const ShortListWithAddNew = Template.bind({}) as StoryObj;

ShortListWithAddNew.args = {
  groupTitle: "Datasources",
  className: "t--from-source-list",
  items: [
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasoucre-create-option-users",
      title: "Users",
      onClick: () => console.log("Users clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasoucre-create-option-movies",
      title: "Movies",
      onClick: () => console.log("Movies clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasoucre-create-option-untitled_datasource_1",
      title: "Untitled datasource 1",
      onClick: () => console.log("Untitled datasource 1 clicked"),
    },
    {
      startIcon: <Icon name="plus" />,
      className: "t--datasoucre-create-option-new_datasource",
      title: "New datasource",
      onClick: () => console.log("New datasource clicked"),
    },
  ],
};

export const ListWithoutAddNew = Template.bind({}) as StoryObj;

ListWithoutAddNew.args = {
  groupTitle: "Apis",
  className: "t--from-source-list",
  items: [
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasoucre-create-option-users",
      title: "Users",
      onClick: () => console.log("Users clicked"),
    },
    {
      startIcon: <Icon name="database-2-line" />,
      className: "t--datasoucre-create-option-movies",
      title: "Movies",
      onClick: () => console.log("Movies clicked"),
    },
  ],
};
